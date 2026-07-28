'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import ExportButtons from '@/components/ExportButtons';
import {
  getRevenueReport,
  getRevenueByService,
  getProfitabilityReport,
  getExpenseBreakdown,
  getTopServices,
  getPreviousPeriodData,
} from '@/lib/actions/reports';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowDown,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
} from 'lucide-react';

interface DateRange {
  from: string;
  to: string;
}

interface RevenueEntry {
  period: string;
  revenue: number;
  paid: number;
  count: number;
}

interface ServiceEntry {
  category: string;
  revenue: number;
  count: number;
}

interface Profitability {
  totalRevenue: number;
  totalCollected: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  expenseCount: number;
}

interface ExpenseBreakdownData {
  categories: Array<{ category: string; amount: number }>;
  total: number;
}

interface TopService {
  name: string;
  category: string;
  revenue: number;
  count: number;
}

const EXPENSE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#f97316',
  '#06b6d4',
  '#ef4444',
  '#6b7280',
];

const SERVICE_BAR_COLORS = [
  'from-brand-500 to-brand-400',
  'from-blue-500 to-blue-400',
  'from-violet-500 to-violet-400',
  'from-amber-500 to-amber-400',
  'from-emerald-500 to-emerald-400',
  'from-rose-500 to-rose-400',
  'from-cyan-500 to-cyan-400',
  'from-orange-500 to-orange-400',
];

function getDatePresets() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const quarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  return {
    today: { from: today, to: today },
    thisWeek: { from: weekStart, to: weekEnd },
    thisMonth: { from: monthStart, to: monthEnd },
    thisQuarter: { from: quarterStart, to: quarterEnd },
    thisYear: { from: yearStart, to: yearEnd },
  };
}

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function computeChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function ReportsPage() {
  const presets = getDatePresets();
  const initialFrom = formatDateStr(presets.thisMonth.from);
  const initialTo = formatDateStr(presets.thisMonth.to);

  const [dateRange, setDateRange] = useState<DateRange>({ from: initialFrom, to: initialTo });
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(initialTo);
  const [loading, setLoading] = useState(true);

  const [revenueData, setRevenueData] = useState<RevenueEntry[]>([]);
  const [serviceData, setServiceData] = useState<ServiceEntry[]>([]);
  const [profitability, setProfitability] = useState<Profitability | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownData | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [previousProfitability, setPreviousProfitability] = useState<Profitability | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const dateFrom = new Date(dateRange.from);
      const dateTo = new Date(dateRange.to + 'T23:59:59');

      const [revenueResult, serviceResult, profitabilityResult, expenseResult, topServicesResult, prevResult] =
        await Promise.all([
          getRevenueReport(dateFrom, dateTo, 'day'),
          getRevenueByService(dateFrom, dateTo),
          getProfitabilityReport(dateFrom, dateTo),
          getExpenseBreakdown(dateFrom, dateTo),
          getTopServices(dateFrom, dateTo),
          getPreviousPeriodData(dateFrom, dateTo),
        ]);

      if (!cancelled) {
        setRevenueData(revenueResult.data ?? []);
        setServiceData(serviceResult.data ?? []);
        setProfitability(profitabilityResult.data);
        setExpenseBreakdown(expenseResult.data);
        setTopServices(topServicesResult.data ?? []);
        setPreviousProfitability(prevResult.data);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [dateRange]);

  function handlePreset(name: string) {
    const preset = presets[name as keyof typeof presets];
    if (preset) {
      setDateRange({ from: formatDateStr(preset.from), to: formatDateStr(preset.to) });
      setCustomFrom(formatDateStr(preset.from));
      setCustomTo(formatDateStr(preset.to));
      setActivePreset(name);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDateRange({ from: customFrom, to: customTo });
    setActivePreset('custom');
  }

  const profitMargin = profitability && profitability.totalRevenue > 0
    ? (profitability.netProfit / profitability.totalRevenue) * 100
    : 0;

  const prevProfitMargin = previousProfitability && previousProfitability.totalRevenue > 0
    ? (previousProfitability.netProfit / previousProfitability.totalRevenue) * 100
    : 0;

  const expenseTotal = expenseBreakdown?.total ?? 0;
  const maxServiceRevenue = serviceData.length > 0 ? Math.max(...serviceData.map((s) => s.revenue), 1) : 1;

  const comparisonMetrics = profitability && previousProfitability ? [
    {
      label: 'Revenue',
      current: profitability.totalRevenue,
      previous: previousProfitability.totalRevenue,
      icon: <DollarSign size={18} />,
      color: 'text-brand-600',
    },
    {
      label: 'Expenses',
      current: profitability.totalExpenses,
      previous: previousProfitability.totalExpenses,
      icon: <Receipt size={18} />,
      color: 'text-rose-600',
    },
    {
      label: 'Net Profit',
      current: profitability.netProfit,
      previous: previousProfitability.netProfit,
      icon: <TrendingUp size={18} />,
      color: profitability.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      label: 'Orders',
      current: profitability.orderCount,
      previous: previousProfitability.orderCount,
      icon: <BarChart3 size={18} />,
      color: 'text-blue-600',
    },
  ] : [];

  return (
    <div className="flex flex-col">
      <Header title="Reports & Analytics" />
      <div className="flex-1 p-6">
        {/* Date Range Presets */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'thisWeek', label: 'This Week' },
                { key: 'thisMonth', label: 'This Month' },
                { key: 'thisQuarter', label: 'This Quarter' },
                { key: 'thisYear', label: 'This Year' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePreset(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activePreset === key
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              {activePreset === 'custom' && (
                <span className="rounded-xl bg-accent-100 px-4 py-2 text-sm font-medium text-accent-700">
                  Custom
                </span>
              )}
            </div>

            <form onSubmit={handleCustomSubmit} className="flex items-end gap-3">
              <div>
                <label htmlFor="dateFrom" className="mb-1 block text-xs font-medium text-gray-500">
                  From
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="mb-1 block text-xs font-medium text-gray-500">
                  To
                </label>
                <input
                  type="date"
                  id="dateTo"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-brand-600"
              >
                <Calendar size={16} className="mr-1 inline" />
                Generate
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <span className="ml-3 text-sm text-gray-500">Loading report data...</span>
          </div>
        ) : (
          <>
            {/* Revenue Summary Cards */}
            {profitability && (
              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Revenue"
                  value={formatCurrency(profitability.totalRevenue)}
                  change={Math.round(computeChange(profitability.totalRevenue, previousProfitability?.totalRevenue ?? 0))}
                  icon={<DollarSign size={22} />}
                  trend={profitability.totalRevenue >= (previousProfitability?.totalRevenue ?? 0) ? 'up' : 'down'}
                  color="brand"
                />
                <StatsCard
                  title="Total Expenses"
                  value={formatCurrency(profitability.totalExpenses)}
                  change={Math.round(computeChange(profitability.totalExpenses, previousProfitability?.totalExpenses ?? 0))}
                  icon={<Receipt size={22} />}
                  trend={profitability.totalExpenses <= (previousProfitability?.totalExpenses ?? 0) ? 'up' : 'down'}
                  color="rose"
                />
                <StatsCard
                  title="Net Profit"
                  value={formatCurrency(profitability.netProfit)}
                  change={Math.round(computeChange(profitability.netProfit, previousProfitability?.netProfit ?? 0))}
                  icon={profitability.netProfit >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                  trend={profitability.netProfit >= 0 ? 'up' : 'down'}
                  color={profitability.netProfit >= 0 ? 'accent' : 'rose'}
                />
                <StatsCard
                  title="Profit Margin"
                  value={`${profitMargin.toFixed(1)}%`}
                  change={Math.round(profitMargin - prevProfitMargin)}
                  icon={<BarChart3 size={22} />}
                  trend={profitMargin >= prevProfitMargin ? 'up' : 'down'}
                  color="teal"
                />
              </div>
            )}

            {/* Revenue Trend + Revenue by Service */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Revenue Trend</h3>
                {revenueData.length > 0 ? (
                  <div className="space-y-2">
                    {revenueData.map((d) => (
                      <div key={d.period} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs font-medium text-gray-500">{d.period}</span>
                        <div className="flex-1">
                          <div
                            className="h-6 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                            style={{ width: `${(d.revenue / maxServiceRevenue) * 100}%`, minWidth: d.revenue > 0 ? '8px' : '0' }}
                          />
                        </div>
                        <div className="w-32 shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(d.revenue)}</p>
                          <p className="text-[10px] text-gray-400">{d.count} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No revenue data for this period</p>
                )}
              </div>

              {/* Revenue by Service Category */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Revenue by Service Category</h3>
                {serviceData.length > 0 ? (
                  <div className="space-y-4">
                    {serviceData.map((s, i) => {
                      const total = serviceData.reduce((sum, sv) => sum + sv.revenue, 0);
                      const percentage = total > 0 ? (s.revenue / total) * 100 : 0;
                      return (
                        <div key={s.category}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">{s.category}</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(s.revenue)}</span>
                              <span className="ml-2 text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${SERVICE_BAR_COLORS[i % SERVICE_BAR_COLORS.length]} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-gray-400">{s.count} items</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No service data for this period</p>
                )}
              </div>
            </div>

            {/* Daily Revenue Breakdown + Expense Breakdown */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Daily Revenue Breakdown Table */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Daily Revenue Breakdown</h3>
                {revenueData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase text-gray-500">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4 text-right">Revenue</th>
                          <th className="pb-3 pr-4 text-right">Collected</th>
                          <th className="pb-3 pr-4 text-right">Orders</th>
                          <th className="pb-3 text-right">Avg Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {revenueData.map((d) => (
                          <tr key={d.period} className="transition-colors hover:bg-gray-50/80">
                            <td className="py-2.5 pr-4 font-medium text-gray-900">{d.period}</td>
                            <td className="py-2.5 pr-4 text-right font-semibold text-brand-700">{formatCurrency(d.revenue)}</td>
                            <td className="py-2.5 pr-4 text-right text-emerald-600">{formatCurrency(d.paid)}</td>
                            <td className="py-2.5 pr-4 text-right text-gray-600">{d.count}</td>
                            <td className="py-2.5 text-right text-gray-600">{d.count > 0 ? formatCurrency(d.revenue / d.count) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 font-bold">
                          <td className="py-2.5 pr-4 text-gray-900">Total</td>
                          <td className="py-2.5 pr-4 text-right text-brand-700">{formatCurrency(revenueData.reduce((s, d) => s + d.revenue, 0))}</td>
                          <td className="py-2.5 pr-4 text-right text-emerald-600">{formatCurrency(revenueData.reduce((s, d) => s + d.paid, 0))}</td>
                          <td className="py-2.5 pr-4 text-right text-gray-900">{revenueData.reduce((s, d) => s + d.count, 0)}</td>
                          <td className="py-2.5 text-right text-gray-900">
                            {revenueData.reduce((s, d) => s + d.count, 0) > 0
                              ? formatCurrency(revenueData.reduce((s, d) => s + d.revenue, 0) / revenueData.reduce((s, d) => s + d.count, 0))
                              : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No daily data for this period</p>
                )}
              </div>

              {/* Expense Breakdown Pie Chart */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Expense Breakdown</h3>
                {expenseBreakdown && expenseBreakdown.categories.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4 h-44 w-44">
                      <div
                        className="h-full w-full rounded-full shadow-inner"
                        style={{
                          background: `conic-gradient(${expenseBreakdown.categories.map((cat, i) => {
                            const start = expenseBreakdown.categories
                              .slice(0, i)
                              .reduce((sum, c) => sum + (c.amount / expenseBreakdown.total) * 360, 0);
                            const end = start + (cat.amount / expenseBreakdown.total) * 360;
                            return `${EXPENSE_COLORS[i % EXPENSE_COLORS.length]} ${start}deg ${end}deg`;
                          }).join(', ')})`,
                        }}
                      />
                      <div className="absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400">Total</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(expenseBreakdown.total)}</p>
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      {expenseBreakdown.categories.map((cat, i) => {
                        const percentage = expenseBreakdown.total > 0 ? (cat.amount / expenseBreakdown.total) * 100 : 0;
                        return (
                          <div key={cat.category} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                            />
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600">{cat.category}</span>
                            <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                            <span className="text-xs font-semibold text-gray-700">{formatCurrency(cat.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No expenses for this period</p>
                )}
              </div>
            </div>

            {/* Top Services + Comparison */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Services */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Top Services</h3>
                  <Award size={20} className="text-accent-500" />
                </div>
                {topServices.length > 0 ? (
                  <div className="space-y-3">
                    {topServices.map((service, i) => {
                      const maxCount = topServices[0]?.count ?? 1;
                      const barWidth = maxCount > 0 ? (service.count / maxCount) * 100 : 0;
                      return (
                        <div key={service.name} className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white text-xs ${
                            i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                            i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500' :
                            'bg-gradient-to-br from-gray-200 to-gray-400'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900 truncate">{service.name}</p>
                              <p className="text-sm font-bold text-brand-700 shrink-0 ml-2">{formatCurrency(service.revenue)}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0">{service.count} items</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-gray-400">{service.category}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No service data for this period</p>
                )}
              </div>

              {/* Comparison to Previous Period */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Period Comparison</h3>
                  <TrendingUp size={20} className="text-brand-500" />
                </div>
                {comparisonMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {comparisonMetrics.map((metric) => {
                      const change = computeChange(metric.current, metric.previous);
                      const isPositive = change > 0;
                      const isNeutral = Math.abs(change) < 0.1;
                      return (
                        <div key={metric.label} className="rounded-xl bg-gray-50/80 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${metric.color}`}>
                                {metric.icon}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{metric.label}</p>
                                <p className="text-xs text-gray-500">vs previous period</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(metric.current)}</p>
                              <div className="flex items-center justify-end gap-1">
                                {isNeutral ? (
                                  <Minus size={12} className="text-gray-400" />
                                ) : isPositive ? (
                                  <ArrowUpRight size={12} className="text-emerald-500" />
                                ) : (
                                  <ArrowDownRight size={12} className="text-rose-500" />
                                )}
                                <span className={`text-xs font-semibold ${isNeutral ? 'text-gray-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isNeutral ? '0.0' : `${isPositive ? '+' : ''}${change.toFixed(1)}%`}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400">was {formatCurrency(metric.previous)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No comparison data available</p>
                )}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex justify-end">
              <ExportButtons
                revenueData={revenueData}
                serviceData={serviceData}
                profitability={profitability}
                dateRange={{ from: dateRange.from, to: dateRange.to }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
