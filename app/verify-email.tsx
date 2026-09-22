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

export default function VerifyEmailScreen() {
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

  const [code, setCode] =
    useState('');

  const [verifying, setVerifying] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  async function verifyEmail() {
    const cleanedCode =
      code.trim();

    if (!email) {
      setErrorMessage(
        'E-mailadressen mangler. Gå tilbage og opret kontoen igen.'
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
          type: 'email',
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
          'E-mail blev bekræftet, men logout fejlede:',
          signOutError
        );
      }

      Alert.alert(
        'E-mail bekræftet',
        'Din ProtoGo-konto er nu bekræftet. Du kan logge ind.',
        [
          {
            text: 'Log ind',

            onPress: () =>
              router.dismissTo('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'Kunne ikke bekræfte e-mail:',
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
        'E-mailadressen mangler. Gå tilbage og opret kontoen igen.'
      );

      return;
    }

    try {
      setResending(true);
      setErrorMessage(null);

      const { error } =
        await supabase.auth.resend({
          type: 'signup',
          email,
        });

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
        'Kunne ikke sende ny bekræftelseskode:',
        error
      );

      const message =
        error?.message
          ?.toLowerCase()
          ?.trim() ?? '';

      if (
        message.includes(
          'rate limit'
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

  const busy =
    verifying ||
    resending;

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

          <Text style={styles.title}>
            Bekræft din e-mail
          </Text>

          <Text style={styles.subtitle}>
            Vi har sendt en kode til{' '}
            {email || 'din e-mailadresse'}.
            Indtast koden for at aktivere din
            ProtoGo-konto.
          </Text>
        </View>

        {/* FORM */}

        <View style={styles.form}>
          {/* CODE */}

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <View style={styles.labelIcon}>
                <Ionicons
                  name="keypad-outline"
                  size={15}
                  color={COLORS.navy}
                />
              </View>

              <Text style={styles.label}>
                Bekræftelseskode
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
                  setErrorMessage(null);
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
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.danger}
              />

              <Text
                style={styles.errorText}
              >
                {errorMessage}
              </Text>
            </View>
          )}

          {/* VERIFY */}

          <Pressable
            onPress={verifyEmail}
            disabled={busy}
            style={({ pressed }) => [
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
                color={COLORS.white}
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Bekræft e-mail
              </Text>
            )}
          </Pressable>

          {/* RESEND */}

          <Pressable
            onPress={resendCode}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => [
              styles.resendButton,

              pressed &&
                styles.textPressed,

              busy &&
                styles.disabled,
            ]}
          >
            {resending ? (
              <ActivityIndicator
                size="small"
                color={COLORS.navy}
              />
            ) : (
              <Text style={styles.resendText}>
                Har du ikke modtaget koden? Send igen
              </Text>
            )}
          </Pressable>

          {/* SPAM INFO */}

          <View style={styles.spamInfo}>
            <Text style={styles.spamInfoText}>
              Kan du ikke finde mailen? Tjek også din
              spam- eller uønsket mail-mappe.
            </Text>
          </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor:
      COLORS.white,
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

  /* ERROR */

  errorBox: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 8,

    backgroundColor:
      COLORS.dangerSoft,

    borderRadius: 14,

    padding: 12,
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

  /* RESEND */

  resendButton: {
    alignSelf: 'center',

    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  resendText: {
    fontSize: 13,

    fontWeight: '600',

    color: COLORS.navy,

    textAlign: 'center',
  },

  /* SPAM INFO */

  spamInfo: {
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 14,

    marginTop: -4,
  },

  spamInfoText: {
    flexShrink: 1,

    fontSize: 12,
    lineHeight: 17,

    color: COLORS.lightMuted,

    textAlign: 'center',
  },

  /* LOGIN */

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