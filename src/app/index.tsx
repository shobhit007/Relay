import { Redirect } from 'expo-router';

import { useAuth } from '@/core/context/AuthContext';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(home)/chats" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
