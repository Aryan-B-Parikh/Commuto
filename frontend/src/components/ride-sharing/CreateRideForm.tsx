'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocationInput } from '@/components/ride/LocationInput';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Calendar, Clock, Users, IndianRupee, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { MapSelectionModal } from '@/components/map/MapSelectionModal';

interface CreateRideFormProps {
    isMobile?: boolean;
}

export default function CreateRideForm({ isMobile }: CreateRideFormProps) {
    const { showToast } = useToast() as any;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [formData, setFormData] = useState({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        seats: 3,
        price: '',
        notes: ''
    });

    const [coords, setCoords] = useState<{
        pickup: [number, number] | undefined;
        destination: [number, number] | undefined;
    }>({
        pickup: undefined,
        destination: undefined
    });

    const [mapConfig, setMapConfig] = useState<{
        isOpen: boolean;
        type: 'pickup' | 'destination';
    }>({ isOpen: false, type: 'pickup' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!coords.pickup || !coords.destination) {
            showToast('error', 'Please select both pickup and destination on the map.');
            return;
        }

        setIsLoading(true);

        try {
            const tripData = {
                from_location: {
                    address: formData.pickup,
                    lat: coords.pickup![0],
                    lng: coords.pickup![1]
                },
                to_location: {
                    address: formData.destination,
                    lat: coords.destination![0],
                    lng: coords.destination![1]
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

    const renderMapModal = () => (
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
    );

    if (isMobile) {
        return (
            <div className="flex flex-col h-full relative">
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
                    <div className="p-4 space-y-6">

                        {/* 1️⃣ Location Card */}
                        <div className="bg-[#111827] rounded-3xl p-5 border border-[#1E293B] shadow-sm relative">
                            {/* Visual connection line between inputs */}
                            <div className="absolute left-[38px] top-[45px] bottom-[45px] w-[2px] bg-[#1E293B] z-0" />

                            <div className="relative z-10 space-y-4">
                                <LocationInput
                                    type="pickup"
                                    label=""
                                    value={formData.pickup}
                                    onChange={(v) => setFormData({ ...formData, pickup: v })}
                                    placeholder="Pickup location"
                                    onMapClick={() => setMapConfig({ isOpen: true, type: 'pickup' })}
                                />
                                <LocationInput
                                    type="destination"
                                    label=""
                                    value={formData.destination}
                                    onChange={(v) => setFormData({ ...formData, destination: v })}
                                    placeholder="Where to?"
                                    onMapClick={() => setMapConfig({ isOpen: true, type: 'destination' })}
                                />
                            </div>
                        </div>

                        {/* 2️⃣ Quick Options Row (Chips) */}
                        <div>
                            <h3 className="text-[#F9FAFB] text-sm font-bold mb-3 px-1">Trip Details</h3>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-fade-edges">
                                <div className="flex-shrink-0 relative group">
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                        required
                                    />
                                    <div className={`bg-[#1E293B] hover:bg-[#334155] rounded-full px-4 py-2.5 flex items-center gap-2 border border-[#374151] transition-colors ${formData.date ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
                                        <Calendar size={16} className={formData.date ? 'text-indigo-400' : 'text-[#9CA3AF]'} />
                                        <span className={`text-sm font-bold whitespace-nowrap ${formData.date ? 'text-indigo-400' : 'text-[#F9FAFB]'}`}>
                                            {formData.date ? new Date(formData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 relative group">
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                        required
                                    />
                                    <div className={`bg-[#1E293B] hover:bg-[#334155] rounded-full px-4 py-2.5 flex items-center gap-2 border border-[#374151] transition-colors ${formData.time ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
                                        <Clock size={16} className={formData.time ? 'text-indigo-400' : 'text-[#9CA3AF]'} />
                                        <span className={`text-sm font-bold whitespace-nowrap ${formData.time ? 'text-indigo-400' : 'text-[#F9FAFB]'}`}>
                                            {formData.time ? formData.time : 'Now'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 relative group">
                                    <select
                                        value={formData.seats}
                                        onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-[#111827] text-white">{n} Seats</option>)}
                                    </select>
                                    <div className="bg-[#1E293B] hover:bg-[#334155] rounded-full px-4 py-2.5 flex items-center gap-2 border border-[#374151] transition-colors">
                                        <Users size={16} className="text-[#9CA3AF]" />
                                        <span className="text-[#F9FAFB] text-sm font-bold whitespace-nowrap">
                                            {formData.seats} Seats
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3️⃣ Advanced Options (Collapsible) */}
                        <div className="bg-[#111827] rounded-3xl border border-[#1E293B] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full px-5 py-4 flex items-center justify-between text-[#F9FAFB] hover:bg-[#1E293B]/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Settings size={18} className="text-indigo-400" />
                                    <span className="font-bold text-sm">More Options</span>
                                </div>
                                {showAdvanced ? <ChevronUp size={18} className="text-[#9CA3AF]" /> : <ChevronDown size={18} className="text-[#9CA3AF]" />}
                            </button>

                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-[#1E293B]"
                                    >
                                        <div className="p-5 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#9CA3AF] uppercase ml-1 flex items-center gap-1">
                                                    <IndianRupee size={12} /> Price per seat
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="₹ 0"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full px-4 py-3 bg-[#1E293B]/50 border border-[#374151] rounded-xl text-[#F9FAFB] focus:border-indigo-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[#9CA3AF] uppercase ml-1 flex items-center gap-1">
                                                    <FileText size={12} /> Notes
                                                </label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    placeholder="Smoking preference, luggage space..."
                                                    maxLength={500}
                                                    className="w-full px-4 py-3 bg-[#1E293B]/50 border border-[#374151] rounded-xl text-[#F9FAFB] focus:border-indigo-500 focus:outline-none min-h-[80px] resize-none"
                                                />
                                                {formData.notes && (
                                                    <p className="text-[10px] text-[#6B7280] text-right mt-1">{formData.notes.length}/500</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>

                    {/* 4️⃣ Fixed Bottom Action */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/95 to-transparent z-50">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-transform h-14 text-base font-bold shadow-lg shadow-indigo-500/20 rounded-xl"
                        >
                            {isLoading ? 'Creating Ride...' : 'Create Ride'}
                        </Button>
                    </div>
                </form>
                {renderMapModal()}
            </div>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto overflow-hidden">
            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                            Route Details
                        </label>
                        <LocationInput
                            type="pickup"
                            label="Pickup Location"
                            value={formData.pickup}
                            onChange={(v) => setFormData({ ...formData, pickup: v })}
                            placeholder="Where are you starting from?"
                            onMapClick={() => setMapConfig({ isOpen: true, type: 'pickup' })}
                        />
                        <LocationInput
                            type="destination"
                            label="Destination"
                            value={formData.destination}
                            onChange={(v) => setFormData({ ...formData, destination: v })}
                            placeholder="Where are you going?"
                            onMapClick={() => setMapConfig({ isOpen: true, type: 'destination' })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-[#F9FAFB] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                                Time
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-[#F9FAFB] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                                Available Seats
                            </label>
                            <select
                                value={formData.seats}
                                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-[#F9FAFB] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <option key={n} value={n} className="bg-[#111827]">{n} Seats</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                                Price per Seat
                            </label>
                            <input
                                type="number"
                                placeholder="₹ / Seat"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">
                            Additional Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Luggage details, smoking preferences, etc..."
                            maxLength={500}
                            className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-[#F9FAFB] placeholder:text-[#6B7280] min-h-[100px] resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        {formData.notes && (
                            <p className="text-[10px] text-[#6B7280] text-right mt-1">{formData.notes.length}/500</p>
                        )}
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
            {renderMapModal()}
        </Card>
    );
}
