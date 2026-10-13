import { CommercialHub, CommercialHubProps } from './CommercialHub';

type QuotationsPageProps = Omit<CommercialHubProps, 'page'>;

export default function QuotationsPage(props: QuotationsPageProps) {
  return <CommercialHub {...props} page="quotations" />;
}
