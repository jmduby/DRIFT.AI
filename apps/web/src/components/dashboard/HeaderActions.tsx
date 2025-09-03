'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UploadDialog from './UploadDialog';
import { trackUI } from '@/lib/telemetry';

export default function HeaderActions() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const pathname = usePathname();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle 'U' key on dashboard route and when not focused on input elements
      if (
        e.key.toLowerCase() === 'u' && 
        pathname === '/' && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        trackUI.keyboardShortcut('u', 'open_manual_upload');
        setShowUploadDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [pathname]);

  const handleUploadClick = () => {
    trackUI.openManualUpload();
    setShowUploadDialog(true);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleUploadClick}
        className="relative inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-elev-1 bg-[linear-gradient(180deg,hsl(var(--accent-400))_0%,hsl(var(--accent-500))_100%)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]/60 transition-all"
        title="Upload invoice (Press U)"
      >
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        Manual Upload
      </button>

      <UploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
      />
    </div>
  );
}