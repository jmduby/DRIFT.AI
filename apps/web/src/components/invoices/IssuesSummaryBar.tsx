import { styleFoundation } from '@/lib/flags';
import { formatUSD } from '@/lib/format';

interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface IssuesSummaryBarProps {
  counts: SeverityCounts;
  driftCents: number;
}

export default function IssuesSummaryBar({ counts, driftCents }: IssuesSummaryBarProps) {
  const isStyleFoundation = styleFoundation();
  
  const severityColors = {
    critical: {
      dot: 'bg-[hsl(0,100%,60%)]',
      text: isStyleFoundation ? 'text-[hsl(0,100%,75%)]' : 'text-red-400',
      bg: 'bg-[hsl(0,100%,60%/0.08)]',
      border: 'border-[hsl(0,100%,60%/0.35)]'
    },
    high: {
      dot: 'bg-[hsl(24,100%,50%)]',
      text: isStyleFoundation ? 'text-[hsl(24,100%,70%)]' : 'text-orange-400',
      bg: 'bg-[hsl(24,100%,50%/0.08)]',
      border: 'border-[hsl(24,100%,50%/0.35)]'
    },
    medium: {
      dot: 'bg-[hsl(45,100%,50%)]',
      text: isStyleFoundation ? 'text-[hsl(45,100%,70%)]' : 'text-yellow-400',
      bg: 'bg-[hsl(45,100%,50%/0.08)]',
      border: 'border-[hsl(45,100%,50%/0.35)]'
    },
    low: {
      dot: 'bg-neutral-400',
      text: isStyleFoundation ? 'text-neutral-200' : 'text-neutral-300',
      bg: 'bg-white/5',
      border: 'border-white/10'
    }
  };

  const severityData = [
    { key: 'critical' as const, label: 'Critical', count: counts.critical },
    { key: 'high' as const, label: 'High', count: counts.high },
    { key: 'medium' as const, label: 'Medium', count: counts.medium },
    { key: 'low' as const, label: 'Low', count: counts.low }
  ];

  const totalIssues = counts.critical + counts.high + counts.medium + counts.low;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      {/* Severity Pills */}
      <div className="flex flex-wrap gap-2">
        {severityData.map(({ key, label, count }) => {
          const colors = severityColors[key];
          
          return (
            <div
              key={key}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${
                colors.bg
              } ${colors.border} ${colors.text}`}
            >
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="font-inter">
                {label} {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions and Total */}
      <div className="flex items-center gap-3">
        {/* Total Recoverable Variance */}
        {driftCents !== 0 && (
          <div className={`text-right ${
            isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
          }`}>
            <div className="text-xs font-medium mb-1">
              Total Recoverable Variance
            </div>
            <div className={`text-lg font-semibold ${
              driftCents > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {driftCents > 0 ? '+' : ''}{formatUSD(driftCents)}
            </div>
          </div>
        )}

        {/* Filter Button (stub) */}
        {totalIssues > 0 && (
          <button
            onClick={() => {
              // TODO: Implement filter functionality
              console.log('Filter issues');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              isStyleFoundation
                ? 'bg-white/5 border-white/10 text-text-2 hover:bg-white/10 hover:text-text-1'
                : 'bg-transparent border-[var(--background-surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-surface-secondary)] hover:text-[var(--text-primary)]'
            } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60`}
            aria-label="Filter issues"
          >
            Filter
          </button>
        )}

        {/* Export Report Button (stub) */}
        {totalIssues > 0 && (
          <button
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Export report');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              isStyleFoundation
                ? 'bg-white/5 border-white/10 text-text-2 hover:bg-white/10 hover:text-text-1'
                : 'bg-transparent border-[var(--background-surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-surface-secondary)] hover:text-[var(--text-primary)]'
            } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60`}
            aria-label="Export issues report"
          >
            Export report
          </button>
        )}
      </div>
    </div>
  );
}