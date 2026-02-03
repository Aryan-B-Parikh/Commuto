'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCountdownReturn {
    seconds: number;
    isActive: boolean;
    start: (duration: number) => void;
    reset: () => void;
    formattedTime: string;
}

export const useCountdown = (initialSeconds: number = 0): UseCountdownReturn => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, seconds]);

    const start = useCallback((duration: number) => {
        setSeconds(duration);
        setIsActive(true);
    }, []);

    const reset = useCallback(() => {
        setSeconds(0);
        setIsActive(false);
    }, []);

    const formatTime = (totalSeconds: number): string => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        seconds,
        isActive,
        start,
        reset,
        formattedTime: formatTime(seconds),
    };
};
