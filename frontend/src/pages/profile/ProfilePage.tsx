import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Shield, Lock, Save, ShieldAlert } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/apiClient';
import { updateProfileSchema, UpdateProfileFormData } from '@/lib/validations/auth';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    setApiError('');
    try {
      const response = await apiClient.put('/users/profile', data);
      if (response.data.success) {
        updateUser(response.data.data);
        reset({ fullName: response.data.data.fullName, newPassword: '' });
        success('Profile Updated', 'Your identity details and security credentials have been updated.');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update operator profile details.';
      setApiError(message);
      error('Update Failed', message);
    }
  };

  const rolesList = user?.roles
    ? Array.isArray(user.roles)
      ? user.roles
      : Array.from(user.roles)
    : [user?.role || 'ROLE_DEVELOPER'];

  return (
    <div>
      <PageHeader
        title="Operator Profile"
        description="Manage SRE operator identity, permissions, and security authentication credentials"
      />

      <div className="max-w-3xl space-y-6">
        {/* Profile Identity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shadow-inner">
                {user?.username?.charAt(0).toUpperCase() || 'O'}
              </div>
              <div>
                <CardTitle>{user?.fullName || user?.username}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
                <p className="text-[10px] uppercase text-slate-500 font-mono">Assigned Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300 font-mono">
                    {rolesList.join(', ')}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950">
                <p className="text-[10px] uppercase text-slate-500 font-mono">Username Handle</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-200 font-mono">@{user?.username}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Identity Settings</CardTitle>
            <CardDescription>Update display name or reset authentication password</CardDescription>
          </CardHeader>
          <CardContent>
            {apiError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    {...register('newPassword')}
                    placeholder="Leave blank to keep existing password"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
