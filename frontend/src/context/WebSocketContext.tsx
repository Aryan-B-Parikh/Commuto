'use client';

import React, { createContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any;
    connect: () => void;
    disconnect: () => void;
    sendMessage: (type: string, data: any) => void;
    addListener: (type: string, callback: (data: any) => void) => void;
    removeListener: (type: string, callback: (data: any) => void) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        // Prevent multiple connections
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        // Use query parameter instead of path for token (security: prevents logging in server access logs)
        const ws = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(token)}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WS Message:', message);
                setLastMessage(message);

                // Dispatch to listeners
                const type = message.type;
                if (type && listenersRef.current.has(type)) {
                    listenersRef.current.get(type)?.forEach(callback => callback(message.data));
                }
            } catch (error) {
                console.error('Failed to parse WS message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            socketRef.current = null;

            // Auto reconnect if user is still authenticated
            if (isAuthenticated) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting Reconnect...');
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        socketRef.current = ws;
    }, [isAuthenticated]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    // Connect/Disconnect based on auth state
    useEffect(() => {
        if (isAuthenticated && user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, user, connect, disconnect]);

    const sendMessage = useCallback((type: string, data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, data }));
        }
    }, []);

    const addListener = useCallback((type: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(type)) {
            listenersRef.current.set(type, new Set());
        }
        listenersRef.current.get(type)?.add(callback);
    }, []);

    const removeListener = useCallback((type: string, callback: (data: any) => void) => {
        listenersRef.current.get(type)?.delete(callback);
    }, []);

    return (
        <WebSocketContext.Provider value={{
            socket: socketRef.current,
            isConnected,
            lastMessage,
            connect,
            disconnect,
            sendMessage,
            addListener,
            removeListener
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};
