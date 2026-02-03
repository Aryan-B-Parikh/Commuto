import { PassengerProfile, DriverProfile } from '../types/profile';

export const mockPassenger: PassengerProfile = {
    role: 'passenger',
    id: 'pass-123',
    fullName: 'Alex Johnson',
    email: 'alex.j@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    gender: 'male',
    dateOfBirth: '1992-05-15',
    address: '123 Maple Avenue, San Francisco, CA',
    bio: 'Frequent traveler who loves meeting new people. I usually commute to the Financial District.',
    emergencyContact: {
        name: 'Sarah Johnson',
        relationship: 'Sister',
        phone: '+1 (555) 987-6543',
    },
    preferredPickupLocations: ['Home', 'Office', 'Gym'],
    paymentMethods: [
        { id: 'pay-1', type: 'card', last4: '4242', provider: 'Visa', isDefault: true },
        { id: 'pay-2', type: 'wallet', provider: 'Commuto Credits', isDefault: false },
    ],
    travelPreferences: ['quiet', 'music'],
    accessibilityNeeds: false,
    savedPlaces: [
        { name: 'Home', address: '123 Maple Avenue, San Francisco, CA' },
        { name: 'Work', address: '456 Market St, San Francisco, CA' },
    ],
};

export const mockDriver: DriverProfile = {
    role: 'driver',
    id: 'driv-456',
    fullName: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '+1 (555) 000-1111',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    gender: 'male',
    dateOfBirth: '1985-11-20',
    address: '789 Oak Lane, Oakland, CA',
    bio: 'Professional driver with 5 years of experience. I pride myself on punctuality and a clean vehicle.',
    emergencyContact: {
        name: 'Emily Chen',
        relationship: 'Wife',
        phone: '+1 (555) 222-3333',
    },
    vehicle: {
        type: 'Sedan',
        model: 'Tesla Model 3',
        plateNumber: 'CALI-9X2',
        color: 'Midnight Silver',
        seatCapacity: 4,
    },
    documents: {
        licenseNumber: 'L12345678',
        insuranceStatus: 'active',
        registrationUrl: '/docs/reg-123.pdf',
    },
    preferences: {
        maxPassengers: 3,
        routeRadius: 25,
        isAvailable: true,
    },
};
