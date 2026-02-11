'use client';

import React, { createContext, useEffect, useState, useCallback, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
    sendMessage: (data: any) => void;
    lastMessage: any;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);

    useEffect(() => {
        // Only connect if we have a user and a token
        if (!user || !token) {
            if (ws) {
                ws.close();
                setWs(null);
                setIsConnected(false);
            }
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        // Use query parameter instead of path for token (security: prevents logging in server access logs)
        const socketUrl = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;

        console.log('Connecting to WebSocket:', socketUrl);
        const websocket = new WebSocket(socketUrl);

        websocket.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
                setLastMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', event.data);
            }
        };

        websocket.onclose = (event) => {
            console.log('WebSocket disconnected', event.code, event.reason);
            setIsConnected(false);
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [user, token]);

    const sendMessage = useCallback((data: any) => {
        if (ws && isConnected) {
            ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }, [ws, isConnected]);

    return (
        <WebSocketContext.Provider value={{ sendMessage, lastMessage, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
