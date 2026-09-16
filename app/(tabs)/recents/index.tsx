import { useCallback, useState } from 'react';

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

  white: '#FFFFFF',
};

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late';

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

let recentsCache: RecentSession[] | null =
  null;

export default function RecentsScreen() {
  const [sessions, setSessions] =
    useState<RecentSession[]>(
      recentsCache ?? []
    );

  const [loading, setLoading] =
    useState(recentsCache === null);

  const loadRecents =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from('attendance_sessions')
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
        (data ?? []) as RecentSession[];

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
      <View style={styles.header}>
        <Text style={styles.title}>
          Historik
        </Text>

        <Text style={styles.subtitle}>
          Tidligere afsluttede protokoller
        </Text>
      </View>

      {loading &&
      sessions.length === 0 ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.navy}
          />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="documents-outline"
              size={26}
              color={COLORS.navy}
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen protokoller endnu
          </Text>

          <Text style={styles.muted}>
            Afsluttede protokoller vises her.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sessions.map(
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
                  key={session.id}
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

                      <View
                        style={
                          styles.metaRow
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={COLORS.navy}
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
                          styles.metaRow
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
                          {' · '}
                          {formatTime(
                            session.finalized_at
                          )}
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
                        color={COLORS.navy}
                      />
                    </View>
                  </View>

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
                          color={COLORS.navy}
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
                          color={COLORS.navy}
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
                          color={COLORS.navy}
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
      paddingBottom: 50,
    },

    header: {
      marginBottom: 28,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
    },

    subtitle: {
      fontSize: 15,
      color: COLORS.muted,
      marginTop: 6,
    },

    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent:
        'center',
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

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    cardInfo: {
      flex: 1,
      paddingRight: 12,
    },

    className: {
      fontSize: 21,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 7,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },

    date: {
      fontSize: 14,
      color: COLORS.muted,
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

      alignItems: 'center',
      justifyContent:
        'center',
    },

    stats: {
      flexDirection: 'row',
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

      alignItems: 'center',
    },

    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    statNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.navy,
    },

    statLabel: {
      fontSize: 11,
      color: COLORS.muted,
      marginTop: 3,
    },

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
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 6,
    },

    muted: {
      color: COLORS.muted,
      textAlign: 'center',
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