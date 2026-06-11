'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  MoreVertical,
  Mail,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { get, post, del, patch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User as UserType } from '@/types';

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'business_owner', label: 'Business Owner' },
];

const roleBadgeVariant: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  super_admin: 'warning',
  business_owner: 'success',
  staff: 'default',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  business_owner: 'Owner',
  staff: 'Staff',
};

export default function TeamPage() {
  const { user: currentUser } = useAuthStore();
  const [members, setMembers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff',
  });
  const [inviteError, setInviteError] = useState('');

  const isOwner = currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await get<{ results: UserType[] }>('/auth/users/');
      setMembers(res.data.results || []);
    } catch {
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteForm.email) {
      setInviteError('Email is required');
      return;
    }
    setIsInviting(true);
    setInviteError('');
    try {
      await post('/auth/users/invite/', {
        email: inviteForm.email,
        role: inviteForm.role,
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'staff' });
      fetchMembers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setInviteError(
        error.response?.data?.message || 'Failed to send invitation'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await del(`/auth/users/${userId}/`);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setActionMenuId(null);
    } catch {
      // error handled silently
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await patch(`/auth/users/${userId}/`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole as UserType['role'] } : m))
      );
      setActionMenuId(null);
    } catch {
      // error handled silently
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No team members"
                description="Invite your first team member to get started"
                action={
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-4 py-4 sm:px-6"
                  >
                    <Avatar
                      src={member.avatar}
                      name={`${member.first_name} ${member.last_name}`}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        {member.id === currentUser?.id && (
                          <Badge variant="info">You</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={roleBadgeVariant[member.role] || 'default'}>
                        {roleLabels[member.role] || member.role}
                      </Badge>
                      {isOwner && member.id !== currentUser?.id && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenuId(
                                actionMenuId === member.id ? null : member.id
                              )
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenuId === member.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <div className="px-3 py-1.5">
                                  <p className="text-xs font-medium text-gray-500">
                                    Change Role
                                  </p>
                                </div>
                                {roleOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      handleRoleChange(member.id, option.value)
                                    }
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                                      member.role === option.value
                                        ? 'text-blue-600'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <Shield className="h-4 w-4" />
                                    {option.label}
                                    {member.role === option.value && (
                                      <span className="ml-auto text-xs">
                                        Current
                                      </span>
                                    )}
                                  </button>
                                ))}
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove Member
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteError('');
          setInviteForm({ email: '', role: 'staff' });
        }}
        title="Invite Team Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteForm.email}
            onChange={(e) => {
              setInviteForm({ ...inviteForm, email: e.target.value });
              setInviteError('');
            }}
            placeholder="colleague@company.com"
            error={inviteError}
          />
          <Select
            label="Role"
            value={inviteForm.role}
            onChange={(e) =>
              setInviteForm({ ...inviteForm, role: e.target.value })
            }
            options={roleOptions}
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setInviteError('');
                setInviteForm({ email: '', role: 'staff' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              isLoading={isInviting}
              disabled={!inviteForm.email}
            >
              <Mail className="h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
