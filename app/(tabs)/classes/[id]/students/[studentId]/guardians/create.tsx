import { useState } from 'react';
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

export default function CreateGuardianScreen() {
  const { studentId } =
    useLocalSearchParams<{
      id: string;
      studentId: string;
    }>();

  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [
    relationship,
    setRelationship,
  ] = useState('');

  const [phone, setPhone] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function saveGuardian() {
    if (!studentId) {
      return;
    }

    const cleanedFirstName =
      firstName.trim();

    const cleanedLastName =
      lastName.trim();

    const cleanedRelationship =
      relationship.trim();

    const cleanedPhone =
      phone.trim();

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

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
      setLoading(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Fejl',
          'Du er ikke logget ind.'
        );

        return;
      }

      const {
        data: guardian,
        error: guardianError,
      } = await supabase
        .from('guardians')
        .insert({
          full_name:
            fullName,

          phone:
            cleanedPhone ||
            null,

          email:
            cleanedEmail ||
            null,

          created_by:
            user.id,
        })
        .select('id')
        .single();

      if (guardianError) {
        Alert.alert(
          'Kunne ikke oprette forælder',
          guardianError.message
        );

        return;
      }

      const {
        error: linkError,
      } = await supabase
        .from(
          'student_guardians'
        )
        .insert({
          student_id:
            studentId,

          guardian_id:
            guardian.id,

          relationship:
            cleanedRelationship ||
            null,
        });

      if (linkError) {
        Alert.alert(
          'Kunne ikke tilknytte forælder',
          linkError.message
        );

        return;
      }

      router.back();
    } finally {
      setLoading(false);
    }
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
          Tilføj forælder
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
          placeholder="anne@example.dk"
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
            loading
          }
          style={({
            pressed,
          }) => [
            styles.button,

            pressed &&
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
            <View
              style={
                styles.buttonContent
              }
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color={
                  COLORS.white
                }
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Gem forælder
              </Text>
            </View>
          )}
        </Pressable>
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

      padding: 20,
      paddingTop: 70,
      paddingBottom: 50,
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

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 16,

      color:
        COLORS.text,

      marginBottom: 18,
    },

    button: {
      height: 56,

      backgroundColor:
        COLORS.navy,

      borderRadius: 16,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 28,

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

    buttonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
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
  });