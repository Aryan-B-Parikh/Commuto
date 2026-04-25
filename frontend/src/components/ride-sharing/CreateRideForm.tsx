'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, Calendar, ChevronDown, ChevronUp, Clock, FileText, IndianRupee, MapPinned, Smartphone, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationInput } from '@/components/ride/LocationInput';
import { MapSelectionModal } from '@/components/map/MapSelectionModal';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';

interface CreateRideFormProps {
    isMobile?: boolean;
}

export default function CreateRideForm({ isMobile }: CreateRideFormProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [formData, setFormData] = useState({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        seats: 3,
        totalPrice: '',
        paymentMethod: 'online' as 'online' | 'cash',
        notes: ''
    });

    const [coords, setCoords] = useState<{
        pickup: [number, number] | undefined;
        destination: [number, number] | undefined;
    }>({ pickup: undefined, destination: undefined });

    const [mapConfig, setMapConfig] = useState<{ isOpen: boolean; type: 'pickup' | 'destination' }>({ isOpen: false, type: 'pickup' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!coords.pickup || !coords.destination) {
            showToast('error', 'Please select both pickup and destination on the map.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await tripsAPI.createSharedRide({
                from_location: {
                    address: formData.pickup,
                    lat: coords.pickup[0],
                    lng: coords.pickup[1]
                },
                to_location: {
                    address: formData.destination,
                    lat: coords.destination[0],
                    lng: coords.destination[1]
                },
                date: formData.date,
                time: formData.time,
                total_seats: formData.seats,
                total_price: parseFloat(formData.totalPrice),
                payment_method: formData.paymentMethod,
                notes: formData.notes
            });
            showToast('success', 'Shared ride created successfully!');
            router.push(`/passenger/ride-details/${response.id}`);
        } catch (error: unknown) {
            console.warn('Failed to create shared ride:', error);
            const message = typeof error === 'object' && error !== null && 'response' in error
                ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create ride.')
                : 'Failed to create ride.';
            showToast('error', message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputSurface = 'min-h-[52px] w-full rounded-2xl border border-card-border bg-background/60 px-4 text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-[var(--ring)]';
    const formBody = (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-[28px] border border-card-border bg-background/55 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MapPinned className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Route details</p>
                        <p className="text-sm text-muted-foreground">Add your pickup and destination first.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <LocationInput
                        type="pickup"
                        label="Pickup location"
                        value={formData.pickup}
                        onChange={(v) => setFormData({ ...formData, pickup: v })}
                        placeholder="Where are you starting from?"
                        onMapClick={() => setMapConfig({ isOpen: true, type: 'pickup' })}
                        onLocationSelect={(addr, lat, lng) => {
                            setFormData((prev) => ({ ...prev, pickup: addr }));
                            setCoords((prev) => ({ ...prev, pickup: [lat, lng] }));
                        }}
                    />
                    <LocationInput
                        type="destination"
                        label="Destination"
                        value={formData.destination}
                        onChange={(v) => setFormData({ ...formData, destination: v })}
                        placeholder="Where are you going?"
                        onMapClick={() => setMapConfig({ isOpen: true, type: 'destination' })}
                        onLocationSelect={(addr, lat, lng) => {
                            setFormData((prev) => ({ ...prev, destination: addr }));
                            setCoords((prev) => ({ ...prev, destination: [lat, lng] }));
                        }}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground/80">Date</span>
                    <div className="relative">
                        <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={`${inputSurface} pl-11`} required />
                    </div>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground/80">Time</span>
                    <div className="relative">
                        <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className={`${inputSurface} pl-11`} required />
                    </div>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground/80">Seats</span>
                    <div className="relative">
                        <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <select value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })} className={`${inputSurface} pl-11`}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <option key={n} value={n}>{n} seats</option>
                            ))}
                        </select>
                    </div>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground/80">Total price</span>
                    <div className="relative">
                        <IndianRupee className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="number" value={formData.totalPrice} onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })} className={`${inputSurface} pl-11`} placeholder="Enter amount" required />
                    </div>
                </label>
            </div>

            <div className="rounded-[28px] border border-card-border bg-background/55 p-4 sm:p-5">
                <div className="mb-4">
                    <p className="text-sm font-semibold text-foreground">Payment method</p>
                    <p className="text-sm text-muted-foreground">Choose how this ride should be paid when it is completed.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                        className={`rounded-3xl border p-4 text-left transition-all ${
                            formData.paymentMethod === 'online'
                                ? 'border-primary bg-primary/10 shadow-[var(--shadow-card)]'
                                : 'border-card-border bg-card'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Online</p>
                                <p className="text-sm text-muted-foreground">Wallet balance will be checked before the ride is created.</p>
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                        className={`rounded-3xl border p-4 text-left transition-all ${
                            formData.paymentMethod === 'cash'
                                ? 'border-primary bg-primary/10 shadow-[var(--shadow-card)]'
                                : 'border-card-border bg-card'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Cash</p>
                                <p className="text-sm text-muted-foreground">No wallet balance check is needed during ride creation.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="rounded-[28px] border border-card-border bg-background/55">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                    <div>
                        <p className="text-sm font-semibold text-foreground">Additional notes</p>
                        <p className="text-sm text-muted-foreground">Help riders understand luggage, timing, or preferences.</p>
                    </div>
                    {showAdvanced ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-card-border px-5 pb-5"
                        >
                            <label className="mt-4 block space-y-2">
                                <span className="text-sm font-semibold text-foreground/80">Trip notes</span>
                                <div className="relative">
                                    <FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Anything riders should know before booking?"
                                        maxLength={500}
                                        className="min-h-[120px] w-full rounded-2xl border border-card-border bg-background/60 pl-11 pr-4 pt-4 text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
                                    />
                                </div>
                                <p className="text-right text-xs text-muted-foreground">{formData.notes.length}/500</p>
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between gap-4'} rounded-[28px] border border-card-border bg-card p-4 shadow-[var(--shadow-card)]`}>
                <div>
                    <p className="text-sm font-semibold text-foreground">Ready to publish this ride?</p>
                    <p className="text-sm text-muted-foreground">You can edit details later from ride details if needed.</p>
                </div>
                <Button type="submit" isLoading={isLoading} className={isMobile ? 'w-full' : ''}>
                    {isLoading ? 'Creating ride...' : 'Create shared ride'}
                </Button>
            </div>
        </form>
    );

    return (
        <>
            {isMobile ? formBody : <Card className="mx-auto max-w-5xl" padding="lg">{formBody}</Card>}
            <MapSelectionModal
                isOpen={mapConfig.isOpen}
                onClose={() => setMapConfig({ ...mapConfig, isOpen: false })}
                title={`Select ${mapConfig.type === 'pickup' ? 'Pickup Location' : 'Destination'}`}
                initialCoords={mapConfig.type === 'pickup' ? coords.pickup : coords.destination}
                onSelect={(addr, lat, lng) => {
                    if (mapConfig.type === 'pickup') {
                        setFormData({ ...formData, pickup: addr });
                        setCoords({ ...coords, pickup: [lat, lng] });
                    } else {
                        setFormData({ ...formData, destination: addr });
                        setCoords({ ...coords, destination: [lat, lng] });
                    }
                }}
            />
        </>
    );
}
