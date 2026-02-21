'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface PassengerSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({ value, onChange }) => {
    const options = ['1', '2', '3', '4'];

    return (
        <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">
                Number of Passengers
            </label>
            <div className="flex p-1.5 bg-muted/30 border border-card-border/50 rounded-2xl gap-1.5 overflow-hidden">
                {options.map((num) => {
                    const isActive = value === num;
                    return (
                        <button
                            key={num}
                            type="button"
                            onClick={() => onChange(num)}
                            className="relative flex-1 py-3 group outline-none"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="passenger-tab"
                                    className="absolute inset-0 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20"
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                />
                            )}
                            <div className={`relative z-10 flex items-center justify-center gap-1.5 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-muted-foreground hover:text-foreground'
                                }`}>
                                <User className={`w-4 h-4 ${isActive ? 'fill-white/20' : ''}`} />
                                <span className="font-black text-sm">{num}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
