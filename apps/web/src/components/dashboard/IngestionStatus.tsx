'use client';

import { useIngestionSources, connectIngestionSource, manageIngestionSources } from '@/hooks/useIngestionSources';
import { ingestionStatus } from '@/lib/flags';
import { trackUI } from '@/lib/telemetry';

export default function IngestionStatus() {
  const { connected, sources } = useIngestionSources();
  const showIngestionStatus = ingestionStatus();

  if (!showIngestionStatus) {
    return null;
  }

  const handleConnectSource = () => {
    trackUI.connectSourceClick('Bill.com');
    connectIngestionSource('Bill.com');
  };

  const handleManageSources = () => {
    trackUI.manageSourcesClick();
    manageIngestionSources();
  };

  return (
    <div className="rounded-lg bg-[linear-gradient(180deg,hsl(var(--surface-1))_0%,hsl(var(--surface-1)_/_0.8)_100%)] border border-[hsl(240_8%_18%_/_0.3)] px-4 py-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {connected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--success)_/_0.2)]">
                <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-text-1">
                Auto-ingest active · Syncing new invoices from {sources.join(', ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--warning)_/_0.2)]">
                <svg className="w-3 h-3 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="text-sm text-text-1">
                No data source connected. Connect Bill.com (recommended) to auto-ingest invoices.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={handleManageSources}
              className="px-3 py-1.5 text-xs font-medium text-text-2 hover:text-text-1 border border-[hsl(240_8%_18%_/_0.3)] rounded-md hover:bg-[hsl(var(--surface-2))] transition-colors"
            >
              Manage sources
            </button>
          ) : (
            <button
              onClick={handleConnectSource}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 rounded-md shadow-elev-1 transition-all"
            >
              Connect source
            </button>
          )}
        </div>
      </div>
    </div>
  );
}