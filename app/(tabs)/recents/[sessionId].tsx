import { useEffect, useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLocalSearchParams } from 'expo-router';

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

const sessionCache =
  new Map<string, SessionDetails>();

export default function RecentDetailsScreen() {
  const { sessionId } =
    useLocalSearchParams<{
      sessionId: string;
    }>();

  const cachedSession = sessionId
    ? sessionCache.get(sessionId)
    : undefined;

  const [session, setSession] =
    useState<SessionDetails | null>(
      cachedSession ?? null
    );

  const [loading, setLoading] =
    useState(!cachedSession);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    if (!sessionId) {
      return;
    }

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

      setLoading(false);
      return;
    }

    const freshSession =
      data as SessionDetails;

    sessionCache.set(
      sessionId,
      freshSession
    );

    setSession(
      freshSession
    );

    setLoading(false);
  }

  if (loading && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>
          Protokollen blev ikke fundet.
        </Text>
      </View>
    );
  }

  // =====================================================
  // STATISTIK FOR DENNE PROTOKOL
  // =====================================================

  const totalStudents =
    session.attendance_records.length;

  const presentCount =
    session.attendance_records.filter(
      (record) =>
        record.status === 'present'
    ).length;

  const lateCount =
    session.attendance_records.filter(
      (record) =>
        record.status === 'late'
    ).length;

  const absentCount =
    session.attendance_records.filter(
      (record) =>
        record.status === 'absent'
    ).length;

  const attendanceCount =
    presentCount + lateCount;

  const attendancePercentage =
    totalStudents > 0
      ? Math.round(
          (attendanceCount /
            totalStudents) *
            100
        )
      : 0;

  const absencePercentage =
    totalStudents > 0
      ? Math.round(
          (absentCount /
            totalStudents) *
            100
        )
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      {/* HEADER */}

      <View style={styles.dateRow}>
        <Ionicons
          name="calendar-outline"
          size={15}
          color={COLORS.navy}
        />

        <Text style={styles.date}>
          {formatDate(
            session.session_date
          )}
        </Text>
      </View>

      <Text style={styles.title}>
        {session.classes?.name ??
          'Ukendt klasse'}
      </Text>

      <View style={styles.teacherRow}>
        <Ionicons
          name="person-outline"
          size={15}
          color={COLORS.navy}
        />

        <Text style={styles.teacher}>
          Registreret af{' '}
          <Text
            style={
              styles.teacherName
            }
          >
            {session.creator?.full_name ??
              'Ukendt lærer'}
          </Text>
        </Text>
      </View>

      {/* STATISTIK */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="people-outline"
              size={19}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.statValue}>
            {totalStudents}
          </Text>

          <Text style={styles.statLabel}>
            Elever
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.statValue}>
            {attendancePercentage}%
          </Text>

          <Text style={styles.statLabel}>
            {attendanceCount}{' '}
            {attendanceCount === 1
              ? 'fremmødt'
              : 'fremmødte'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="remove-circle-outline"
              size={19}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.statValue}>
            {absencePercentage}%
          </Text>

          <Text style={styles.statLabel}>
            {absentCount}{' '}
            {absentCount === 1
              ? 'fraværende'
              : 'fraværende'}
          </Text>
        </View>
      </View>

      {/* ELEVER */}

      <View style={styles.list}>
        {session.attendance_records.map(
          (record) => (
            <View
              key={record.id}
              style={styles.card}
            >
              <View
                style={
                  styles.studentInfo
                }
              >
                <View
                  style={
                    styles.avatar
                  }
                >
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {record.students?.first_name
                      ?.charAt(0)
                      .toUpperCase() ??
                      ''}

                    {record.students?.last_name
                      ?.charAt(0)
                      .toUpperCase() ??
                      ''}
                  </Text>
                </View>

                <Text style={styles.name}>
                  {record.students?.first_name ??
                    ''}{' '}
                  {record.students?.last_name ??
                    ''}
                </Text>
              </View>

              <View
                style={
                  styles.statusContainer
                }
              >
                <Ionicons
                  name={getStatusIcon(
                    record.status
                  )}
                  size={17}
                  color={COLORS.navy}
                />

                <Text
                  style={styles.status}
                >
                  {getStatusLabel(
                    record.status
                  )}
                </Text>
              </View>
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

function getStatusIcon(
  status: AttendanceStatus
):
  | 'checkmark-circle-outline'
  | 'remove-circle-outline'
  | 'time-outline' {
  switch (status) {
    case 'present':
      return 'checkmark-circle-outline';

    case 'absent':
      return 'remove-circle-outline';

    case 'late':
      return 'time-outline';
  }
}

function formatDate(
  date: string
) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString(
    'da-DK',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    content: {
      padding: 20,
      paddingTop: 70,
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      backgroundColor:
        COLORS.white,
    },

    notFoundText: {
      fontSize: 15,
      color: COLORS.muted,
    },

    /* HEADER */

    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    date: {
      fontSize: 14,
      color: COLORS.muted,
    },

    title: {
      fontSize: 36,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 5,
    },

    teacherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,

      marginTop: 7,
      marginBottom: 22,
    },

    teacher: {
      flex: 1,
      fontSize: 14,
      color: COLORS.muted,
    },

    teacherName: {
      fontWeight: '600',
      color: COLORS.text,
    },

    /* STATISTIK */

    statsRow: {
      flexDirection: 'row',
      gap: 10,

      marginBottom: 28,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    statCard: {
      flex: 1,
      minHeight: 108,

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      paddingVertical: 13,
      paddingHorizontal: 8,

      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    statIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent: 'center',

      marginBottom: 7,
    },

    statValue: {
      fontSize: 21,
      fontWeight: '800',
      color: COLORS.navy,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.muted,

      marginTop: 3,

      textAlign: 'center',
    },

    /* ELEVER */

    list: {
      gap: 14,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
      minHeight: 70,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      paddingHorizontal: 16,
      paddingVertical: 14,

      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    studentInfo: {
      flex: 1,

      flexDirection: 'row',
      alignItems: 'center',

      paddingRight: 12,
    },

    avatar: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent: 'center',

      marginRight: 11,
    },

    avatarText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.navy,
    },

    name: {
      flex: 1,

      fontSize: 16,
      fontWeight: '600',

      color: COLORS.text,
    },

    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 5,

      backgroundColor:
        COLORS.navySoft,

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 10,
    },

    status: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.navy,
    },
  });