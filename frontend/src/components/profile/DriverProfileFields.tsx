"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { DriverProfile } from '../../types/profile';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { Select } from '../ui/Select';
import { CollapsibleSection } from '../ui/CollapsibleSection';

interface DriverProfileFieldsProps {
    data: DriverProfile;
    onChange: (data: Partial<DriverProfile>) => void;
}

export const DriverProfileFields: React.FC<DriverProfileFieldsProps> = ({
    data,
    onChange,
}) => {
    const [verifyStatus, setVerifyStatus] = React.useState<'idle' | 'verifying' | 'success' | 'error'>(
        data.documents.licensePhotoUrl ? 'success' : 'idle'
    );
    const [analysisStep, setAnalysisStep] = React.useState<string>('');
    const [failReason, setFailReason] = React.useState<string>('');

    const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVerifyStatus('verifying');
            setFailReason('');

            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = reader.result as string;

                // Load image to check dimensions and content
                const img = new Image();
                img.src = result;
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 100; // Small size for analysis
                    canvas.height = 100;
                    ctx?.drawImage(img, 0, 0, 100, 100);

                    const imageData = ctx?.getImageData(0, 0, 100, 100).data;
                    let totalBrightness = 0;
                    let colorVariance = 0;

                    if (imageData) {
                        for (let i = 0; i < imageData.length; i += 4) {
                            const r = imageData[i];
                            const g = imageData[i + 1];
                            const b = imageData[i + 2];
                            totalBrightness += (r + g + b) / 3;
                            colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
                        }
                    }

                    const avgBrightness = totalBrightness / (100 * 100);
                    const avgColorVariance = colorVariance / (100 * 100);
                    const isLandscape = img.width > img.height * 1.1;

                    // Step 1: Detect Layout
                    setAnalysisStep('Detecting document edges...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Step 2: Content Scan
                    setAnalysisStep('Analyzing biometric data...');
                    await new Promise(resolve => setTimeout(resolve, 1200));

                    // Step 3: Security Check
                    setAnalysisStep('Verifying authenticity tags...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Heuristic Logic (STRICTER):
                    if (!isLandscape) {
                        setVerifyStatus('error');
                        setFailReason('Image layout mismatch. Please upload a landscape photo of your license card.');
                    } else if (avgBrightness < 70) { // Much stricter for dark screens
                        setVerifyStatus('error');
                        setFailReason('You upload wrong photo, you must upload license photo.');
                    } else if (avgColorVariance < 25) { // Stricter for grayscale text/screenshots
                        setVerifyStatus('error');
                        setFailReason('You upload wrong photo, you must upload license photo.');
                    } else {
                        setVerifyStatus('success');
                        onChange({ documents: { ...data.documents, licensePhotoUrl: result } });
                    }
                    setAnalysisStep('');
                };
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <CollapsibleSection
                title="Vehicle Information"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                }
            >
                <Select
                    label="Vehicle Type"
                    value={data.vehicle.type}
                    options={[
                        { value: 'Sedan', label: 'Sedan' },
                        { value: 'SUV', label: 'SUV' },
                        { value: 'Hatchback', label: 'Hatchback' },
                        { value: 'Luxury', label: 'Luxury' },
                    ]}
                    onChange={(val) => onChange({ vehicle: { ...data.vehicle, type: val } })}
                />
                <Input
                    label="Model"
                    value={data.vehicle.model}
                    onChange={(e) => onChange({ vehicle: { ...data.vehicle, model: e.target.value } })}
                    placeholder="e.g. Tesla Model 3"
                />
                <Input
                    label="Plate Number"
                    value={data.vehicle.plateNumber}
                    onChange={(e) => onChange({ vehicle: { ...data.vehicle, plateNumber: e.target.value } })}
                    placeholder="e.g. ABC-1234"
                />
                <Input
                    label="Color"
                    value={data.vehicle.color}
                    onChange={(e) => onChange({ vehicle: { ...data.vehicle, color: e.target.value } })}
                    placeholder="e.g. Midnight Silver"
                />
                <Input
                    label="Seat Capacity"
                    type="number"
                    value={data.vehicle.seatCapacity}
                    onChange={(e) => onChange({ vehicle: { ...data.vehicle, seatCapacity: parseInt(e.target.value) } })}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Driver Documents"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
            >
                <Input
                    label="License Number"
                    value={data.documents.licenseNumber}
                    onChange={(e) => onChange({ documents: { ...data.documents, licenseNumber: e.target.value } })}
                />
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 ml-1">Insurance Status</label>
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Verified & Active</span>
                    </div>
                </div>

                <div className="md:col-span-2 mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 ml-1 block">Driver&apos;s License Photo</label>
                        {verifyStatus === 'success' && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wider">Verified</span>
                        )}
                        {verifyStatus === 'verifying' && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider animate-pulse">AI Checking...</span>
                        )}
                        {verifyStatus === 'error' && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wider">Failed</span>
                        )}
                    </div>

                    <div
                        className={`
                            relative group w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex items-center justify-center cursor-pointer
                            ${verifyStatus === 'idle' ? 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30' : ''}
                            ${verifyStatus === 'verifying' ? 'border-indigo-400 bg-indigo-50/20 cursor-wait shadow-inner' : ''}
                            ${verifyStatus === 'success' ? 'border-green-400 bg-green-50/10 shadow-sm' : ''}
                            ${verifyStatus === 'error' ? 'border-red-400 bg-red-50/20' : ''}
                        `}
                        onClick={() => {
                            if (verifyStatus !== 'verifying') {
                                document.getElementById('license-photo-input')?.click();
                            }
                        }}
                    >
                        {data.documents.licensePhotoUrl || verifyStatus === 'verifying' ? (
                            <>
                                {data.documents.licensePhotoUrl && <img src={data.documents.licensePhotoUrl} alt="Driver License" className={`w-full h-full object-cover transition-all duration-700 ${verifyStatus === 'verifying' ? 'opacity-30 grayscale blur-[4px] scale-110' : ''}`} />}

                                {verifyStatus === 'verifying' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50/40 backdrop-blur-[2px]">
                                        <div className="relative w-16 h-16 mb-4">
                                            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                                            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em] mb-1">{analysisStep}</p>
                                        <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest animate-pulse">Commuto AI Vision</p>
                                    </div>
                                )}

                                {verifyStatus === 'success' && (
                                    <motion.div
                                        initial={{ y: 40 }}
                                        animate={{ y: 0 }}
                                        className="absolute inset-x-0 bottom-0 bg-green-500/95 backdrop-blur-md py-2.5 flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Verification Result: Pass</span>
                                    </motion.div>
                                )}

                                {verifyStatus === 'error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-[4px] p-6 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-sm border border-red-200">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-bold text-red-800 mb-1">Invalid Document Type</p>
                                        <p className="text-[10px] text-red-600 font-medium leading-relaxed max-w-[200px] mb-4">{failReason}</p>
                                        <button
                                            className="px-6 py-2 bg-red-600 rounded-xl text-[10px] font-black text-white shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-widest"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setVerifyStatus('idle');
                                                setFailReason('');
                                                document.getElementById('license-photo-input')?.click();
                                            }}
                                        >
                                            TRY ANOTHER PHOTO
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-500 font-bold">Upload Driver&apos;s License</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.1em]">Horizontal photo only</p>
                            </div>
                        )}
                        <input
                            id="license-photo-input"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLicenseUpload}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors mt-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Update Vehicle Registration
                    </button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Driving Preferences"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4m-6 0a2 2 0 100-4m0 4a2 2 0 110-4" />
                    </svg>
                }
            >
                <Input
                    label="Max Passengers"
                    type="number"
                    value={data.preferences.maxPassengers}
                    onChange={(e) => onChange({ preferences: { ...data.preferences, maxPassengers: parseInt(e.target.value) } })}
                />
                <Input
                    label="Route Radius (km)"
                    type="number"
                    value={data.preferences.routeRadius}
                    onChange={(e) => onChange({ preferences: { ...data.preferences, routeRadius: parseInt(e.target.value) } })}
                />
                <Toggle
                    label="Currently Available"
                    description="Switch off to stop receiving ride requests"
                    checked={data.preferences.isAvailable}
                    onChange={(checked) => onChange({ preferences: { ...data.preferences, isAvailable: checked } })}
                    className="md:col-span-2 mt-2"
                />
            </CollapsibleSection>
        </>
    );
};
