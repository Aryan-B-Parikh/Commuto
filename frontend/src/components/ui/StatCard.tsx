"use client";

import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    color?: 'indigo' | 'blue' | 'purple' | 'orange';
}

export function StatCard({ label, value, trend, trendUp, icon, color = 'indigo' }: StatCardProps) {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 text-indigo-400',
        blue: 'bg-blue-500/10 text-blue-400',
        purple: 'bg-purple-500/10 text-purple-400',
        orange: 'bg-orange-500/10 text-orange-400',
    };

    return (
        <div className="bg-[#111827] p-4 lg:p-6 rounded-2xl border border-[#1E293B] shadow-sm shadow-black/20 flex items-start justify-between hover:border-[#374151] transition-all duration-300">
            <div>
                <p className="text-sm font-medium text-[#9CA3AF]">{label}</p>
                <h3 className="text-xl lg:text-2xl font-bold text-[#F9FAFB] mt-1">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                {icon}
            </div>
        </div>
    );
}
