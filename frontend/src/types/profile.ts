export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

export interface SharedProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatar: string; // URL or base64
    gender: Gender;
    dateOfBirth: string;
    address: string;
    bio: string;
    emergencyContact: EmergencyContact;
}

export type TravelPreference = 'quiet' | 'chatty' | 'music' | 'any';

export interface PaymentMethod {
    id: string;
    type: 'card' | 'wallet' | 'upi';
    last4?: string;
    provider: string;
    isDefault: boolean;
}

export interface PassengerProfile extends SharedProfile {
    role: 'passenger';
    preferredPickupLocations: string[];
    paymentMethods: PaymentMethod[];
    travelPreferences: TravelPreference[];
    accessibilityNeeds: boolean;
    savedPlaces: { name: string; address: string }[];
}

export interface VehicleInfo {
    type: string;
    model: string;
    plateNumber: string;
    color: string;
    seatCapacity: number;
}

export interface DriverDocuments {
    licenseNumber: string;
    insuranceStatus: 'active' | 'expired' | 'pending';
    registrationUrl: string;
}

export interface DriverProfile extends SharedProfile {
    role: 'driver';
    vehicle: VehicleInfo;
    documents: DriverDocuments;
    preferences: {
        maxPassengers: number;
        routeRadius: number; // in km
        isAvailable: boolean;
    };
}

export type UserProfile = PassengerProfile | DriverProfile;
