import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, User, Shield, ShieldAlert, Code } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/apiClient';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';

export function RegisterPage() {
  const [apiError, setApiError] = useState('');
  const { success, error } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      role: 'DEVELOPER',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    try {
      const response = await apiClient.post('/auth/register', data);
      if (response.data.success) {
        success('Registration Successful', 'Account created! Please sign in with your credentials.');
        navigate('/login');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please check input details.';
      setApiError(message);
      error('Registration Error', message);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle>Create Operator Account</CardTitle>
        <CardDescription>Register a new SRE or Developer profile</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                {...register('fullName')}
                placeholder="Alex Mercer"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <div className="relative">
              <Code className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                {...register('username')}
                placeholder="alex_sre"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {errors.username && <p className="text-[11px] text-rose-400 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                {...register('email')}
                placeholder="alex@kubemind.io"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
          </div>

          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('role', 'DEVELOPER')}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                  selectedRole === 'DEVELOPER'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Developer</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'ADMIN')}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>SRE / Admin</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
            Register Account
          </Button>

          <p className="text-center text-xs text-slate-400 mt-3">
            Already registered?{' '}
            <Link to="/login" className="text-blue-400 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
