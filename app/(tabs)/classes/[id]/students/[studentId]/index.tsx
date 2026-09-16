import { useCallback, useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
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

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

type Guardian = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type GuardianLink = {
  relationship: string | null;
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

const studentCache =
  new Map<string, Student>();

export default function StudentScreen() {
  const { id, studentId } =
    useLocalSearchParams<{
      id: string;
      studentId: string;
    }>();

  const cachedStudent = studentId
    ? studentCache.get(studentId)
    : undefined;

  const [student, setStudent] =
    useState<Student | null>(
      cachedStudent ?? null
    );

  const [loading, setLoading] =
    useState(!cachedStudent);

  const loadStudent =
    useCallback(async () => {
      if (!id || !studentId) {
        return;
      }

      const { data, error } =
        await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            birth_date,
            phone,

            student_guardians (
              relationship,

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

        if (
          !studentCache.has(
            studentId
          )
        ) {
          Alert.alert(
            'Fejl',
            'Kunne ikke hente eleven.'
          );
        }

        setLoading(false);
        return;
      }

      const newStudent =
        data as Student;

      studentCache.set(
        studentId,
        newStudent
      );

      setStudent(newStudent);
      setLoading(false);
    }, [id, studentId]);

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [loadStudent])
  );

  async function callPhone(
    phone: string
  ) {
    const cleanedPhone =
      phone.replace(
        /[^\d+]/g,
        ''
      );

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

  async function sendEmail(
    email: string
  ) {
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

  async function openWhatsApp(
    phone: string
  ) {
    let number =
      phone.replace(/\D/g, '');

    if (number.length === 8) {
      number = `45${number}`;
    }

    if (
      number.startsWith('00')
    ) {
      number =
        number.substring(2);
    }

    try {
      await Linking.openURL(
        `https://wa.me/${number}`
      );
    } catch {
      Alert.alert(
        'Kunne ikke åbne WhatsApp',
        'WhatsApp kunne ikke åbnes.'
      );
    }
  }

  if (loading && !student) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>
          Eleven blev ikke fundet.
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

      {/* ELEV HEADER */}

      <View
        style={
          styles.studentHeader
        }
      >
        <View
          style={
            styles.studentHeaderText
          }
        >
          <Text
            style={styles.eyebrow}
          >
            Elev
          </Text>

          <Text style={styles.title}>
            {student.first_name}{' '}
            {student.last_name}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname:
                '/classes/[id]/students/[studentId]/edit',
              params: {
                id,
                studentId,
              },
            })
          }
          style={({ pressed }) => [
            styles.editStudentButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="create-outline"
            size={17}
            color={COLORS.navy}
          />

          <Text
            style={
              styles.editStudentText
            }
          >
            Rediger
          </Text>
        </Pressable>
      </View>

      {/* ELEV OPLYSNINGER */}

      <View style={styles.infoCard}>
        <InfoRow
          icon="calendar-outline"
          label="Fødselsdato"
          value={
            student.birth_date
              ? formatDate(
                  student.birth_date
                )
              : 'Ikke angivet'
          }
        />

        <InfoRow
          icon="call-outline"
          label="Telefon"
          value={
            student.phone ??
            'Ikke angivet'
          }
          last
        />
      </View>

      {/* FORÆLDRE / VÆRGER */}

      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
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

          <Text
            style={styles.addText}
          >
            Tilføj
          </Text>
        </Pressable>
      </View>

      {student.student_guardians
        .length === 0 ? (
        <View style={styles.empty}>
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="people-outline"
              size={26}
              color={COLORS.navy}
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen forældre tilføjet
          </Text>

          <Text style={styles.muted}>
            Tilføj kontaktoplysninger
            på elevens forældre eller
            værger.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.guardianList
          }
        >
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
                  style={
                    styles.guardianCard
                  }
                >
                  {/* VÆRGE HEADER */}

                  <View
                    style={
                      styles.guardianHeader
                    }
                  >
                    <View
                      style={
                        styles.guardianIdentity
                      }
                    >
                      <View
                        style={
                          styles.guardianAvatar
                        }
                      >
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color={COLORS.navy}
                        />
                      </View>

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
                          {
                            guardian.full_name
                          }
                        </Text>

                        <Text
                          style={
                            styles.relationship
                          }
                        >
                          {link.relationship ??
                            'Værge'}
                        </Text>
                      </View>
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
                      style={({
                        pressed,
                      }) => [
                        styles.editGuardianButton,
                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={COLORS.navy}
                      />

                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Rediger
                      </Text>
                    </Pressable>
                  </View>

                  {/* KONTAKTINFO */}

                  {(guardian.phone ||
                    guardian.email) && (
                    <View
                      style={
                        styles.contactSection
                      }
                    >
                      {guardian.phone && (
                        <View
                          style={
                            styles.contactRow
                          }
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color={COLORS.navy}
                          />

                          <Text
                            style={
                              styles.contactText
                            }
                          >
                            {
                              guardian.phone
                            }
                          </Text>
                        </View>
                      )}

                      {guardian.email && (
                        <View
                          style={
                            styles.contactRow
                          }
                        >
                          <Ionicons
                            name="mail-outline"
                            size={16}
                            color={COLORS.navy}
                          />

                          <Text
                            style={
                              styles.contactText
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              guardian.email
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* HANDLINGER */}

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
                        style={({
                          pressed,
                        }) => [
                          styles.primaryButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name="call-outline"
                          size={17}
                          color={COLORS.white}
                        />

                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Ring
                        </Text>
                      </Pressable>
                    )}

                    {guardian.phone && (
                      <Pressable
                        onPress={() =>
                          openWhatsApp(
                            guardian.phone!
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.whatsappButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name="logo-whatsapp"
                          size={18}
                          color={COLORS.white}
                        />

                        <Text
                          style={
                            styles.whatsappButtonText
                          }
                        >
                          WhatsApp
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
                        style={({
                          pressed,
                        }) => [
                          styles.secondaryButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={17}
                          color={COLORS.navy}
                        />

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

type InfoRowProps = {
  icon:
    | 'calendar-outline'
    | 'call-outline';

  label: string;
  value: string;
  last?: boolean;
};

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,

        last &&
          styles.infoRowLast,
      ]}
    >
      <View
        style={
          styles.infoIcon
        }
      >
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.navy}
        />
      </View>

      <View
        style={
          styles.infoContent
        }
      >
        <Text
          style={
            styles.infoLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.infoValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function formatDate(
  date: string
) {
  const [
    year,
    month,
    day,
  ] = date.split('-');

  if (
    !year ||
    !month ||
    !day
  ) {
    return date;
  }

  return `${day}-${month}-${year}`;
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

    eyebrow: {
      fontSize: 14,
      color: COLORS.muted,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 4,
    },

    /* HEADER */

    studentHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },

    studentHeaderText: {
      flex: 1,
      paddingRight: 12,
    },

    editStudentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
      paddingVertical: 5,
    },

    editStudentText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.navy,
    },

    /* INFO */

    infoCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      paddingHorizontal: 20,
      marginBottom: 32,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    infoRow: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',

      borderBottomWidth: 1,
      borderBottomColor:
        '#F3F4F6',
    },

    infoRowLast: {
      borderBottomWidth: 0,
    },

    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 12,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 12,
      color:
        COLORS.lightMuted,
    },

    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
      marginTop: 3,
    },

    /* SECTION */

    sectionHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 21,
      fontWeight: '700',
      color: COLORS.text,
    },

    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
    },

    addText: {
      color: COLORS.navy,
      fontWeight: '700',
    },

    /* GUARDIANS */

    guardianList: {
      gap: 16,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    guardianCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 20,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    guardianHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-start',
    },

    guardianIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
    },

    guardianAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 12,
    },

    guardianHeaderText: {
      flex: 1,
    },

    guardianName: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
    },

    relationship: {
      fontSize: 13,
      color: COLORS.muted,
      marginTop: 3,
    },

    editGuardianButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },

    editText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.navy,
    },

    /* CONTACT */

    contactSection: {
      gap: 9,
      marginTop: 18,
      paddingTop: 16,

      borderTopWidth: 1,
      borderTopColor:
        '#F3F4F6',
    },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    contactText: {
      flex: 1,
      fontSize: 14,
      color: '#374151',
    },

    /* ACTIONS */

    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 18,
    },

    primaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 14,

      backgroundColor:
        COLORS.navy,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 6,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.11,
      shadowRadius: 9,

      elevation: 2,
    },

    primaryButtonText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: 13,
    },

    whatsappButton: {
      flex: 1,
      height: 48,
      borderRadius: 14,

      backgroundColor:
        '#25D366',

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 5,
    },

    whatsappButtonText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: 12,
    },

    secondaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 14,

      backgroundColor:
        COLORS.navySoft,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 6,
    },

    secondaryButtonText: {
      color: COLORS.navy,
      fontWeight: '700',
      fontSize: 13,
    },

    buttonPressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    pressed: {
      opacity: 0.7,
    },

    /* EMPTY */

    empty: {
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
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.text,
    },

    muted: {
      color: COLORS.muted,
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 20,
    },
  });