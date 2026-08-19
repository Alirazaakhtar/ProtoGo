import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  router,
  useFocusEffect,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type RecentSession = {
  id: string;
  session_date: string;
  created_at: string;
  finalized_at: string | null;

  classes: {
    id: string;
    name: string;
  } | null;

  creator: {
    full_name: string;
  } | null;

  attendance_records: {
    status: AttendanceStatus;
  }[];
};

export default function RecentsScreen() {
  const [sessions, setSessions] =
    useState<RecentSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadRecents = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        id,
        session_date,
        created_at,
        finalized_at,

        classes (
          id,
          name
        ),

        creator:profiles!attendance_sessions_created_by_fkey (
          full_name
        ),

        attendance_records (
          status
        )
      `)
      .not('finalized_at', 'is', null)
      .order('finalized_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'Kunne ikke hente recents:',
        error
      );
    } else {
      setSessions(
        (data ?? []) as RecentSession[]
      );
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecents();
    }, [loadRecents])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          Historik
        </Text>

        <Text style={styles.title}>
          Recents
        </Text>

        <Text style={styles.subtitle}>
          Tidligere afsluttede protokoller
        </Text>
      </View>

      {loading ? (
        <Text style={styles.muted}>
          Henter protokoller...
        </Text>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Ingen protokoller endnu
          </Text>

          <Text style={styles.muted}>
            Afsluttede protokoller vises her.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sessions.map((session) => {
            const present =
              session.attendance_records.filter(
                (record) =>
                  record.status === 'present'
              ).length;

            const absent =
              session.attendance_records.filter(
                (record) =>
                  record.status === 'absent'
              ).length;

            const late =
              session.attendance_records.filter(
                (record) =>
                  record.status === 'late'
              ).length;

            return (
              <Pressable
                key={session.id}
                onPress={() =>
                  router.push({
                    pathname:
                      '/recents/[sessionId]',
                    params: {
                      sessionId: session.id,
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.className}>
                      {session.classes?.name ??
                        'Ukendt klasse'}
                    </Text>

                    <Text style={styles.date}>
                      {formatDate(
                        session.session_date
                      )}
                    </Text>

                    <Text style={styles.teacher}>
                      Registreret af{' '}
                      {session.creator?.full_name ??
                        'Ukendt lærer'}
                      {' · '}
                      {formatTime(
                        session.finalized_at
                      )}
                    </Text>
                  </View>

                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </View>

                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                      {present}
                    </Text>

                    <Text style={styles.statLabel}>
                      Til stede
                    </Text>
                  </View>

                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                      {absent}
                    </Text>

                    <Text style={styles.statLabel}>
                      Fravær
                    </Text>
                  </View>

                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>
                      {late}
                    </Text>

                    <Text style={styles.statLabel}>
                      Forsinket
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(date: string) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: string | null) {
  if (!date) {
    return '';
  }

  return new Date(date).toLocaleTimeString(
    'da-DK',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
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

  header: {
    marginBottom: 28,
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

  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },

  list: {
    gap: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  className: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827',
  },

  date: {
    fontSize: 15,
    color: '#374151',
    marginTop: 5,
  },

  teacher: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  arrow: {
    fontSize: 30,
    color: '#9CA3AF',
  },

  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },

  stat: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  muted: {
    color: '#6B7280',
  },

  pressed: {
    opacity: 0.7,
  },
});