import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { supabase } from '@/lib/supabase';

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type SessionDetails = {
  id: string;
  session_date: string;

  classes: {
    name: string;
  } | null;

  creator: {
    full_name: string;
  } | null;

  attendance_records: {
    id: string;
    status: AttendanceStatus;

    students: {
      first_name: string;
      last_name: string;
    } | null;
  }[];
};

export default function RecentDetailsScreen() {
  const { sessionId } =
    useLocalSearchParams<{
      sessionId: string;
    }>();

  const [session, setSession] =
    useState<SessionDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        id,
        session_date,

        classes (
          name
        ),

        creator:profiles!attendance_sessions_created_by_fkey (
          full_name
        ),

        attendance_records (
          id,
          status,

          students (
            first_name,
            last_name
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error(error);
    } else {
      setSession(
        data as SessionDetails
      );
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Henter protokol...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text>
          Protokollen blev ikke fundet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.date}>
        {formatDate(session.session_date)}
      </Text>

      <Text style={styles.title}>
        {session.classes?.name}
      </Text>

      <Text style={styles.teacher}>
        Registreret af{' '}
        {session.creator?.full_name}
      </Text>

      <View style={styles.list}>
        {session.attendance_records.map(
          (record) => (
            <View
              key={record.id}
              style={styles.card}
            >
              <Text style={styles.name}>
                {record.students?.first_name}{' '}
                {record.students?.last_name}
              </Text>

              <Text style={styles.status}>
                {getStatusLabel(
                  record.status
                )}
              </Text>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}

function getStatusLabel(
  status: AttendanceStatus
) {
  switch (status) {
    case 'present':
      return 'Til stede';

    case 'absent':
      return 'Fravær';

    case 'late':
      return 'Forsinket';
  }
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  date: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginTop: 5,
  },

  teacher: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 28,
  },

  list: {
    gap: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});