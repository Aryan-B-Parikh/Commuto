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
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm flex items-start justify-between hover:shadow-md dark:hover:hover-glow transition-all duration-300">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendUp ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]} ${color === 'indigo' ? 'dark:glow-primary' : ''}`}>
                {icon}
            </div>
        </div>
    );
}
