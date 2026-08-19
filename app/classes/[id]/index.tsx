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
  useLocalSearchParams,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

type SchoolClass = {
  id: string;
  name: string;
  school_year: string | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
};

export default function ClassScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [schoolClass, setSchoolClass] =
    useState<SchoolClass | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadClass = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);

    const {
      data: classData,
      error: classError,
    } = await supabase
      .from('classes')
      .select('id, name, school_year')
      .eq('id', id)
      .single();

    if (classError) {
      console.error(
        'Kunne ikke hente klasse:',
        classError
      );

      setLoading(false);
      return;
    }

    const {
      data: studentData,
      error: studentError,
    } = await supabase
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
      .order('first_name');

    if (studentError) {
      console.error(
        'Kunne ikke hente elever:',
        studentError
      );
    }

    setSchoolClass(classData);
    setStudents(studentData ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass])
  );

  /*
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Henter klasse...</Text>
      </View>
    );
  }
  */

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
      contentContainerStyle={styles.content}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {schoolClass.school_year ??
            'Intet skoleår'}
        </Text>

        <Text style={styles.title}>
          {schoolClass.name}
        </Text>

        <Text style={styles.subtitle}>
          {students.length}{' '}
          {students.length === 1
            ? 'elev'
            : 'elever'}
        </Text>
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
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={
            styles.attendanceButtonText
          }
        >
          Tag dagens protokol
        </Text>
      </Pressable>

      {/* INVITER LÆRER */}
      <Pressable
        onPress={() =>
          router.push({
            pathname:
              '/classes/[id]/invite',
            params: { id },
          })
        }
        style={({ pressed }) => [
          styles.inviteButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.inviteButtonText}>
          + Inviter lærer
        </Text>
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
        >
          <Text style={styles.addText}>
            + Tilføj elev
          </Text>
        </Pressable>
      </View>

      {/* ELEVER */}
      {students.length === 0 ? (
        <View style={styles.emptyState}>
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
                  <Text style={styles.avatarText}>
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
                    style={styles.studentName}
                  >
                    {student.first_name}{' '}
                    {student.last_name}
                  </Text>

                  <Text
                    style={styles.studentInfo}
                  >
                    {age !== null
                      ? `${age} år`
                      : 'Alder ikke angivet'}
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
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

  header: {
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 6,
  },

  attendanceButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  attendanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  inviteButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  inviteButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  addText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },

  studentList: {
    gap: 12,
  },

  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  studentCardPressed: {
    opacity: 0.65,
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

  studentContent: {
    flex: 1,
  },

  studentName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },

  studentInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 3,
  },

  arrow: {
    fontSize: 30,
    color: '#9CA3AF',
    marginLeft: 10,
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
    color: '#6B7280',
    marginTop: 6,
  },

  pressed: {
    opacity: 0.7,
  },
});