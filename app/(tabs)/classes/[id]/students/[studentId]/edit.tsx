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

type StudentEditData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
};

const studentEditCache =
  new Map<string, StudentEditData>();

export default function EditStudentScreen() {
  const {
    id,
    studentId,
  } = useLocalSearchParams<{
    id: string;
    studentId: string;
  }>();

  const cachedStudent = studentId
    ? studentEditCache.get(studentId)
    : undefined;

  const [firstName, setFirstName] =
    useState(
      cachedStudent?.firstName ?? ''
    );

  const [lastName, setLastName] =
    useState(
      cachedStudent?.lastName ?? ''
    );

  const [birthDate, setBirthDate] =
    useState(
      cachedStudent?.birthDate ?? ''
    );

  const [phone, setPhone] =
    useState(
      cachedStudent?.phone ?? ''
    );

  const [loading, setLoading] =
    useState(!cachedStudent);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadStudent();
  }, [id, studentId]);

  async function loadStudent() {
    if (!id || !studentId) {
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          birth_date,
          phone
        `)
        .eq('id', studentId)
        .eq('class_id', id)
        .single();

      if (error) {
        throw error;
      }

      const freshData: StudentEditData = {
        firstName:
          data.first_name ?? '',

        lastName:
          data.last_name ?? '',

        birthDate:
          data.birth_date
            ? fromIsoBirthDate(
                data.birth_date
              )
            : '',

        phone:
          data.phone ?? '',
      };

      studentEditCache.set(
        studentId,
        freshData
      );

      setFirstName(
        freshData.firstName
      );

      setLastName(
        freshData.lastName
      );

      setBirthDate(
        freshData.birthDate
      );

      setPhone(
        freshData.phone
      );
    } catch (error) {
      console.error(error);

      if (
        !studentEditCache.has(studentId)
      ) {
        Alert.alert(
          'Fejl',
          'Kunne ikke hente eleven.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleBirthDateChange(
    value: string
  ) {
    setBirthDate(
      formatBirthDateInput(value)
    );
  }

  async function saveStudent() {
    if (!studentId || !id) {
      return;
    }

    if (
      !firstName.trim() ||
      !lastName.trim()
    ) {
      Alert.alert(
        'Navn mangler',
        'Skriv elevens fornavn og efternavn.'
      );

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
          'Forkert dato',
          'Fødselsdato skal skrives som DD-MM-ÅÅÅÅ, fx 01-01-2000.'
        );

        return;
      }
    }

    try {
      setSaving(true);

      const updatedStudent = {
        first_name:
          firstName.trim(),

        last_name:
          lastName.trim(),

        birth_date:
          birthDateForDatabase,

        phone:
          phone.trim() || null,
      };

      const { error } = await supabase
        .from('students')
        .update(updatedStudent)
        .eq('id', studentId)
        .eq('class_id', id);

      if (error) {
        Alert.alert(
          'Kunne ikke gemme elev',
          error.message
        );

        return;
      }

      studentEditCache.set(
        studentId,
        {
          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          birthDate:
            birthDate.trim(),

          phone:
            phone.trim(),
        }
      );

      router.back();
    } finally {
      setSaving(false);
    }
  }

  function deactivateStudent() {
    if (!studentId || !id) {
      return;
    }

    Alert.alert(
      'Fjern elev',
      'Vil du fjerne eleven fra klassen? Tidligere protokoller bliver bevaret.',
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Fjern elev',
          style: 'destructive',

          onPress: async () => {
            const { error } =
              await supabase
                .from('students')
                .update({
                  active: false,
                })
                .eq(
                  'id',
                  studentId
                )
                .eq(
                  'class_id',
                  id
                );

            if (error) {
              Alert.alert(
                'Kunne ikke fjerne elev',
                error.message
              );

              return;
            }

            studentEditCache.delete(
              studentId
            );

            router.replace({
              pathname:
                '/classes/[id]',
              params: { id },
            });
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
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
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <Text style={styles.title}>
          Rediger elev
        </Text>

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
            Fornavn
          </Text>
        </View>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Fornavn"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          style={styles.input}
        />

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
            Efternavn
          </Text>
        </View>

        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Efternavn"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          style={styles.input}
        />

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

        <View style={styles.helperRow}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={COLORS.navy}
          />

          <Text style={styles.helper}>
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
            Telefon
          </Text>
        </View>

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

        {/* GEM */}

        <Pressable
          onPress={saveStudent}
          disabled={saving}
          style={({ pressed }) => [
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
              color={COLORS.white}
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
                color={COLORS.white}
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

        {/* FJERN ELEV */}

        <Pressable
          onPress={deactivateStudent}
          disabled={saving}
          style={({ pressed }) => [
            styles.deleteButton,

            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="person-remove-outline"
            size={18}
            color="#DC2626"
          />

          <Text
            style={
              styles.deleteButtonText
            }
          >
            Fjern elev fra klassen
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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

  const today = new Date();

  if (date > today) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function fromIsoBirthDate(
  value: string
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return value;
  }

  const [, year, month, day] =
    match;

  return `${day}-${month}-${year}`;
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

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
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
      marginBottom: 28,
    },

    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 7,

      marginBottom: 7,
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
      fontSize: 13,
      fontWeight: '600',

      color: COLORS.navy,
    },

    input: {
      backgroundColor:
        COLORS.white,

      height: 54,
      borderRadius: 15,

      paddingHorizontal: 16,

      fontSize: 16,
      marginBottom: 18,

      color: COLORS.text,

      borderWidth: 1,
      borderColor:
        '#E5E7EB',
    },

    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 4,

      marginTop: -10,
      marginBottom: 18,
      marginLeft: 2,
    },

    helper: {
      fontSize: 12,

      color:
        COLORS.lightMuted,
    },

    saveButton: {
      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
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
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 8,
    },

    saveButtonText: {
      color: COLORS.white,

      fontSize: 16,
      fontWeight: '700',
    },

    deleteButton: {
      marginTop: 18,
      minHeight: 48,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 7,
    },

    deleteButtonText: {
      fontSize: 15,
      fontWeight: '600',

      color: '#DC2626',
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.5,
    },
  });