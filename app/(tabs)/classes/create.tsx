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

import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  soft: '#F5F6F8',
  white: '#FFFFFF',
};

export default function CreateClassScreen() {
  const [name, setName] =
    useState('');

  const [schoolYear, setSchoolYear] =
    useState('');

  const [subject, setSubject] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function createClass() {
    if (!name.trim()) {
      Alert.alert(
        'Skriv et klassenavn'
      );

      return;
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

      const {
        data,
        error,
      } = await supabase
        .from('classes')
        .insert({
          name:
            name.trim(),

          school_year:
            schoolYear.trim() ||
            null,

          subject:
            subject.trim() ||
            null,

          created_by:
            user.id,
        })
        .select()
        .single();

      if (error) {
        Alert.alert(
          'Kunne ikke oprette klasse',
          error.message
        );

        return;
      }

      router.replace(
        `/classes/${data.id}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>
        Opret klasse
      </Text>

      <View style={styles.form}>
        {/* KLASSENAVN */}

        <View>
          <View style={styles.labelRow}>
            <View
              style={
                styles.labelIcon
              }
            >
              <Ionicons
                name="school-outline"
                size={15}
                color={COLORS.navy}
              />
            </View>

            <Text style={styles.label}>
              Klassenavn
            </Text>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Fx 5.A"
            placeholderTextColor={
              COLORS.lightMuted
            }
            autoCapitalize="words"
            autoFocus
            style={styles.input}
          />
        </View>

        {/* FAG */}

        <View>
          <View style={styles.labelRow}>
            <View
              style={
                styles.labelIcon
              }
            >
              <Ionicons
                name="book-outline"
                size={15}
                color={COLORS.navy}
              />
            </View>

            <Text style={styles.label}>
              Fag
            </Text>
          </View>

          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Fx Matematik"
            placeholderTextColor={
              COLORS.lightMuted
            }
            autoCapitalize="words"
            style={styles.input}
          />
        </View>

        {/* SKOLEÅR */}

        <View>
          <View style={styles.labelRow}>
            <View
              style={
                styles.labelIcon
              }
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={COLORS.navy}
              />
            </View>

            <Text style={styles.label}>
              Skoleår
            </Text>
          </View>

          <TextInput
            value={schoolYear}
            onChangeText={setSchoolYear}
            placeholder="Fx 2026/2027"
            placeholderTextColor={
              COLORS.lightMuted
            }
            style={styles.input}
          />
        </View>

        {/* OPRET */}

        <Pressable
          onPress={createClass}
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
                name="add-circle-outline"
                size={21}
                color={COLORS.white}
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Opret klasse
              </Text>
            </View>
          )}
        </Pressable>
      </View>
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
      paddingTop: 80,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 4,
      marginBottom: 32,
    },

    form: {
      gap: 20,
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
      backgroundColor:
        COLORS.white,
      borderRadius: 16,

      borderWidth: 1,
      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 16,
      color: COLORS.text,
    },

    button: {
      height: 58,
      backgroundColor:
        COLORS.navy,
      borderRadius: 16,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 10,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.12,
      shadowRadius: 10,

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