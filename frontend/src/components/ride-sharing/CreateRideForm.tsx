'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationInput } from '@/components/ride/LocationInput';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CreateRideForm() {
    const { showToast } = useToast() as any;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        seats: 3,
        price: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Simplified for now - in real app would geocode addresses
            const tripData = {
                from_location: {
                    address: formData.pickup,
                    lat: 23.0225, // Mock coords
                    lng: 72.5714
                },
                to_location: {
                    address: formData.destination,
                    lat: 23.0338,
                    lng: 72.5850
                },
                date: formData.date,
                time: formData.time,
                total_seats: formData.seats,
                price_per_seat: parseFloat(formData.price),
                notes: formData.notes
            };

            const response = await tripsAPI.createSharedRide(tripData);
            showToast('success', 'Shared ride created successfully!');
            router.push(`/passenger/ride-details/${response.id}`);
        } catch (error: any) {
            console.error('Failed to create shared ride:', error);
            showToast('error', error.response?.data?.detail || 'Failed to create ride.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto overflow-hidden">
            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                            Route Details
                        </label>
                        <LocationInput
                            type="pickup"
                            label="Pickup Location"
                            value={formData.pickup}
                            onChange={(v) => setFormData({ ...formData, pickup: v })}
                            placeholder="Where are you starting from?"
                        />
                        <LocationInput
                            type="destination"
                            label="Destination"
                            value={formData.destination}
                            onChange={(v) => setFormData({ ...formData, destination: v })}
                            placeholder="Where are you going?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-muted/30 border border-card-border/50 rounded-xl text-foreground"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Time
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 bg-muted/30 border border-card-border/50 rounded-xl text-foreground"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Available Seats
                            </label>
                            <select
                                value={formData.seats}
                                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-muted/30 border border-card-border/50 rounded-xl text-foreground"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <option key={n} value={n}>{n} Seats</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Price per Seat
                            </label>
                            <input
                                type="number"
                                placeholder="₹ / Seat"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-3 bg-muted/30 border border-card-border/50 rounded-xl text-foreground"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">
                            Additional Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Luggage details, smoking preferences, etc..."
                            className="w-full px-4 py-3 bg-muted/30 border border-card-border/50 rounded-xl text-foreground min-h-[100px] resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 h-14 text-lg font-bold shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? 'Creating Ride...' : 'Create Shared Ride'}
                    </Button>

                </form>
            </div>
        </Card>
    );
}
