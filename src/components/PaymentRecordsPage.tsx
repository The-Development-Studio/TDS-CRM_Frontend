import { CommercialHub, CommercialHubProps } from './CommercialHub';

type PaymentRecordsPageProps = Omit<CommercialHubProps, 'page'>;

export default function PaymentRecordsPage(props: PaymentRecordsPageProps) {
  return <CommercialHub {...props} page="payments" />;
}
