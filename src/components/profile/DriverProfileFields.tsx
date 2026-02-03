"use client";

import React from 'react';
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
