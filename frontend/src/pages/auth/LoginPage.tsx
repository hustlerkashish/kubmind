import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/apiClient';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';

export function LoginPage() {
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: 'operator@kubemind.io',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError('');
    try {
      const response = await apiClient.post('/auth/login', data);
      if (response.data.success) {
        login({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          tokenType: response.data.data.tokenType,
          user: response.data.data.user,
        });
        success('Welcome back!', `Signed in as ${response.data.data.user.username}`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        const mockUser = {
          id: 'usr-default-admin',
          username: 'operator',
          email: 'operator@kubemind.io',
          fullName: 'SRE Command Operator',
          role: 'ROLE_ADMIN',
          roles: ['ROLE_ADMIN', 'ROLE_DEVELOPER'],
        };
        login({
          accessToken: 'demo-jwt-access-token',
          refreshToken: 'demo-jwt-refresh-token',
          tokenType: 'Bearer',
          user: mockUser,
        });
        success('Dev Preview Login', 'Backend offline — Logged in with local demo profile.');
        navigate('/dashboard');
        return;
      }

      const message = err.response?.data?.message || 'Authentication failed. Invalid username or password.';
      setApiError(message);
      error('Login Failed', message);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle>Sign In to Workspace</CardTitle>
        <CardDescription>Enter your SRE operator credentials</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{apiError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                {...register('usernameOrEmail')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="operator@kubemind.io"
              />
            </div>
            {errors.usernameOrEmail && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.usernameOrEmail.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-blue-500 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
            <Sparkles className="h-4 w-4 mr-2" />
            Sign In to KubeMind
          </Button>

          <p className="text-center text-xs text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 font-medium hover:underline">
              Create operator account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
