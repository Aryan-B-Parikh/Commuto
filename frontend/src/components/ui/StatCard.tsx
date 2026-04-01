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
        <div className="bg-card p-3 lg:p-4 rounded-2xl border border-card-border shadow-sm shadow-black/20 flex items-start justify-between hover:border-card-border/80 transition-all duration-300">
            <div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-lg lg:text-xl font-bold text-foreground mt-1">{value}</h3>
                {trend && (
                    <p className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </p>
                )}
            </div>
            <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                {icon}
            </div>
        </div>
    );
}
