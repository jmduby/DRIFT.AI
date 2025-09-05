'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { styleFoundation } from '@/lib/flags';
import { formatUSD } from '@/lib/format';

interface IssueCardProps {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
  lineRef?: string;
  amountDeltaCents?: number;
  date?: string;
  onIgnore?: () => void;
  onOpenContext?: (ref?: string) => void;
  overbillingData?: {
    expected_total: number;
    invoice_total: number;
    overbilling_total: number;
    breakdown: {
      unit_rate_delta: number;
      fuel_surcharge_over_cap: number;
      unauthorized_lines_total: number;
    };
  };
}

export default function IssueCard({
  id,
  title,
  severity,
  message,
  suggestion,
  lineRef,
  amountDeltaCents,
  date,
  onIgnore,
  onOpenContext,
  overbillingData
}: IssueCardProps) {
  const [reviewed, setReviewed] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const isStyleFoundation = styleFoundation();

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      label: 'Critical',
      bg: 'bg-[hsl(0,100%,60%/0.08)]',
      border: 'border-[hsl(0,100%,60%/0.35)]',
      text: isStyleFoundation ? 'text-[hsl(0,100%,75%)]' : 'text-red-400',
      dot: 'bg-[hsl(0,100%,60%)]'
    },
    high: {
      icon: AlertTriangle,
      label: 'High',
      bg: 'bg-[hsl(24,100%,50%/0.08)]',
      border: 'border-[hsl(24,100%,50%/0.35)]',
      text: isStyleFoundation ? 'text-[hsl(24,100%,70%)]' : 'text-orange-400',
      dot: 'bg-[hsl(24,100%,50%)]'
    },
    medium: {
      icon: AlertCircle,
      label: 'Medium',
      bg: 'bg-[hsl(45,100%,50%/0.08)]',
      border: 'border-[hsl(45,100%,50%/0.35)]',
      text: isStyleFoundation ? 'text-[hsl(45,100%,70%)]' : 'text-yellow-400',
      dot: 'bg-[hsl(45,100%,50%)]'
    },
    low: {
      icon: Info,
      label: 'Low',
      bg: 'bg-white/5',
      border: 'border-white/10',
      text: isStyleFoundation ? 'text-neutral-200' : 'text-neutral-300',
      dot: 'bg-neutral-400'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleMarkReviewed = () => {
    setReviewed(!reviewed);
    // TODO: Wire to backend
    console.log('Mark reviewed:', id, !reviewed);
  };

  const handleIgnore = () => {
    setIgnored(true);
    onIgnore?.();
    // TODO: Wire to backend
    console.log('Ignore issue:', id);
  };

  const handleOpenContext = () => {
    onOpenContext?.(lineRef);
    // TODO: Implement scroll-to-line and highlight animation
    console.log('Open context for line:', lineRef);
    
    if (lineRef) {
      // Scroll to line item and briefly highlight it
      const lineElement = document.querySelector(`[data-line-ref="${lineRef}"]`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add temporary highlight class
        lineElement.classList.add('bg-white/10');
        setTimeout(() => {
          lineElement.classList.remove('bg-white/10');
        }, 2000);
      }
    }
  };

  if (ignored) {
    return null; // This would be handled by a "Hidden issues" accordion in the real implementation
  }

  return (
    <article
      className={`rounded-2xl border p-4 md:p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-200 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] focus-within:ring-2 focus-within:ring-[hsl(var(--accent-400))]/60 ${
        config.bg
      } ${config.border}`}
      tabIndex={0}
      role="article"
      aria-labelledby={`issue-title-${id}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Left: Issue Content */}
        <div className="flex-1 min-w-0">
          {/* Severity Badge and Title */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${config.text}`}>
              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
              <Icon className="w-3 h-3" />
              <span className="font-inter">{config.label}</span>
              {reviewed && <Check className="w-3 h-3 text-green-400" />}
            </div>
          </div>

          <h3 
            id={`issue-title-${id}`}
            className={`text-lg font-semibold mb-2 font-inter ${
              isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
            }`}
          >
            {title}
          </h3>

          <p className={`text-sm mb-3 leading-relaxed ${
            isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
          }`}>
            {message}
          </p>

          {suggestion && (
            <div className={`text-sm p-3 rounded-lg border-l-4 mb-3 ${
              isStyleFoundation 
                ? 'bg-white/5 border-l-[hsl(var(--accent-400))] text-text-2' 
                : 'bg-[var(--background-surface-secondary)] border-l-blue-400 text-[var(--text-secondary)]'
            }`}>
              <span className="font-medium">Suggestion: </span>
              {suggestion}
            </div>
          )}

          {/* Overbilling Breakdown */}
          {overbillingData && (
            <div className={`text-sm p-3 rounded-lg border mb-3 ${
              isStyleFoundation 
                ? 'bg-white/5 border-white/10 text-text-2' 
                : 'bg-[var(--background-surface-secondary)] border-[var(--background-surface-secondary)] text-[var(--text-secondary)]'
            }`}>
              <div className="font-medium mb-2 text-red-400">
                Overbilling: ${overbillingData.overbilling_total.toFixed(2)}
              </div>
              <ul className="space-y-1 text-xs">
                {overbillingData.breakdown.unit_rate_delta > 0 && (
                  <li>• Unit rate variance: ${overbillingData.breakdown.unit_rate_delta.toFixed(2)}</li>
                )}
                {overbillingData.breakdown.fuel_surcharge_over_cap > 0 && (
                  <li>• Fuel surcharge over cap: ${overbillingData.breakdown.fuel_surcharge_over_cap.toFixed(2)}</li>
                )}
                {overbillingData.breakdown.unauthorized_lines_total > 0 && (
                  <li>• Unauthorized line items: ${overbillingData.breakdown.unauthorized_lines_total.toFixed(2)}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Amount and Actions */}
        <div className="flex flex-col lg:items-end gap-4 lg:min-w-[180px]">
          {/* Amount Delta */}
          {amountDeltaCents !== undefined && amountDeltaCents !== 0 && (
            <div className={`text-right ${
              amountDeltaCents > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <div className="text-lg font-semibold font-inter">
                {amountDeltaCents > 0 ? '+' : ''}{formatUSD(amountDeltaCents)}
              </div>
              <div className="text-xs opacity-80">
                {amountDeltaCents > 0 ? 'Recoverable' : 'Variance'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 lg:w-full">
            {/* Primary Action: Open in Context */}
            {lineRef && (
              <button
                onClick={handleOpenContext}
                className={`px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                  isStyleFoundation
                    ? 'bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 shadow-elev-1'
                    : 'bg-[var(--brand-steel-blue)] hover:opacity-90 shadow-lg'
                } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60`}
                aria-label={`Open context for line ${lineRef}`}
              >
                Open in context
              </button>
            )}

            {/* Secondary Action: Mark Reviewed */}
            <button
              onClick={handleMarkReviewed}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                reviewed
                  ? isStyleFoundation
                    ? 'bg-green-400/10 border-green-400/30 text-green-400'
                    : 'bg-green-100 border-green-300 text-green-800'
                  : isStyleFoundation
                    ? 'bg-white/5 border-white/10 text-text-2 hover:bg-white/10 hover:text-text-1'
                    : 'bg-transparent border-[var(--background-surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-surface-secondary)] hover:text-[var(--text-primary)]'
              } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60`}
              aria-label={reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
            >
              {reviewed ? 'Reviewed ✓' : 'Mark reviewed'}
            </button>

            {/* Tertiary Action: Ignore */}
            <button
              onClick={handleIgnore}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isStyleFoundation
                  ? 'text-text-3 hover:text-text-2'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              } focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60`}
              aria-label={`Ignore issue: ${title}`}
            >
              Ignore for now
            </button>
          </div>
        </div>
      </div>

      {/* Footer: Meta */}
      {(lineRef || date) && (
        <div className={`mt-4 pt-3 border-t text-xs flex items-center gap-4 ${
          isStyleFoundation 
            ? 'border-white/10 text-text-3' 
            : 'border-[var(--background-surface-secondary)] text-[var(--text-secondary)]'
        }`}>
          {lineRef && (
            <span>
              Line: {lineRef}
            </span>
          )}
          {date && (
            <span>
              {new Date(date).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </article>
  );
}