import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
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

  const loadAttendance =
    useCallback(async () => {
      if (!id) {
        return;
      }

      setLoading(true);

      try {
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

        setStudents(
          currentStudents
        );

        const today =
          getLocalDate();

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

        setSessionId(
          attendanceSessionId
        );

        const {
          data: recordData,
          error: recordError,
        } = await supabase
          .from(
            'attendance_records'
          )
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

        const statusMap:
          StatusMap = {};

        for (
          const record of
          recordData ?? []
        ) {
          statusMap[
            record.student_id
          ] =
            record.status as AttendanceStatus;
        }

        const missingStudents =
          currentStudents.filter(
            (student) =>
              !statusMap[
                student.id
              ]
          );

        if (
          missingStudents.length >
          0
        ) {
          const {
            data: { user },
            error: userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !user
          ) {
            throw new Error(
              'Brugeren kunne ikke hentes'
            );
          }

          const now =
            new Date().toISOString();

          const defaultRecords =
            missingStudents.map(
              (student) => ({
                session_id:
                  attendanceSessionId,

                student_id:
                  student.id,

                status:
                  'absent' as const,

                updated_by:
                  user.id,

                updated_at:
                  now,
              })
            );

          const {
            error:
              defaultStatusError,
          } = await supabase
            .from(
              'attendance_records'
            )
            .upsert(
              defaultRecords,
              {
                onConflict:
                  'session_id,student_id',

                ignoreDuplicates:
                  true,
              }
            );

          if (
            defaultStatusError
          ) {
            throw defaultStatusError;
          }

          for (
            const student of
            missingStudents
          ) {
            statusMap[
              student.id
            ] = 'absent';
          }
        }

        setStatuses(
          statusMap
        );
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
      .channel(
        `attendance:${sessionId}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'attendance_records',
          filter:
            `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const record =
            payload.new as {
              student_id?: string;
              status?: AttendanceStatus;
            };

          if (
            !record.student_id ||
            !record.status
          ) {
            return;
          }

          setStatuses(
            (current) => ({
              ...current,

              [record.student_id!]:
                record.status,
            })
          );
        }
      )
      .subscribe(
        (status, error) => {
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
        }
      );

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [sessionId]);

  // =====================================================
  // GEM ÉN ELEV
  // =====================================================

  async function updateStatus(
    studentId: string,
    status: AttendanceStatus
  ) {
    if (!sessionId) {
      return;
    }

    const previousStatus =
      statuses[studentId];

    setStatuses(
      (current) => ({
        ...current,
        [studentId]: status,
      })
    );

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setStatuses(
        (current) => ({
          ...current,
          [studentId]:
            previousStatus,
        })
      );

      return;
    }

    const { error } =
      await supabase
        .from(
          'attendance_records'
        )
        .upsert(
          {
            session_id:
              sessionId,

            student_id:
              studentId,

            status,

            updated_by:
              user.id,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              'session_id,student_id',
          }
        );

    if (error) {
      console.error(error);

      setStatuses(
        (current) => ({
          ...current,

          [studentId]:
            previousStatus,
        })
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

    const missingStudents =
      students.filter(
        (student) =>
          !statuses[
            student.id
          ]
      );

    if (
      missingStudents.length >
      0
    ) {
      Alert.alert(
        'Protokollen er ikke færdig',
        `${missingStudents.length} ${
          missingStudents.length ===
          1
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
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        Alert.alert(
          'Fejl',
          'Du er ikke logget ind.'
        );

        return;
      }

      const finalizedAt =
        new Date();

      const archiveSessionType =
        `archived:${user.id}:${finalizedAt.getTime()}`;

      const { error } =
        await supabase
          .from(
            'attendance_sessions'
          )
          .update({
            finalized_at:
              finalizedAt.toISOString(),

            session_type:
              archiveSessionType,
          })
          .eq(
            'id',
            sessionId
          );

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
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
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
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text
              style={
                styles.protocolTitle
              }
            >
              Dagens protokol ·{' '}
              {className}
            </Text>

            <View
              style={
                styles.studentCountRow
              }
            >
              <Ionicons
                name="people-outline"
                size={15}
                color={COLORS.navy}
              />

              <Text
                style={
                  styles.subtitle
                }
              >
                {students.length}{' '}
                {students.length === 1
                  ? 'elev'
                  : 'elever'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ELEVER */}

      <View style={styles.list}>
        {students.map(
          (student) => {
            const status =
              statuses[
                student.id
              ];

            return (
              <View
                key={student.id}
                style={styles.card}
              >
                <View
                  style={styles.student}
                >
                  <View
                    style={styles.avatar}
                  >
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {student.first_name
                        .charAt(0)
                        .toUpperCase()}

                      {student.last_name
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.studentContent
                    }
                  >
                    <Text
                      style={styles.name}
                    >
                      {student.first_name}{' '}
                      {student.last_name}
                    </Text>

                    <View
                      style={
                        styles.currentStatusRow
                      }
                    >
                      <Ionicons
                        name={getStatusIcon(
                          status
                        )}
                        size={14}
                        color={COLORS.navy}
                      />

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
                </View>

                <View
                  style={styles.buttons}
                >
                  <StatusButton
                    text="Til stede"
                    icon="checkmark-circle-outline"
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
                    icon="time-outline"
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
                    icon="remove-circle-outline"
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
          }
        )}
      </View>

      {/* AFSLUT */}

      <Pressable
        onPress={
          finalizeAttendance
        }
        disabled={
          finishing
        }
        style={({ pressed }) => [
          styles.finishButton,

          pressed &&
            styles.finishButtonPressed,

          finishing &&
            styles.disabled,
        ]}
      >
        {finishing ? (
          <ActivityIndicator
            size="small"
            color={COLORS.white}
          />
        ) : (
          <View
            style={
              styles.finishButtonContent
            }
          >
            <Ionicons
              name="checkmark-done-outline"
              size={21}
              color={COLORS.white}
            />

            <Text
              style={
                styles.finishButtonText
              }
            >
              Afslut protokol
            </Text>
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

type StatusButtonProps = {
  text: string;

  icon:
    | 'checkmark-circle-outline'
    | 'time-outline'
    | 'remove-circle-outline';

  active: boolean;
  onPress: () => void;
};

function StatusButton({
  text,
  icon,
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
      <Ionicons
        name={icon}
        size={16}
        color={
          active
            ? COLORS.white
            : COLORS.navy
        }
      />

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

function getStatusIcon(
  status:
    | AttendanceStatus
    | undefined
):
  | 'checkmark-circle-outline'
  | 'remove-circle-outline'
  | 'time-outline'
  | 'help-circle-outline' {
  switch (status) {
    case 'present':
      return 'checkmark-circle-outline';

    case 'absent':
      return 'remove-circle-outline';

    case 'late':
      return 'time-outline';

    default:
      return 'help-circle-outline';
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
      paddingBottom: 60,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.white,
    },

    header: {
      marginBottom: 24,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    headerText: {
      flex: 1,
    },

    protocolTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: COLORS.text,
    },

    studentCountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 5,
    },

    subtitle: {
      fontSize: 14,
      color: COLORS.muted,
    },

    list: {
      gap: 16,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 18,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    student: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 14,
    },

    avatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.navy,
    },

    studentContent: {
      flex: 1,
    },

    name: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.text,
    },

    currentStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },

    statusLabel: {
      fontSize: 13,
      color: COLORS.muted,
    },

    buttons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },

    statusButton: {
      flex: 1,
      minHeight: 42,

      borderWidth: 1,
      borderColor:
        '#DDE4EC',

      borderRadius: 12,

      paddingHorizontal: 8,
      paddingVertical: 9,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 5,

      backgroundColor:
        COLORS.white,
    },

    statusButtonActive: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    statusButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.navy,
    },

    statusButtonTextActive: {
      color: COLORS.white,
    },

    finishButton: {
      height: 58,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 28,

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

    finishButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    finishButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    finishButtonText: {
      color: COLORS.white,
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