import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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

export default function ResetPasswordScreen() {
  const url = Linking.useURL();

  const processedUrl =
    useRef<string | null>(null);

  const [
    checking,
    setChecking,
  ] = useState(true);

  const [
    recoveryReady,
    setRecoveryReady,
  ] = useState(false);

  const [
    linkError,
    setLinkError,
  ] = useState<string | null>(
    null
  );

  const [
    password,
    setPassword,
  ] = useState('');

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
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    void initializeRecovery();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event ===
              'PASSWORD_RECOVERY' &&
            session
          ) {
            setRecoveryReady(true);
            setLinkError(null);
            setChecking(false);
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }

    if (
      processedUrl.current === url
    ) {
      return;
    }

    processedUrl.current = url;

    if (
      hasRecoveryParameters(url)
    ) {
      void handleRecoveryUrl(url);
    }
  }, [url]);

  async function initializeRecovery() {
    try {
      setChecking(true);
      setLinkError(null);

      /*
       * VIGTIGT:
       *
       * Hvis brugeren reloader siden efter
       * recovery-linket allerede er blevet
       * behandlet, ligger recovery-sessionen
       * stadig i Supabase.
       *
       * Så skal vi IKKE kræve tokens i URL'en
       * igen.
       */

      const {
        data: { session },
        error,
      } =
        await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session) {
        setRecoveryReady(true);
        return;
      }

      /*
       * Hvis der endnu ikke findes en session,
       * prøver vi initial URL.
       */

      const initialUrl =
        await Linking.getInitialURL();

      if (
        initialUrl &&
        hasRecoveryParameters(
          initialUrl
        )
      ) {
        processedUrl.current =
          initialUrl;

        await handleRecoveryUrl(
          initialUrl
        );

        return;
      }

      /*
       * Ingen session og intet recovery-link.
       */

      setLinkError(
        'Reset-linket er ugyldigt eller udløbet. Bed om et nyt link fra login-siden.'
      );
    } catch (error) {
      console.error(
        'Kunne ikke kontrollere reset-session:',
        error
      );

      setLinkError(
        'Reset-linket kunne ikke kontrolleres. Bed om et nyt link fra login-siden.'
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleRecoveryUrl(
    recoveryUrl: string
  ) {
    try {
      setChecking(true);
      setLinkError(null);

      const errorDescription =
        getUrlParameter(
          recoveryUrl,
          'error_description'
        );

      if (errorDescription) {
        throw new Error(
          errorDescription
        );
      }

      /*
       * PKCE FLOW
       */

      const code =
        getUrlParameter(
          recoveryUrl,
          'code'
        );

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(
            code
          );

        if (error) {
          throw error;
        }

        setRecoveryReady(true);

        return;
      }

      /*
       * IMPLICIT FLOW
       */

      const accessToken =
        getUrlParameter(
          recoveryUrl,
          'access_token'
        );

      const refreshToken =
        getUrlParameter(
          recoveryUrl,
          'refresh_token'
        );

      if (
        accessToken &&
        refreshToken
      ) {
        const { error } =
          await supabase.auth.setSession({
            access_token:
              accessToken,

            refresh_token:
              refreshToken,
          });

        if (error) {
          throw error;
        }

        setRecoveryReady(true);

        return;
      }

      /*
       * Hvis URL'en ikke længere har tokens,
       * kan sessionen allerede være blevet
       * gemt.
       */

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session) {
        setRecoveryReady(true);

        return;
      }

      throw new Error(
        'Reset-linket indeholder ikke en gyldig recovery-session.'
      );
    } catch (error) {
      console.error(
        'Kunne ikke behandle reset-link:',
        error
      );

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      /*
       * Et PKCE-code kan kun bruges én gang.
       *
       * Ved reload kan exchange derfor fejle,
       * selvom sessionen allerede er oprettet.
       */

      if (session) {
        setRecoveryReady(true);
        setLinkError(null);

        return;
      }

      setRecoveryReady(false);

      setLinkError(
        'Reset-linket er ugyldigt eller udløbet. Bed om et nyt link fra login-siden.'
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleUpdatePassword() {
    if (password.length < 8) {
      Alert.alert(
        'Adgangskoden er for kort',
        'Adgangskoden skal være mindst 8 tegn.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        'Adgangskoderne er forskellige',
        'De to adgangskoder skal være ens.'
      );

      return;
    }

    try {
      setSaving(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      /*
       * Log ud efter ændringen,
       * så brugeren logger ind igen
       * med sin nye adgangskode.
       */

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
        'Din adgangskode er blevet ændret. Du kan nu logge ind med din nye adgangskode.',
        [
          {
            text: 'Log ind',

            onPress: () =>
              router.replace(
                '/login'
              ),
          },
        ]
      );
    } catch (error) {
      console.error(
        'Kunne ikke ændre adgangskode:',
        error
      );

      Alert.alert(
        'Kunne ikke ændre adgangskode',
        'Reset-sessionen kan være udløbet. Prøv eventuelt at bede om et nyt link.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />

        <Text style={styles.loadingText}>
          Kontrollerer reset-link...
        </Text>
      </View>
    );
  }

  if (
    linkError ||
    !recoveryReady
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.errorTitle}>
            Linket virker ikke
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            {linkError ??
              'Reset-linket kunne ikke læses.'}
          </Text>

          <Pressable
            onPress={() =>
              router.replace(
                '/forgot-password'
              )
            }
            style={({ pressed }) => [
              styles.primaryButton,

              pressed &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Send et nyt link
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.replace(
                '/login'
              )
            }
            style={({ pressed }) => [
              styles.secondaryButton,

              pressed &&
                styles.secondaryButtonPressed,
            ]}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Tilbage til login
            </Text>
          </Pressable>
        </View>
      </View>
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
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.headerIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={27}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.title}>
          Ny adgangskode
        </Text>

        <Text style={styles.subtitle}>
          Vælg en ny adgangskode til
          din ProtoGo-konto.
        </Text>

        {/* PASSWORD */}

        <View style={styles.fieldHeader}>
          <View
            style={
              styles.smallIconBox
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.fieldLabel}>
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
            onChangeText={setPassword}
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
            editable={!saving}
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

        {/* CONFIRM PASSWORD */}

        <View
          style={[
            styles.fieldHeader,
            styles.secondField,
          ]}
        >
          <View
            style={
              styles.smallIconBox
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.fieldLabel}>
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
            onChangeText={
              setConfirmPassword
            }
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
            editable={!saving}
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

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={COLORS.navy}
          />

          <Text style={styles.infoText}>
            Din nye adgangskode skal
            være mindst 8 tegn.
          </Text>
        </View>

        <Pressable
          onPress={
            handleUpdatePassword
          }
          disabled={saving}
          style={({ pressed }) => [
            styles.primaryButton,

            pressed &&
              !saving &&
              styles.primaryButtonPressed,

            saving &&
              styles.disabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <View
              style={
                styles.buttonContent
              }
            >
              <Ionicons
                name="checkmark-outline"
                size={20}
                color={COLORS.white}
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Gem ny adgangskode
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function hasRecoveryParameters(
  url: string
) {
  return Boolean(
    getUrlParameter(
      url,
      'code'
    ) ||
      getUrlParameter(
        url,
        'access_token'
      ) ||
      getUrlParameter(
        url,
        'error_description'
      )
  );
}

function getUrlParameter(
  url: string,
  key: string
) {
  const queryPart =
    url.includes('?')
      ? url
          .split('?')[1]
          ?.split('#')[0]
      : '';

  const hashPart =
    url.includes('#')
      ? url.split('#')[1]
      : '';

  const sections = [
    queryPart,
    hashPart,
  ];

  for (
    const section of sections
  ) {
    if (!section) {
      continue;
    }

    const pairs =
      section.split('&');

    for (
      const pair of pairs
    ) {
      const [
        rawKey,
        ...rawValueParts
      ] = pair.split('=');

      if (
        decodeURIComponent(
          rawKey
        ) !== key
      ) {
        continue;
      }

      const rawValue =
        rawValueParts.join('=');

      return decodeURIComponent(
        rawValue.replace(
          /\+/g,
          ' '
        )
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  content: {
    flexGrow: 1,

    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 40,
  },

  center: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.white,

    paddingHorizontal: 30,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.muted,

    marginTop: 12,
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

  secondField: {
    marginTop: 20,
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

  passwordContainer: {
    height: 56,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.white,

    borderRadius: 16,

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
    width: 48,
    height: 56,

    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: COLORS.navySoft,

    borderRadius: 14,

    padding: 13,

    marginTop: 16,
  },

  infoText: {
    flex: 1,

    fontSize: 12,
    lineHeight: 18,

    color: COLORS.muted,

    marginLeft: 9,
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

  errorContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 28,
  },

  errorIcon: {
    width: 72,
    height: 72,

    borderRadius: 22,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,
  },

  errorTitle: {
    fontSize: 26,
    fontWeight: '700',

    color: COLORS.text,

    textAlign: 'center',
  },

  errorDescription: {
    fontSize: 15,
    lineHeight: 22,

    color: COLORS.muted,

    textAlign: 'center',

    marginTop: 9,
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