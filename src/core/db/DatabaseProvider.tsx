import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../../drizzle/migrations';

import { db } from './client';

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return null;
  }

  return children;
}
