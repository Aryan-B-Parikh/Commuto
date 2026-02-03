import { PassengerProfile, DriverProfile } from '../types/profile';

export const mockPassenger: PassengerProfile = {
    role: 'passenger',
    id: '',
    fullName: '',
    email: '',
    phone: '',
    avatar: '',
    gender: 'other',
    dateOfBirth: '',
    address: '',
    bio: '',
    emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
    },
    preferredPickupLocations: [],
    paymentMethods: [],
    travelPreferences: [],
    accessibilityNeeds: false,
    savedPlaces: [],
};

export const mockDriver: DriverProfile = {
    role: 'driver',
    id: '',
    fullName: '',
    email: '',
    phone: '',
    avatar: '',
    gender: 'other',
    dateOfBirth: '',
    address: '',
    bio: '',
    emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
    },
    vehicle: {
        type: '',
        model: '',
        plateNumber: '',
        color: '',
        seatCapacity: 0,
    },
    documents: {
        licenseNumber: '',
        insuranceStatus: 'pending',
        registrationUrl: '',
    },
    preferences: {
        maxPassengers: 0,
        routeRadius: 0,
        isAvailable: false,
    },
};
