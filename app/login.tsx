import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

export default function LoginScreen() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function login() {
    if (
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        'Manglende oplysninger',
        'Skriv både e-mail og adgangskode.'
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email
            .trim()
            .toLowerCase(),

          password,
        });

      if (error) {
        Alert.alert(
          'Login fejlede',
          error.message
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function forgotPassword() {
    Alert.alert(
      'Glemt adgangskode',
      'Denne funktion bliver tilføjet senere.'
    );
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
            source={require('../assets/images/protogo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Velkommen tilbage
          </Text>

          <Text style={styles.subtitle}>
            Log ind for at få adgang til dine
            klasser og dagens protokol.
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
              onChangeText={setEmail}
              placeholder="laerer@skole.dk"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          {/* ADGANGSKODE */}

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <View style={styles.labelIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={15}
                  color={COLORS.navy}
                />
              </View>

              <Text style={styles.label}>
                Adgangskode
              </Text>
            </View>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Din adgangskode"
              placeholderTextColor={
                COLORS.lightMuted
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              style={styles.input}
            />

<Pressable
  onPress={() =>
    router.push(
      '/forgot-password'
    )
  }
  hitSlop={8}
  style={({ pressed }) => [
    styles.forgotPasswordButton,
    pressed && {
      opacity: 0.6,
    },
  ]}
>
  <Text
    style={
      styles.forgotPasswordText
    }
  >
    Glemt adgangskode?
  </Text>
</Pressable>
          </View>

          {/* LOGIN */}

          <Pressable
            onPress={login}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginButton,

              pressed &&
                styles.loginButtonPressed,

              loading &&
                styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Log ind
              </Text>
            )}
          </Pressable>

          {/* OPRET KONTO */}

          <Pressable
            onPress={() =>
              router.push('/signup')
            }
            style={({ pressed }) => [
              styles.signupButton,

              pressed &&
                styles.textPressed,
            ]}
          >
            <Text
              style={styles.signupMuted}
            >
              Ingen konto?{' '}
            </Text>

            <Text
              style={styles.signupText}
            >
              Opret dig
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

  /* FORGOT */

  forgotButton: {
    alignSelf: 'flex-start',

    paddingVertical: 4,
    paddingHorizontal: 2,

    marginTop: -2,
  },

  forgotText: {
    fontSize: 13,

    fontWeight: '600',

    color: COLORS.navy,
  },

  /* LOGIN */

  loginButton: {
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

  loginButtonPressed: {
    backgroundColor:
      COLORS.navyDark,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  loginButtonText: {
    color: COLORS.white,

    fontSize: 16,

    fontWeight: '700',
  },

  disabled: {
    opacity: 0.5,
  },

  /* SIGNUP */

  signupButton: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    paddingVertical: 12,

    marginTop: 2,
  },

  signupMuted: {
    fontSize: 14,

    color: COLORS.muted,
  },

  signupText: {
    fontSize: 14,

    color: COLORS.navy,

    fontWeight: '700',
  },

  textPressed: {
    opacity: 0.6,
  },

  forgotPasswordButton: {
  alignSelf: 'flex-end',
  marginTop: 10,
},

forgotPasswordText: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.navy,
},
});