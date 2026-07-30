'use client';

import { Ruler } from 'lucide-react';

export interface Measurements {
  shoulder?: string;
  chest?: string;
  waist?: string;
  hip?: string;
  sleeve?: string;
  neck?: string;
  inseam?: string;
  length?: string;
  bust?: string;
  armhole?: string;
  [key: string]: string | undefined;
}

interface Props {
  value: Measurements;
  onChange: (m: Measurements) => void;
}

const MEASUREMENT_FIELDS = [
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'sleeve', label: 'Sleeve' },
  { key: 'neck', label: 'Neck' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'length', label: 'Length' },
  { key: 'bust', label: 'Bust' },
  { key: 'armhole', label: 'Armhole' },
];

export default function CustomerMeasurements({ value, onChange }: Props) {
  function update(key: string, val: string) {
    onChange({ ...value, [key]: val || undefined });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Ruler size={16} className="text-brand-500" />
        <h4 className="text-sm font-semibold text-gray-700">Body Measurements (inches)</h4>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {MEASUREMENT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">{label}</label>
            <input
              type="text"
              value={value[key] || ''}
              onChange={(e) => update(key, e.target.value)}
              placeholder="—"
              className="w-full rounded-lg border border-gray-200 bg-gray-50/60 px-2.5 py-1.5 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
