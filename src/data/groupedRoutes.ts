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

export const mockGroupedRoutes: GroupedRoute[] = [
    {
        id: 'route-1',
        passengerCount: 3,
        totalDistance: '12.5 km',
        estimatedEarnings: 45.50,
        from: 'Downtown Tech Hub',
        to: 'Green Valley Suburbs',
        status: 'available',
        stops: [
            {
                id: 'stop-1',
                type: 'pickup',
                address: '123 Market St, Financial District',
                passengerName: 'Sarah Jenkins',
                passengerId: 'p-1',
                estimatedTime: '10:00 AM',
                isCompleted: false,
                otp: '4821',
            },
            {
                id: 'stop-2',
                type: 'pickup',
                address: '88 Pine Ave, Creative Quarter',
                passengerName: 'Mark Wilson',
                passengerId: 'p-2',
                estimatedTime: '10:15 AM',
                isCompleted: false,
                otp: '9932',
            },
            {
                id: 'stop-3',
                type: 'pickup',
                address: '45 Oak Lane, Mid-town',
                passengerName: 'Elena Rodriguez',
                passengerId: 'p-3',
                estimatedTime: '10:30 AM',
                isCompleted: false,
                otp: '1105',
            },
            {
                id: 'stop-4',
                type: 'dropoff',
                address: 'Green Valley Community Center',
                passengerName: 'All',
                passengerId: 'all',
                estimatedTime: '11:00 AM',
                isCompleted: false,
            }
        ]
    },
    {
        id: 'route-2',
        passengerCount: 2,
        totalDistance: '8.2 km',
        estimatedEarnings: 28.00,
        from: 'Airport Terminal 1',
        to: 'City Center Plaza',
        status: 'available',
        stops: [
            {
                id: 'stop-5',
                type: 'pickup',
                address: 'Pickup Zone B, Logan Airport',
                passengerName: 'David Chen',
                passengerId: 'p-4',
                estimatedTime: '02:00 PM',
                isCompleted: false,
                otp: '7721',
            },
            {
                id: 'stop-6',
                type: 'pickup',
                address: 'Terminal 2 Arrivals',
                passengerName: 'Jessica Lee',
                passengerId: 'p-5',
                estimatedTime: '02:10 PM',
                isCompleted: false,
                otp: '5543',
            },
            {
                id: 'stop-7',
                type: 'dropoff',
                address: 'Central Station Main Entrance',
                passengerName: 'All',
                passengerId: 'all',
                estimatedTime: '02:45 PM',
                isCompleted: false,
            }
        ]
    }
];
