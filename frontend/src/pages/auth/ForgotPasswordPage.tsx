import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Key, Lock, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/apiClient';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from '@/lib/validations/auth';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [issuedToken, setIssuedToken] = useState('');
  const [apiError, setApiError] = useState('');
  const { success, error } = useToast();
  const navigate = useNavigate();

  const requestForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  });

  const onRequestSubmit = async (data: ForgotPasswordFormData) => {
    setApiError('');
    try {
      const response = await apiClient.post('/auth/forgot-password', data);
      if (response.data.success) {
        const token = response.data.data?.resetToken || '';
        setIssuedToken(token);
        resetForm.setValue('token', token);
        setStep('reset');
        success('Reset Token Dispatched', 'Check your token below to authorize password update.');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to request password reset.';
      setApiError(message);
      error('Request Error', message);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setApiError('');
    try {
      const response = await apiClient.post('/auth/reset-password', data);
      if (response.data.success) {
        success('Password Reset Complete', 'You can now sign in with your new password.');
        navigate('/login');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Password reset failed. Token may be invalid or expired.';
      setApiError(message);
      error('Reset Error', message);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{step === 'request' ? 'Reset Password' : 'Confirm New Password'}</CardTitle>
          <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
        <CardDescription>
          {step === 'request'
            ? 'Enter your registered operator email to receive a recovery token'
            : 'Enter your reset token and establish a new secure password'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operator Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  {...requestForm.register('email')}
                  placeholder="operator@kubemind.io"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {requestForm.formState.errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{requestForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={requestForm.formState.isSubmitting}
            >
              Send Reset Token
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
            <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-200 font-mono">
              <p className="font-semibold text-cyan-400 mb-0.5">Authorization Reset Token:</p>
              <p className="break-all text-[11px] select-all">{issuedToken}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reset Token</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  {...resetForm.register('token')}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {resetForm.formState.errors.token && (
                <p className="text-[11px] text-rose-400 mt-1">{resetForm.formState.errors.token.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  {...resetForm.register('newPassword')}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  {...resetForm.register('confirmPassword')}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={resetForm.formState.isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
