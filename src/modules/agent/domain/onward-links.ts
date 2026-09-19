import { FLEET_PATH, MARKETS_PATH, SYSTEMS_PATH } from '@/shared/lib/paths';

type OnwardLink = {
  label: string;
  description: string;
  to: string;
};

export const ONWARD_LINKS: readonly OnwardLink[] = [
  {
    label: 'Systems',
    description: 'Browse the universe system by system, down to every waypoint.',
    to: SYSTEMS_PATH,
  },
  {
    label: 'Fleet',
    description: 'Your ships, where they are and what they are carrying.',
    to: FLEET_PATH,
  },
  {
    label: 'Markets',
    description: 'Marketplaces near your fleet, with their goods and prices.',
    to: MARKETS_PATH,
  },
] as const;
