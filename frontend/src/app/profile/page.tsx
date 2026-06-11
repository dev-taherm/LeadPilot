'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Camera, Save, Lock, Building } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { get, put } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User as UserType, Business } from '@/types';

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuthStore();
  const [user, setUser_] = useState<UserType | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const [businessForm, setBusinessForm] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRes, businessRes] = await Promise.allSettled([
        get<UserType>('/auth/users/me/'),
        get<Business>('/businesses/'),
      ]);

      if (userRes.status === 'fulfilled') {
        const userData = userRes.value.data;
        setUser_(userData);
        setProfileForm({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone || '',
        });
      }

      if (businessRes.status === 'fulfilled') {
        const bizData = businessRes.value.data;
        setBusiness(bizData);
        setBusinessForm({
          name: bizData.name || '',
          industry: bizData.industry || '',
          website: bizData.website || '',
          description: bizData.description || '',
        });
      }
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await put<UserType>('/auth/users/me/', {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
      });
      setUser_(res.data);
      setUser(res.data);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (!passwordForm.old_password || !passwordForm.new_password) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await put('/auth/users/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setSaveMessage({ type: 'success', text: 'Password changed successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setPasswordError('Current password is incorrect');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBusinessSave = async () => {
    setIsSavingBusiness(true);
    setSaveMessage(null);
    try {
      await put('/businesses/', businessForm);
      setSaveMessage({ type: 'success', text: 'Business info updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to update business info' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const isOwner =
    authUser?.role === 'business_owner' || authUser?.role === 'super_admin';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          {saveMessage && (
            <Badge variant={saveMessage.type === 'success' ? 'success' : 'danger'}>
              {saveMessage.text}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <Avatar
                      src={user?.avatar}
                      name={`${profileForm.first_name} ${profileForm.last_name}`}
                      size="lg"
                    />
                    <button className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white shadow-sm hover:bg-blue-700">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {profileForm.first_name} {profileForm.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{profileForm.email}</p>
                    <Badge variant="info" className="mt-1 capitalize">
                      {authUser?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profileForm.first_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, first_name: e.target.value })
                      }
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={profileForm.last_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, last_name: e.target.value })
                      }
                      placeholder="Last name"
                    />
                  </div>
                  <Input
                    label="Email"
                    value={profileForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <Input
                    label="Phone"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleProfileSave} isLoading={isSaving}>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-base">Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, old_password: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirm_password: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    isLoading={isChangingPassword}
                    variant="outline"
                  >
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            {isOwner && (
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">Business Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Business Name"
                      value={businessForm.name}
                      onChange={(e) =>
                        setBusinessForm({ ...businessForm, name: e.target.value })
                      }
                      placeholder="Your business name"
                    />
                    <Input
                      label="Industry"
                      value={businessForm.industry}
                      onChange={(e) =>
                        setBusinessForm({ ...businessForm, industry: e.target.value })
                      }
                      placeholder="e.g., Technology, Healthcare"
                    />
                    <Input
                      label="Website"
                      value={businessForm.website}
                      onChange={(e) =>
                        setBusinessForm({ ...businessForm, website: e.target.value })
                      }
                      placeholder="https://example.com"
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={businessForm.description}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Describe your business..."
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={handleBusinessSave}
                      isLoading={isSavingBusiness}
                      className="w-full"
                    >
                      <Save className="h-4 w-4" />
                      Save Business Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
