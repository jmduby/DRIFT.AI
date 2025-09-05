import { notFound } from 'next/navigation';
import { listInvoicesByVendor } from '@/server/invoiceStore';
import { getVendor } from '@/server/store';
import VendorInvoicesClient from './VendorInvoicesClient';

interface Props {
  params: { vendorId: string };
}

export default async function VendorInvoicesPage({ params }: Props) {
  // Fetch vendor details and invoices in parallel
  const [vendor, invoices] = await Promise.all([
    getVendor(params.vendorId),
    listInvoicesByVendor(params.vendorId)
  ]);
  
  if (!vendor) {
    notFound();
  }

  return <VendorInvoicesClient vendor={vendor} initialInvoices={invoices} />;
}