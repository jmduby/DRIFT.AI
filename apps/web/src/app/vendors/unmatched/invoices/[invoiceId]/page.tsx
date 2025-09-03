import InvoiceDetailPage from '@/app/vendors/[vendorId]/invoices/[invoiceId]/page';

interface Props {
  params: { invoiceId: string };
}

export default function UnmatchedInvoicePage(props: Props) {
  // Use the same component but force vendorId to 'unmatched'
  const modifiedProps = {
    ...props,
    params: {
      ...props.params,
      vendorId: 'unmatched'
    }
  };
  
  return InvoiceDetailPage(modifiedProps);
}