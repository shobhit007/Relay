export type NetworkStatus = 'unknown' | 'offline' | 'online';

export type NetworkState = {
  status: NetworkStatus;
  isOnline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
};
