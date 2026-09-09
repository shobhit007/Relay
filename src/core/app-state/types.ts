export type AppLifecycleState =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown';

export type AppStateSnapshot = {
  status: AppLifecycleState;
  isActive: boolean;
};
