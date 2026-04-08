'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { showToast } = useToast() as any;

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            showToast('error', 'Email is required');
            return;
        }
        if (newPassword.length < 8) {
            showToast('error', 'Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }

        setIsResetting(true);
        try {
            const res = await authAPI.resetPasswordDirect({
                email: email.trim(),
                new_password: newPassword,
            });
            showToast('success', res.message || 'Password updated successfully');
            router.push('/login');
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            showToast('error', typeof detail === 'string' ? detail : 'Failed to reset password.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-md bg-card border border-card-border rounded-2xl p-6 shadow-xl">
                <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Enter your email and new password to update your account.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full h-11 px-3 rounded-xl border border-card-border bg-background text-foreground"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="w-full h-11 px-3 rounded-xl border border-card-border bg-background text-foreground"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full h-11 px-3 rounded-xl border border-card-border bg-background text-foreground"
                        />
                    </div>
                    <Button type="submit" fullWidth isLoading={isResetting} className="h-11 font-bold">
                        Update Password
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Remembered your password? <Link href="/login" className="text-indigo-500 font-semibold">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
