import { useEffect, useState } from 'react';
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

  white: '#FFFFFF',
};

type GuardianEditData = {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
};

const guardianEditCache =
  new Map<string, GuardianEditData>();

export default function EditGuardianScreen() {
  const {
    studentId,
    guardianId,
  } = useLocalSearchParams<{
    id: string;
    studentId: string;
    guardianId: string;
  }>();

  const cacheKey =
    studentId && guardianId
      ? `${studentId}:${guardianId}`
      : '';

  const cachedGuardian = cacheKey
    ? guardianEditCache.get(cacheKey)
    : undefined;

  const [
    firstName,
    setFirstName,
  ] = useState(
    cachedGuardian?.firstName ?? ''
  );

  const [
    lastName,
    setLastName,
  ] = useState(
    cachedGuardian?.lastName ?? ''
  );

  const [
    relationship,
    setRelationship,
  ] = useState(
    cachedGuardian?.relationship ?? ''
  );

  const [phone, setPhone] =
    useState(
      cachedGuardian?.phone ?? ''
    );

  const [email, setEmail] =
    useState(
      cachedGuardian?.email ?? ''
    );

  const [loading, setLoading] =
    useState(!cachedGuardian);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadGuardian();
  }, [
    guardianId,
    studentId,
  ]);

  async function loadGuardian() {
    if (
      !guardianId ||
      !studentId ||
      !cacheKey
    ) {
      return;
    }

    try {
      const {
        data: guardian,
        error: guardianError,
      } = await supabase
        .from('guardians')
        .select(`
          id,
          full_name,
          phone,
          email
        `)
        .eq(
          'id',
          guardianId
        )
        .single();

      if (guardianError) {
        throw guardianError;
      }

      const {
        data: relation,
        error: relationError,
      } = await supabase
        .from(
          'student_guardians'
        )
        .select(`
          relationship
        `)
        .eq(
          'student_id',
          studentId
        )
        .eq(
          'guardian_id',
          guardianId
        )
        .single();

      if (relationError) {
        throw relationError;
      }

      const {
        firstName:
          parsedFirstName,
        lastName:
          parsedLastName,
      } = splitFullName(
        guardian.full_name ?? ''
      );

      const freshData:
        GuardianEditData = {
          firstName:
            parsedFirstName,

          lastName:
            parsedLastName,

          relationship:
            relation.relationship ?? '',

          phone:
            guardian.phone ?? '',

          email:
            guardian.email ?? '',
        };

      guardianEditCache.set(
        cacheKey,
        freshData
      );

      setFirstName(
        freshData.firstName
      );

      setLastName(
        freshData.lastName
      );

      setRelationship(
        freshData.relationship
      );

      setPhone(
        freshData.phone
      );

      setEmail(
        freshData.email
      );
    } catch (error) {
      console.error(error);

      if (
        !guardianEditCache.has(
          cacheKey
        )
      ) {
        Alert.alert(
          'Fejl',
          'Kunne ikke hente forælderen.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveGuardian() {
    if (
      !guardianId ||
      !studentId ||
      !cacheKey
    ) {
      return;
    }

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

      const cleanedPhone =
        phone.trim();

      const cleanedEmail =
        email
          .trim()
          .toLowerCase();

      const cleanedRelationship =
        relationship.trim();

      const {
        error: guardianError,
      } = await supabase
        .from('guardians')
        .update({
          full_name:
            fullName,

          phone:
            cleanedPhone ||
            null,

          email:
            cleanedEmail ||
            null,
        })
        .eq(
          'id',
          guardianId
        );

      if (guardianError) {
        Alert.alert(
          'Kunne ikke gemme',
          guardianError.message
        );

        return;
      }

      const {
        error: relationError,
      } = await supabase
        .from(
          'student_guardians'
        )
        .update({
          relationship:
            cleanedRelationship ||
            null,
        })
        .eq(
          'student_id',
          studentId
        )
        .eq(
          'guardian_id',
          guardianId
        );

      if (relationError) {
        Alert.alert(
          'Kunne ikke gemme relation',
          relationError.message
        );

        return;
      }

      guardianEditCache.set(
        cacheKey,
        {
          firstName:
            cleanedFirstName,

          lastName:
            cleanedLastName,

          relationship:
            cleanedRelationship,

          phone:
            cleanedPhone,

          email:
            cleanedEmail,
        }
      );

      router.back();
    } finally {
      setSaving(false);
    }
  }

  function removeGuardian() {
    if (
      !studentId ||
      !guardianId
    ) {
      return;
    }

    const fullName =
      `${firstName.trim()} ${lastName.trim()}`
        .trim();

    Alert.alert(
      'Fjern forælder',
      `Vil du fjerne ${fullName} fra eleven?`,
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Fjern',
          style: 'destructive',

          onPress: async () => {
            const { error } =
              await supabase
                .from(
                  'student_guardians'
                )
                .delete()
                .eq(
                  'student_id',
                  studentId
                )
                .eq(
                  'guardian_id',
                  guardianId
                );

            if (error) {
              Alert.alert(
                'Kunne ikke fjerne forælder',
                error.message
              );

              return;
            }

            if (cacheKey) {
              guardianEditCache.delete(
                cacheKey
              );
            }

            router.back();
          },
        },
      ]
    );
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

        <Text
          style={
            styles.eyebrow
          }
        >
          Kontaktperson
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Rediger forælder
        </Text>

        {/* FORNAVN */}

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
          placeholder="Fx Anne"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          style={
            styles.input
          }
        />

        {/* EFTERNAVN */}

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
          placeholder="Fx Jensen"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          style={
            styles.input
          }
        />

        {/* RELATION */}

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
              name="people-outline"
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
            Relation
          </Text>
        </View>

        <TextInput
          value={
            relationship
          }
          onChangeText={
            setRelationship
          }
          placeholder="Fx Mor, Far eller Værge"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          style={
            styles.input
          }
        />

        {/* TELEFON */}

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
              name="call-outline"
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
            Telefon
          </Text>
        </View>

        <TextInput
          value={
            phone
          }
          onChangeText={
            setPhone
          }
          placeholder="+45 12 34 56 78"
          placeholderTextColor={
            COLORS.lightMuted
          }
          keyboardType="phone-pad"
          returnKeyType="next"
          style={
            styles.input
          }
        />

        {/* E-MAIL */}

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
          placeholder="navn@example.dk"
          placeholderTextColor={
            COLORS.lightMuted
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          style={
            styles.input
          }
        />

        {/* GEM */}

        <Pressable
          onPress={
            saveGuardian
          }
          disabled={
            saving
          }
          style={({
            pressed,
          }) => [
            styles.saveButton,

            pressed &&
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
                styles.buttonContent
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
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

        {/* FJERN */}

        <Pressable
          onPress={
            removeGuardian
          }
          disabled={
            saving
          }
          style={({
            pressed,
          }) => [
            styles.removeButton,

            pressed &&
              styles.pressed,

            saving &&
              styles.disabled,
          ]}
        >
          <Ionicons
            name="person-remove-outline"
            size={18}
            color="#DC2626"
          />

          <Text
            style={
              styles.removeButtonText
            }
          >
            Fjern fra elev
          </Text>
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
      paddingBottom: 50,
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
      marginBottom: 28,
    },

    labelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 7,
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

      paddingHorizontal: 18,

      fontSize: 16,

      marginBottom: 18,

      color:
        COLORS.text,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',
    },

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

    buttonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    saveButtonText: {
      color:
        COLORS.white,

      fontSize: 16,

      fontWeight:
        '700',
    },

    removeButton: {
      marginTop: 18,

      minHeight: 48,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,
    },

    removeButtonText: {
      fontSize: 15,

      fontWeight:
        '600',

      color:
        '#DC2626',
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.5,
    },
  });