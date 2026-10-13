import { CommercialHub, CommercialHubProps } from './CommercialHub';

type ProposalsPageProps = Omit<CommercialHubProps, 'page'>;

export default function ProposalsPage(props: ProposalsPageProps) {
  return <CommercialHub {...props} page="proposals" />;
}
