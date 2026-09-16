import { useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  Alert,
  Pressable,
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

export default function InviteTeacherScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function inviteTeacher() {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert(
        'Skriv lærerens e-mail'
      );

      return;
    }

    if (!id) {
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Du er ikke logget ind'
        );

        return;
      }

      if (
        user.email?.toLowerCase() ===
        normalizedEmail
      ) {
        Alert.alert(
          'Du er allerede medlem af klassen'
        );

        return;
      }

      const { error } =
        await supabase
          .from('class_invites')
          .insert({
            class_id: id,
            email:
              normalizedEmail,
            invited_by:
              user.id,
            role: 'teacher',
          });

      if (error) {
        if (
          error.code ===
          '23505'
        ) {
          Alert.alert(
            'Allerede inviteret',
            'Der findes allerede en aktiv invitation til denne lærer.'
          );

          return;
        }

        Alert.alert(
          'Kunne ikke invitere lærer',
          error.message
        );

        return;
      }

      Alert.alert(
        'Invitation oprettet',
        `${normalizedEmail} kan nu acceptere invitationen, når læreren logger ind i appen.`
      );

      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.eyebrow}>
        Klasse
      </Text>

      <Text style={styles.title}>
        Inviter lærer
      </Text>

      {/* BESKRIVELSE */}

      <View
        style={
          styles.descriptionRow
        }
      >
        <View
          style={
            styles.descriptionIcon
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.navy}
          />
        </View>

        <Text
          style={
            styles.description
          }
        >
          Læreren skal logge ind eller
          oprette konto med den
          e-mailadresse, du inviterer.
        </Text>
      </View>

      {/* E-MAIL */}

      <View style={styles.labelRow}>
        <View
          style={
            styles.labelIcon
          }
        >
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
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      {/* INVITER */}

      <Pressable
        onPress={inviteTeacher}
        disabled={loading}
        style={({ pressed }) => [
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
            color={COLORS.white}
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
              color={COLORS.white}
            />

            <Text
              style={
                styles.buttonText
              }
            >
              Inviter lærer
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.white,
      padding: 24,
      paddingTop: 70,
    },

    eyebrow: {
      fontSize: 14,
      color: COLORS.muted,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 4,
    },

    descriptionRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      marginTop: 14,
      marginBottom: 32,
      paddingRight: 8,
    },

    descriptionIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor:
        COLORS.navySoft,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 1,
    },

    description: {
      flex: 1,
      fontSize: 15,
      color: COLORS.muted,
      lineHeight: 22,
      paddingTop: 4,
    },

    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 8,
    },

    labelIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor:
        COLORS.navySoft,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.navy,
    },

    input: {
      height: 56,
      borderRadius: 16,

      borderWidth: 1,
      borderColor:
        '#E5E7EB',

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 18,

      fontSize: 16,
      color: COLORS.text,
    },

    button: {
      height: 58,
      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 18,

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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    buttonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '700',
    },

    disabled: {
      opacity: 0.5,
    },
  });