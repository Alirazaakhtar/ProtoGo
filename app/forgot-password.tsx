import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function sendCode() {
    const cleanedEmail = email
      .trim()
      .toLowerCase();

    if (!cleanedEmail) {
      setErrorMessage(
        'Skriv din e-mailadresse.'
      );

      return;
    }

    try {
      setSending(true);
      setErrorMessage(null);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanedEmail
        );

      if (error) {
        throw error;
      }

      router.push({
        pathname: '/reset-password',

        params: {
          email: cleanedEmail,
        },
      });
    } catch (error: any) {
      console.error(
        'Kunne ikke sende reset-kode:',
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
        'Koden kunne ikke sendes. Prøv igen om lidt.'
      );
    } finally {
      setSending(false);
    }
  }

  function goBackToLogin() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/login');
  }

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
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Glemt adgangskode?
          </Text>

          <Text style={styles.subtitle}>
            Indtast e-mailadressen til din
            ProtoGo-konto, så sender vi dig en
            kode til at vælge en ny adgangskode.
          </Text>
        </View>

        {/* FORM */}

        <View style={styles.form}>
          {/* EMAIL */}

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <View style={styles.labelIcon}>
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color={COLORS.navy}
                />
              </View>

              <Text style={styles.label}>
                E-mail
              </Text>
            </View>

            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);

                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              placeholder="laerer@skole.dk"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="done"
              editable={!sending}
              style={[
                styles.input,

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

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* SEND */}

          <Pressable
            onPress={sendCode}
            disabled={sending}
            style={({ pressed }) => [
              styles.primaryButton,

              pressed &&
                !sending &&
                styles.primaryButtonPressed,

              sending &&
                styles.disabled,
            ]}
          >
            {sending ? (
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
                Send kode
              </Text>
            )}
          </Pressable>

          {/* LOGIN */}

          <Pressable
            onPress={goBackToLogin}
            disabled={sending}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backToLoginButton,

              pressed &&
                styles.textPressed,

              sending &&
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
    width: 240,
    height: 175,

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

  inputError: {
    borderColor: '#FCA5A5',
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

  helpText: {
    fontSize: 12,
    lineHeight: 18,

    color: COLORS.lightMuted,

    textAlign: 'center',

    paddingHorizontal: 16,
  },

  /* BACK TO LOGIN */

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