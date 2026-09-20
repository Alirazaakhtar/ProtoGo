import {
  useCallback,
  useMemo,
  useState,
} from 'react';

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

type SortOption =
  | 'newest'
  | 'oldest';

type SchoolClass = {
  id: string;
  name: string;
  school_year: string | null;
  subject: string | null;
  created_at: string;
};

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type AttendanceSessionSummary = {
  class_id: string;

  attendance_records: {
    status: AttendanceStatus;
  }[];
};

type AttendancePercentages = Record<
  string,
  number | null
>;

type HomeCache = {
  classes: SchoolClass[];
  fullName: string;
  attendancePercentages: AttendancePercentages;
};

const SORT_OPTIONS: {
  key: SortOption;
  label: string;
  icon:
    keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'newest',
    label: 'Nyeste',
    icon: 'arrow-down-outline',
  },
  {
    key: 'oldest',
    label: 'Ældste',
    icon: 'arrow-up-outline',
  },
];

let homeCache: HomeCache | null = null;

export default function HomeScreen() {
  const [classes, setClasses] =
    useState<SchoolClass[]>(
      homeCache?.classes ?? []
    );

  const [fullName, setFullName] =
    useState(
      homeCache?.fullName ?? ''
    );

  const [
    attendancePercentages,
    setAttendancePercentages,
  ] =
    useState<AttendancePercentages>(
      homeCache?.attendancePercentages ?? {}
    );

  const [
    sortOption,
    setSortOption,
  ] = useState<SortOption>(
    'newest'
  );

  const [loading, setLoading] =
    useState(homeCache === null);

  const loadHome =
    useCallback(async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        console.error(
          'Kunne ikke hente bruger:',
          userError
        );

        setLoading(false);
        return;
      }

      const [
        profileResult,
        classesResult,
        attendanceResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq(
            'id',
            user.id
          )
          .single(),

        supabase
          .from('classes')
          .select(`
            id,
            name,
            school_year,
            subject,
            created_at
          `),

        supabase
          .from(
            'attendance_sessions'
          )
          .select(`
            class_id,

            attendance_records (
              status
            )
          `)
          .not(
            'finalized_at',
            'is',
            null
          ),
      ]);

      if (
        profileResult.error
      ) {
        console.error(
          'Fejl ved hentning af profil:',
          profileResult.error
        );
      }

      if (
        classesResult.error
      ) {
        console.error(
          'Fejl ved hentning af klasser:',
          classesResult.error
        );

        setLoading(false);
        return;
      }

      if (
        attendanceResult.error
      ) {
        console.error(
          'Fejl ved hentning af fremmøde:',
          attendanceResult.error
        );
      }

      const newClasses =
        (classesResult.data ??
          []) as SchoolClass[];

      const newFullName =
        profileResult.data
          ?.full_name ??
        '';

      const attendanceSessions =
        attendanceResult.error
          ? []
          : ((attendanceResult.data ??
              []) as AttendanceSessionSummary[]);

      const newAttendancePercentages:
        AttendancePercentages = {};

      for (
        const schoolClass of
        newClasses
      ) {
        const classSessions =
          attendanceSessions.filter(
            (session) =>
              session.class_id ===
              schoolClass.id
          );

        let totalRegistrations = 0;
        let totalAttendance = 0;

        for (
          const session of
          classSessions
        ) {
          for (
            const record of
            session
              .attendance_records ??
            []
          ) {
            totalRegistrations += 1;

            if (
              record.status ===
                'present' ||
              record.status ===
                'late'
            ) {
              totalAttendance += 1;
            }
          }
        }

        newAttendancePercentages[
          schoolClass.id
        ] =
          totalRegistrations > 0
            ? Math.round(
                (totalAttendance /
                  totalRegistrations) *
                  100
              )
            : null;
      }

      homeCache = {
        classes:
          newClasses,

        fullName:
          newFullName,

        attendancePercentages:
          newAttendancePercentages,
      };

      setClasses(
        newClasses
      );

      setFullName(
        newFullName
      );

      setAttendancePercentages(
        newAttendancePercentages
      );

      setLoading(false);
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );

  const sortedClasses =
    useMemo(() => {
      const result =
        [...classes];

      result.sort(
        (a, b) => {
          const aTime =
            new Date(
              a.created_at
            ).getTime();

          const bTime =
            new Date(
              b.created_at
            ).getTime();

          if (
            sortOption ===
            'newest'
          ) {
            return (
              bTime -
              aTime
            );
          }

          return (
            aTime -
            bTime
          );
        }
      );

      return result;
    }, [
      classes,
      sortOption,
    ]);

  const firstName =
    fullName
      .trim()
      .split(' ')[0];

  return (
    <View
      style={
        styles.container
      }
    >
      {/* FAST HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.greeting
          }
        >
          {getGreeting()}
          {firstName
            ? ` ${firstName}`
            : ''}
        </Text>

        <View
          style={
            styles.dateRow
          }
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={
              COLORS.navy
            }
          />

          <Text
            style={
              styles.dateText
            }
          >
            {getFormattedDate()} · Uge{' '}
            {getWeekNumber()}
          </Text>
        </View>

        <Text
          style={
            styles.title
          }
        >
          Dine klasser
        </Text>
      </View>

      {/* SCROLL OMRÅDE */}

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HANDLINGER */}

        <View
          style={
            styles.actionRow
          }
        >
          <Pressable
            onPress={() =>
              router.push(
                '/classes/create'
              )
            }
            style={({
              pressed,
            }) => [
              styles.actionCard,

              pressed &&
                styles.actionCardPressed,
            ]}
          >
            <View
              style={
                styles.actionIcon
              }
            >
              <Ionicons
                name="add"
                size={22}
                color={
                  COLORS.navy
                }
              />
            </View>

            <Text
              style={
                styles.actionTitle
              }
            >
              Opret klasse
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Tilføj en ny klasse
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                '/invites'
              )
            }
            style={({
              pressed,
            }) => [
              styles.actionCard,

              pressed &&
                styles.actionCardPressed,
            ]}
          >
            <View
              style={
                styles.actionIcon
              }
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={
                  COLORS.navy
                }
              />
            </View>

            <Text
              style={
                styles.actionTitle
              }
            >
              Invitationer
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Se dine invitationer
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.divider
          }
        />

        {/* SORTERING */}

        {classes.length >
          0 && (
          <>
            <View
              style={
                styles.sortHeader
              }
            >
              <View
                style={
                  styles.sortTitleRow
                }
              >
                <Ionicons
                  name="swap-vertical-outline"
                  size={15}
                  color={
                    COLORS.navy
                  }
                />

                <Text
                  style={
                    styles.sortTitle
                  }
                >
                  Sortér
                </Text>
              </View>

              <Text
                style={
                  styles.classCount
                }
              >
                {
                  classes.length
                }{' '}
                {classes.length ===
                1
                  ? 'klasse'
                  : 'klasser'}
              </Text>
            </View>

            <View
              style={
                styles.sortRow
              }
            >
              {SORT_OPTIONS.map(
                (option) => {
                  const selected =
                    sortOption ===
                    option.key;

                  return (
                    <Pressable
                      key={
                        option.key
                      }
                      onPress={() =>
                        setSortOption(
                          option.key
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.sortChip,

                        selected &&
                          styles
                            .sortChipSelected,

                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={
                          option.icon
                        }
                        size={14}
                        color={
                          selected
                            ? COLORS.white
                            : COLORS.navy
                        }
                      />

                      <Text
                        style={[
                          styles.sortChipText,

                          selected &&
                            styles
                              .sortChipTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </>
        )}

        {/* KLASSER */}

        {loading &&
        classes.length ===
          0 ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.navy
              }
            />
          </View>
        ) : classes.length ===
          0 ? (
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="school-outline"
                size={26}
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
              Ingen klasser endnu
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Opret din første klasse
              for at komme i gang.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.classList
            }
          >
            {sortedClasses.map(
              (
                schoolClass
              ) => {
                const attendance =
                  attendancePercentages[
                    schoolClass.id
                  ];

                return (
                  <Pressable
                    key={
                      schoolClass.id
                    }
                    onPress={() =>
                      router.push(
                        `/classes/${schoolClass.id}`
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.card,

                      pressed &&
                        styles.cardPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.classIcon
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

                    <View
                      style={
                        styles.classInfo
                      }
                    >
                      <Text
                        style={
                          styles.className
                        }
                      >
                        {
                          schoolClass.name
                        }
                      </Text>

                      <View
                        style={
                          styles.classMetaRow
                        }
                      >
                        <View
                          style={
                            styles.metaItem
                          }
                        >
                          <Ionicons
                            name="book-outline"
                            size={14}
                            color={
                              COLORS.navy
                            }
                          />

                          <Text
                            style={
                              styles.classMeta
                            }
                          >
                            {schoolClass.subject ??
                              'Intet fag'}
                          </Text>
                        </View>

                        {schoolClass.school_year && (
                          <>
                            <Text
                              style={
                                styles.metaSeparator
                              }
                            >
                              ·
                            </Text>

                            <View
                              style={
                                styles.metaItem
                              }
                            >
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={
                                  COLORS.navy
                                }
                              />

                              <Text
                                style={
                                  styles.classMeta
                                }
                              >
                                {
                                  schoolClass.school_year
                                }
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* FREMMØDE */}

                    <View
                      style={
                        styles.attendanceContainer
                      }
                    >
                      <View
                        style={
                          styles.attendanceCircle
                        }
                      >
                        <Text
                          style={
                            styles.attendancePercent
                          }
                        >
                          {attendance !==
                            null &&
                          attendance !==
                            undefined
                            ? `${attendance}%`
                            : '–'}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.attendanceLabel
                        }
                      >
                        Fremmøde
                      </Text>
                    </View>
                  </Pressable>
                );
              }
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 10) {
    return 'Godmorgen';
  }

  if (hour < 12) {
    return 'God formiddag';
  }

  if (hour < 18) {
    return 'God eftermiddag';
  }

  return 'Godaften';
}

function getFormattedDate() {
  const now =
    new Date();

  const formatted =
    now.toLocaleDateString(
      'da-DK',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }
    );

  return (
    formatted
      .charAt(0)
      .toUpperCase() +
    formatted.slice(1)
  );
}

function getWeekNumber() {
  const now =
    new Date();

  const date =
    new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );

  const dayNumber =
    date.getUTCDay() ||
    7;

  date.setUTCDate(
    date.getUTCDate() +
      4 -
      dayNumber
  );

  const yearStart =
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        0,
        1
      )
    );

  return Math.ceil(
    ((date.getTime() -
      yearStart.getTime()) /
      86400000 +
      1) /
      7
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 20,
      paddingTop: 70,
    },

    /* HEADER */

    header: {
      marginBottom: 20,
    },

    greeting: {
      fontSize: 16,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    dateRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      marginTop: 4,
      marginBottom: 8,
    },

    dateText: {
      fontSize: 13,

      color:
        COLORS.lightMuted,
    },

    title: {
      fontSize: 34,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 4,

      paddingTop: 4,
      paddingBottom: 50,
    },

    /* HANDLINGER */

    actionRow: {
      flexDirection:
        'row',

      gap: 12,
    },

    actionCard: {
      flex: 1,

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      padding: 16,

      minHeight: 122,

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

    actionCardPressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    actionIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 12,
    },

    actionTitle: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    actionSubtitle: {
      fontSize: 12,

      color:
        COLORS.lightMuted,

      marginTop: 4,
    },

    divider: {
      height: 1,

      backgroundColor:
        '#EEF1F4',

      marginHorizontal: 12,

      marginVertical: 20,
    },

    /* SORTERING */

    sortHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 12,

      marginBottom: 9,
    },

    sortTitleRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    sortTitle: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    classCount: {
      fontSize: 11,

      color:
        COLORS.lightMuted,
    },

    sortRow: {
      flexDirection:
        'row',

      gap: 8,

      marginBottom: 20,
    },

    sortChip: {
      minHeight: 38,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      paddingHorizontal: 13,

      borderRadius: 12,

      backgroundColor:
        COLORS.soft,

      borderWidth: 1,

      borderColor:
        COLORS.soft,
    },

    sortChipSelected: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    sortChipText: {
      fontSize: 12,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    sortChipTextSelected: {
      color:
        COLORS.white,
    },

    /* KLASSER */

    loadingContainer: {
      paddingVertical: 40,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    classList: {
      gap: 16,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 18,

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

    cardPressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    classIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 13,
    },

    classInfo: {
      flex: 1,

      paddingRight: 8,
    },

    className: {
      fontSize: 20,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    classMetaRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      flexWrap:
        'wrap',

      marginTop: 6,

      gap: 5,
    },

    metaItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,
    },

    classMeta: {
      fontSize: 13,

      color:
        COLORS.muted,
    },

    metaSeparator: {
      fontSize: 13,

      color:
        COLORS.lightMuted,
    },

    attendanceContainer: {
      alignItems:
        'center',

      justifyContent:
        'center',

      marginLeft: 8,
    },

    attendanceCircle: {
      width: 52,
      height: 52,

      borderRadius: 26,

      borderWidth: 3,

      borderColor:
        COLORS.navy,

      backgroundColor:
        '#F7FAFC',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    attendancePercent: {
      fontSize: 14,

      fontWeight:
        '800',

      color:
        COLORS.navy,
    },

    attendanceLabel: {
      fontSize: 10,

      fontWeight:
        '700',

      color:
        COLORS.navy,

      marginTop: 4,
    },

    /* EMPTY */

    emptyState: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 28,

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

    emptyIcon: {
      width: 52,
      height: 52,

      borderRadius: 16,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    emptyText: {
      fontSize: 15,

      color:
        COLORS.muted,

      marginTop: 6,

      textAlign:
        'center',
    },

    pressed: {
      opacity: 0.75,
    },
  });