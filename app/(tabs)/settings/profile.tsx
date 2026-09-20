import {
  useEffect,
  useState,
} from 'react';

import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

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

export default function ProfileScreen() {
  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        Alert.alert(
          'Fejl',
          'Kunne ikke hente din profil.'
        );

        return;
      }

      setEmail(
        user.email ?? ''
      );

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('full_name')
        .eq(
          'id',
          user.id
        )
        .single();

      if (profileError) {
        console.error(
          'Kunne ikke hente profil:',
          profileError
        );

        Alert.alert(
          'Fejl',
          'Kunne ikke hente dine profiloplysninger.'
        );

        return;
      }

      const {
        firstName:
          parsedFirstName,
        lastName:
          parsedLastName,
      } = splitFullName(
        profile.full_name ?? ''
      );

      setFirstName(
        parsedFirstName
      );

      setLastName(
        parsedLastName
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    const cleanedFirstName =
      firstName.trim();

    const cleanedLastName =
      lastName.trim();

    if (
      !cleanedFirstName ||
      !cleanedLastName
    ) {
      Alert.alert(
        'Navn mangler',
        'Skriv både fornavn og efternavn.'
      );

      return;
    }

    const fullName =
      `${cleanedFirstName} ${cleanedLastName}`;

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        Alert.alert(
          'Fejl',
          'Du er ikke logget ind.'
        );

        return;
      }

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .update({
          full_name:
            fullName,
        })
        .eq(
          'id',
          user.id
        );

      if (profileError) {
        Alert.alert(
          'Kunne ikke gemme',
          profileError.message
        );

        return;
      }

      const {
        error: authError,
      } =
        await supabase.auth.updateUser({
          data: {
            first_name:
              cleanedFirstName,

            last_name:
              cleanedLastName,

            full_name:
              fullName,
          },
        });

      if (authError) {
        console.error(
          'Kunne ikke opdatere auth metadata:',
          authError
        );
      }

      setFirstName(
        cleanedFirstName
      );

      setLastName(
        cleanedLastName
      );

      Alert.alert(
        'Profil opdateret',
        'Dine ændringer er gemt.'
      );
    } catch (error) {
      console.error(
        error
      );

      Alert.alert(
        'Kunne ikke gemme',
        'Der opstod en fejl.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="small"
          color={
            COLORS.navy
          }
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
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
        <BackButton />

        {/* HEADER */}

        <Text
          style={
            styles.eyebrow
          }
        >
          Konto
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Profil
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Administrer dine personlige
          oplysninger.
        </Text>

        {/* PROFILKORT */}

        <View
          style={
            styles.profileCard
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {getInitials(
                firstName,
                lastName
              )}
            </Text>
          </View>

          <View
            style={
              styles.profileCardText
            }
          >
            <Text
              style={
                styles.profileName
              }
              numberOfLines={1}
            >
              {firstName}{' '}
              {lastName}
            </Text>

            <Text
              style={
                styles.profileEmail
              }
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
        </View>

        {/* SKILLELINJE */}

        <View
          style={
            styles.sectionDivider
          }
        />

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
            editable={
              !saving
            }
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
            returnKeyType="done"
            editable={
              !saving
            }
            style={
              styles.input
            }
          />
        </View>

        {/* GEM */}

        <Pressable
          onPress={
            saveProfile
          }
          disabled={
            saving
          }
          style={({
            pressed,
          }) => [
            styles.saveButton,

            pressed &&
              !saving &&
              styles.saveButtonPressed,

            saving &&
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
            <View
              style={
                styles.saveButtonContent
              }
            >
              <Ionicons
                name="checkmark-outline"
                size={20}
                color={
                  COLORS.white
                }
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Gem ændringer
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function splitFullName(
  fullName: string
) {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  if (
    parts.length === 1
  ) {
    return {
      firstName:
        parts[0],

      lastName:
        '',
    };
  }

  return {
    firstName:
      parts
        .slice(
          0,
          -1
        )
        .join(' '),

    lastName:
      parts[
        parts.length - 1
      ],
  };
}

function getInitials(
  firstName: string,
  lastName: string
) {
  const first =
    firstName
      .trim()
      .charAt(0)
      .toUpperCase();

  const last =
    lastName
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    `${first}${last}` ||
    '?'
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

      padding: 20,

      paddingTop: 70,
      paddingBottom: 60,
    },

    center: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    /* HEADER */

    eyebrow: {
      fontSize: 14,

      color:
        COLORS.muted,
    },

    title: {
      fontSize: 34,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop: 4,
    },

    subtitle: {
      fontSize: 15,

      color:
        COLORS.muted,

      lineHeight: 21,

      marginTop: 7,
      marginBottom: 24,
    },

    /* PROFIL */

    profileCard: {
      minHeight: 90,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 18,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    avatar: {
      width: 52,
      height: 52,

      borderRadius: 26,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 14,
    },

    avatarText: {
      fontSize: 16,

      fontWeight:
        '800',

      color:
        COLORS.navy,
    },

    profileCardText: {
      flex: 1,
    },

    profileName: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    profileEmail: {
      fontSize: 13,

      color:
        COLORS.muted,

      marginTop: 4,
    },

    /* DIVIDER */

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 24,
      marginBottom: 24,
    },

    /* FORM */

    field: {
      marginBottom: 18,
    },

    labelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 8,
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
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    input: {
      height: 56,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 16,

      color:
        COLORS.text,
    },

    /* SAVE */

    saveButton: {
      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 10,

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

    saveButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    saveButtonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    saveButtonText: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.white,
    },

    disabled: {
      opacity: 0.5,
    },
  });