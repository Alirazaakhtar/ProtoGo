import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerSoft: '#FEF2F2',

  white: '#FFFFFF',
};

type Step = 'code' | 'password';

export default function ResetPasswordScreen() {
  const params =
    useLocalSearchParams<{
      email?: string | string[];
    }>();

  const emailParam =
    Array.isArray(params.email)
      ? params.email[0]
      : params.email;

  const email =
    emailParam
      ?.trim()
      .toLowerCase() ?? '';

  const [step, setStep] =
    useState<Step>('code');

  const [code, setCode] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    verifying,
    setVerifying,
  ] = useState(false);

  const [
    resending,
    setResending,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  async function verifyCode() {
    const cleanedCode =
      code.trim();

    if (!email) {
      setErrorMessage(
        'E-mailadressen mangler. Gå tilbage og bed om en ny kode.'
      );

      return;
    }

    if (!cleanedCode) {
      setErrorMessage(
        'Indtast koden fra mailen.'
      );

      return;
    }

    try {
      setVerifying(true);
      setErrorMessage(null);

      const { error } =
        await supabase.auth.verifyOtp({
          email,
          token: cleanedCode,
          type: 'recovery',
        });

      if (error) {
        throw error;
      }

      setStep('password');
    } catch (error: any) {
      console.error(
        'Kunne ikke verificere recovery-kode:',
        error
      );

      const message =
        error?.message
          ?.toLowerCase()
          ?.trim() ?? '';

      if (
        message.includes('expired') ||
        message.includes('invalid')
      ) {
        setErrorMessage(
          'Koden er ugyldig eller udløbet. Kontrollér koden eller send en ny.'
        );

        return;
      }

      setErrorMessage(
        'Koden kunne ikke bekræftes. Prøv igen.'
      );
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (!email) {
      setErrorMessage(
        'E-mailadressen mangler. Gå tilbage og bed om en ny kode.'
      );

      return;
    }

    try {
      setResending(true);
      setErrorMessage(null);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email
        );

      if (error) {
        throw error;
      }

      setCode('');

      Alert.alert(
        'Ny kode sendt',
        `Vi har sendt en ny kode til ${email}. Tjek også din spam-mappe, hvis du ikke kan finde mailen.`
      );
    } catch (error: any) {
      console.error(
        'Kunne ikke sende ny kode:',
        error
      );

      const message =
        error?.message
          ?.toLowerCase()
          ?.trim() ?? '';

      if (
        message.includes(
          'email rate limit exceeded'
        )
      ) {
        setErrorMessage(
          'Der er sendt for mange mails på kort tid. Vent lidt og prøv igen.'
        );

        return;
      }

      setErrorMessage(
        'En ny kode kunne ikke sendes. Prøv igen om lidt.'
      );
    } finally {
      setResending(false);
    }
  }

  function goBackToLogin() {
    router.dismissTo('/login');
  }

  async function updatePassword() {
    if (password.length < 8) {
      setErrorMessage(
        'Adgangskoden skal være mindst 8 tegn.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        'De to adgangskoder er ikke ens.'
      );

      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      const {
        error: signOutError,
      } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.warn(
          'Adgangskoden blev ændret, men logout fejlede:',
          signOutError
        );
      }

      Alert.alert(
        'Adgangskode ændret',
        'Din adgangskode er blevet ændret. Du kan nu logge ind med den nye adgangskode.',
        [
          {
            text: 'Log ind',
            onPress: goBackToLogin,
          },
        ]
      );
    } catch (error) {
      console.error(
        'Kunne ikke ændre adgangskode:',
        error
      );

      setErrorMessage(
        'Adgangskoden kunne ikke ændres. Prøv igen.'
      );
    } finally {
      setSaving(false);
    }
  }

  const busy =
    verifying ||
    resending ||
    saving;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Image
            source={require('../assets/images/protogo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {step === 'code' ? (
            <>
              <Text style={styles.title}>
                Indtast din kode
              </Text>

              <Text
                style={styles.subtitle}
              >
                Vi har sendt en kode til{' '}
                {email ||
                  'din e-mailadresse'}
                . Indtast koden for at
                fortsætte.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                Ny adgangskode
              </Text>

              <Text
                style={styles.subtitle}
              >
                Koden er bekræftet. Vælg
                nu en ny adgangskode til
                din ProtoGo-konto.
              </Text>
            </>
          )}
        </View>

        {/* FORM */}

        <View style={styles.form}>
          {step === 'code' ? (
            <>
              {/* CODE */}

              <View style={styles.field}>
                <View
                  style={styles.labelRow}
                >
                  <View
                    style={
                      styles.labelIcon
                    }
                  >
                    <Ionicons
                      name="keypad-outline"
                      size={15}
                      color={
                        COLORS.navy
                      }
                    />
                  </View>

                  <Text
                    style={styles.label}
                  >
                    Kode
                  </Text>
                </View>

                <TextInput
                  value={code}
                  onChangeText={(value) => {
                    setCode(
                      value.replace(
                        /\D/g,
                        ''
                      )
                    );

                    if (errorMessage) {
                      setErrorMessage(
                        null
                      );
                    }
                  }}
                  placeholder="Indtast koden"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  editable={!busy}
                  style={[
                    styles.input,
                    styles.codeInput,

                    errorMessage &&
                      styles.inputError,
                  ]}
                />
              </View>

              {/* ERROR */}

              {errorMessage && (
                <ErrorBox
                  message={
                    errorMessage
                  }
                />
              )}

              {/* VERIFY */}

              <Pressable
                onPress={verifyCode}
                disabled={busy}
                style={({
                  pressed,
                }) => [
                  styles.primaryButton,

                  pressed &&
                    !busy &&
                    styles.primaryButtonPressed,

                  busy &&
                    styles.disabled,
                ]}
              >
                {verifying ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.white
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Bekræft kode
                  </Text>
                )}
              </Pressable>

              {/* RESEND */}

              <Pressable
                onPress={resendCode}
                disabled={busy}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.smallTextButton,

                  pressed &&
                    styles.textPressed,
                ]}
              >
                {resending ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.navy
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.resendText
                    }
                  >
                    Har du ikke modtaget
                    koden? Send igen
                  </Text>
                )}
              </Pressable>

              {/* SPAM INFO */}

              <Text style={styles.spamText}>
                Kan du ikke finde mailen? Tjek også din
                spam- eller uønsket mail-mappe.
              </Text>
            </>
          ) : (
            <>
              {/* PASSWORD */}

              <View style={styles.field}>
                <View
                  style={styles.labelRow}
                >
                  <View
                    style={
                      styles.labelIcon
                    }
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={15}
                      color={
                        COLORS.navy
                      }
                    />
                  </View>

                  <Text
                    style={styles.label}
                  >
                    Ny adgangskode
                  </Text>
                </View>

                <View
                  style={
                    styles.passwordContainer
                  }
                >
                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);

                      if (
                        errorMessage
                      ) {
                        setErrorMessage(
                          null
                        );
                      }
                    }}
                    placeholder="Mindst 8 tegn"
                    placeholderTextColor={
                      COLORS.lightMuted
                    }
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="next"
                    editable={!busy}
                    style={
                      styles.passwordInput
                    }
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    hitSlop={8}
                    style={
                      styles.eyeButton
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color={
                        COLORS.muted
                      }
                    />
                  </Pressable>
                </View>
              </View>

              {/* CONFIRM PASSWORD */}

              <View style={styles.field}>
                <View
                  style={styles.labelRow}
                >
                  <View
                    style={
                      styles.labelIcon
                    }
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={15}
                      color={
                        COLORS.navy
                      }
                    />
                  </View>

                  <Text
                    style={styles.label}
                  >
                    Gentag adgangskode
                  </Text>
                </View>

                <View
                  style={
                    styles.passwordContainer
                  }
                >
                  <TextInput
                    value={
                      confirmPassword
                    }
                    onChangeText={(value) => {
                      setConfirmPassword(
                        value
                      );

                      if (
                        errorMessage
                      ) {
                        setErrorMessage(
                          null
                        );
                      }
                    }}
                    placeholder="Gentag adgangskoden"
                    placeholderTextColor={
                      COLORS.lightMuted
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="done"
                    editable={!busy}
                    style={
                      styles.passwordInput
                    }
                  />

                  <Pressable
                    onPress={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    hitSlop={8}
                    style={
                      styles.eyeButton
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color={
                        COLORS.muted
                      }
                    />
                  </Pressable>
                </View>
              </View>

              {/* ERROR */}

              {errorMessage && (
                <ErrorBox
                  message={
                    errorMessage
                  }
                />
              )}

              {/* SAVE */}

              <Pressable
                onPress={
                  updatePassword
                }
                disabled={busy}
                style={({
                  pressed,
                }) => [
                  styles.primaryButton,

                  pressed &&
                    !busy &&
                    styles.primaryButtonPressed,

                  busy &&
                    styles.disabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.white
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Gem ny adgangskode
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {/* BACK TO LOGIN */}

          <Pressable
            onPress={goBackToLogin}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backToLoginButton,

              pressed &&
                styles.textPressed,

              busy &&
                styles.disabled,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={14}
              color={COLORS.muted}
            />

            <Text
              style={
                styles.backToLoginText
              }
            >
              Tilbage til login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <View style={styles.errorBox}>
      <Ionicons
        name="alert-circle-outline"
        size={18}
        color={COLORS.danger}
      />

      <Text style={styles.errorText}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 24,
    paddingVertical: 32,

    justifyContent: 'center',
  },

  /* HEADER */

  header: {
    marginBottom: 34,

    alignItems: 'center',
  },

  logo: {
    width: 190,
    height: 125,

    marginBottom: 18,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',

    color: COLORS.text,

    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,

    color: COLORS.muted,

    marginTop: 9,

    lineHeight: 22,

    textAlign: 'center',

    paddingHorizontal: 12,
  },

  /* FORM */

  form: {
    gap: 14,
  },

  field: {
    gap: 8,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 7,
  },

  labelIcon: {
    width: 26,
    height: 26,

    borderRadius: 8,

    backgroundColor:
      COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',

    color: COLORS.navy,
  },

  input: {
    height: 56,

    borderRadius: 16,

    backgroundColor:
      COLORS.white,

    borderWidth: 1,

    borderColor: '#E5E7EB',

    paddingHorizontal: 18,

    fontSize: 16,

    color: COLORS.text,
  },

  codeInput: {
    fontSize: 19,

    fontWeight: '600',

    letterSpacing: 3,
  },

  inputError: {
    borderColor: '#FCA5A5',
  },

  /* PASSWORD */

  passwordContainer: {
    height: 56,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 16,

    backgroundColor:
      COLORS.white,

    borderWidth: 1,

    borderColor: '#E5E7EB',
  },

  passwordInput: {
    flex: 1,

    height: 56,

    paddingLeft: 18,
    paddingRight: 8,

    fontSize: 16,

    color: COLORS.text,
  },

  eyeButton: {
    width: 50,
    height: 56,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ERROR */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor:
      COLORS.dangerSoft,

    borderRadius: 14,

    padding: 12,

    gap: 8,
  },

  errorText: {
    flex: 1,

    fontSize: 13,
    lineHeight: 18,

    color: COLORS.dangerDark,
  },

  /* PRIMARY */

  primaryButton: {
    height: 58,

    borderRadius: 16,

    backgroundColor:
      COLORS.navy,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 6,

    shadowColor:
      COLORS.navyDark,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.13,
    shadowRadius: 12,

    elevation: 2,
  },

  primaryButtonPressed: {
    backgroundColor:
      COLORS.navyDark,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  primaryButtonText: {
    color: COLORS.white,

    fontSize: 16,

    fontWeight: '700',
  },

  /* SMALL ACTIONS */

  smallTextButton: {
    alignSelf: 'center',

    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  resendText: {
    fontSize: 13,

    fontWeight: '600',

    color: COLORS.navy,
  },

  spamText: {
    fontSize: 12,
    lineHeight: 17,

    color: COLORS.lightMuted,

    textAlign: 'center',

    paddingHorizontal: 16,

    marginTop: -6,
  },

  backToLoginButton: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',

    gap: 5,

    paddingVertical: 7,
    paddingHorizontal: 10,

    marginTop: 2,
  },

  backToLoginText: {
    fontSize: 13,

    fontWeight: '500',

    color: COLORS.muted,
  },

  disabled: {
    opacity: 0.5,
  },

  textPressed: {
    opacity: 0.6,
  },
});