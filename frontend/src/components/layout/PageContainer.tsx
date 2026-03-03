'use client';

import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function PageContainer({ children, className = '', noPadding = false }: PageContainerProps) {
    return (
        <div className={`
            w-full max-w-7xl mx-auto animate-fadeIn
            ${noPadding ? '' : 'px-4 py-4 lg:px-8 lg:py-6'}
            pb-24 lg:pb-6
            ${className}
        `}>
            {children}
        </div>
    );
}
