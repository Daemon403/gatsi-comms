'use client';

import Link from 'next/link';
import { Plus, Building2, MapPin, Phone, Mail, Pencil, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { getBranches, deleteBranch } from '@/lib/actions/branches';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadBranches() {
    getBranches().then((result) => {
      if (result.data) setBranches(result.data as Branch[]);
      setLoading(false);
    });
  }

  useEffect(loadBranches, []);

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteBranch(id);
        loadBranches();
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col">
      <Header title="Branches" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Branches</h2>
              <p className="text-sm text-gray-500">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
            </div>
            <Link
              href="/branches/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600"
            >
              <Plus size={18} />
              Add Branch
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20">
              <Building2 size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900">No branches yet</h3>
              <p className="mb-6 text-sm text-gray-500">Create your first branch to get started.</p>
              <Link
                href="/branches/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600"
              >
                <Plus size={18} />
                Add Branch
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <Building2 size={20} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/branches/${branch.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        disabled={isPending && deletingId === branch.id}
                        onClick={() => handleDelete(branch.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h3 className="mb-3 text-base font-bold text-gray-900">{branch.name}</h3>
                  <div className="space-y-2">
                    {branch.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span>{branch.address}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone size={14} className="shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail size={14} className="shrink-0" />
                        <span>{branch.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
