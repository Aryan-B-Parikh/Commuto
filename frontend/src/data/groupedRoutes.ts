export interface Stop {
    id: string;
    type: 'pickup' | 'dropoff';
    address: string;
    passengerName: string;
    passengerId: string;
    estimatedTime: string;
    isCompleted: boolean;
    otp?: string;
}

export interface GroupedRoute {
    id: string;
    passengerCount: number;
    totalDistance: string;
    estimatedEarnings: number;
    stops: Stop[];
    status: 'available' | 'accepted' | 'live' | 'completed';
    from: string;
    to: string;
}

export const mockGroupedRoutes: GroupedRoute[] = [];
