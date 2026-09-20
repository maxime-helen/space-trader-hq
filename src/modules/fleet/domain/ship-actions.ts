import type { ShipNavStatus } from '@/shared/api/types';

export const canOrbit = (status: ShipNavStatus): boolean => status === 'DOCKED';

export const canDock = (status: ShipNavStatus): boolean => status === 'IN_ORBIT';

export const canNavigate = (status: ShipNavStatus): boolean => status === 'IN_ORBIT';
