'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.985]';

    const variantStyles = {
        primary: 'bg-[linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary-hover)_72%,white_28%))] text-white shadow-[0_16px_30px_rgba(47,128,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(47,128,255,0.26)]',
        secondary: 'border border-card-border bg-card text-foreground shadow-sm hover:bg-muted/70 hover:border-primary/20',
        outline: 'border border-card-border bg-transparent text-foreground hover:bg-muted/60 hover:border-primary/25',
        ghost: 'bg-transparent text-muted-foreground hover:bg-muted/65 hover:text-foreground',
        danger: 'bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white shadow-[0_16px_30px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(239,68,68,0.24)]',
    };

    const sizeStyles = {
        sm: 'min-h-[44px] gap-2 px-4 text-sm',
        md: 'min-h-[50px] gap-2.5 px-5 text-sm sm:text-base',
        lg: 'min-h-[56px] gap-2.5 px-6 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {leftIcon}
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
};
