import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/core/context/AuthContext';
import { colors, spacing } from '@app/theme/tokens';
import { ApiError } from '@shared/api';
import { useOnceRouter } from '@shared/hooks';
import { AppText, Button, Screen, TextField } from '@shared/ui';

import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../utils/validation';

export function SignupScreen() {
  const { pushOnce, replaceOnce } = useOnceRouter();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const nextDisplayNameError = validateDisplayName(displayName);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password, { minLength: 8 });
    setDisplayNameError(nextDisplayNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);

    if (nextDisplayNameError || nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      await signUp({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      replaceOnce('/(home)/conversations');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to sign up. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.stackMd }}>
        <View style={{ gap: spacing.stackSm }}>
          <AppText variant="headline">Create account</AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            Join Relay with your name and email.
          </AppText>
        </View>

        <View style={{ gap: spacing.stackMd }}>
          <TextField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            error={displayNameError ?? undefined}
          />
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
            textContentType="newPassword"
            autoComplete="password-new"
            error={passwordError ?? undefined}
          />
        </View>

        {formError ? (
          <AppText variant="label-sm" color={colors.error}>
            {formError}
          </AppText>
        ) : null}

        <Button label="Sign up" onPress={onSubmit} loading={loading} />

        <Pressable
          onPress={() => pushOnce('/(auth)/login')}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <AppText variant="body-md" color={colors.secondaryText} align="center">
            Already have an account?{' '}
            <AppText variant="label-lg" color={colors.accent}>
              Log in
            </AppText>
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
