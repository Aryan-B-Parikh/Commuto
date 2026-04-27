import { Testimonial } from '@/types';

export const testimonials: Testimonial[] = [
    {
        id: 'test-1',
        name: 'Daily Commute Scenario',
        role: 'Planning shared rides',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=commuter-feedback',
        content: 'Riders can coordinate pickup points and timings with less back-and-forth in chat.',
        rating: 4,
    },
    {
        id: 'test-2',
        name: 'Driver Scenario',
        role: 'Accepting requests',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver-feedback',
        content: 'Drivers can review route and trip details before accepting a ride request.',
        rating: 4,
    },
    {
        id: 'test-3',
        name: 'Student Scenario',
        role: 'Campus travel',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student-feedback',
        content: 'Shared trips can help students coordinate around class schedules and limited transit windows.',
        rating: 4,
    },
    {
        id: 'test-4',
        name: 'Safety Scenario',
        role: 'Trip confidence',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=family-feedback',
        content: 'OTP checks and trip status sharing provide additional confidence during evening rides.',
        rating: 4,
    },
    {
        id: 'test-5',
        name: 'Flexible Role Scenario',
        role: 'Switching roles',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=working-professional',
        content: 'Users can switch between passenger and driver roles as their schedule changes.',
        rating: 4,
    },
];
