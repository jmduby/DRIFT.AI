'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import UploadInvoicePanel from '@/components/invoices/UploadInvoicePanel';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSuccess = (invoiceId: string) => {
    // Dialog will close automatically when navigation happens
    onOpenChange(false);
    setSelectedFile(null);
  };

  const handleError = (error: string) => {
    // Error handling is done within the UploadInvoicePanel
    console.error('Upload error:', error);
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual Invoice Upload</DialogTitle>
          <DialogDescription>
            Drag & drop a PDF or choose a file. PDFs only, up to 10MB.
          </DialogDescription>
        </DialogHeader>

        <UploadInvoicePanel
          onSuccess={handleSuccess}
          onError={handleError}
          className=""
        />

        <DialogFooter>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-text-2 hover:text-text-1 transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}