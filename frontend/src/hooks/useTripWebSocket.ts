import { useState, useEffect, useCallback, useRef } from 'react';

export function useTripWebSocket(tripId: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocation, setLastLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [tripStatus, setTripStatus] = useState<string | null>(null);
    const [availableSeats, setAvailableSeats] = useState<number | null>(null);
    const [newPassenger, setNewPassenger] = useState<any | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!tripId) return;
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/trips/${tripId}?token=${token}`);

        ws.onopen = () => {
            console.log(`Trip WS Connected: ${tripId}`);
            setIsConnected(true);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
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

            // Reconnect logic
            if (tripId) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting Trip WS Reconnect...');
                    connect();
                }, 3000);
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
        newPassenger,
        sendLocation,
        updateStatus
    };
}
