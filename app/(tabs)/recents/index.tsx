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
  TextInput,
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

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

type SortOption =
  | 'newest'
  | 'oldest';

type RecentSession = {
  id: string;
  session_date: string;
  created_at: string;
  finalized_at: string | null;

  classes: {
    id: string;
    name: string;
  } | null;

  creator: {
    full_name: string;
  } | null;

  attendance_records: {
    status: AttendanceStatus;
  }[];
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

let recentsCache:
  RecentSession[] | null = null;

export default function RecentsScreen() {
  const [sessions, setSessions] =
    useState<RecentSession[]>(
      recentsCache ?? []
    );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    sortOption,
    setSortOption,
  ] = useState<SortOption>(
    'newest'
  );

  const [loading, setLoading] =
    useState(
      recentsCache === null
    );

  const loadRecents =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from(
            'attendance_sessions'
          )
          .select(`
            id,
            session_date,
            created_at,
            finalized_at,

            classes (
              id,
              name
            ),

            creator:profiles!attendance_sessions_created_by_fkey (
              full_name
            ),

            attendance_records (
              status
            )
          `)
          .not(
            'finalized_at',
            'is',
            null
          )
          .order(
            'finalized_at',
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          'Kunne ikke hente historik:',
          error
        );

        setLoading(false);
        return;
      }

      const freshSessions =
        (data ??
          []) as RecentSession[];

      recentsCache =
        freshSessions;

      setSessions(
        freshSessions
      );

      setLoading(false);
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecents();
    }, [loadRecents])
  );

  const visibleSessions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            'da-DK'
          );

      let result =
        [...sessions];

      if (normalizedSearch) {
        result =
          result.filter(
            (session) => {
              const className =
                session.classes
                  ?.name ??
                '';

              const teacherName =
                session.creator
                  ?.full_name ??
                '';

              const date =
                formatDate(
                  session.session_date
                );

              const shortDate =
                formatShortDate(
                  session.session_date
                );

              const time =
                formatTime(
                  session.finalized_at
                );

              const searchableText =
                [
                  className,
                  teacherName,
                  date,
                  shortDate,
                  time,
                ]
                  .join(' ')
                  .toLocaleLowerCase(
                    'da-DK'
                  );

              return searchableText.includes(
                normalizedSearch
              );
            }
          );
      }

      result.sort(
        (a, b) => {
          switch (
            sortOption
          ) {
            case 'newest':
              return (
                getSessionTimestamp(
                  b
                ) -
                getSessionTimestamp(
                  a
                )
              );

            case 'oldest':
              return (
                getSessionTimestamp(
                  a
                ) -
                getSessionTimestamp(
                  b
                )
              );
          }
        }
      );

      return result;
    }, [
      sessions,
      search,
      sortOption,
    ]);

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
      keyboardDismissMode="on-drag"
    >
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
          Historik
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Tidligere afsluttede
          protokoller
        </Text>
      </View>

      {/* SØGNING */}

      {sessions.length >
        0 && (
        <>
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
              Find protokol
            </Text>
          </View>

          <View
            style={
              styles.searchContainer
            }
          >
            <TextInput
              value={
                search
              }
              onChangeText={
                setSearch
              }
              placeholder="Søg efter klasse, lærer eller dato"
              placeholderTextColor={
                COLORS.lightMuted
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              style={
                styles.searchInput
              }
            />

            {search.length >
              0 && (
              <Pressable
                onPress={() =>
                  setSearch('')
                }
                hitSlop={8}
                style={({
                  pressed,
                }) => [
                  styles.clearButton,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={
                    COLORS.lightMuted
                  }
                />
              </Pressable>
            )}
          </View>

          {/* SORTERING */}

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
                styles.resultCount
              }
            >
              {
                visibleSessions.length
              }{' '}
              {visibleSessions.length ===
              1
                ? 'protokol'
                : 'protokoller'}
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
                  option.key ===
                  sortOption;

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

          {/* SKILLELINJE */}

          <View
            style={
              styles.sectionDivider
            }
          />
        </>
      )}

      {/* LOADING */}

      {loading &&
      sessions.length ===
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
      ) : sessions.length ===
        0 ? (
        /* INGEN PROTOKOLLER */

        <View
          style={
            styles.empty
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="documents-outline"
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
            Ingen protokoller endnu
          </Text>

          <Text
            style={
              styles.muted
            }
          >
            Afsluttede protokoller
            vises her.
          </Text>
        </View>
      ) : visibleSessions.length ===
        0 ? (
        /* INGEN SØGERESULTATER */

        <View
          style={
            styles.empty
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="search-outline"
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
            Ingen protokoller fundet
          </Text>

          <Text
            style={
              styles.muted
            }
          >
            Prøv at søge efter en
            anden klasse, lærer eller
            dato.
          </Text>

          <Pressable
            onPress={() =>
              setSearch('')
            }
            style={({
              pressed,
            }) => [
              styles.resetSearchButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.resetSearchText
              }
            >
              Ryd søgning
            </Text>
          </Pressable>
        </View>
      ) : (
        /* LISTE */

        <View
          style={
            styles.list
          }
        >
          {visibleSessions.map(
            (session) => {
              const present =
                session.attendance_records.filter(
                  (record) =>
                    record.status ===
                    'present'
                ).length;

              const absent =
                session.attendance_records.filter(
                  (record) =>
                    record.status ===
                    'absent'
                ).length;

              const late =
                session.attendance_records.filter(
                  (record) =>
                    record.status ===
                    'late'
                ).length;

              return (
                <Pressable
                  key={
                    session.id
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        '/(tabs)/recents/[sessionId]',

                      params: {
                        sessionId:
                          session.id,
                      },
                    })
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.card,

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <View
                      style={
                        styles.cardInfo
                      }
                    >
                      <Text
                        style={
                          styles.className
                        }
                      >
                        {session.classes
                          ?.name ??
                          'Ukendt klasse'}
                      </Text>

                      {/* DATO + TID */}

                      <View
                        style={
                          styles.dateTimeRow
                        }
                      >
                        <View
                          style={
                            styles.metaRow
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
                              styles.date
                            }
                          >
                            {formatDate(
                              session.session_date
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.metaDot
                          }
                        />

                        <View
                          style={
                            styles.metaRow
                          }
                        >
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={
                              COLORS.navy
                            }
                          />

                          <Text
                            style={
                              styles.date
                            }
                          >
                            {formatTime(
                              session.finalized_at
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* LÆRER */}

                      <View
                        style={
                          styles.teacherRow
                        }
                      >
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={
                            COLORS.navy
                          }
                        />

                        <Text
                          style={
                            styles.teacher
                          }
                        >
                          {session.creator
                            ?.full_name ??
                            'Ukendt lærer'}
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
                        size={20}
                        color={
                          COLORS.navy
                        }
                      />
                    </View>
                  </View>

                  {/* STATS */}

                  <View
                    style={
                      styles.stats
                    }
                  >
                    <View
                      style={
                        styles.stat
                      }
                    >
                      <View
                        style={
                          styles.statTop
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color={
                            COLORS.navy
                          }
                        />

                        <Text
                          style={
                            styles.statNumber
                          }
                        >
                          {present}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.statLabel
                        }
                      >
                        Til stede
                      </Text>
                    </View>

                    <View
                      style={
                        styles.stat
                      }
                    >
                      <View
                        style={
                          styles.statTop
                        }
                      >
                        <Ionicons
                          name="remove-circle-outline"
                          size={17}
                          color={
                            COLORS.navy
                          }
                        />

                        <Text
                          style={
                            styles.statNumber
                          }
                        >
                          {absent}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.statLabel
                        }
                      >
                        Fravær
                      </Text>
                    </View>

                    <View
                      style={
                        styles.stat
                      }
                    >
                      <View
                        style={
                          styles.statTop
                        }
                      >
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={
                            COLORS.navy
                          }
                        />

                        <Text
                          style={
                            styles.statNumber
                          }
                        >
                          {late}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.statLabel
                        }
                      >
                        Forsinket
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            }
          )}
        </View>
      )}
    </ScrollView>
  );
}

function getSessionTimestamp(
  session: RecentSession
) {
  const value =
    session.finalized_at ??
    session.created_at;

  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;
}

function formatDate(
  date: string
) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString(
    'da-DK',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

function formatShortDate(
  date: string
) {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString(
    'da-DK',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
}

function formatTime(
  date: string | null
) {
  if (!date) {
    return '';
  }

  return new Date(
    date
  ).toLocaleTimeString(
    'da-DK',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
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

      paddingTop: 70,
      paddingBottom: 70,
    },

    /* HEADER */

    header: {
      marginBottom: 24,
    },

    title: {
      fontSize: 34,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    subtitle: {
      fontSize: 15,

      color:
        COLORS.muted,

      marginTop: 6,
    },

    /* SEARCH */

    searchLabelRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 8,
    },

    searchLabelIcon: {
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

    searchLabel: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    searchContainer: {
      position:
        'relative',

      justifyContent:
        'center',

      marginBottom: 18,
    },

    searchInput: {
      height: 54,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingLeft: 18,
      paddingRight: 48,

      fontSize: 15,

      color:
        COLORS.text,
    },

    clearButton: {
      position:
        'absolute',

      right: 14,

      width: 28,
      height: 28,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* SORT */

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

    resultCount: {
      fontSize: 11,

      color:
        COLORS.lightMuted,
    },

    sortRow: {
      flexDirection:
        'row',

      gap: 8,

      paddingBottom: 5,

      marginBottom: 8,
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

    /* DIVIDER */

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 2,
      marginBottom: 22,
    },

    /* LOADING */

    loadingContainer: {
      paddingVertical: 40,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* LIST */

    list: {
      gap: 16,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
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

    cardHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    cardInfo: {
      flex: 1,

      paddingRight: 12,
    },

    className: {
      fontSize: 21,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginBottom: 7,
    },

    /* DATO + TID */

    dateTimeRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      flexWrap:
        'wrap',

      gap: 8,

      marginTop: 4,
    },

    metaRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,
    },

    metaDot: {
      width: 3,
      height: 3,

      borderRadius: 2,

      backgroundColor:
        COLORS.lightMuted,
    },

    date: {
      fontSize: 14,

      color:
        COLORS.muted,
    },

    /* LÆRER */

    teacherRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,

      marginTop: 7,
    },

    teacher: {
      fontSize: 13,

      color:
        COLORS.lightMuted,

      flexShrink: 1,
    },

    chevron: {
      width: 34,
      height: 34,

      borderRadius: 17,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* STATS */

    stats: {
      flexDirection:
        'row',

      gap: 8,

      marginTop: 18,
    },

    stat: {
      flex: 1,

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 14,

      paddingVertical: 11,
      paddingHorizontal: 8,

      alignItems:
        'center',
    },

    statTop: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    statNumber: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    statLabel: {
      fontSize: 11,

      color:
        COLORS.muted,

      marginTop: 3,
    },

    /* EMPTY */

    empty: {
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

      marginBottom: 6,

      textAlign:
        'center',
    },

    muted: {
      color:
        COLORS.muted,

      textAlign:
        'center',

      lineHeight: 20,
    },

    resetSearchButton: {
      marginTop: 16,

      paddingHorizontal: 14,
      paddingVertical: 9,

      borderRadius: 11,

      backgroundColor:
        COLORS.navySoft,
    },

    resetSearchText: {
      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    pressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },
  });