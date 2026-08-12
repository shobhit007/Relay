import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/core/context/AuthContext';
import { colors, spacing } from '@app/theme/tokens';
import { ApiError } from '@shared/api';
import { useOnceRouter } from '@shared/hooks';
import { AppText, Button, Screen, TextField } from '@shared/ui';

import { validateEmail, validatePassword } from '../utils/validation';

export function LoginScreen() {
  const { pushOnce, replaceOnce } = useOnceRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);

    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      replaceOnce('/(home)/conversations');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to log in. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.stackMd }}>
        <View style={{ gap: spacing.stackSm }}>
          <AppText variant="headline">Welcome back</AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            Log in to continue to your chats.
          </AppText>
        </View>

        <View style={{ gap: spacing.stackMd }}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            error={emailError ?? undefined}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            error={passwordError ?? undefined}
          />
        </View>

        {formError ? (
          <AppText variant="label-sm" color={colors.error}>
            {formError}
          </AppText>
        ) : null}

        <Button label="Log in" onPress={onSubmit} loading={loading} />

        <Pressable
          onPress={() => pushOnce('/(auth)/signup')}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <AppText variant="body-md" color={colors.secondaryText} align="center">
            Need an account?{' '}
            <AppText variant="label-lg" color={colors.accent}>
              Sign up
            </AppText>
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
