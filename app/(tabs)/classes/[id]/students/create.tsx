import { useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  Alert,
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

export default function CreateStudentScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [birthDate, setBirthDate] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  function handleBirthDateChange(
    value: string
  ) {
    setBirthDate(
      formatBirthDateInput(value)
    );
  }

  async function createStudent() {
    if (
      !firstName.trim() ||
      !lastName.trim()
    ) {
      Alert.alert(
        'Manglende oplysninger',
        'Fornavn og efternavn er påkrævet.'
      );

      return;
    }

    if (!id) {
      return;
    }

    let birthDateForDatabase:
      | string
      | null = null;

    if (birthDate.trim()) {
      birthDateForDatabase =
        toIsoBirthDate(
          birthDate.trim()
        );

      if (!birthDateForDatabase) {
        Alert.alert(
          'Ugyldig fødselsdato',
          'Indtast datoen som DD-MM-ÅÅÅÅ, fx 01-01-2000.'
        );

        return;
      }
    }

    try {
      setLoading(true);

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
          'Du er ikke logget ind'
        );

        return;
      }

      const { error } =
        await supabase
          .from('students')
          .insert({
            class_id: id,

            first_name:
              firstName.trim(),

            last_name:
              lastName.trim(),

            birth_date:
              birthDateForDatabase,

            phone:
              phone.trim() ||
              null,

            created_by:
              user.id,
          });

      if (error) {
        Alert.alert(
          'Kunne ikke oprette elev',
          error.message
        );

        return;
      }

      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      <BackButton />

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>
          Tilføj elev
        </Text>
      </View>

      {/* FORNAVN */}

      <View style={styles.labelRow}>
        <View style={styles.labelIcon}>
          <Ionicons
            name="person-outline"
            size={15}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.label}>
          Fornavn *
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Emma"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          style={styles.input}
        />
      </View>

      {/* EFTERNAVN */}

      <View style={styles.labelRow}>
        <View style={styles.labelIcon}>
          <Ionicons
            name="person-outline"
            size={15}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.label}>
          Efternavn *
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Jensen"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          style={styles.input}
        />
      </View>

      {/* FØDSELSDATO */}

      <View style={styles.labelRow}>
        <View style={styles.labelIcon}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.label}>
          Fødselsdato
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={birthDate}
          onChangeText={
            handleBirthDateChange
          }
          placeholder="01-01-2000"
          placeholderTextColor={
            COLORS.lightMuted
          }
          keyboardType="number-pad"
          maxLength={10}
          style={styles.input}
        />
      </View>

      <View style={styles.helpRow}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={COLORS.navy}
        />

        <Text style={styles.help}>
          Format: DD-MM-ÅÅÅÅ
        </Text>
      </View>

      {/* TELEFON */}

      <View style={styles.labelRow}>
        <View style={styles.labelIcon}>
          <Ionicons
            name="call-outline"
            size={15}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.label}>
          Telefonnummer
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+45 12 34 56 78"
          placeholderTextColor={
            COLORS.lightMuted
          }
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      {/* OPRET */}

      <Pressable
        onPress={createStudent}
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
              Tilføj elev
            </Text>
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

function formatBirthDateInput(
  value: string
) {
  const digits =
    value
      .replace(/\D/g, '')
      .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(
      0,
      2
    )}-${digits.slice(2)}`;
  }

  return `${digits.slice(
    0,
    2
  )}-${digits.slice(
    2,
    4
  )}-${digits.slice(4)}`;
}

function toIsoBirthDate(
  value: string
): string | null {
  const match =
    value.match(
      /^(\d{2})-(\d{2})-(\d{4})$/
    );

  if (!match) {
    return null;
  }

  const [, day, month, year] =
    match;

  const dayNumber =
    Number(day);

  const monthNumber =
    Number(month);

  const yearNumber =
    Number(year);

  const date = new Date(
    yearNumber,
    monthNumber - 1,
    dayNumber
  );

  const isValid =
    date.getFullYear() ===
      yearNumber &&
    date.getMonth() ===
      monthNumber - 1 &&
    date.getDate() ===
      dayNumber;

  if (!isValid) {
    return null;
  }

  const today =
    new Date();

  if (date > today) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    content: {
      padding: 24,
      paddingTop: 70,
      paddingBottom: 50,
    },

    header: {
      marginBottom: 28,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 2,
    },

    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 8,
      marginTop: 14,
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

    inputContainer: {
      height: 56,
      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        '#E5E7EB',

      paddingHorizontal: 16,

      flexDirection: 'row',
      alignItems: 'center',
    },

    input: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: COLORS.text,
    },

    helpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 7,
      marginLeft: 2,
    },

    help: {
      color:
        COLORS.lightMuted,
      fontSize: 13,
    },

    button: {
      height: 58,
      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 32,

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
      fontWeight: '700',
      fontSize: 16,
    },

    disabled: {
      opacity: 0.5,
    },
  });