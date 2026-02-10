'use client';

import React, { useRef, useState, useEffect } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    value,
    onChange,
    disabled = false,
    error = false,
}) => {
    const [focused, setFocused] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Split value into array of characters
    const valueArray = value.split('').slice(0, length);

    useEffect(() => {
        // Focus first empty input on mount
        const firstEmptyIndex = valueArray.length;
        if (firstEmptyIndex < length && inputRefs.current[firstEmptyIndex]) {
            inputRefs.current[firstEmptyIndex]?.focus();
        }
    }, []);

    const handleChange = (index: number, char: string) => {
        if (!/^\d*$/.test(char)) return; // Only allow digits

        const newValue = value.split('');
        newValue[index] = char;
        const joined = newValue.join('').slice(0, length);
        onChange(joined);

        // Move to next input
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        onChange(pastedData);

        // Focus the input after pasted content
        const nextIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={valueArray[index] || ''}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={disabled}
                    className={`
            w-12 h-14 sm:w-14 sm:h-16
            text-center text-2xl font-bold
            rounded-xl border-2
            transition-all duration-200
            focus:outline-none
            ${error
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : focused
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                />
            ))}
        </div>
    );
};
