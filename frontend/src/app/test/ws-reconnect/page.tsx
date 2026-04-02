'use client';

import { useTripWebSocket } from '@/hooks/useTripWebSocket';

export default function WsReconnectTestPage() {
    const { isConnected } = useTripWebSocket('test-trip');

    return (
        <div className="p-6">
            <h1 className="text-lg font-bold">WS Reconnect Test</h1>
            <p data-testid="ws-status">{isConnected ? 'connected' : 'disconnected'}</p>
        </div>
    );
}
