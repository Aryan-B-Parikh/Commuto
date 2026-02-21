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
        indigo: 'bg-indigo-50 text-indigo-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-300">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendUp ? 'text-indigo-600' : 'text-red-500'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]} ${color === 'indigo' ? '' : ''}`}>
                {icon}
            </div>
        </div>
    );
}
