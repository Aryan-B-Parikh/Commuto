export type RideStatus = 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';

const STATUS_ALIASES: Record<string, RideStatus> = {
    requested: 'requested',
    pending: 'requested',
    upcoming: 'requested',
    accepted: 'accepted',
    bid_accepted: 'accepted',
    driver_assigned: 'accepted',
    started: 'started',
    active: 'started',
    completed: 'completed',
    cancelled: 'cancelled',
};

export function normalizeRideStatus(status?: string | null): RideStatus {
    if (!status) return 'requested';
    return STATUS_ALIASES[status.toLowerCase()] ?? 'requested';
}

export function isRideAccepted(status?: string | null): boolean {
    return normalizeRideStatus(status) === 'accepted';
}

export function isRideStarted(status?: string | null): boolean {
    return normalizeRideStatus(status) === 'started';
}

export function isRideFinished(status?: string | null): boolean {
    const normalized = normalizeRideStatus(status);
    return normalized === 'completed' || normalized === 'cancelled';
}

export function canLeaveRideScreen(status?: string | null): boolean {
    return normalizeRideStatus(status) !== 'started';
}

export function rideStatusLabel(status?: string | null): string {
    switch (normalizeRideStatus(status)) {
        case 'requested':
            return 'Requested';
        case 'accepted':
            return 'Accepted';
        case 'started':
            return 'Started';
        case 'completed':
            return 'Completed';
        case 'cancelled':
            return 'Cancelled';
        default:
            return 'Requested';
    }
}