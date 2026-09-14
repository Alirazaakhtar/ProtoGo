import { useEffect, useState } from 'react';
import BackButton from '@/app/components/BackButton';
import {
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

export default function EditStudentScreen() {
  const {
    id,
    studentId,
  } = useLocalSearchParams<{
    id: string;
    studentId: string;
  }>();

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [birthDate, setBirthDate] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadStudent();
  }, [id, studentId]);

  async function loadStudent() {
    if (!id || !studentId) {
      return;
    }

    setLoading(true);

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

      setFirstName(
        data.first_name ?? ''
      );

      setLastName(
        data.last_name ?? ''
      );

      setBirthDate(
        data.birth_date ?? ''
      );

      setPhone(
        data.phone ?? ''
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Fejl',
        'Kunne ikke hente eleven.'
      );
    } finally {
      setLoading(false);
    }
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

    if (
      birthDate.trim() &&
      !isValidDate(birthDate.trim())
    ) {
      Alert.alert(
        'Forkert dato',
        'Fødselsdato skal skrives som YYYY-MM-DD.'
      );

      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('students')
        .update({
          first_name:
            firstName.trim(),

          last_name:
            lastName.trim(),

          birth_date:
            birthDate.trim() ||
            null,

          phone:
            phone.trim() ||
            null,
        })
        .eq('id', studentId)
        .eq('class_id', id);

      if (error) {
        Alert.alert(
          'Kunne ikke gemme elev',
          error.message
        );

        return;
      }

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
          const { error } = await supabase
            .from('students')
            .update({
              active: false,
            })
            .eq('id', studentId)
            .eq('class_id', id);

          if (error) {
            Alert.alert(
              'Kunne ikke fjerne elev',
              error.message
            );

            return;
          }

          router.replace({
            pathname: '/classes/[id]',
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
        <Text>
          Henter elev...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
        <BackButton/>
      <Text style={styles.eyebrow}>
        Elev
      </Text>

      <Text style={styles.title}>
        Rediger elev
      </Text>

      <Text style={styles.label}>
        Fornavn
      </Text>

      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Fornavn"
        autoCapitalize="words"
        style={styles.input}
      />

      <Text style={styles.label}>
        Efternavn
      </Text>

      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Efternavn"
        autoCapitalize="words"
        style={styles.input}
      />

      <Text style={styles.label}>
        Fødselsdato
      </Text>

      <TextInput
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />

      <Text style={styles.helper}>
        Fx 2014-05-21
      </Text>

      <Text style={styles.label}>
        Telefon
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+45 12 34 56 78"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Pressable
        onPress={saveStudent}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.pressed,
          saving && styles.disabled,
        ]}
      >
        <Text
          style={
            styles.saveButtonText
          }
        >
          {saving
            ? 'Gemmer...'
            : 'Gem ændringer'}
        </Text>
      </Pressable>

      <Pressable
  onPress={deactivateStudent}
  style={({ pressed }) => [
    styles.deleteButton,
    pressed && styles.pressed,
  ]}
>
  <Text style={styles.deleteButtonText}>
    Fjern elev fra klassen
  </Text>
</Pressable>
    </ScrollView>
  );
}

function isValidDate(
  value: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  return !Number.isNaN(
    date.getTime()
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 28,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 18,
  },

  helper: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -10,
    marginBottom: 18,
  },

  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },

  deleteButton: {
  marginTop: 18,
  paddingVertical: 14,
  alignItems: 'center',
},

deleteButtonText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#DC2626',
},
});