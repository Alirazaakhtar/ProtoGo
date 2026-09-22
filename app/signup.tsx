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

export default function SignupScreen() {
  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function signup() {
    const cleanedFirstName =
      firstName.trim();

    const cleanedLastName =
      lastName.trim();

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !cleanedFirstName ||
      !cleanedLastName ||
      !cleanedEmail ||
      !password
    ) {
      Alert.alert(
        'Manglende oplysninger',
        'Udfyld alle felter.'
      );

      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Adgangskoden er for kort',
        'Adgangskoden skal være mindst 8 tegn.'
      );

      return;
    }

    const fullName =
      `${cleanedFirstName} ${cleanedLastName}`;

    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email: cleanedEmail,
          password,

          options: {
            data: {
              first_name:
                cleanedFirstName,

              last_name:
                cleanedLastName,

              full_name:
                fullName,
            },
          },
        });

      if (error) {
        Alert.alert(
          'Kunne ikke oprette bruger',
          error.message
        );

        return;
      }

      /*
       * Hvis email-bekræftelse er
       * slået fra i Supabase, kan
       * signUp returnere en session
       * med det samme.
       */
      if (data.session) {
        await supabase.auth.signOut();

        Alert.alert(
          'Konto oprettet',
          'Din konto er oprettet. Du kan nu logge ind.',
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

        return;
      }

      /*
       * Email-bekræftelse er aktiveret.
       * Send brugeren videre til vores
       * OTP-side.
       */
      router.push({
        pathname: '/verify-email',

        params: {
          email: cleanedEmail,
        },
      });
    } catch (error) {
      console.error(
        'Kunne ikke oprette konto:',
        error
      );

      Alert.alert(
        'Noget gik galt',
        'Kontoen kunne ikke oprettes. Prøv igen.'
      );
    } finally {
      setLoading(false);
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
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <Image
            source={require('../assets/images/protogo-logo.png')}
            style={
              styles.logo
            }
            resizeMode="contain"
          />

          <Text
            style={
              styles.title
            }
          >
            Opret lærerprofil
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Opret din konto og kom i
            gang med ProtoGo.
          </Text>
        </View>

        {/* FORM */}

        <View
          style={
            styles.form
          }
        >
          {/* FORNAVN */}

          <View
            style={
              styles.field
            }
          >
            <View
              style={
                styles.labelRow
              }
            >
              <View
                style={
                  styles.labelIcon
                }
              >
                <Ionicons
                  name="person-outline"
                  size={15}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <Text
                style={
                  styles.label
                }
              >
                Fornavn
              </Text>
            </View>

            <TextInput
              value={
                firstName
              }
              onChangeText={
                setFirstName
              }
              placeholder="Dit fornavn"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
              style={
                styles.input
              }
            />
          </View>

          {/* EFTERNAVN */}

          <View
            style={
              styles.field
            }
          >
            <View
              style={
                styles.labelRow
              }
            >
              <View
                style={
                  styles.labelIcon
                }
              >
                <Ionicons
                  name="person-outline"
                  size={15}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <Text
                style={
                  styles.label
                }
              >
                Efternavn
              </Text>
            </View>

            <TextInput
              value={
                lastName
              }
              onChangeText={
                setLastName
              }
              placeholder="Dit efternavn"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
              style={
                styles.input
              }
            />
          </View>

          {/* EMAIL */}

          <View
            style={
              styles.field
            }
          >
            <View
              style={
                styles.labelRow
              }
            >
              <View
                style={
                  styles.labelIcon
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <Text
                style={
                  styles.label
                }
              >
                E-mail
              </Text>
            </View>

            <TextInput
              value={
                email
              }
              onChangeText={
                setEmail
              }
              placeholder="laerer@skole.dk"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!loading}
              style={
                styles.input
              }
            />
          </View>

          {/* ADGANGSKODE */}

          <View
            style={
              styles.field
            }
          >
            <View
              style={
                styles.labelRow
              }
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
                style={
                  styles.label
                }
              >
                Adgangskode
              </Text>
            </View>

            <TextInput
              value={
                password
              }
              onChangeText={
                setPassword
              }
              placeholder="Vælg en adgangskode"
              placeholderTextColor={
                COLORS.lightMuted
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="done"
              editable={!loading}
              style={
                styles.input
              }
            />
          </View>

          {/* OPRET */}

          <Pressable
            onPress={
              signup
            }
            disabled={
              loading
            }
            style={({
              pressed,
            }) => [
              styles.button,

              pressed &&
                !loading &&
                styles.buttonPressed,

              loading &&
                styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.white
                }
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Opret konto
              </Text>
            )}
          </Pressable>

          {/* LOGIN */}

          <Pressable
            onPress={
              goBackToLogin
            }
            disabled={loading}
            style={({
              pressed,
            }) => [
              styles.loginButton,

              pressed &&
                styles.textPressed,

              loading &&
                styles.disabled,
            ]}
          >
            <Text
              style={
                styles.loginMuted
              }
            >
              Har du allerede en konto?{' '}
            </Text>

            <Text
              style={
                styles.loginText
              }
            >
              Log ind
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.white,
    },

    content: {
      flexGrow: 1,

      paddingHorizontal: 24,
      paddingTop: 70,
      paddingBottom: 40,

      justifyContent:
        'center',
    },

    /* HEADER */

    header: {
      alignItems:
        'center',

      marginBottom: 32,
    },

    logo: {
      width: 185,
      height: 120,

      marginBottom: 16,
    },

    title: {
      fontSize: 32,

      fontWeight:
        '700',

      color:
        COLORS.text,

      textAlign:
        'center',
    },

    subtitle: {
      fontSize: 15,

      color:
        COLORS.muted,

      marginTop: 9,

      lineHeight: 22,

      textAlign:
        'center',

      paddingHorizontal: 16,
    },

    /* FORM */

    form: {
      gap: 14,
    },

    field: {
      gap: 8,
    },

    labelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,
    },

    labelIcon: {
      width: 26,
      height: 26,

      borderRadius: 8,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    label: {
      fontSize: 14,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    input: {
      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 16,

      color:
        COLORS.text,
    },

    /* BUTTON */

    button: {
      height: 58,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 8,

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

    buttonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    buttonText: {
      color:
        COLORS.white,

      fontSize: 16,

      fontWeight:
        '700',
    },

    disabled: {
      opacity: 0.5,
    },

    /* LOGIN LINK */

    loginButton: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingVertical: 12,

      marginTop: 2,
    },

    loginMuted: {
      fontSize: 14,

      color:
        COLORS.muted,
    },

    loginText: {
      fontSize: 14,

      color:
        COLORS.navy,

      fontWeight:
        '700',
    },

    textPressed: {
      opacity: 0.6,
    },
  });