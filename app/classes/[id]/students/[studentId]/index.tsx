import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
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

type Guardian = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type GuardianLink = {
  relationship: string | null;
  is_primary: boolean;
  guardians: Guardian | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
  student_guardians: GuardianLink[];
};

export default function StudentScreen() {
  const { id, studentId } =
    useLocalSearchParams<{
      id: string;
      studentId: string;
    }>();

  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadStudent = useCallback(async () => {
    if (!id || !studentId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        birth_date,
        phone,

        student_guardians (
          relationship,
          is_primary,

          guardians (
            id,
            full_name,
            phone,
            email
          )
        )
      `)
      .eq('id', studentId)
      .eq('class_id', id)
      .single();

    if (error) {
      console.error(error);

      Alert.alert(
        'Fejl',
        'Kunne ikke hente eleven.'
      );
    } else {
      setStudent(data as Student);
    }

    setLoading(false);
  }, [id, studentId]);

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [loadStudent])
  );

  async function callPhone(phone: string) {
    const cleanedPhone =
      phone.replace(/[^\d+]/g, '');

    try {
      await Linking.openURL(
        `tel:${cleanedPhone}`
      );
    } catch {
      Alert.alert(
        'Kunne ikke ringe',
        'Telefonappen kunne ikke åbnes.'
      );
    }
  }

  async function sendEmail(email: string) {
    try {
      await Linking.openURL(
        `mailto:${email}`
      );
    } catch {
      Alert.alert(
        'Kunne ikke åbne mail',
        'Mailappen kunne ikke åbnes.'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Henter elev...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>Eleven blev ikke fundet.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        Elev
      </Text>

      <Text style={styles.title}>
        {student.first_name}{' '}
        {student.last_name}
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          label="Fødselsdato"
          value={
            student.birth_date
              ? formatDate(student.birth_date)
              : 'Ikke angivet'
          }
        />

        <InfoRow
          label="Telefon"
          value={
            student.phone ??
            'Ikke angivet'
          }
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Forældre & værger
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname:
                '/classes/[id]/students/[studentId]/guardians/create',
              params: {
                id,
                studentId,
              },
            })
          }
        >
          <Text style={styles.addText}>
            + Tilføj
          </Text>
        </Pressable>
      </View>

      {student.student_guardians.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Ingen forældre tilføjet
          </Text>

          <Text style={styles.muted}>
            Tilføj kontaktoplysninger på
            elevens forældre eller værger.
          </Text>
        </View>
      ) : (
        <View style={styles.guardianList}>
          {student.student_guardians.map(
            (link) => {
              const guardian =
                link.guardians;

              if (!guardian) {
                return null;
              }

              return (
                <View
                  key={guardian.id}
                  style={styles.guardianCard}
                >
                  <View
                    style={
                      styles.guardianHeader
                    }
                  >
                    <View
                      style={
                        styles.guardianHeaderText
                      }
                    >
                      <Text
                        style={
                          styles.guardianName
                        }
                      >
                        {guardian.full_name}
                      </Text>

                      <Text
                        style={
                          styles.relationship
                        }
                      >
                        {link.relationship ??
                          'Værge'}

                        {link.is_primary
                          ? ' · Primær kontakt'
                          : ''}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname:
                            '/classes/[id]/students/[studentId]/guardians/[guardianId]/edit',
                          params: {
                            id,
                            studentId,
                            guardianId:
                              guardian.id,
                          },
                        })
                      }
                    >
                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Rediger
                      </Text>
                    </Pressable>
                  </View>

                  {guardian.phone && (
                    <Text
                      style={
                        styles.contactText
                      }
                    >
                      {guardian.phone}
                    </Text>
                  )}

                  {guardian.email && (
                    <Text
                      style={
                        styles.contactText
                      }
                    >
                      {guardian.email}
                    </Text>
                  )}

                  <View
                    style={
                      styles.actionRow
                    }
                  >
                    {guardian.phone && (
                      <Pressable
                        onPress={() =>
                          callPhone(
                            guardian.phone!
                          )
                        }
                        style={
                          styles.primaryButton
                        }
                      >
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Ring
                        </Text>
                      </Pressable>
                    )}

                    {guardian.email && (
                      <Pressable
                        onPress={() =>
                          sendEmail(
                            guardian.email!
                          )
                        }
                        style={
                          styles.secondaryButton
                        }
                      >
                        <Text
                          style={
                            styles.secondaryButtonText
                          }
                        >
                          Mail
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }
          )}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(date: string) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString('da-DK');
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

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 24,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
  },

  infoRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827',
  },

  addText: {
    color: '#111827',
    fontWeight: '700',
  },

  guardianList: {
    gap: 14,
  },

  guardianCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  guardianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  guardianHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },

  guardianName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },

  relationship: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  contactText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 10,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  muted: {
    color: '#6B7280',
    marginTop: 6,
  },
});