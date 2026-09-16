import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

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

type Teacher = {
  user_id: string;
  role: 'owner' | 'teacher';

  profiles: {
    full_name: string;
  } | null;
};

type ClassData = {
  id: string;
  name: string;
  school_year: string | null;
  subject: string | null;
  created_by: string;
};

type ClassSettingsCache = {
  classData: ClassData;
  teachers: Teacher[];
  isOwner: boolean;
};

const classSettingsCache =
  new Map<string, ClassSettingsCache>();

export default function ClassSettingsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const cachedData = id
    ? classSettingsCache.get(id)
    : undefined;

  const [classData, setClassData] =
    useState<ClassData | null>(
      cachedData?.classData ?? null
    );

  const [teachers, setTeachers] =
    useState<Teacher[]>(
      cachedData?.teachers ?? []
    );

  const [name, setName] =
    useState(
      cachedData?.classData.name ?? ''
    );

  const [schoolYear, setSchoolYear] =
    useState(
      cachedData?.classData.school_year ??
        ''
    );

  const [subject, setSubject] =
    useState(
      cachedData?.classData.subject ?? ''
    );

  const [isOwner, setIsOwner] =
    useState(
      cachedData?.isOwner ?? false
    );

  const [loading, setLoading] =
    useState(!cachedData);

  const [saving, setSaving] =
    useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const {
      data: currentClass,
      error: classError,
    } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        school_year,
        subject,
        created_by
      `)
      .eq('id', id)
      .single();

    if (classError) {
      console.error(classError);

      if (!classSettingsCache.has(id)) {
        Alert.alert(
          'Fejl',
          'Kunne ikke hente klassen.'
        );
      }

      setLoading(false);
      return;
    }

    const {
      data: members,
      error: membersError,
    } = await supabase
      .from('class_members')
      .select(`
        user_id,
        role,
        profiles (
          full_name
        )
      `)
      .eq('class_id', id);

    if (membersError) {
      console.error(membersError);

      setLoading(false);
      return;
    }

    const currentTeachers =
      (members ?? []) as Teacher[];

    const currentMember =
      currentTeachers.find(
        (member) =>
          member.user_id === user.id
      );

    const currentIsOwner =
      currentMember?.role === 'owner';

    classSettingsCache.set(id, {
      classData:
        currentClass as ClassData,

      teachers:
        currentTeachers,

      isOwner:
        currentIsOwner,
    });

    setClassData(
      currentClass as ClassData
    );

    setName(
      currentClass.name
    );

    setSchoolYear(
      currentClass.school_year ?? ''
    );

    setSubject(
      currentClass.subject ?? ''
    );

    setTeachers(
      currentTeachers
    );

    setIsOwner(
      currentIsOwner
    );

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function saveClass() {
    if (!id || !isOwner) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        'Navn mangler',
        'Klassen skal have et navn.'
      );

      return;
    }

    try {
      setSaving(true);

      const newName =
        name.trim();

      const newSubject =
        subject.trim() || null;

      const newSchoolYear =
        schoolYear.trim() || null;

      const { error } = await supabase
        .from('classes')
        .update({
          name: newName,
          subject: newSubject,
          school_year:
            newSchoolYear,
        })
        .eq('id', id);

      if (error) {
        Alert.alert(
          'Kunne ikke gemme',
          error.message
        );

        return;
      }

      if (classData) {
        const updatedClass: ClassData = {
          ...classData,
          name: newName,
          subject: newSubject,
          school_year:
            newSchoolYear,
        };

        classSettingsCache.set(id, {
          classData:
            updatedClass,
          teachers,
          isOwner,
        });

        setClassData(
          updatedClass
        );
      }

      Alert.alert(
        'Gemt',
        'Klassen er blevet opdateret.'
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteClass() {
    if (!id || !isOwner) {
      return;
    }

    Alert.alert(
      'Slet klasse',
      `Er du sikker på, at du vil slette ${
        classData?.name ?? 'klassen'
      }?\n\nElever, protokoller og historik for klassen bliver permanent slettet.`,
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Slet klasse',
          style: 'destructive',

          onPress: async () => {
            const { error } =
              await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) {
              Alert.alert(
                'Kunne ikke slette klassen',
                error.message
              );

              return;
            }

            classSettingsCache.delete(id);

            router.replace('/(tabs)');
          },
        },
      ]
    );
  }

  function removeTeacher(
    userId: string,
    teacherName: string
  ) {
    if (!id || !isOwner) {
      return;
    }

    Alert.alert(
      'Fjern lærer',
      `Vil du fjerne ${teacherName} fra klassen?`,
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Fjern',
          style: 'destructive',

          onPress: async () => {
            const { error } =
              await supabase
                .from('class_members')
                .delete()
                .eq('class_id', id)
                .eq(
                  'user_id',
                  userId
                )
                .eq(
                  'role',
                  'teacher'
                );

            if (error) {
              Alert.alert(
                'Kunne ikke fjerne lærer',
                error.message
              );

              return;
            }

            const newTeachers =
              teachers.filter(
                (teacher) =>
                  teacher.user_id !==
                  userId
              );

            setTeachers(
              newTeachers
            );

            if (classData) {
              classSettingsCache.set(
                id,
                {
                  classData,
                  teachers:
                    newTeachers,
                  isOwner,
                }
              );
            }
          },
        },
      ]
    );
  }

  if (loading && !classData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
      </View>
    );
  }

  if (!classData) {
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
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* TOPPEN */}

      <Pressable
        onPress={() =>
          router.back()
        }
        hitSlop={12}
        style={styles.backButton}
      >
        <Text
          style={styles.backText}
        >
          ‹
        </Text>
      </Pressable>

      <Text style={styles.eyebrow}>
        Klasse
      </Text>

      <Text style={styles.title}>
        Indstillinger
      </Text>

      {/* KLASSEOPLYSNINGER */}

      <View style={styles.section}>
        <Text
          style={
            styles.sectionTitle
          }
        >
          Klasseoplysninger
        </Text>

        {/* KLASSENAVN */}

        <View style={styles.labelRow}>
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="school-outline"
              size={15}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.label}>
            Klassenavn
          </Text>
        </View>

        <View
          style={[
            styles.inputContainer,

            !isOwner &&
              styles.disabledInput,
          ]}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            editable={isOwner}
            placeholder="Klassenavn"
            placeholderTextColor={
              COLORS.lightMuted
            }
            style={styles.input}
          />
        </View>

        {/* FAG */}

        <View style={styles.labelRow}>
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="book-outline"
              size={15}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.label}>
            Fag
          </Text>
        </View>

        <View
          style={[
            styles.inputContainer,

            !isOwner &&
              styles.disabledInput,
          ]}
        >
          <TextInput
            value={subject}
            onChangeText={setSubject}
            editable={isOwner}
            placeholder="Fx Matematik"
            placeholderTextColor={
              COLORS.lightMuted
            }
            autoCapitalize="words"
            style={styles.input}
          />
        </View>

        {/* SKOLEÅR */}

        <View style={styles.labelRow}>
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.label}>
            Skoleår
          </Text>
        </View>

        <View
          style={[
            styles.inputContainer,

            !isOwner &&
              styles.disabledInput,
          ]}
        >
          <TextInput
            value={schoolYear}
            onChangeText={
              setSchoolYear
            }
            editable={isOwner}
            placeholder="Fx 2026/2027"
            placeholderTextColor={
              COLORS.lightMuted
            }
            style={styles.input}
          />
        </View>

        {/* GEM */}

        {isOwner ? (
          <Pressable
            onPress={saveClass}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,

              pressed &&
                styles.saveButtonPressed,

              saving &&
                styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.white
                }
              />
            ) : (
              <View
                style={
                  styles.buttonContent
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={
                    COLORS.white
                  }
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Gem ændringer
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.helperRow}>
            <Ionicons
              name="lock-closed-outline"
              size={15}
              color={COLORS.navy}
            />

            <Text style={styles.helper}>
              Kun klassens ejer kan
              redigere klasseoplysninger.
            </Text>
          </View>
        )}
      </View>

      {/* LÆRERE */}

      <View
        style={
          styles.teacherHeader
        }
      >
        <View>
          <Text
            style={
              styles.sectionTitle
            }
          >
            Lærere
          </Text>

          <Text
            style={
              styles.teacherCount
            }
          >
            {teachers.length}{' '}
            {teachers.length === 1
              ? 'lærer'
              : 'lærere'}
          </Text>
        </View>

        {isOwner && (
          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  '/classes/[id]/invite',
                params: { id },
              })
            }
          >
            <Text
              style={
                styles.inviteText
              }
            >
              + Inviter
            </Text>
          </Pressable>
        )}
      </View>

      <View
        style={
          styles.teacherList
        }
      >
        {teachers.map(
          (teacher) => (
            <View
              key={
                teacher.user_id
              }
              style={
                styles.teacherCard
              }
            >
              <View
                style={
                  styles.teacherAvatar
                }
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#374151"
                />
              </View>

              <View
                style={
                  styles.teacherInfo
                }
              >
                <Text
                  style={
                    styles.teacherName
                  }
                >
                  {teacher.profiles
                    ?.full_name ??
                    'Ukendt lærer'}
                </Text>

                <Text
                  style={
                    styles.teacherRole
                  }
                >
                  {teacher.role ===
                  'owner'
                    ? 'Ejer'
                    : 'Lærer'}
                </Text>
              </View>

              {teacher.role ===
              'owner' ? (
                <View
                  style={
                    styles.ownerBadge
                  }
                >
                  <Text
                    style={
                      styles.ownerBadgeText
                    }
                  >
                    Ejer
                  </Text>
                </View>
              ) : (
                isOwner && (
                  <Pressable
                    onPress={() =>
                      removeTeacher(
                        teacher.user_id,
                        teacher.profiles
                          ?.full_name ??
                          'læreren'
                      )
                    }
                    hitSlop={10}
                  >
                    <Text
                      style={
                        styles.removeTeacherText
                      }
                    >
                      Fjern
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          )
        )}
      </View>

      {/* SLET KLASSE */}

      {isOwner && (
        <View
          style={
            styles.dangerZone
          }
        >
          <View
            style={
              styles.dangerTitleRow
            }
          >
            <View
              style={
                styles.dangerIcon
              }
            >
              <Ionicons
                name="warning-outline"
                size={20}
                color="#991B1B"
              />
            </View>

            <Text
              style={
                styles.dangerTitle
              }
            >
              Slet klasse
            </Text>
          </View>

          <Text
            style={
              styles.dangerText
            }
          >
            Klassen, eleverne og al
            protokolhistorik bliver
            permanent slettet.
          </Text>

          <Pressable
            onPress={
              deleteClass
            }
            style={({
              pressed,
            }) => [
              styles.deleteClassButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={
                styles.buttonContent
              }
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.deleteClassButtonText
                }
              >
                Slet klasse
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </ScrollView>
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
      paddingTop: 60,
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

    /* TOP */

    backButton: {
      alignSelf:
        'flex-start',
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginBottom: 14,
    },

    backText: {
      fontSize: 34,
      lineHeight: 34,
      color: COLORS.text,
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
      marginBottom: 30,
    },

    /* KLASSEOPLYSNINGER */

    section: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 20,
      marginBottom: 30,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.text,
    },

    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 20,
      marginBottom: 8,
    },

    labelIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    label: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.navy,
    },

    inputContainer: {
      height: 52,

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      paddingHorizontal: 14,

      flexDirection: 'row',
      alignItems: 'center',

      borderWidth: 1,
      borderColor:
        '#E5E7EB',
    },

    input: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: COLORS.text,
    },

    disabledInput: {
      backgroundColor:
        '#F9FAFB',

      opacity: 0.65,
    },

    saveButton: {
      height: 54,

      borderRadius: 15,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 24,

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

    saveButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    saveButtonText: {
      color: COLORS.white,
      fontSize: 15,
      fontWeight: '700',
    },

    helperRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 18,
    },

    helper: {
      color: COLORS.muted,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },

    /* LÆRERE */

    teacherHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },

    teacherCount: {
      color: COLORS.muted,
      marginTop: 3,
    },

    inviteText: {
      color: COLORS.navy,
      fontWeight: '700',
    },

    teacherList: {
      gap: 14,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    teacherCard: {
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

    teacherAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,

      backgroundColor:
        '#F3F4F6',

      alignItems: 'center',
      justifyContent:
        'center',
    },

    teacherInfo: {
      flex: 1,
      marginLeft: 13,
    },

    teacherName: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.text,
    },

    teacherRole: {
      fontSize: 13,
      color: COLORS.muted,
      marginTop: 2,
    },

    ownerBadge: {
      backgroundColor:
        COLORS.navySoft,

      paddingHorizontal: 10,
      paddingVertical: 5,

      borderRadius: 20,
    },

    ownerBadgeText: {
      color: COLORS.navy,
      fontSize: 12,
      fontWeight: '700',
    },

    removeTeacherText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#DC2626',
    },

    /* DANGER */

    dangerZone: {
      marginTop: 40,

      backgroundColor:
        '#FEF2F2',

      borderRadius: 20,
      padding: 20,

      borderWidth: 1,
      borderColor:
        '#FEE2E2',

      shadowColor: '#991B1B',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    dangerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    dangerIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,

      backgroundColor:
        '#FEE2E2',

      alignItems: 'center',
      justifyContent:
        'center',
    },

    dangerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#991B1B',
    },

    dangerText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#7F1D1D',
      marginTop: 12,
      marginBottom: 18,
    },

    deleteClassButton: {
      height: 52,

      borderRadius: 14,

      backgroundColor:
        '#DC2626',

      alignItems: 'center',
      justifyContent:
        'center',
    },

    deleteClassButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.65,
    },

    disabled: {
      opacity: 0.5,
    },
  });