'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    MessageSquare,
    ArrowUpDown,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LocationInput } from './LocationInput';
import { PassengerSelector } from './PassengerSelector';

interface RideFormProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
}

export const RideForm: React.FC<RideFormProps> = ({
    formData,
    setFormData,
    onSubmit,
    isLoading
}) => {
    const handleSwap = () => {
        setFormData({
            ...formData,
            pickup: formData.destination,
            destination: formData.pickup
        });
    };

    const canSubmit = formData.pickup && formData.destination && formData.date && formData.time;

    return (
        <Card className="shadow-2xl shadow-indigo-500/5 overflow-visible relative">
            <div className="absolute -top-12 left-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#F9FAFB] tracking-tighter uppercase italic leading-none">Request a Trip</h2>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 ml-0.5">Passenger Session Active</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-8 py-4">
                {/* Location Section */}
                <div className="relative space-y-3">
                    <LocationInput
                        type="pickup"
                        label="Pickup Location"
                        placeholder="Current Location / Address"
                        value={formData.pickup}
                        onChange={(val) => setFormData({ ...formData, pickup: val })}
                        onAutoDetect={() => {/* Auto detect logic */ }}
                    />

                    <div className="absolute left-[26px] top-1/2 -translate-y-1/2 h-8 w-[2px] bg-[#1E293B]/50 z-0" />

                    <button
                        type="button"
                        onClick={handleSwap}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-[#111827] border border-[#1E293B] rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-indigo-400 hover:border-indigo-500/50 shadow-sm transition-all active:scale-90"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                    </button>

                    <LocationInput
                        type="destination"
                        label="Destination"
                        placeholder="Where are you going?"
                        value={formData.destination}
                        onChange={(val) => setFormData({ ...formData, destination: val })}
                    />
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest pl-1">Departure Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-2xl text-[#F9FAFB] focus:bg-[#111827] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium appearance-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest pl-1">Preferred Time</label>
                        <div className="relative group">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-2xl text-[#F9FAFB] focus:bg-[#111827] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium appearance-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Passenger Selector */}
                <PassengerSelector
                    value={formData.passengers}
                    onChange={(val) => setFormData({ ...formData, passengers: val })}
                />

                {/* Notes Section */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest pl-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Additional Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any specific requests for the driver? (Optional)"
                        maxLength={500}
                        className="w-full px-5 py-4 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-2xl text-[#F9FAFB] min-h-[120px] focus:bg-[#111827] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium resize-none placeholder:text-[#6B7280]/50"
                    />
                    {formData.notes && (
                        <p className="text-[10px] text-[#6B7280] text-right mt-1">{formData.notes.length}/500</p>
                    )}
                </div>

                {/* CTA Section */}
                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        isLoading={isLoading}
                        className={`w-full h-16 rounded-2xl text-lg font-black uppercase italic tracking-wider transition-all duration-500 ${canSubmit
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-500/20'
                            : 'bg-[#1E293B] opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Processing Request...' : (
                            <span className="flex items-center gap-2">
                                Request Ride Now <CheckCircle2 className="w-5 h-5" />
                            </span>
                        )}
                    </Button>
                    <p className="text-center text-[10px] text-[#9CA3AF] mt-4 font-bold uppercase tracking-widest opacity-60">
                        Secure 128-bit Encrypted Connection
                    </p>
                </div>
            </form>
        </Card>
    );
};
