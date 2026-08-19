import { useEffect, useState } from 'react';
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

export default function EditGuardianScreen() {
  const {
    studentId,
    guardianId,
  } = useLocalSearchParams<{
    id: string;
    studentId: string;
    guardianId: string;
  }>();

  const [name, setName] = useState('');

  const [relationship, setRelationship] =
    useState('');

  const [phone, setPhone] = useState('');

  const [email, setEmail] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadGuardian();
  }, [guardianId, studentId]);

  async function loadGuardian() {
    if (!guardianId || !studentId) {
      return;
    }

    setLoading(true);

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
        .eq('id', guardianId)
        .single();

      if (guardianError) {
        throw guardianError;
      }

      const {
        data: relation,
        error: relationError,
      } = await supabase
        .from('student_guardians')
        .select(`
          relationship
        `)
        .eq('student_id', studentId)
        .eq(
          'guardian_id',
          guardianId
        )
        .single();

      if (relationError) {
        throw relationError;
      }

      setName(
        guardian.full_name
      );

      setPhone(
        guardian.phone ?? ''
      );

      setEmail(
        guardian.email ?? ''
      );

      setRelationship(
        relation.relationship ?? ''
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Fejl',
        'Kunne ikke hente forælderen.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveGuardian() {
    if (!guardianId || !studentId) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        'Navn mangler',
        'Skriv forælderens navn.'
      );

      return;
    }

    try {
      setSaving(true);

      const { error: guardianError } =
        await supabase
          .from('guardians')
          .update({
            full_name: name.trim(),

            phone:
              phone.trim() || null,

            email:
              email
                .trim()
                .toLowerCase() ||
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
        .from('student_guardians')
        .update({
          relationship:
            relationship.trim() ||
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

      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>
          Henter forælder...
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
      <Text style={styles.eyebrow}>
        Kontaktperson
      </Text>

      <Text style={styles.title}>
        Rediger forælder
      </Text>

      <Text style={styles.label}>
        Navn
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Navn"
        style={styles.input}
      />

      <Text style={styles.label}>
        Relation
      </Text>

      <TextInput
        value={relationship}
        onChangeText={
          setRelationship
        }
        placeholder="Fx Mor, Far eller Værge"
        style={styles.input}
      />

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

      <Text style={styles.label}>
        E-mail
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="navn@example.dk"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <Pressable
        onPress={saveGuardian}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveButton,
          pressed &&
            styles.pressed,
          saving &&
            styles.disabled,
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
    </ScrollView>
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
});