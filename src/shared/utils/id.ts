import * as Crypto from 'expo-crypto';

export function createLocalId(): string {
  return Crypto.randomUUID();
}
