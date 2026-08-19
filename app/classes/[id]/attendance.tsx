import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
};

type StatusMap = Record<
  string,
  AttendanceStatus | undefined
>;

export default function AttendanceScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [className, setClassName] =
    useState('');

  const [students, setStudents] =
    useState<Student[]>([]);

  const [statuses, setStatuses] =
    useState<StatusMap>({});

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [finishing, setFinishing] =
    useState(false);

  // =====================================================
  // HENT PROTOKOL
  // =====================================================

  const loadAttendance = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    try {
      // -------------------------
      // Hent klassen
      // -------------------------

      const {
        data: classData,
        error: classError,
      } = await supabase
        .from('classes')
        .select('id, name')
        .eq('id', id)
        .single();

      if (classError) {
        throw classError;
      }

      setClassName(classData.name);

      // -------------------------
      // Hent elever
      // -------------------------

      const {
        data: studentData,
        error: studentError,
      } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name
        `)
        .eq('class_id', id)
        .eq('active', true)
        .order('first_name');

      if (studentError) {
        throw studentError;
      }

      const currentStudents =
        studentData ?? [];

      setStudents(currentStudents);

      // -------------------------
      // Hent/opret dagens session
      // -------------------------

      const today = getLocalDate();

      const {
        data: attendanceSessionId,
        error: sessionError,
      } = await supabase.rpc(
        'get_or_create_attendance_session',
        {
          target_class_id: id,
          target_date: today,
        }
      );

      if (sessionError) {
        throw sessionError;
      }

      if (!attendanceSessionId) {
        throw new Error(
          'Attendance session kunne ikke oprettes'
        );
      }

      setSessionId(attendanceSessionId);

      // -------------------------
      // Hent eksisterende status
      // -------------------------

      const {
        data: recordData,
        error: recordError,
      } = await supabase
        .from('attendance_records')
        .select(`
          student_id,
          status
        `)
        .eq(
          'session_id',
          attendanceSessionId
        );

      if (recordError) {
        throw recordError;
      }

      const statusMap: StatusMap = {};

      for (const record of recordData ?? []) {
        statusMap[record.student_id] =
          record.status as AttendanceStatus;
      }

      setStatuses(statusMap);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Fejl',
        'Kunne ikke hente protokollen.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  // =====================================================
  // REALTIME
  // =====================================================

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const channel = supabase
      .channel(`attendance:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const record = payload.new as {
            student_id?: string;
            status?: AttendanceStatus;
          };

          if (
            !record.student_id ||
            !record.status
          ) {
            return;
          }

          setStatuses((current) => ({
            ...current,
            [record.student_id!]:
              record.status,
          }));
        }
      )
      .subscribe((status, error) => {
        console.log(
          'Realtime:',
          status
        );

        if (error) {
          console.error(
            'Realtime fejl:',
            error
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // =====================================================
  // GEM ÉN ELEV
  // =====================================================

  async function updateStatus(
    studentId: string,
    status: AttendanceStatus
  ) {
    if (!sessionId) return;

    const previousStatus =
      statuses[studentId];

    // Optimistic UI
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from('attendance_records')
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          status,
          updated_by: user.id,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'session_id,student_id',
        }
      );

    if (error) {
      console.error(error);

      // Rollback hvis DB fejler
      setStatuses((current) => ({
        ...current,
        [studentId]: previousStatus,
      }));

      Alert.alert(
        'Kunne ikke gemme',
        error.message
      );
    }
  }

  // =====================================================
  // MARKÉR ALLE TIL STEDE
  // =====================================================

  async function markAllPresent() {
    if (!sessionId) return;

    const previousStatuses =
      statuses;

    const newStatuses: StatusMap = {};

    for (const student of students) {
      newStatuses[student.id] =
        'present';
    }

    // Optimistic UI
    setStatuses(newStatuses);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const records = students.map(
      (student) => ({
        session_id: sessionId,
        student_id: student.id,
        status: 'present' as const,
        updated_by: user.id,
        updated_at:
          new Date().toISOString(),
      })
    );

    const { error } = await supabase
      .from('attendance_records')
      .upsert(records, {
        onConflict:
          'session_id,student_id',
      });

    if (error) {
      console.error(error);

      setStatuses(
        previousStatuses
      );

      Alert.alert(
        'Kunne ikke gemme',
        error.message
      );
    }
  }

  // =====================================================
  // AFSLUT PROTOKOL
  // =====================================================

  async function finalizeAttendance() {
  if (!sessionId) {
    return;
  }

  const missingStudents = students.filter(
    (student) => !statuses[student.id]
  );

  if (missingStudents.length > 0) {
    Alert.alert(
      'Protokollen er ikke færdig',
      `${missingStudents.length} ${
        missingStudents.length === 1
          ? 'elev mangler'
          : 'elever mangler'
      } at blive registreret.`
    );

    return;
  }

  try {
    setFinishing(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert(
        'Fejl',
        'Du er ikke logget ind.'
      );

      return;
    }

    const finalizedAt = new Date();

    const archiveSessionType =
      `archived:${user.id}:${finalizedAt.getTime()}`;

    const { error } = await supabase
      .from('attendance_sessions')
      .update({
        finalized_at: finalizedAt.toISOString(),
        session_type: archiveSessionType,
      })
      .eq('id', sessionId);

    if (error) {
      Alert.alert(
        'Kunne ikke afslutte protokollen',
        error.message
      );

      return;
    }

    router.back();
  } finally {
    setFinishing(false);
  }
}

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>
          Henter protokol...
        </Text>
      </View>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          Dagens protokol
        </Text>

        <Text style={styles.title}>
          {className}
        </Text>

        <Text style={styles.subtitle}>
          {students.length} elever
        </Text>
      </View>

      <Pressable
        onPress={markAllPresent}
        style={({ pressed }) => [
          styles.allButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={
            styles.allButtonText
          }
        >
          ✓ Markér alle til stede
        </Text>
      </Pressable>

      <View style={styles.list}>
        {students.map((student) => {
          const status =
            statuses[student.id];

          return (
            <View
              key={student.id}
              style={styles.card}
            >
              <View
                style={
                  styles.student
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
                    {student
                      .first_name[0]}
                    {student
                      .last_name[0]}
                  </Text>
                </View>

                <View>
                  <Text
                    style={
                      styles.name
                    }
                  >
                    {
                      student.first_name
                    }{' '}
                    {
                      student.last_name
                    }
                  </Text>

                  <Text
                    style={
                      styles.statusLabel
                    }
                  >
                    {getStatusLabel(
                      status
                    )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.buttons
                }
              >
                <StatusButton
                  text="Til stede"
                  active={
                    status ===
                    'present'
                  }
                  onPress={() =>
                    updateStatus(
                      student.id,
                      'present'
                    )
                  }
                />

                <StatusButton
                  text="Forsinket"
                  active={
                    status ===
                    'late'
                  }
                  onPress={() =>
                    updateStatus(
                      student.id,
                      'late'
                    )
                  }
                />

                <StatusButton
                  text="Fravær"
                  active={
                    status ===
                    'absent'
                  }
                  onPress={() =>
                    updateStatus(
                      student.id,
                      'absent'
                    )
                  }
                />
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={finalizeAttendance}
        disabled={finishing}
        style={({ pressed }) => [
          styles.finishButton,
          pressed &&
            styles.pressed,
          finishing &&
            styles.disabled,
        ]}
      >
        <Text
          style={
            styles.finishButtonText
          }
        >
          {finishing
            ? 'Afslutter...'
            : 'Afslut protokol'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

type StatusButtonProps = {
  text: string;
  active: boolean;
  onPress: () => void;
};

function StatusButton({
  text,
  active,
  onPress,
}: StatusButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusButton,
        active &&
          styles.statusButtonActive,
        pressed &&
          styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.statusButtonText,
          active &&
            styles.statusButtonTextActive,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function getStatusLabel(
  status:
    | AttendanceStatus
    | undefined
) {
  switch (status) {
    case 'present':
      return 'Til stede';

    case 'absent':
      return 'Fraværende';

    case 'late':
      return 'Forsinket';

    default:
      return 'Ikke registreret';
  }
}

function getLocalDate() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 60,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 6,
  },

  allButton: {
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  allButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  list: {
    gap: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  student: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 3,
  },

  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  statusButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statusButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  statusButtonTextActive: {
    color: '#FFFFFF',
  },

  finishButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },

  finishButtonText: {
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