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

type StudentCopyData = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
  active: boolean;
};

type GuardianLink = {
  student_id: string;
  guardian_id: string;
  relationship: string | null;
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

  const [
    creatingNewYear,
    setCreatingNewYear,
  ] = useState(false);

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

  function handleCreateNextYear() {
    if (
      !id ||
      !isOwner ||
      !classData
    ) {
      return;
    }

    const nextSchoolYear =
      getNextSchoolYear(
        classData.school_year
      );

    if (!nextSchoolYear) {
      Alert.alert(
        'Skoleår mangler',
        'Klassen skal have et gyldigt skoleår, fx 2026/2027, før den kan oprettes til det nye år.'
      );

      return;
    }

    Alert.alert(
      'Opret klasse til nyt skoleår',
      `${classData.name} oprettes til ${nextSchoolYear}.\n\nAktive elever og deres forældrekontakter bliver kopieret.\n\nProtokoller og fraværshistorik bliver ikke kopieret.`,
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Opret klasse',

          onPress: () => {
            void createClassForNextYear(
              nextSchoolYear
            );
          },
        },
      ]
    );
  }

  async function createClassForNextYear(
    nextSchoolYear: string
  ) {
    if (
      !id ||
      !isOwner ||
      !classData
    ) {
      return;
    }

    let newClassId: string | null =
      null;

    try {
      setCreatingNewYear(true);

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

      /*
       * 1. OPRET NY KLASSE
       */

      const {
        data: newClass,
        error: createClassError,
      } = await supabase
        .from('classes')
        .insert({
          name:
            classData.name,

          school_year:
            nextSchoolYear,

          subject:
            classData.subject,

          created_by:
            user.id,
        })
        .select(`
          id,
          name,
          school_year,
          subject,
          created_by
        `)
        .single();

      if (
        createClassError ||
        !newClass
      ) {
        throw (
          createClassError ??
          new Error(
            'Den nye klasse kunne ikke oprettes.'
          )
        );
      }

      newClassId =
        newClass.id;

      /*
       * 2. SØRG FOR AT BRUGEREN
       * ER EJER AF DEN NYE KLASSE
       */

      const {
        data: existingOwner,
        error: ownerCheckError,
      } = await supabase
        .from('class_members')
        .select('user_id')
        .eq(
          'class_id',
          newClassId
        )
        .eq(
          'user_id',
          user.id
        )
        .maybeSingle();

      if (ownerCheckError) {
        throw ownerCheckError;
      }

      if (!existingOwner) {
        const {
          error: ownerInsertError,
        } = await supabase
          .from('class_members')
          .insert({
            class_id:
              newClassId,

            user_id:
              user.id,

            role:
              'owner',
          });

        if (ownerInsertError) {
          throw ownerInsertError;
        }
      }

      /*
       * 3. HENT AKTIVE ELEVER
       */

      const {
        data: students,
        error: studentsError,
      } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          birth_date,
          phone,
          active
        `)
        .eq(
          'class_id',
          id
        )
        .eq(
          'active',
          true
        );

      if (studentsError) {
        throw studentsError;
      }

      const activeStudents =
        (students ??
          []) as StudentCopyData[];

      /*
       * 4. HENT FORÆLDRERELATIONER
       */

      let guardianLinks:
        GuardianLink[] = [];

      const oldStudentIds =
        activeStudents.map(
          (student) =>
            student.id
        );

      if (
        oldStudentIds.length >
        0
      ) {
        const {
          data: links,
          error: linksError,
        } = await supabase
          .from(
            'student_guardians'
          )
          .select(`
            student_id,
            guardian_id,
            relationship
          `)
          .in(
            'student_id',
            oldStudentIds
          );

        if (linksError) {
          throw linksError;
        }

        guardianLinks =
          (links ??
            []) as GuardianLink[];
      }

      /*
       * 5. KOPIÉR ELEVER
       */

      const studentIdMap =
        new Map<
          string,
          string
        >();

      for (
        const student of
          activeStudents
      ) {
        const {
          data: newStudent,
          error:
            studentInsertError,
        } = await supabase
          .from('students')
          .insert({
            class_id:
              newClassId,

            first_name:
              student.first_name,

            last_name:
              student.last_name,

            birth_date:
              student.birth_date,

            phone:
              student.phone,

            active:
              true,

            created_by:
              user.id,
          })
          .select('id')
          .single();

        if (
          studentInsertError ||
          !newStudent
        ) {
          throw (
            studentInsertError ??
            new Error(
              'En elev kunne ikke kopieres.'
            )
          );
        }

        studentIdMap.set(
          student.id,
          newStudent.id
        );
      }

      /*
       * 6. KOPIÉR FORÆLDRERELATIONER
       *
       * Eksisterende guardians
       * genbruges.
       */

      const newGuardianLinks =
        guardianLinks.flatMap(
          (link) => {
            const newStudentId =
              studentIdMap.get(
                link.student_id
              );

            if (!newStudentId) {
              return [];
            }

            return [
              {
                student_id:
                  newStudentId,

                guardian_id:
                  link.guardian_id,

                relationship:
                  link.relationship,
              },
            ];
          }
        );

      if (
        newGuardianLinks.length >
        0
      ) {
        const {
          error:
            guardianInsertError,
        } = await supabase
          .from(
            'student_guardians'
          )
          .insert(
            newGuardianLinks
          );

        if (
          guardianInsertError
        ) {
          throw guardianInsertError;
        }
      }

      /*
       * 7. FÆRDIG
       */

      Alert.alert(
        'Klasse oprettet',
        `${classData.name} er oprettet til ${nextSchoolYear} med ${activeStudents.length} ${
          activeStudents.length ===
          1
            ? 'elev'
            : 'elever'
        }.`,
        [
          {
            text:
              'Åbn klasse',

            onPress: () => {
              router.replace({
                pathname:
                  '/(tabs)/classes/[id]',

                params: {
                  id:
                    newClassId!,
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Kunne ikke oprette klasse til nyt skoleår:',
        error
      );

      if (newClassId) {
        const {
          error: cleanupError,
        } = await supabase
          .from('classes')
          .delete()
          .eq(
            'id',
            newClassId
          );

        if (cleanupError) {
          console.error(
            'Kunne ikke rydde den halvfærdige klasse op:',
            cleanupError
          );
        }
      }

      Alert.alert(
        'Kunne ikke oprette klassen',
        error instanceof Error
          ? error.message
          : 'Der opstod en fejl under kopieringen.'
      );
    } finally {
      setCreatingNewYear(false);
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
                .eq(
                  'class_id',
                  id
                )
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
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="small"
          color={
            COLORS.navy
          }
        />
      </View>
    );
  }

  if (!classData) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text>
          Klassen blev ikke fundet.
        </Text>
      </View>
    );
  }

  const nextSchoolYear =
    getNextSchoolYear(
      classData.school_year
    );

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* TOPPEN */}

      <Pressable
        onPress={() =>
          router.back()
        }
        hitSlop={12}
        style={
          styles.backButton
        }
      >
        <Text
          style={
            styles.backText
          }
        >
          ‹
        </Text>
      </Pressable>

      <Text
        style={
          styles.eyebrow
        }
      >
        Klasse
      </Text>

      <Text
        style={
          styles.title
        }
      >
        Indstillinger
      </Text>

      {/* KLASSEOPLYSNINGER */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Klasseoplysninger
        </Text>

        {/* KLASSENAVN */}

        <View
          style={
            styles.labelRow
          }
        >
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="school-outline"
              size={15}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.label
            }
          >
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
            value={
              name
            }
            onChangeText={
              setName
            }
            editable={
              isOwner
            }
            placeholder="Klassenavn"
            placeholderTextColor={
              COLORS.lightMuted
            }
            style={
              styles.input
            }
          />
        </View>

        {/* FAG */}

        <View
          style={
            styles.labelRow
          }
        >
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="book-outline"
              size={15}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.label
            }
          >
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
            value={
              subject
            }
            onChangeText={
              setSubject
            }
            editable={
              isOwner
            }
            placeholder="Fx Matematik"
            placeholderTextColor={
              COLORS.lightMuted
            }
            autoCapitalize="words"
            style={
              styles.input
            }
          />
        </View>

        {/* SKOLEÅR */}

        <View
          style={
            styles.labelRow
          }
        >
          <View
            style={
              styles.labelIcon
            }
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.label
            }
          >
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
            value={
              schoolYear
            }
            onChangeText={
              setSchoolYear
            }
            editable={
              isOwner
            }
            placeholder="Fx 2026/2027"
            placeholderTextColor={
              COLORS.lightMuted
            }
            style={
              styles.input
            }
          />
        </View>

        {/* GEM */}

        {isOwner ? (
          <Pressable
            onPress={
              saveClass
            }
            disabled={
              saving ||
              creatingNewYear
            }
            style={({
              pressed,
            }) => [
              styles.saveButton,

              pressed &&
                styles.saveButtonPressed,

              (saving ||
                creatingNewYear) &&
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
          <View
            style={
              styles.helperRow
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={15}
              color={
                COLORS.navy
              }
            />

            <Text
              style={
                styles.helper
              }
            >
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

                params: {
                  id,
                },
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

      {/* STREG UNDER LÆRERE */}

      {isOwner && (
        <View
          style={
            styles.sectionDivider
          }
        />
      )}

      {/* NYT SKOLEÅR */}

      {isOwner && (
        <View
          style={
            styles.newYearSection
          }
        >
          <View
            style={
              styles.newYearHeader
            }
          >
            <View
              style={
                styles.newYearIcon
              }
            >
              <Ionicons
                name="copy-outline"
                size={21}
                color={
                  COLORS.navy
                }
              />
            </View>

            <View
              style={
                styles.newYearHeaderText
              }
            >
              <Text
                style={
                  styles.newYearTitle
                }
              >
                Nyt skoleår
              </Text>

              <Text
                style={
                  styles.newYearText
                }
              >
                Opret en ny version af
                klassen med de samme
                aktive elever og deres
                forældrekontakter.
              </Text>
            </View>
          </View>

          {nextSchoolYear ? (
            <View
              style={
                styles.nextYearBox
              }
            >
              <View
                style={
                  styles.nextYearInfo
                }
              >
                <Text
                  style={
                    styles.nextYearLabel
                  }
                >
                  Nyt skoleår
                </Text>

                <Text
                  style={
                    styles.nextYearValue
                  }
                >
                  {nextSchoolYear}
                </Text>
              </View>

              <Ionicons
                name="arrow-forward-outline"
                size={19}
                color={
                  COLORS.navy
                }
              />
            </View>
          ) : (
            <View
              style={
                styles.yearWarning
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={
                  COLORS.muted
                }
              />

              <Text
                style={
                  styles.yearWarningText
                }
              >
                Angiv først et skoleår
                som fx 2026/2027.
              </Text>
            </View>
          )}

          <View
            style={
              styles.newYearDetails
            }
          >
            <NewYearDetail
              icon="people-outline"
              text="Aktive elever kopieres"
            />

            <NewYearDetail
              icon="heart-outline"
              text="Forældre og relationer følger med"
            />

            <NewYearDetail
              icon="time-outline"
              text="Protokoller og historik starter fra nul"
            />
          </View>

          <Pressable
            onPress={
              handleCreateNextYear
            }
            disabled={
              creatingNewYear ||
              saving
            }
            style={({
              pressed,
            }) => [
              styles.newYearButton,

              pressed &&
                !creatingNewYear &&
                !saving &&
                styles.newYearButtonPressed,

              (creatingNewYear ||
                saving) &&
                styles.disabled,
            ]}
          >
            {creatingNewYear ? (
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
                  name="add-circle-outline"
                  size={20}
                  color={
                    COLORS.white
                  }
                />

                <Text
                  style={
                    styles.newYearButtonText
                  }
                >
                  Opret klassen til det
                  nye år
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* STREG MELLEM NYT SKOLEÅR OG SLET */}

      {isOwner && (
        <View
          style={
            styles.sectionDivider
          }
        />
      )}

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

type NewYearDetailProps = {
  icon:
    keyof typeof Ionicons.glyphMap;

  text: string;
};

function NewYearDetail({
  icon,
  text,
}: NewYearDetailProps) {
  return (
    <View
      style={
        styles.newYearDetailRow
      }
    >
      <View
        style={
          styles.newYearDetailIcon
        }
      >
        <Ionicons
          name={icon}
          size={15}
          color={
            COLORS.navy
          }
        />
      </View>

      <Text
        style={
          styles.newYearDetailText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function getNextSchoolYear(
  schoolYear: string | null
) {
  if (!schoolYear) {
    return null;
  }

  const match =
    schoolYear
      .trim()
      .match(
        /^(\d{4})\s*\/\s*(\d{4})$/
      );

  if (!match) {
    return null;
  }

  const startYear =
    Number(match[1]);

  const endYear =
    Number(match[2]);

  if (
    Number.isNaN(startYear) ||
    Number.isNaN(endYear) ||
    endYear !==
      startYear + 1
  ) {
    return null;
  }

  return `${startYear + 1}/${
    endYear + 1
  }`;
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

      alignItems:
        'center',

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

      color:
        COLORS.text,
    },

    eyebrow: {
      fontSize: 14,

      color:
        COLORS.muted,
    },

    title: {
      fontSize: 34,

      fontWeight:
        '700',

      color:
        COLORS.text,

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

      shadowColor:
        '#000000',

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

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    labelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

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

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    label: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    inputContainer: {
      height: 52,

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      paddingHorizontal: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        '#E5E7EB',
    },

    input: {
      flex: 1,

      height: '100%',

      fontSize: 16,

      color:
        COLORS.text,
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

      alignItems:
        'center',

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
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    saveButtonText: {
      color:
        COLORS.white,

      fontSize: 15,

      fontWeight:
        '700',
    },

    helperRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 6,

      marginTop: 18,
    },

    helper: {
      color:
        COLORS.muted,

      fontSize: 13,

      flex: 1,

      lineHeight: 18,
    },

    /* LÆRERE */

    teacherHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 14,
    },

    teacherCount: {
      color:
        COLORS.muted,

      marginTop: 3,
    },

    inviteText: {
      color:
        COLORS.navy,

      fontWeight:
        '700',
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

      flexDirection:
        'row',

      alignItems:
        'center',

      shadowColor:
        '#000000',

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

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    teacherInfo: {
      flex: 1,

      marginLeft: 13,
    },

    teacherName: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    teacherRole: {
      fontSize: 13,

      color:
        COLORS.muted,

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
      color:
        COLORS.navy,

      fontSize: 12,

      fontWeight:
        '700',
    },

    removeTeacherText: {
      fontSize: 14,

      fontWeight:
        '700',

      color:
        '#DC2626',
    },

    /* DIVIDER */

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 28,

      marginBottom: 28,
    },

    /* NYT SKOLEÅR */

    newYearSection: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 20,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    newYearHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },

    newYearIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 13,
    },

    newYearHeaderText: {
      flex: 1,
    },

    newYearTitle: {
      fontSize: 20,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    newYearText: {
      fontSize: 14,

      lineHeight: 20,

      color:
        COLORS.muted,

      marginTop: 5,
    },

    nextYearBox: {
      minHeight: 64,

      borderRadius: 15,

      backgroundColor:
        COLORS.navySoft,

      paddingHorizontal: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop: 20,
    },

    nextYearInfo: {
      gap: 2,
    },

    nextYearLabel: {
      fontSize: 12,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    nextYearValue: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    yearWarning: {
      minHeight: 52,

      borderRadius: 14,

      backgroundColor:
        COLORS.soft,

      paddingHorizontal: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,

      marginTop: 20,
    },

    yearWarningText: {
      flex: 1,

      color:
        COLORS.muted,

      fontSize: 13,

      lineHeight: 18,
    },

    newYearDetails: {
      gap: 10,

      marginTop: 18,

      marginBottom: 20,
    },

    newYearDetailRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,
    },

    newYearDetailIcon: {
      width: 28,

      height: 28,

      borderRadius: 9,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    newYearDetailText: {
      flex: 1,

      fontSize: 13,

      color:
        COLORS.muted,

      lineHeight: 18,
    },

    newYearButton: {
      minHeight: 54,

      borderRadius: 15,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 16,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 10,

      elevation: 2,
    },

    newYearButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    newYearButtonText: {
      color:
        COLORS.white,

      fontSize: 15,

      fontWeight:
        '700',

      textAlign:
        'center',
    },

    /* SLET KLASSE */

    dangerZone: {
      backgroundColor:
        '#FEF2F2',

      borderRadius: 20,

      padding: 20,

      borderWidth: 1,

      borderColor:
        '#FEE2E2',

      shadowColor:
        '#991B1B',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    dangerTitleRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,
    },

    dangerIcon: {
      width: 36,

      height: 36,

      borderRadius: 12,

      backgroundColor:
        '#FEE2E2',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    dangerTitle: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        '#991B1B',
    },

    dangerText: {
      fontSize: 14,

      lineHeight: 20,

      color:
        '#7F1D1D',

      marginTop: 12,

      marginBottom: 18,
    },

    deleteClassButton: {
      height: 52,

      borderRadius: 14,

      backgroundColor:
        '#DC2626',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    deleteClassButtonText: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight:
        '700',
    },

    pressed: {
      opacity: 0.65,
    },

    disabled: {
      opacity: 0.5,
    },
  });