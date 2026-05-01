import { useState, useEffect, useCallback, useRef } from 'react';
import { authStorage } from '@/utils/authStorage';

export function useTripWebSocket(tripId: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocation, setLastLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [tripStatus, setTripStatus] = useState<string | null>(null);
    const [availableSeats, setAvailableSeats] = useState<number | null>(null);
    const [seatUpdateVersion, setSeatUpdateVersion] = useState(0);
    const [newPassenger, setNewPassenger] = useState<any | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptRef = useRef(0);

    const connect = useCallback(() => {
        if (!tripId) return;
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const token = authStorage.getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/trips/${tripId}?token=${token}`);

        ws.onopen = () => {
            console.log(`Trip WS Connected: ${tripId}`);
            setIsConnected(true);
            reconnectAttemptRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            // Re-sync latest location snapshot after reconnect.
            void fetch(`${apiUrl}/rides/${tripId}/locations`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(async (response) => {
                    if (!response.ok) return;
                    const history = await response.json();
                    if (!Array.isArray(history) || history.length === 0) return;

                    const latest = history[0];
                    if (typeof latest.latitude === 'number' && typeof latest.longitude === 'number') {
                        setLastLocation({ lat: latest.latitude, lng: latest.longitude });
                    }
                })
                .catch(() => {
                    // Best-effort resync; live websocket updates continue even if this fails.
                });
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'location_update') {
                    setLastLocation({ lat: message.lat, lng: message.lng });
                } else if (message.type === 'trip_status_update') {
                    setTripStatus(message.status);
                } else if (message.type === 'seat_update') {
                    setAvailableSeats(message.available_seats);
                    setSeatUpdateVersion((prev) => prev + 1);
                    if (message.passenger) {
                        setNewPassenger(message.passenger);
                    }
                }
            } catch (error) {
                console.error('Failed to parse trip WS message:', error);
            }
        };

        ws.onclose = () => {
            console.log(`Trip WS Disconnected: ${tripId}`);
            setIsConnected(false);
            socketRef.current = null;

            // Exponential backoff reconnect logic.
            if (tripId) {
                const delayMs = Math.min(30000, 1000 * Math.pow(2, reconnectAttemptRef.current));
                reconnectAttemptRef.current += 1;
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log(`Attempting Trip WS Reconnect in ${delayMs}ms...`);
                    connect();
                }, delayMs);
            }
        };

        ws.onerror = (error) => {
            // WebSocket errors are often opaque (Event {}), so we log a generic connection error
            // only if we haven't already marked as disconnected.
            if (socketRef.current) {
                console.warn('Trip WS connection issues for:', tripId);
            }
            ws.close();
        };

        socketRef.current = ws;
    }, [tripId]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectAttemptRef.current = 0;
        };
    }, [tripId, connect]);

    const sendLocation = useCallback((lat: number, lng: number) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'location_update',
                lat,
                lng
            }));
        }
    }, []);

    const updateStatus = useCallback((status: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'trip_status_update',
                status
            }));
        }
    }, []);

    return {
        isConnected,
        lastLocation,
        tripStatus,
        availableSeats,
        seatUpdateVersion,
        newPassenger,
        sendLocation,
        updateStatus
    };
}
