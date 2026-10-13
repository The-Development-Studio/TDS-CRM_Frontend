import { CommercialHub, CommercialHubProps } from './CommercialHub';

type ProformaInvoicesPageProps = Omit<CommercialHubProps, 'page'>;

export default function ProformaInvoicesPage(props: ProformaInvoicesPageProps) {
  return <CommercialHub {...props} page="proforma" />;
}
