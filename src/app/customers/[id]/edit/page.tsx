'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import Header from '@/components/Header';
import { getCustomer, updateCustomer } from '@/lib/actions/customers';
import CustomerMeasurements from '@/components/CustomerMeasurements';
import type { Measurements } from '@/components/CustomerMeasurements';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredContact, setPreferredContact] = useState('SMS');
  const [branchId, setBranchId] = useState('');
  const [measurements, setMeasurements] = useState<Measurements>({});

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      params.then(({ id }) => getCustomer(id)),
      fetch('/api/branches').then((r) => r.json()).catch(() => []),
    ]).then(([result, branchData]) => {
      setBranches(branchData);
      if (result.data) {
        const c = result.data;
        setFirstName(c.firstName);
        setLastName(c.lastName);
        setEmail(c.email || '');
        setPhone(c.phone || '');
        setAddress(c.address || '');
        setNotes(c.notes || '');
        setPreferredContact(c.preferredContact || 'SMS');
        setBranchId(c.branchId || '');
        setMeasurements((c.measurements || {}) as Measurements);
      } else {
        setError(result.error || 'Customer not found');
      }
      setLoading(false);
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !phone) {
      setError('First name, last name, and phone are required');
      return;
    }

    const formData = new FormData();
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('email', email);
    formData.set('phone', phone);
    formData.set('address', address);
    formData.set('notes', notes);
    formData.set('preferredContact', preferredContact);
    formData.set('branchId', branchId);

    if (Object.keys(measurements).some((k) => measurements[k])) {
      formData.set('measurements', JSON.stringify(measurements));
    }

    const { id } = await params;
    startTransition(async () => {
      try {
        const result = await updateCustomer(id, formData);
        if (result.error) {
          setError(result.error);
        } else {
          router.push(`/customers/${id}`);
        }
      } catch {
        setError('Failed to update customer.');
      }
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Edit Customer" />
        <div className="flex-1 p-6">
          <div className="text-center text-gray-500 py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title="Edit Customer" />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Customer Information</h3>
          <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="preferredContact" className="mb-1 block text-sm font-medium text-gray-700">
                Preferred Contact Method
              </label>
              <select
                id="preferredContact"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="branchId" className="mb-1 block text-sm font-medium text-gray-700">
                Branch
              </label>
              <select
                id="branchId"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">No branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <CustomerMeasurements value={measurements} onChange={setMeasurements} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
