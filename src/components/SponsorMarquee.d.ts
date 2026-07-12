import type { Sponsor } from '../services/sponsors.service';

type SponsorMarqueeProps = {
  sponsors?: Sponsor[];
  rows?: number;
  compact?: boolean;
  ariaLabel?: string;
};

export default function SponsorMarquee(props: SponsorMarqueeProps): JSX.Element | null;
