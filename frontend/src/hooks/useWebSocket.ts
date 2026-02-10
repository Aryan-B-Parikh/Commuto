'use client';

import { useContext, useEffect } from 'react';
import { WebSocketContext } from '@/context/WebSocketContext';

export function useWebSocket() {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }

    return context;
}

/**
 * Hook to subscribe to a specific WebSocket event
 */
export function useSocketEvent(event: string, callback: (data: any) => void) {
    const { addListener, removeListener } = useWebSocket();

    useEffect(() => {
        addListener(event, callback);
        return () => {
            removeListener(event, callback);
        };
    }, [event, callback, addListener, removeListener]);
}
