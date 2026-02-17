import { User } from '@/types';

export const mockUsers: User[] = [];

export const currentUser: User = {
    id: '',
    name: '',
    email: '',
    phone: '',
    // avatar is now optional, so we don't need to provide empty string
    rating: 0,
    totalTrips: 0,
    verified: false,
    joinedDate: '',
};
