import { useCallback, useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
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

  soft: '#F5F6F8',
  white: '#FFFFFF',
};

type SchoolClass = {
  id: string;
  name: string;
  school_year: string | null;
  subject: string | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
};

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type AttendanceSession = {
  attendance_records: {
    status: AttendanceStatus;
  }[];
};

export default function ClassScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [schoolClass, setSchoolClass] =
    useState<SchoolClass | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [
    attendancePercentage,
    setAttendancePercentage,
  ] = useState<number | null>(null);

  const [
    absencePercentage,
    setAbsencePercentage,
  ] = useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadClass =
    useCallback(async () => {
      if (!id) {
        return;
      }

      const [
        classResult,
        studentsResult,
        attendanceResult,
      ] = await Promise.all([
        supabase
          .from('classes')
          .select(
            'id, name, school_year, subject'
          )
          .eq('id', id)
          .single(),

        supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            birth_date,
            phone
          `)
          .eq('class_id', id)
          .eq('active', true)
          .order('first_name'),

        supabase
          .from('attendance_sessions')
          .select(`
            attendance_records (
              status
            )
          `)
          .eq('class_id', id)
          .not(
            'finalized_at',
            'is',
            null
          ),
      ]);

      if (classResult.error) {
        console.error(
          'Kunne ikke hente klasse:',
          classResult.error
        );

        setLoading(false);
        return;
      }

      if (studentsResult.error) {
        console.error(
          'Kunne ikke hente elever:',
          studentsResult.error
        );
      }

      if (attendanceResult.error) {
        console.error(
          'Kunne ikke hente fremmøde:',
          attendanceResult.error
        );
      }

      const classData =
        classResult.data as SchoolClass;

      const studentData =
        (studentsResult.data ??
          []) as Student[];

      const attendanceSessions =
        attendanceResult.error
          ? []
          : ((attendanceResult.data ??
              []) as AttendanceSession[]);

      let totalRegistrations = 0;
      let totalAttendance = 0;
      let totalAbsence = 0;

      for (
        const session of attendanceSessions
      ) {
        for (
          const record of
          session.attendance_records ?? []
        ) {
          totalRegistrations += 1;

          if (
            record.status === 'present' ||
            record.status === 'late'
          ) {
            totalAttendance += 1;
          }

          if (
            record.status === 'absent'
          ) {
            totalAbsence += 1;
          }
        }
      }

      const attendance =
        totalRegistrations > 0
          ? Math.round(
              (totalAttendance /
                totalRegistrations) *
                100
            )
          : null;

      const absence =
        totalRegistrations > 0
          ? Math.round(
              (totalAbsence /
                totalRegistrations) *
                100
            )
          : null;

      setSchoolClass(classData);
      setStudents(studentData);

      setAttendancePercentage(
        attendance
      );

      setAbsencePercentage(
        absence
      );

      setLoading(false);
    }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass])
  );

  if (loading && !schoolClass) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
      </View>
    );
  }

  if (!schoolClass) {
    return (
      <View style={styles.center}>
        <Text>
          Klassen blev ikke fundet.
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
      showsVerticalScrollIndicator={
        false
      }
    >
      <BackButton />

      {/* HEADER */}

      <View style={styles.headerRow}>
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="book-outline"
                size={14}
                color={COLORS.navy}
              />

              <Text style={styles.subject}>
                {schoolClass.subject ??
                  'Intet fag'}
              </Text>
            </View>

            <Text
              style={
                styles.metaSeparator
              }
            >
              ·
            </Text>

            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.navy}
              />

              <Text style={styles.eyebrow}>
                {schoolClass.school_year ??
                  'Intet skoleår'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>
            {schoolClass.name}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname:
                '/classes/[id]/settings',
              params: { id },
            })
          }
          hitSlop={12}
          style={({ pressed }) => [
            styles.settingsButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={COLORS.navy}
          />
        </Pressable>
      </View>

      {/* OVERBLIK */}

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
            {students.length}
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
            {attendancePercentage !== null
              ? `${attendancePercentage}%`
              : '–'}
          </Text>

          <Text style={styles.statLabel}>
            Fremmøde
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
            {absencePercentage !== null
              ? `${absencePercentage}%`
              : '–'}
          </Text>

          <Text style={styles.statLabel}>
            Fravær
          </Text>
        </View>
      </View>

      {/* PROTOKOL */}

      <Pressable
        onPress={() =>
          router.push({
            pathname:
              '/classes/[id]/attendance',
            params: { id },
          })
        }
        style={({ pressed }) => [
          styles.attendanceButton,

          pressed &&
            styles.attendanceButtonPressed,
        ]}
      >
        <View
          style={
            styles.attendanceButtonContent
          }
        >
          <Ionicons
            name="clipboard-outline"
            size={20}
            color={COLORS.white}
          />

          <Text
            style={
              styles.attendanceButtonText
            }
          >
            Tag dagens protokol
          </Text>
        </View>
      </Pressable>

      {/* ELEVER HEADER */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Elever
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname:
                '/classes/[id]/students/create',
              params: { id },
            })
          }
          style={({ pressed }) => [
            styles.addButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="person-add-outline"
            size={17}
            color={COLORS.navy}
          />

          <Text style={styles.addText}>
            Tilføj elev
          </Text>
        </Pressable>
      </View>

      {/* ELEVER */}

      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Ingen elever endnu
          </Text>

          <Text style={styles.emptyText}>
            Tilføj den første elev til
            klassen.
          </Text>
        </View>
      ) : (
        <View style={styles.studentList}>
          {students.map((student) => {
            const age = getAge(
              student.birth_date
            );

            return (
              <Pressable
                key={student.id}
                onPress={() =>
                  router.push({
                    pathname:
                      '/classes/[id]/students/[studentId]',
                    params: {
                      id,
                      studentId:
                        student.id,
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.studentCard,

                  pressed &&
                    styles.studentCardPressed,
                ]}
              >
                <View style={styles.avatar}>
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
                    style={
                      styles.studentName
                    }
                  >
                    {student.first_name}{' '}
                    {student.last_name}
                  </Text>

                  <View
                    style={
                      styles.studentInfoRow
                    }
                  >
                    <Text
                      style={
                        styles.studentInfo
                      }
                    >
                      {age !== null
                        ? `${age} år`
                        : 'Alder ikke angivet'}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.chevron
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={COLORS.navy}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function getAge(
  birthDate: string | null
) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();

  const birth = new Date(
    `${birthDate}T12:00:00`
  );

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDiff =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() <
        birth.getDate())
  ) {
    age--;
  }

  return age;
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
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.white,
    },

    /* HEADER */

    headerRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      marginBottom: 24,
    },

    header: {
      flex: 1,
      paddingRight: 16,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 5,
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    eyebrow: {
      fontSize: 14,
      color: COLORS.muted,
    },

    subject: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.muted,
    },

    metaSeparator: {
      fontSize: 14,
      color:
        COLORS.lightMuted,
    },

    title: {
      fontSize: 36,
      fontWeight: '700',
      color: COLORS.text,
    },

    settingsButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 2,
    },

    /* OVERBLIK */

    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    statCard: {
      flex: 1,
      minHeight: 116,

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      paddingVertical: 14,
      paddingHorizontal: 10,

      alignItems: 'center',
      justifyContent:
        'center',

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
      width: 34,
      height: 34,
      borderRadius: 11,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 8,
    },

    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.navy,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.muted,
      marginTop: 3,
    },

    /* PROTOKOL */

    attendanceButton: {
      height: 58,
      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 32,

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

    attendanceButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    attendanceButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    attendanceButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '700',
    },

    /* ELEVER */

    sectionHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: COLORS.text,
    },

    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingLeft: 8,
    },

    addText: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.navy,
    },

    studentList: {
      gap: 14,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    studentCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 18,
      padding: 16,

      flexDirection: 'row',
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

    studentCardPressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.99,
        },
      ],
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

    studentName: {
      fontSize: 17,
      fontWeight: '600',
      color: COLORS.text,
    },

    studentInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },

    studentInfo: {
      fontSize: 13,
      color: COLORS.muted,
    },

    chevron: {
      width: 32,
      height: 32,
      borderRadius: 16,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginLeft: 10,
    },

    /* EMPTY STATE */

    emptyState: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 28,

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

    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
    },

    emptyText: {
      color: COLORS.muted,
      marginTop: 6,
      textAlign: 'center',
    },

    pressed: {
      opacity: 0.7,
    },
  });