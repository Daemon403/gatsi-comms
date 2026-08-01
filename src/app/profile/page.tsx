'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getCurrentEmployee } from '@/lib/actions/auth';
import { updateProfile, changePassword } from '@/lib/actions/profile';
import { User, Shield, KeyRound } from 'lucide-react';

interface MyProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  branch: { name: string } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentEmployee()
      .then((employee) => {
        if (cancelled) return;
        if (!employee) {
          router.push('/login');
          return;
        }
        setProfile(employee as unknown as MyProfile);
      })
      .catch(() => {
        if (!cancelled) router.push('/login');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    const formData = new FormData(e.currentTarget);

    startProfileTransition(async () => {
      try {
        const result = await updateProfile(formData);
        if (result.error || !result.data) {
          setProfileError(result.error || 'Failed to update profile');
          return;
        }
        setProfile((p) =>
          p
            ? {
                ...p,
                firstName: result.data!.firstName,
                lastName: result.data!.lastName,
                email: result.data!.email,
                phone: result.data!.phone,
              }
            : p
        );
        setProfileSuccess(true);
        router.refresh();
      } catch {
        setProfileError('Failed to update profile. Please try again.');
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const formData = new FormData(e.currentTarget);
    const currentPassword = (formData.get('currentPassword') as string) || '';
    const newPassword = (formData.get('newPassword') as string) || '';
    const confirmPassword = (formData.get('confirmPassword') as string) || '';

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    startPasswordTransition(async () => {
      try {
        const result = await changePassword(currentPassword, newPassword);
        if (result.error) {
          setPasswordError(result.error);
          return;
        }
        setPasswordSuccess(true);
        e.currentTarget.reset();
      } catch {
        setPasswordError('Failed to change password. Please try again.');
      }
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col bg-[#f8fafc]">
        <Header title="My Profile" />
        <div className="flex flex-1 items-center justify-center p-6">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100';

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title="My Profile" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                <p className="text-sm text-gray-500">
                  {profile.role}
                  {profile.branch ? ` · ${profile.branch.name}` : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {profileError && (
                <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Profile updated successfully
                </div>
              )}

              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  defaultValue={profile.firstName}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  defaultValue={profile.lastName}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={profile.email || ''}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone || ''}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={profilePending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profilePending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Use a password with at least 6 characters</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-6">
              {passwordError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Password changed successfully
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-gray-700">
                  Current Password *
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Shield size={18} className="text-emerald-500" />
            <p className="text-sm text-gray-600">
              Your access level: <span className="font-semibold text-gray-900">{profile.role}</span>. Contact an
              administrator to change your role or branch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
