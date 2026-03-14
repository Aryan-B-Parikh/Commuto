'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

export interface RouteInfo {
    /** Road distance in km, e.g. "3.2" */
    distanceKm: string;
    /** Raw distance in meters */
    distanceMeters: number;
    /** Formatted duration, e.g. "12 mins" */
    duration: string;
    /** Raw duration in seconds */
    durationSeconds: number;
    /** Route summary / name, e.g. "via SG Highway" */
    routeName: string;
    /** Whether the data is currently loading */
    isLoading: boolean;
}

const THROTTLE_MS = 30_000; // Re-fetch at most every 30 seconds

/**
 * Fetches real-time route info (road distance, ETA, route name) from
 * Ola Maps Directions API between two coordinates.
 *
 * Automatically re-fetches when origin changes (throttled to 30s).
 */
export function useRouteInfo(
    origin?: [number, number],
    destination?: [number, number]
): RouteInfo {
    const [info, setInfo] = useState<RouteInfo>({
        distanceKm: '--',
        distanceMeters: 0,
        duration: '--',
        durationSeconds: 0,
        routeName: '',
        isLoading: true,
    });

    const lastFetchRef = useRef<number>(0);
    const lastOriginRef = useRef<string>('');

    const fetchRoute = useCallback(async () => {
        if (!origin || !destination || !OLA_API_KEY) {
            setInfo(prev => ({ ...prev, isLoading: false }));
            return;
        }

        // Throttle: don't re-fetch within 30s for same approximate position
        const originKey = `${origin[0].toFixed(4)},${origin[1].toFixed(4)}`;
        const now = Date.now();
        if (
            originKey === lastOriginRef.current &&
            now - lastFetchRef.current < THROTTLE_MS
        ) {
            return;
        }

        try {
            const response = await fetch(
                `https://api.olamaps.io/routing/v1/directions?origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&api_key=${OLA_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'X-Request-Id': crypto.randomUUID() },
                }
            );

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const leg = route.legs?.[0];

                // Distance
                const distMeters = leg?.distance ?? route.distance ?? 0;
                const distKm = (distMeters / 1000).toFixed(1);

                // Duration
                const durSeconds = leg?.duration ?? route.duration ?? 0;
                const durMins = Math.round(durSeconds / 60);
                const durFormatted =
                    durMins < 1
                        ? '< 1 min'
                        : durMins >= 60
                            ? `${Math.floor(durMins / 60)}h ${durMins % 60}m`
                            : `${durMins} min${durMins !== 1 ? 's' : ''}`;

                // Route name
                const routeName = leg?.summary || route.summary || '';

                setInfo({
                    distanceKm: distKm,
                    distanceMeters: distMeters,
                    duration: durFormatted,
                    durationSeconds: durSeconds,
                    routeName,
                    isLoading: false,
                });

                lastFetchRef.current = now;
                lastOriginRef.current = originKey;
            } else {
                setInfo(prev => ({ ...prev, isLoading: false }));
            }
        } catch (err) {
            console.error('Failed to fetch route info:', err);
            setInfo(prev => ({ ...prev, isLoading: false }));
        }
    }, [origin?.[0], origin?.[1], destination?.[0], destination?.[1]]);

    // Fetch on mount and when origin/destination change
    useEffect(() => {
        fetchRoute();
    }, [fetchRoute]);

    // Re-fetch periodically while active (every 30s)
    useEffect(() => {
        if (!origin || !destination) return;

        const interval = setInterval(() => {
            lastOriginRef.current = ''; // Force re-fetch
            fetchRoute();
        }, THROTTLE_MS);

        return () => clearInterval(interval);
    }, [fetchRoute, origin, destination]);

    return info;
}
