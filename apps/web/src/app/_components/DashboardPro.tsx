'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatUSD } from '@/lib/format';
import { useCountUp } from '@/lib/useCountUp';
import { Skeleton } from '@/components/Skeleton';
import { KpiCard, DataCard, ChartCard, EmptyState } from '@/components/ui';
import { isUIV2Enabled } from '@/lib/ui-flags';
import InvoiceUploader from '@/app/_components/InvoiceUploader';
// Note: Using simple SVG charts since recharts is not available

type TimeRange = 'mtd' | '30d' | 'quarter';

interface DashboardData {
  totalActiveVendors: number;
  totalDriftMTD: number;
  invoicesProcessedMTD: number;
  recentActivity: Array<{
    id: string;
    vendorName: string;
    uploadedAt: string;
    amount: number;
    vendorId?: string;
  }>;
  projectedSpend: number;
  vendorsWithFindings: number;
}

export default function DashboardPro() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/data');
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        } else {
          // Fallback to default values if API doesn't exist yet
          setData({
            totalActiveVendors: 4,
            totalDriftMTD: 886.18,
            invoicesProcessedMTD: 10,
            recentActivity: [],
            projectedSpend: 5200,
            vendorsWithFindings: 2
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback data
        setData({
          totalActiveVendors: 4,
          totalDriftMTD: 886.18,
          invoicesProcessedMTD: 10,
          recentActivity: [],
          projectedSpend: 5200,
          vendorsWithFindings: 2
        });
      } finally {
        // Simulate loading for demo
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchData();
  }, []);

  // Count-up animations for KPIs
  const animatedVendors = useCountUp({ value: data?.totalActiveVendors || 0 });
  const animatedDrift = useCountUp({ value: data?.totalDriftMTD || 0 });
  const animatedInvoices = useCountUp({ value: data?.invoicesProcessedMTD || 0 });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const filterByRange = (items: typeof data.recentActivity, range: TimeRange) => {
    if (!items) return [];
    
    const now = new Date();
    const start = new Date(now);
    
    if (range === 'mtd') { 
      start.setDate(1); 
    } else if (range === '30d') { 
      start.setDate(now.getDate() - 30); 
    } else { // quarter
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(qStartMonth, 1);
      start.setHours(0, 0, 0, 0);
    }
    
    return items.filter(item => {
      const ts = item.uploadedAt ? new Date(item.uploadedAt) : null;
      if (!ts) return true; // Include items without timestamps
      return ts >= start && ts <= now;
    });
  };

  const filteredActivity = data ? filterByRange(data.recentActivity, timeRange) : [];

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'mtd': return 'MTD';
      case '30d': return 'Last 30d';
      case 'quarter': return 'Quarter';
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
        <div className="max-w-6xl mx-auto space-y-8" aria-busy="true">
          {/* Header Skeleton */}
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-6 w-80" />
          </div>

          {/* Upload Panel Skeleton */}
          <Skeleton className="h-48 w-full" />

          {/* KPI Cards Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="rounded-xl shadow-lg p-6"
                style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity Skeleton */}
          <div 
            className="rounded-xl shadow-lg p-6"
            style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16 ml-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            <p className="text-lg font-roboto mb-3" style={{ color: 'var(--text-secondary)' }}>
              Invoice processing overview and recent activity
            </p>
            
            {/* Executive Summary */}
            <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
              You&apos;re on track to spend <strong style={{ color: 'var(--text-primary)' }}>{formatUSD(data.projectedSpend)}</strong> this month. 
              We&apos;ve found <strong style={{ color: 'var(--brand-yellow)' }}>{formatUSD(data.totalDriftMTD)}</strong> in recoverable variance across{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{data.vendorsWithFindings}</strong> vendor{data.vendorsWithFindings === 1 ? '' : 's'}.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="ml-auto flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}>
            {(['mtd', '30d', 'quarter'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm rounded-lg font-roboto transition-colors ${
                  timeRange === range 
                    ? 'text-white' 
                    : 'hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: timeRange === range ? 'var(--brand-steel-blue)' : 'transparent',
                  color: timeRange === range ? 'white' : 'var(--text-secondary)',
                  borderRadius: '8px'
                }}
                aria-pressed={timeRange === range}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Uploader */}
        <InvoiceUploader />

        {/* KPI Cards - UI V2 or Legacy */}
        {isUIV2Enabled() ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KpiCard
              title="Projected Monthly Spend"
              value={formatUSD(data.projectedSpend)}
              delta={12.5}
              deltaDirection="up"
              hint="vs last month"
              sparklineData={[4800, 5100, 5000, 5200, 5400, 5600, 5800, 5982]}
            />
            <KpiCard
              title="Confirmed Drift MTD"
              value={formatUSD(animatedDrift)}
              delta={data.totalDriftMTD > 0 ? 0 : -100}
              deltaDirection={data.totalDriftMTD > 0 ? "flat" : "down"}
              hint="recoverable variance"
            />
            <KpiCard
              title="Active Vendors"
              value={Math.round(animatedVendors)}
              hint="total vendors"
            />
            <KpiCard
              title="Invoices Processed MTD"
              value={Math.round(animatedInvoices)}
              delta={8.3}
              deltaDirection="up"
              hint="vs last month"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="rounded-xl shadow-lg p-6"
              style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                    Total Active Vendors
                  </p>
                  <p 
                    className="text-3xl font-bold font-inter mt-1" 
                    style={{ color: 'var(--text-primary)' }}
                    aria-live="polite"
                  >
                    {Math.round(animatedVendors)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)', borderRadius: '12px' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                       style={{ color: 'var(--brand-steel-blue)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl shadow-lg p-6"
              style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                    Total Drift MTD
                  </p>
                  <p 
                    className="text-3xl font-bold font-inter mt-1" 
                    style={{ color: 'var(--brand-yellow)' }}
                    aria-live="polite"
                  >
                    {formatUSD(animatedDrift)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)', borderRadius: '12px' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                       style={{ color: 'var(--brand-yellow)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl shadow-lg p-6"
              style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-roboto" style={{ color: 'var(--text-secondary)' }}>
                    Invoices Processed MTD
                  </p>
                  <p 
                    className="text-3xl font-bold font-inter mt-1" 
                    style={{ color: 'var(--text-primary)' }}
                    aria-live="polite"
                  >
                    {Math.round(animatedInvoices)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-surface-secondary)', borderRadius: '12px' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                       style={{ color: 'var(--brand-steel-blue)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section - UI V2 Only */}
        {isUIV2Enabled() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Projected Spend by Vendor" subtitle="Top 8 vendors by projected monthly spend">
              <div className="space-y-3">
                {[
                  { name: 'Rumpke', value: 2100, max: 2100 },
                  { name: 'Waste Management', value: 1850, max: 2100 },
                  { name: 'Republic Services', value: 1200, max: 2100 },
                  { name: 'Cintas', value: 890, max: 2100 },
                  { name: 'Aramark', value: 650, max: 2100 },
                  { name: 'Sysco', value: 580, max: 2100 },
                  { name: 'US Foods', value: 420, max: 2100 },
                  { name: 'Ecolab', value: 380, max: 2100 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {item.name}
                    </div>
                    <div className="flex-1 h-4 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[hsl(var(--brand))] rounded-full transition-all duration-500"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs text-[hsl(var(--card-foreground))] text-right">
                      ${(item.value / 1000).toFixed(1)}k
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
            
            <ChartCard title="Confirmed Drift Trend" subtitle="Last 12 weeks - downward trend">
              <div className="flex items-end justify-between h-full gap-1 px-4 pb-8">
                {[120, 85, 200, 150, 80, 45, 60, 30, 15, 5, 0, 0].map((value, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex-1 flex items-end">
                      <div 
                        className="w-full bg-[hsl(var(--warning))] rounded-t-sm transition-all duration-500"
                        style={{ 
                          height: `${Math.max(4, (value / 200) * 160)}px`,
                          opacity: value === 0 ? 0.3 : 1
                        }}
                      />
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      W{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {/* Lists Section - UI V2 Only */}
        {isUIV2Enabled() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard title="Attention" actions={
              <span className="text-xs text-[hsl(var(--muted-foreground))]">High findings</span>
            }>
              {data.vendorsWithFindings > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--danger))]/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--danger))]"></div>
                      <div>
                        <p className="font-medium text-[hsl(var(--card-foreground))]">Rumpke Invoice Variance</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Invoice #RMP-2024-003</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--danger))]">High</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>}
                  title="No issues found"
                  description="All invoices are processing normally"
                />
              )}
            </DataCard>
            
            <DataCard title="Renewals" actions={
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Next 30 days</span>
            }>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--warning))]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]"></div>
                    <div>
                      <p className="font-medium text-[hsl(var(--card-foreground))]">Rumpke Waste Contract</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Expires Dec 15, 2024</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--warning))]">21 days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]"></div>
                    <div>
                      <p className="font-medium text-[hsl(var(--card-foreground))]">Cintas Uniform Service</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Expires Jan 30, 2025</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">58 days</span>
                </div>
              </div>
            </DataCard>
          </div>
        )}

        {/* Enhanced Recent Activity */}
        <div 
          className="rounded-xl shadow-lg p-6"
          style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold font-inter" style={{ color: 'var(--text-primary)' }}>
              Recent Activity ({getTimeRangeLabel(timeRange)})
            </h2>
            <Link
              href="/vendors"
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-roboto"
              style={{ backgroundColor: 'var(--brand-steel-blue)', borderRadius: '12px' }}
            >
              View All Vendors
            </Link>
          </div>

          {filteredActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                     style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
                No activity in {getTimeRangeLabel(timeRange).toLowerCase()}
              </h3>
              <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
                Upload an invoice to see activity here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--background-surface-secondary)' }}>
                    <th className="text-left py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Vendor</th>
                    <th className="text-right py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</th>
                    <th className="text-right py-3 font-inter font-semibold" style={{ color: 'var(--text-primary)' }}>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-zinc-800/30 cursor-pointer transition-colors" 
                        style={{ borderColor: 'var(--background-surface-secondary)' }}>
                      <td className="py-4">
                        <Link href={`/invoice/${item.id}`}>
                          <div>
                            <p className="font-roboto font-medium" style={{ color: 'var(--text-primary)' }}>
                              {item.vendorName}
                            </p>
                            <p className="text-xs font-roboto" style={{ color: 'var(--text-secondary)' }}>
                              #{item.id.slice(0, 8)}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-4 font-roboto" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(item.amount)}
                      </td>
                      <td className="text-right py-4 font-roboto text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(item.uploadedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}