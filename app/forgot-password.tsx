import { useState } from 'react';

import {
  ActivityIndicator,
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
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendResetEmail() {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setErrorMessage('Indtast din e-mailadresse.');
      return;
    }

    try {
      setSending(true);
      setErrorMessage(null);

      const redirectTo = Linking.createURL(
        'reset-password',
        {
          scheme: 'protogo',
        }
      );

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanedEmail,
          {
            redirectTo:
            'protogo://reset-password',
          }
        );

      if (error) {
        throw error;
      }

      setSent(true);
    } catch (error: any) {
  console.error(
    'Kunne ikke sende reset-mail:',
    error
  );

  if (
    error?.message
      ?.toLowerCase()
      .includes('email rate limit exceeded')
  ) {
    setErrorMessage(
      'Der er sendt for mange mails på kort tid. Vent lidt og prøv igen.'
    );

    return;
  }

  setErrorMessage(
    'Reset-mailen kunne ikke sendes. Prøv igen om lidt.'
  );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="mail-outline"
              size={32}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.successTitle}>
            Tjek din indbakke
          </Text>

          <Text style={styles.successText}>
            Hvis der findes en ProtoGo-konto med
            e-mailadressen {email.trim()}, modtager du en mail
            med et link til at vælge en ny adgangskode.
          </Text>

          <Pressable
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Tilbage til login
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setSent(false);
              setErrorMessage(null);
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              Prøv en anden e-mail
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={COLORS.navy}
          />
        </Pressable>

        <View style={styles.headerIcon}>
          <Ionicons
            name="key-outline"
            size={27}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.title}>
          Glemt adgangskode?
        </Text>

        <Text style={styles.subtitle}>
          Indtast e-mailadressen til din ProtoGo-konto. Vi
          sender dig et link, hvor du kan vælge en ny
          adgangskode.
        </Text>

        <View style={styles.fieldHeader}>
          <View style={styles.smallIconBox}>
            <Ionicons
              name="mail-outline"
              size={16}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.fieldLabel}>
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
          placeholder="din@email.dk"
          placeholderTextColor={COLORS.lightMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="done"
          editable={!sending}
          style={[
            styles.input,
            errorMessage && styles.inputError,
          ]}
        />

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleSendResetEmail}
          disabled={sending}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed &&
              !sending &&
              styles.primaryButtonPressed,
            sending && styles.disabled,
          ]}
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.primaryButtonText}>
                Send reset-link
              </Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.helpText}>
          Der kan gå et øjeblik, før mailen kommer frem. Tjek
          også din spam-mappe.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 34,
  },

  backButtonPressed: {
    opacity: 0.7,
  },

  headerIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,

    marginTop: 9,
    marginBottom: 30,
  },

  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 10,
  },

  smallIconBox: {
    width: 30,
    height: 30,

    borderRadius: 9,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,

    marginLeft: 9,
  },

  input: {
    height: 56,

    backgroundColor: COLORS.white,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: '#E5E7EB',

    paddingHorizontal: 18,

    fontSize: 16,
    color: COLORS.text,
  },

  inputError: {
    borderColor: '#FCA5A5',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: '#FEF2F2',

    borderRadius: 14,

    padding: 12,

    marginTop: 12,
  },

  errorText: {
    flex: 1,

    fontSize: 13,
    lineHeight: 18,

    color: '#B91C1C',

    marginLeft: 8,
  },

  primaryButton: {
    height: 56,

    borderRadius: 16,

    backgroundColor: COLORS.navy,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 24,

    shadowColor: COLORS.navyDark,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,

    elevation: 2,
  },

  primaryButtonPressed: {
    backgroundColor: COLORS.navyDark,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  helpText: {
    fontSize: 12,
    lineHeight: 18,

    color: COLORS.lightMuted,

    textAlign: 'center',

    marginTop: 14,
  },

  successContainer: {
    flex: 1,

    paddingHorizontal: 28,

    alignItems: 'center',
    justifyContent: 'center',
  },

  successIcon: {
    width: 72,
    height: 72,

    borderRadius: 22,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,
  },

  successTitle: {
    fontSize: 28,
    fontWeight: '700',

    color: COLORS.text,

    textAlign: 'center',
  },

  successText: {
    fontSize: 15,
    lineHeight: 22,

    color: COLORS.muted,

    textAlign: 'center',

    marginTop: 10,
  },

  secondaryButton: {
    height: 52,

    alignSelf: 'stretch',

    borderRadius: 16,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 10,
  },

  secondaryButtonPressed: {
    opacity: 0.7,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',

    color: COLORS.navy,
  },

  disabled: {
    opacity: 0.5,
  },
});