import { useState } from 'react';
import {
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

export default function InviteTeacherScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [email, setEmail] = useState('');
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

    if (!id) return;

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      const { error } = await supabase
        .from('class_invites')
        .insert({
          class_id: id,
          email: normalizedEmail,
          invited_by: user.id,
          role: 'teacher',
        });

      if (error) {
        if (error.code === '23505') {
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
      <Text style={styles.eyebrow}>
        Klasse
      </Text>

      <Text style={styles.title}>
        Inviter lærer
      </Text>

      <Text style={styles.description}>
        Læreren skal logge ind eller oprette
        konto med den e-mailadresse, du
        inviterer.
      </Text>

      <Text style={styles.label}>
        E-mail
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="laerer@skole.dk"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <Pressable
        onPress={inviteTeacher}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Inviterer...'
            : 'Inviter lærer'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    padding: 24,
    paddingTop: 70,
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
  },

  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    fontSize: 16,
  },

  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  buttonText: {
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