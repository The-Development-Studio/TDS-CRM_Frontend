import { CommercialHub, CommercialHubProps } from './CommercialHub';

type TaxInvoicesPageProps = Omit<CommercialHubProps, 'page'>;

export default function TaxInvoicesPage(props: TaxInvoicesPageProps) {
  return <CommercialHub {...props} page="invoices" />;
}
