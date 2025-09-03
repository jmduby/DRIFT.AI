'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { MatchCandidate, UUID } from '@/types/domain';
import { styleFoundation } from '@/lib/flags';

interface LikelyMatchCardProps {
  candidates: MatchCandidate[];
  onConfirmMatch: (vendorId: UUID) => Promise<void>;
  onCreateNewVendor: () => void;
}

interface ScoreBadgeProps {
  label: string;
  score: number;
  color: 'green' | 'blue' | 'yellow' | 'gray';
}

function ScoreBadge({ label, score, color }: ScoreBadgeProps) {
  const isStyleFoundation = styleFoundation();
  
  const colorClasses = {
    green: isStyleFoundation ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-900 text-green-300 border-green-700',
    blue: isStyleFoundation ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-900 text-blue-300 border-blue-700',
    yellow: isStyleFoundation ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-900 text-yellow-300 border-yellow-700',
    gray: isStyleFoundation ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-800 text-gray-300 border-gray-600'
  };

  const formattedScore = score > 0 ? `+${(score * 100).toFixed(0)}` : '0';
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${colorClasses[color]}`}>
      {label} {formattedScore}
    </span>
  );
}

function CandidateRow({ candidate, onConfirm }: { 
  candidate: MatchCandidate; 
  onConfirm: (vendorId: UUID) => Promise<void>;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const isStyleFoundation = styleFoundation();
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(candidate.vendorId);
    } catch (error) {
      console.error('Failed to confirm match:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border hover:border-opacity-60 transition-all ${
      isStyleFoundation 
        ? 'bg-[hsl(var(--surface-2))] border-[hsl(240_8%_18%_/_0.3)] hover:border-[hsl(var(--accent-400)_/_0.5)]' 
        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className={`font-semibold ${
              isStyleFoundation ? 'text-text-1' : 'text-white'
            }`}>
              {candidate.vendorName}
            </h4>
            <div className={`text-sm font-mono px-2 py-1 rounded ${
              isStyleFoundation ? 'bg-[hsl(var(--surface-3))] text-text-2' : 'bg-zinc-700 text-gray-300'
            }`}>
              {(candidate.score * 100).toFixed(0)}% match
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {candidate.scoreBreakdown.nameAlias > 0 && (
              <ScoreBadge 
                label="Name" 
                score={candidate.scoreBreakdown.nameAlias} 
                color="blue" 
              />
            )}
            {candidate.scoreBreakdown.domain > 0 && (
              <ScoreBadge 
                label="Domain" 
                score={candidate.scoreBreakdown.domain} 
                color="green" 
              />
            )}
            {candidate.scoreBreakdown.address > 0 && (
              <ScoreBadge 
                label="Address" 
                score={candidate.scoreBreakdown.address} 
                color="yellow" 
              />
            )}
            {candidate.scoreBreakdown.contractHint > 0 && (
              <ScoreBadge 
                label="Contract" 
                score={candidate.scoreBreakdown.contractHint} 
                color="gray" 
              />
            )}
          </div>

          {candidate.reasons.length > 0 && (
            <ul className={`text-sm space-y-1 ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-400'
            }`}>
              {candidate.reasons.map((reason, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-current opacity-60"></span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Link
            href={`/vendors/${candidate.vendorId}`}
            className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
              isStyleFoundation 
                ? 'border-[hsl(240_8%_18%_/_0.3)] text-text-2 hover:bg-[hsl(var(--surface-3))] hover:text-text-1' 
                : 'border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            View
          </Link>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-all disabled:opacity-50 ${
              isStyleFoundation
                ? 'bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 shadow-elev-1'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isConfirming ? 'Confirming...' : 'Confirm Match'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LikelyMatchCard({ 
  candidates, 
  onConfirmMatch, 
  onCreateNewVendor 
}: LikelyMatchCardProps) {
  const isStyleFoundation = styleFoundation();
  const topCandidates = candidates.slice(0, 3);

  if (topCandidates.length === 0) {
    return null;
  }

  return (
    <Card className={`shadow-elev-2 transition-shadow ${
      isStyleFoundation ? 'hover:shadow-elev-3' : ''
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${
              isStyleFoundation ? 'text-text-1' : 'text-white'
            }`}>
              Likely Matches
            </h3>
            <p className={`text-sm ${
              isStyleFoundation ? 'text-text-2' : 'text-gray-400'
            }`}>
              We found {candidates.length} potential vendor match{candidates.length !== 1 ? 'es' : ''} for this invoice
            </p>
          </div>
          <Badge tone="warning" className="text-xs">
            Unmatched
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCandidates.map((candidate) => (
            <CandidateRow
              key={candidate.vendorId}
              candidate={candidate}
              onConfirm={onConfirmMatch}
            />
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[hsl(240_8%_18%_/_0.3)] flex justify-between items-center">
          <p className={`text-sm ${
            isStyleFoundation ? 'text-text-2' : 'text-gray-400'
          }`}>
            Can't find the right vendor?
          </p>
          <button
            onClick={onCreateNewVendor}
            className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
              isStyleFoundation 
                ? 'border-[hsl(240_8%_18%_/_0.3)] text-text-1 hover:bg-[hsl(var(--surface-2))]' 
                : 'border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            Create New Vendor
          </button>
        </div>
      </CardContent>
    </Card>
  );
}