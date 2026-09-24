import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import BackButton from '@/app/components/BackButton';
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

  border: '#E5E7EB',
  grid: '#EEF0F3',
};

type SchoolClass = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function StudentsStatisticsIndexScreen() {
  const router = useRouter();

  const [
    classes,
    setClasses,
  ] = useState<SchoolClass[]>([]);

  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState<string | null>(
    null
  );

  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }

    loadStudents();
  }, [
    selectedClassId,
  ]);

  async function loadClasses() {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from('classes')
        .select(`
          id,
          name
        `)
        .order('name');

      if (error) {
        throw error;
      }

      const freshClasses =
        (data ??
          []) as SchoolClass[];

      setClasses(
        freshClasses
      );

      if (
        freshClasses.length >
        0
      ) {
        setSelectedClassId(
          freshClasses[0].id
        );
      }
    } catch (error) {
      console.error(
        'Kunne ikke hente klasser:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    if (!selectedClassId) {
      return;
    }

    try {
      setLoadingStudents(
        true
      );

      const {
        data,
        error,
      } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name
        `)
        .eq(
          'class_id',
          selectedClassId
        )
        .eq(
          'active',
          true
        )
        .order(
          'first_name'
        )
        .order(
          'last_name'
        );

      if (error) {
        throw error;
      }

      setStudents(
        (data ??
          []) as Student[]
      );
    } catch (error) {
      console.error(
        'Kunne ikke hente elever:',
        error
      );

      setStudents([]);
    } finally {
      setLoadingStudents(
        false
      );
    }
  }

  const selectedClass =
    useMemo(
      () =>
        classes.find(
          (schoolClass) =>
            schoolClass.id ===
            selectedClassId
        ) ?? null,
      [
        classes,
        selectedClassId,
      ]
    );

  const filteredStudents =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            'da-DK'
          );

      if (
        !normalizedSearch
      ) {
        return students;
      }

      return students.filter(
        (student) => {
          const fullName =
            `${student.first_name} ${student.last_name}`
              .toLocaleLowerCase(
                'da-DK'
              );

          return fullName.includes(
            normalizedSearch
          );
        }
      );
    }, [
      students,
      search,
    ]);

  function openStudent(
    student: Student
  ) {
    if (!selectedClassId) {
      return;
    }

    router.push({
      pathname:
        '/(tabs)/statistics/students/[studentId]',

      params: {
        studentId:
          student.id,

        classId:
          selectedClassId,
      },
    });
  }

  if (loading) {
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

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >
      <BackButton />

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.title
          }
        >
          Elevstatistik
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Vælg en klasse og derefter
          den elev, du vil se statistik
          for.
        </Text>
      </View>

      {/* KLASSE */}

      <Text
        style={
          styles.heading
        }
      >
        Klasse
      </Text>

      {classes.length === 0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="school-outline"
              size={21}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen klasser
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Du har ingen klasser
            tilgængelige endnu.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.chipRow
          }
        >
          {classes.map(
            (schoolClass) => {
              const selected =
                schoolClass.id ===
                selectedClassId;

              return (
                <Pressable
                  key={
                    schoolClass.id
                  }
                  onPress={() => {
                    setSelectedClassId(
                      schoolClass.id
                    );

                    setSearch('');
                  }}
                  style={({
                    pressed,
                  }) => [
                    styles.classChip,

                    selected &&
                      styles
                        .classChipSelected,

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.classChipText,

                      selected &&
                        styles
                          .classChipTextSelected,
                    ]}
                  >
                    {
                      schoolClass.name
                    }
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>
      )}

      {/* SØGNING */}

      <View
        style={
          styles.searchSection
        }
      >
        <View
          style={
            styles.searchLabelRow
          }
        >
          <View
            style={
              styles.searchLabelIcon
            }
          >
            <Ionicons
              name="search-outline"
              size={15}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.searchLabel
            }
          >
            Find elev
          </Text>
        </View>

        <TextInput
          value={
            search
          }
          onChangeText={
            setSearch
          }
          placeholder="Søg efter navn"
          placeholderTextColor={
            COLORS.lightMuted
          }
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          style={
            styles.searchInput
          }
        />

        {search.length >
          0 && (
          <Text
            style={
              styles.searchResultText
            }
          >
            {
              filteredStudents.length
            }{' '}
            {filteredStudents.length ===
            1
              ? 'elev fundet'
              : 'elever fundet'}
          </Text>
        )}
      </View>

      {/* ELEVLISTE */}

      <Text
        style={
          styles.studentsHeading
        }
      >
        Vælg elev
      </Text>

      {loadingStudents ? (
        <View
          style={
            styles.studentsLoading
          }
        >
          <ActivityIndicator
            size="small"
            color={
              COLORS.navy
            }
          />
        </View>
      ) : students.length ===
        0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="people-outline"
              size={21}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen elever
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Klassen har ingen aktive
            elever.
          </Text>
        </View>
      ) : filteredStudents.length ===
        0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="search-outline"
              size={21}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen elever fundet
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Prøv at søge efter et
            andet navn.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.studentList
          }
        >
          {filteredStudents.map(
            (student) => (
              <Pressable
                key={
                  student.id
                }
                onPress={() =>
                  openStudent(
                    student
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.studentCard,

                  pressed &&
                    styles.studentCardPressed,
                ]}
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
                    {student.first_name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View
                  style={
                    styles.studentNameArea
                  }
                >
                  <Text
                    style={
                      styles.studentName
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
                      styles.studentSubtitle
                    }
                  >
                    Se elevstatistik
                  </Text>
                </View>

                <View
                  style={
                    styles.arrowBox
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      COLORS.navy
                    }
                  />
                </View>
              </Pressable>
            )
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        COLORS.white,
    },

    content: {
      paddingHorizontal:
        22,

      paddingTop:
        64,

      paddingBottom:
        120,
    },

    center: {
      flex:
        1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    header: {
      marginTop:
        4,

      marginBottom:
        28,
    },

    title: {
      fontSize:
        34,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    subtitle: {
      fontSize:
        15,

      color:
        COLORS.muted,

      lineHeight:
        22,

      marginTop:
        7,
    },

    heading: {
      fontSize:
        13,

      fontWeight:
        '600',

      color:
        COLORS.muted,

      marginBottom:
        9,
    },

    chipRow: {
      gap:
        8,

      paddingRight:
        22,

      paddingBottom:
        4,
    },

    classChip: {
      height:
        40,

      paddingHorizontal:
        16,

      borderRadius:
        13,

      justifyContent:
        'center',

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,
    },

    classChipSelected: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    classChipText: {
      fontSize:
        14,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    classChipTextSelected: {
      color:
        COLORS.white,
    },

    pressed: {
      opacity:
        0.7,
    },

    selectedClassHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop:
        24,

      paddingHorizontal:
        14,

      paddingVertical:
        12,

      borderRadius:
        16,

      backgroundColor:
        COLORS.soft,
    },

    selectedClassIcon: {
      width:
        38,

      height:
        38,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navySoft,

      marginRight:
        11,
    },

    selectedClassText: {
      flex:
        1,
    },

    selectedClassEyebrow: {
      fontSize:
        11,

      color:
        COLORS.muted,
    },

    selectedClassName: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop:
        1,
    },

    studentCount: {
      minWidth:
        34,

      height:
        34,

      lineHeight:
        34,

      borderRadius:
        11,

      textAlign:
        'center',

      backgroundColor:
        COLORS.white,

      fontSize:
        14,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    searchSection: {
      marginTop:
        24,
    },

    searchLabelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        7,

      marginBottom:
        8,
    },

    searchLabelIcon: {
      width:
        26,

      height:
        26,

      borderRadius:
        8,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    searchLabel: {
      fontSize:
        13,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    searchInput: {
      height:
        52,

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      paddingHorizontal:
        16,

      fontSize:
        15,

      color:
        COLORS.text,

      backgroundColor:
        COLORS.white,
    },

    searchResultText: {
      fontSize:
        11,

      color:
        COLORS.lightMuted,

      marginTop:
        6,

      marginLeft:
        2,
    },

    studentsHeading: {
      fontSize:
        13,

      fontWeight:
        '600',

      color:
        COLORS.muted,

      marginTop:
        24,

      marginBottom:
        10,
    },

    studentsLoading: {
      minHeight:
        160,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    studentList: {
      gap:
        9,
    },

    studentCard: {
      minHeight:
        68,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        11,

      paddingVertical:
        10,

      borderRadius:
        17,

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000000',

      shadowOffset: {
        width:
          0,

        height:
          4,
      },

      shadowOpacity:
        0.04,

      shadowRadius:
        14,

      elevation:
        1,
    },

    studentCardPressed: {
      opacity:
        0.65,

      transform: [
        {
          scale:
            0.995,
        },
      ],
    },

    avatar: {
      width:
        42,

      height:
        42,

      borderRadius:
        13,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        12,
    },

    avatarText: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    studentNameArea: {
      flex:
        1,
    },

    studentName: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    studentSubtitle: {
      fontSize:
        11,

      color:
        COLORS.muted,

      marginTop:
        3,
    },

    arrowBox: {
      width:
        34,

      height:
        34,

      borderRadius:
        11,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.soft,
    },

    emptyCard: {
      minHeight:
        140,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        22,

      borderRadius:
        18,

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000000',

      shadowOffset: {
        width:
          0,

        height:
          4,
      },

      shadowOpacity:
        0.04,

      shadowRadius:
        14,

      elevation:
        1,
    },

    emptyIcon: {
      width:
        42,

      height:
        42,

      borderRadius:
        13,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop:
        9,
    },

    emptyText: {
      fontSize:
        12,

      color:
        COLORS.muted,

      textAlign:
        'center',

      lineHeight:
        18,

      marginTop:
        4,
    },
  });