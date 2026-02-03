'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { mockGroupedRoutes, Stop } from '@/data/groupedRoutes';

export default function LiveRoutePage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast() as any;
    const initialRoute = mockGroupedRoutes.find(r => r.id === id);

    const [stops, setStops] = useState<Stop[]>(initialRoute?.stops || []);
    const [activeStopIndex, setActiveStopIndex] = useState(0);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);

    const activeStop = stops[activeStopIndex];
    const completedCount = stops.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / stops.length) * 100);

    const handleVerifyOtp = () => {
        if (otpInput === activeStop.otp) {
            const updatedStops = [...stops];
            updatedStops[activeStopIndex] = { ...activeStop, isCompleted: true };
            setStops(updatedStops);
            setShowOtpModal(false);
            setOtpInput('');
            showToast('success', `${activeStop.passengerName} verified and picked up!`);

            // Move to next stop if available
            if (activeStopIndex < stops.length - 1) {
                setActiveStopIndex(activeStopIndex + 1);
            }
        } else {
            showToast('error', 'Invalid OTP. Please try again.');
        }
    };

    const handleCompleteStop = () => {
        if (activeStop.type === 'pickup') {
            setShowOtpModal(true);
        } else {
            // Final dropoff
            const updatedStops = [...stops];
            updatedStops[activeStopIndex] = { ...activeStop, isCompleted: true };
            setStops(updatedStops);
            showToast('success', 'All passengers dropped off!');
            setIsFinishing(true);
        }
    };

    const finishTrip = () => {
        showToast('success', 'Route completed! Earnings added to your wallet.');
        router.push('/driver/routes');
    };

    if (!initialRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-gray-900 mb-2">Route Not Found</h3>
                    <p className="text-gray-500 mb-6">The requested route could not be found.</p>
                    <Link href="/driver/routes">
                        <Button variant="outline">Back to Routes</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (!activeStop) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-gray-900 mb-2">No Active Stops</h3>
                    <p className="text-gray-500 mb-6">This route has no stops configured.</p>
                    <Link href="/driver/routes">
                        <Button variant="outline">Back to Routes</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Map Navigation Placeholder */}
            <div className="relative h-[45vh] w-full">
                <MapContainer className="h-full" showRoute />
                <div className="absolute top-4 left-4 right-4 z-10">
                    <Card variant="glass" padding="sm" className="bg-white/90 backdrop-blur-md border-white/50 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-tight">Active Destination</p>
                                <p className="font-bold text-gray-900 truncate leading-tight">{activeStop.address}</p>
                            </div>
                            <div className="text-right border-l border-gray-100 pl-4">
                                <p className="text-xs text-gray-400">ETA</p>
                                <p className="font-bold text-gray-900">{activeStop.estimatedTime}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Control Panel */}
            <div className="flex-1 bg-white rounded-t-[32px] px-6 pt-6 -mt-6 relative z-10 shadow-2xl flex flex-col">
                <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6" />

                {/* Progress Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="font-bold text-gray-900">Route Progress</h2>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>
                    <ProgressBar progress={progress} size="lg" className="bg-blue-50" />
                    <div className="flex justify-between mt-2">
                        <p className="text-xs text-gray-500">{completedCount} of {stops.length} stops completed</p>
                        <p className="text-xs font-semibold text-green-600">Earnings: ${(initialRoute?.estimatedEarnings || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* Active Task Section */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Current Task</h3>

                    <AnimatePresence mode="wait">
                        {!isFinishing ? (
                            <motion.div
                                key={activeStop.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card variant="outline" className="border-blue-100 bg-blue-50/20 p-5 ring-1 ring-blue-100 mb-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 p-1">
                                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 overflow-hidden font-bold">
                                                {activeStop.passengerName.charAt(0)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg leading-tight">{activeStop.passengerName}</p>
                                            <p className="text-sm text-blue-600 font-medium">
                                                {activeStop.type === 'pickup' ? 'Awaiting Pickup' : 'Heading to Dropoff'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-blue-50 mb-6">
                                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-600 leading-snug">{activeStop.address}</p>
                                    </div>

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        className="bg-blue-600 hover:bg-blue-700 h-14 text-lg shadow-lg shadow-blue-500/20"
                                        onClick={handleCompleteStop}
                                    >
                                        {activeStop.type === 'pickup' ? 'Verify OTP to Board' : 'Complete Dropoff'}
                                    </Button>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="finished"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Route Finished!</h3>
                                <p className="text-gray-500 mb-8">All passengers reached their destination safely.</p>
                                <Button variant="primary" fullWidth size="lg" onClick={finishTrip}>Complete Trip & Get Rewards</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stop Checklist */}
                    <div className="mt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Task Checklist</h3>
                        <div className="space-y-3">
                            {stops.map((stop, i) => (
                                <div key={stop.id} className={`flex items-center gap-3 p-3 rounded-xl border ${stop.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : i === activeStopIndex ? 'border-blue-200 bg-blue-50/10' : 'border-gray-50 bg-white'
                                    }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${stop.isCompleted ? 'bg-green-500 text-white' : 'border-2 border-gray-200'
                                        }`}>
                                        {stop.isCompleted && (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${stop.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {stop.passengerName}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase px-2 py-0.5 bg-gray-100 rounded-md">
                                        {stop.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            <Modal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} title="Verify Passenger Boarding">
                <div className="text-center p-2">
                    <p className="text-gray-500 mb-6 text-sm">Enter the 4-digit code shown on {activeStop?.passengerName}&apos;s mobile app to confirm boarding.</p>
                    <div className="flex justify-center mb-8">
                        <input
                            type="text"
                            maxLength={4}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            className="w-48 h-16 text-center text-4xl font-bold tracking-[1rem] border-b-4 border-blue-600 focus:outline-none bg-blue-50/50 rounded-t-xl"
                            placeholder="0000"
                            autoFocus
                        />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl mb-8 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 uppercase">Demo Preview</span>
                        <span className="text-lg font-mono font-bold text-blue-700">{activeStop?.otp}</span>
                    </div>
                    <Button variant="primary" fullWidth size="lg" onClick={handleVerifyOtp} disabled={otpInput.length !== 4}>Confirm Boarding</Button>
                </div>
            </Modal>

            {/* Footer Controls */}
            <div className="bg-white border-t border-gray-100 p-4 fixed bottom-0 left-0 right-0 z-20 flex gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <Button variant="outline" className="flex-1 border-red-50 text-red-600 hover:bg-red-50">Report Emergency</Button>
                <Button variant="ghost" className="px-6">Contact Support</Button>
            </div>
        </div>
    );
}
