"use client";

import React from 'react';
import { PassengerProfile, TravelPreference } from '../../types/profile';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { CollapsibleSection } from '../ui/CollapsibleSection';

interface PassengerProfileFieldsProps {
    data: PassengerProfile;
    onChange: (data: Partial<PassengerProfile>) => void;
}

export const PassengerProfileFields: React.FC<PassengerProfileFieldsProps> = ({
    data,
    onChange,
}) => {
    const toggleTravelPreference = (pref: TravelPreference) => {
        const current = data.travelPreferences || [];
        const updated = current.includes(pref)
            ? current.filter(p => p !== pref)
            : [...current, pref];
        onChange({ travelPreferences: updated });
    };

    return (
        <>
            <CollapsibleSection
                title="Travel Preferences"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                }
            >
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 mb-3 block">Atmosphere during ride</label>
                    <div className="flex flex-wrap gap-2">
                        {(['quiet', 'chatty', 'music', 'any'] as TravelPreference[]).map((pref) => (
                            <button
                                key={pref}
                                type="button"
                                onClick={() => toggleTravelPreference(pref)}
                                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${data.travelPreferences?.includes(pref)
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                `}
                            >
                                {pref.charAt(0).toUpperCase() + pref.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <Toggle
                    label="Accessibility Needs"
                    description="Request vehicles with accessibility features if needed."
                    checked={data.accessibilityNeeds}
                    onChange={(checked) => onChange({ accessibilityNeeds: checked })}
                    className="md:col-span-2 mt-4"
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Payment Methods"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                }
            >
                <div className="md:col-span-2 space-y-3">
                    {data.paymentMethods?.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-white border border-slate-200 rounded-md flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{method.provider.substring(0, 4)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {method.type === 'card' ? `•••• ${method.last4}` : method.provider}
                                    </p>
                                    <p className="text-xs text-slate-500 capitalize">{method.type}</p>
                                </div>
                            </div>
                            {method.isDefault && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Default</span>
                            )}
                        </div>
                    ))}
                    <button type="button" className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                        + Add Payment Method
                    </button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Saved Places"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
            >
                <div className="md:col-span-2 space-y-4">
                    {data.savedPlaces.map((place, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{place.name}</p>
                                <p className="text-xs text-slate-500">{place.address}</p>
                            </div>
                            <button className="text-slate-400 hover:text-red-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                        + Add New Place
                    </button>
                </div>
            </CollapsibleSection>
        </>
    );
};
