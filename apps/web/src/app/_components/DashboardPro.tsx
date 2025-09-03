'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatUSD } from '@/lib/format';
import { useCountUp } from '@/lib/useCountUp';
import { Skeleton } from '@/components/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiTile } from '@/components/ui/KpiTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-6 w-80" />
        </div>

        {/* Upload Panel Skeleton */}
        <GlassCard className="p-6">
          <Skeleton className="h-48 w-full" />
        </GlassCard>

        {/* KPI Cards Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <GlassCard className="p-5">
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
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SectionHeader title="Dashboard" />
          <p className="text-txt2 mb-3">
            Invoice processing overview and recent activity
          </p>
          
          {/* Executive Summary */}
          <p className="text-sm text-txt2">
            You&apos;re on track to spend <strong className="text-txt1">{formatUSD(data.projectedSpend)}</strong> this month. 
            We&apos;ve found <strong className="text-accentOra">{formatUSD(data.totalDriftMTD)}</strong> in recoverable variance across{' '}
            <strong className="text-txt1">{data.vendorsWithFindings}</strong> vendor{data.vendorsWithFindings === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="ml-auto flex gap-1 rounded-xl2 p-1 bg-bg1/60 backdrop-blur-12">
          {(['mtd', '30d', 'quarter'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                timeRange === range 
                  ? 'bg-brand text-white shadow-glowViolet' 
                  : 'text-txt2 hover:bg-bg1/80'
              }`}
              aria-pressed={timeRange === range}
            >
              {getTimeRangeLabel(range)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Uploader */}
      <GlassCard tone="elevated" className="p-6 border-white/10">
        <InvoiceUploader />
      </GlassCard>

      {/* KPI Tiles - Terzo Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiTile
          label="Projected Monthly Spend"
          value={formatUSD(data.projectedSpend)}
          sublabel="vs last month"
          accent="cyan"
        />
        <KpiTile
          label="Confirmed Drift MTD"
          value={formatUSD(animatedDrift)}
          sublabel="recoverable variance"
          accent="violet"
        />
        <KpiTile
          label="Active Vendors"
          value={Math.round(animatedVendors)}
          sublabel="total vendors"
          accent="cyan"
        />
        <KpiTile
          label="Invoices Processed MTD"
          value={Math.round(animatedInvoices)}
          sublabel="vs last month"
          accent="violet"
        />
      </div>

      {/* Charts Section - Terzo Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <SectionHeader title="Projected Spend by Vendor" />
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
                <div className="w-24 text-xs text-txt2 truncate font-tabular">
                  {item.name}
                </div>
                <div className="flex-1 h-4 bg-bg2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand2 rounded-full transition-all duration-500 shadow-glowCyan"
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-xs text-txt1 text-right font-tabular">
                  ${(item.value / 1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <GlassCard className="p-5">
          <SectionHeader title="Confirmed Drift Trend" />
          <div className="flex items-end justify-between h-32 gap-1 px-4">
            {[120, 85, 200, 150, 80, 45, 60, 30, 15, 5, 0, 0].map((value, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex-1 flex items-end">
                  <div 
                    className="w-full bg-accentOra rounded-t-sm transition-all duration-500"
                    style={{ 
                      height: `${Math.max(4, (value / 200) * 100)}px`,
                      opacity: value === 0 ? 0.3 : 1,
                      boxShadow: value > 0 ? 'var(--glow-violet)' : 'none'
                    }}
                  />
                </div>
                <span className="text-xs text-txt2">
                  W{i + 1}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alert Lists - Terzo Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <SectionHeader 
            title="Attention" 
            right={<span className="text-xs text-txt2">High findings</span>}
          />
          {data.vendorsWithFindings > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accentOra/10 ring-1 ring-accentOra/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accentOra"></div>
                  <div>
                    <p className="font-medium text-txt1">Rumpke Invoice Variance</p>
                    <p className="text-sm text-txt2">Invoice #RMP-2024-003</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-accentOra px-2 py-1 rounded bg-accentOra/10">High</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto mb-2 text-brand2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-txt1 font-medium">No issues found</p>
              <p className="text-txt2 text-sm">All invoices are processing normally</p>
            </div>
          )}
        </GlassCard>
        
        <GlassCard className="p-5">
          <SectionHeader 
            title="Renewals" 
            right={<span className="text-xs text-txt2">Next 30 days</span>}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accentOra/10 ring-1 ring-accentOra/30 hover:bg-accentOra/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accentOra"></div>
                <div>
                  <p className="font-medium text-txt1">Rumpke Waste Contract</p>
                  <p className="text-sm text-txt2">Expires Dec 15, 2024</p>
                </div>
              </div>
              <span className="text-sm font-medium text-accentOra px-2 py-1 rounded bg-accentOra/10">21 days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg2/50 hover:bg-bg2/70 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-txt2"></div>
                <div>
                  <p className="font-medium text-txt1">Cintas Uniform Service</p>
                  <p className="text-sm text-txt2">Expires Jan 30, 2025</p>
                </div>
              </div>
              <span className="text-sm font-medium text-txt2">58 days</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity - Terzo Style */}
      <GlassCard className="p-5">
        <SectionHeader 
          title={`Recent Activity (${getTimeRangeLabel(timeRange)})`}
          right={
            <Link
              href="/vendors"
              className="px-4 py-2 text-white rounded-lg bg-brand hover:bg-brand/90 transition-all duration-300 shadow-glowViolet hover:shadow-glowViolet"
            >
              View All Vendors
            </Link>
          }
        />

        {filteredActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl2 bg-bg2/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-txt2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2 text-txt1">
              No activity in {getTimeRangeLabel(timeRange).toLowerCase()}
            </h3>
            <p className="text-txt2">
              Upload an invoice to see activity here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b divide-y divide-white/5 border-white/5">
                  <th className="text-left py-3 text-txt2 uppercase tracking-wide text-[11px] font-medium">Vendor</th>
                  <th className="text-right py-3 text-txt2 uppercase tracking-wide text-[11px] font-medium">Amount</th>
                  <th className="text-right py-3 text-txt2 uppercase tracking-wide text-[11px] font-medium">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActivity.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="py-4">
                      <Link href={`/invoice/${item.id}`}>
                        <div>
                          <p className="font-medium text-txt1">
                            {item.vendorName}
                          </p>
                          <p className="text-xs text-txt2 font-tabular">
                            #{item.id.slice(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-right py-4 text-txt1 font-tabular">
                      {formatUSD(item.amount)}
                    </td>
                    <td className="text-right py-4 text-txt2">
                      {formatDate(item.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}