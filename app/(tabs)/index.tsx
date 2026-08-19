import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { supabase } from '@/lib/supabase';

type SchoolClass = {
  id: string;
  name: string;
  school_year: string | null;
};

export default function HomeScreen() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('classes')
      .select('id, name, school_year')
      .order('name');

    if (error) {
      console.error('Fejl ved hentning af klasser:', error);
    } else {
      setClasses(data ?? []);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout fejl:', error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Godmorgen</Text>
          <Text style={styles.title}>Dine klasser</Text>
        </View>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.logoutText}>Log ud</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/classes/create')}
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.createButtonText}>
          + Opret klasse
        </Text>
      </Pressable>

      <Pressable
  onPress={() =>
    router.push('/invites')
  }
  style={({ pressed }) => [
    styles.inviteButton,
    pressed && styles.pressed,
  ]}
>
  <Text style={styles.inviteButtonText}>
    Invitationer
  </Text>
</Pressable>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Henter klasser...
          </Text>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Ingen klasser endnu
          </Text>

          <Text style={styles.emptyText}>
            Opret din første klasse for at komme i gang.
          </Text>
        </View>
      ) : (
        <View style={styles.classList}>
          {classes.map((schoolClass) => (
            <Pressable
              key={schoolClass.id}
              onPress={() =>
                router.push(`/classes/${schoolClass.id}`)
              }
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View>
                <Text style={styles.className}>
                  {schoolClass.name}
                </Text>

                <Text style={styles.schoolYear}>
                  {schoolClass.school_year ?? 'Intet skoleår'}
                </Text>
              </View>

              <View style={styles.cardRight}>
                <View style={styles.status}>
                  <Text style={styles.statusText}>
                    Åbn klasse
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
    paddingTop: 70,
  },

  header: {
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },

  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  createButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  classList: {
    gap: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  className: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },

  schoolYear: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },

  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  status: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E0E7FF',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3730A3',
  },

  arrow: {
    fontSize: 28,
    color: '#9CA3AF',
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.7,
  },
  
  inviteButton: {
  backgroundColor: '#FFFFFF',
  paddingVertical: 15,
  borderRadius: 16,
  alignItems: 'center',
  marginBottom: 24,
},

inviteButtonText: {
  color: '#111827',
  fontSize: 16,
  fontWeight: '600',
},
});