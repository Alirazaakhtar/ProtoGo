import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

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

import { useLocalSearchParams } from 'expo-router';

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

type AttendanceRecord = {
  id: string;
  status: AttendanceStatus;

  students: {
    first_name: string;
    last_name: string;
  } | null;
};

type SessionDetails = {
  id: string;
  session_date: string;
  created_at: string;

  classes: {
    name: string;
  } | null;

  creator: {
    full_name: string;
  } | null;

  attendance_records: AttendanceRecord[];
};

type DraftStatuses = Record<
  string,
  AttendanceStatus
>;

const sessionCache =
  new Map<string, SessionDetails>();

export default function RecentDetailsScreen() {
  const { sessionId } =
    useLocalSearchParams<{
      sessionId: string;
    }>();

  const cachedSession = sessionId
    ? sessionCache.get(sessionId)
    : undefined;

  const [session, setSession] =
    useState<SessionDetails | null>(
      cachedSession ?? null
    );

  const [loading, setLoading] =
    useState(!cachedSession);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    studentSearch,
    setStudentSearch,
  ] = useState('');

  const [
    draftStatuses,
    setDraftStatuses,
  ] = useState<DraftStatuses>({});

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    if (!sessionId) {
      return;
    }

    const { data, error } =
      await supabase
        .from('attendance_sessions')
        .select(`
          id,
          session_date,
          created_at,

          classes (
            name
          ),

          creator:profiles!attendance_sessions_created_by_fkey (
            full_name
          ),

          attendance_records (
            id,
            status,

            students (
              first_name,
              last_name
            )
          )
        `)
        .eq(
          'id',
          sessionId
        )
        .single();

    if (error) {
      console.error(
        error
      );

      setLoading(
        false
      );

      return;
    }

    const freshSession =
      data as SessionDetails;

    sessionCache.set(
      sessionId,
      freshSession
    );

    setSession(
      freshSession
    );

    setLoading(
      false
    );
  }

  function startEditing() {
    if (!session) {
      return;
    }

    const statuses:
      DraftStatuses = {};

    for (
      const record of
      session.attendance_records
    ) {
      statuses[
        record.id
      ] = record.status;
    }

    setDraftStatuses(
      statuses
    );

    setEditing(
      true
    );
  }

  function cancelEditing() {
    if (!session) {
      return;
    }

    const statuses:
      DraftStatuses = {};

    for (
      const record of
      session.attendance_records
    ) {
      statuses[
        record.id
      ] = record.status;
    }

    setDraftStatuses(
      statuses
    );

    setEditing(
      false
    );
  }

  function changeStatus(
    recordId: string,
    status: AttendanceStatus
  ) {
    setDraftStatuses(
      (current) => ({
        ...current,

        [recordId]:
          status,
      })
    );
  }

  async function saveChanges() {
    if (
      !session ||
      !sessionId
    ) {
      return;
    }

    const changedRecords =
      session.attendance_records.filter(
        (record) => {
          const draftStatus =
            draftStatuses[
              record.id
            ];

          return (
            draftStatus &&
            draftStatus !==
              record.status
          );
        }
      );

    if (
      changedRecords.length ===
      0
    ) {
      setEditing(
        false
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const results =
        await Promise.all(
          changedRecords.map(
            (record) =>
              supabase
                .from(
                  'attendance_records'
                )
                .update({
                  status:
                    draftStatuses[
                      record.id
                    ],
                })
                .eq(
                  'id',
                  record.id
                )
          )
        );

      const failedResult =
        results.find(
          (result) =>
            result.error
        );

      if (
        failedResult?.error
      ) {
        console.error(
          failedResult.error
        );

        Alert.alert(
          'Kunne ikke gemme',
          failedResult.error
            .message
        );

        await loadSession();

        return;
      }

      const updatedSession:
        SessionDetails = {
          ...session,

          attendance_records:
            session.attendance_records.map(
              (record) => ({
                ...record,

                status:
                  draftStatuses[
                    record.id
                  ] ??
                  record.status,
              })
            ),
        };

      setSession(
        updatedSession
      );

      sessionCache.set(
        sessionId,
        updatedSession
      );

      setEditing(
        false
      );

      Alert.alert(
        'Protokol opdateret',

        changedRecords.length ===
          1
          ? '1 registrering blev rettet.'
          : `${changedRecords.length} registreringer blev rettet.`
      );
    } catch (error) {
      console.error(
        error
      );

      Alert.alert(
        'Kunne ikke gemme',
        'Der opstod en fejl under opdateringen.'
      );

      await loadSession();
    } finally {
      setSaving(
        false
      );
    }
  }

  const effectiveRecords =
    useMemo(() => {
      if (!session) {
        return [];
      }

      if (!editing) {
        return session
          .attendance_records;
      }

      return session
        .attendance_records
        .map(
          (record) => ({
            ...record,

            status:
              draftStatuses[
                record.id
              ] ??
              record.status,
          })
        );
    }, [
      session,
      editing,
      draftStatuses,
    ]);

  const filteredRecords =
    useMemo(() => {
      if (!session) {
        return [];
      }

      const search =
        studentSearch
          .trim()
          .toLocaleLowerCase(
            'da-DK'
          );

      if (!search) {
        return session
          .attendance_records;
      }

      return session
        .attendance_records
        .filter(
          (record) => {
            const firstName =
              record.students
                ?.first_name ??
              '';

            const lastName =
              record.students
                ?.last_name ??
              '';

            const fullName =
              `${firstName} ${lastName}`
                .trim()
                .toLocaleLowerCase(
                  'da-DK'
                );

            return (
              firstName
                .toLocaleLowerCase(
                  'da-DK'
                )
                .includes(
                  search
                ) ||
              lastName
                .toLocaleLowerCase(
                  'da-DK'
                )
                .includes(
                  search
                ) ||
              fullName.includes(
                search
              )
            );
          }
        );
    }, [
      session,
      studentSearch,
    ]);

  const hasChanges =
    useMemo(() => {
      if (
        !session ||
        !editing
      ) {
        return false;
      }

      return session
        .attendance_records
        .some(
          (record) =>
            draftStatuses[
              record.id
            ] !==
              undefined &&
            draftStatuses[
              record.id
            ] !==
              record.status
        );
    }, [
      session,
      editing,
      draftStatuses,
    ]);

  if (
    loading &&
    !session
  ) {
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

  if (!session) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.notFoundText
          }
        >
          Protokollen blev ikke fundet.
        </Text>
      </View>
    );
  }

  const totalStudents =
    effectiveRecords.length;

  const presentCount =
    effectiveRecords.filter(
      (record) =>
        record.status ===
        'present'
    ).length;

  const lateCount =
    effectiveRecords.filter(
      (record) =>
        record.status ===
        'late'
    ).length;

  const absentCount =
    effectiveRecords.filter(
      (record) =>
        record.status ===
        'absent'
    ).length;

  const attendanceCount =
    presentCount +
    lateCount;

  const attendancePercentage =
    totalStudents > 0
      ? Math.round(
          (attendanceCount /
            totalStudents) *
            100
        )
      : 0;

  const absencePercentage =
    totalStudents > 0
      ? Math.round(
          (absentCount /
            totalStudents) *
            100
        )
      : 0;

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
      {/* TILBAGE */}

      <BackButton />

      {/* DATO + TID + REDIGER */}

      <View
        style={
          styles.metaHeaderRow
        }
      >
        <View
          style={
            styles.dateRow
          }
        >
          <View
            style={
              styles.dateMeta
            }
          >
            <Ionicons
              name="calendar-outline"
              size={15}
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
              styles.dateMeta
            }
          >
            <Ionicons
              name="time-outline"
              size={15}
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
                session.created_at
              )}
            </Text>
          </View>
        </View>

        {!editing && (
          <Pressable
            onPress={
              startEditing
            }
            accessibilityRole="button"
            accessibilityLabel="Rediger protokol"
            hitSlop={8}
            style={({
              pressed,
            }) => [
              styles.editButton,

              pressed &&
                styles.editButtonPressed,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={
                COLORS.navy
              }
            />
          </Pressable>
        )}
      </View>

      {/* HEADER */}

      <Text
        style={
          styles.title
        }
      >
        {session.classes
          ?.name ??
          'Ukendt klasse'}
      </Text>

      <View
        style={
          styles.teacherRow
        }
      >
        <Ionicons
          name="person-outline"
          size={15}
          color={
            COLORS.navy
          }
        />

        <Text
          style={
            styles.teacher
          }
        >
          Registreret af{' '}

          <Text
            style={
              styles.teacherName
            }
          >
            {session.creator
              ?.full_name ??
              'Ukendt lærer'}
          </Text>
        </Text>
      </View>

      {/* REDIGERING */}

      {editing && (
        <View
          style={
            styles.editNotice
          }
        >
          <View
            style={
              styles.editNoticeIcon
            }
          >
            <Ionicons
              name="create-outline"
              size={17}
              color={
                COLORS.navy
              }
            />
          </View>

          <View
            style={
              styles.editNoticeContent
            }
          >
            <Text
              style={
                styles.editNoticeTitle
              }
            >
              Du redigerer protokollen
            </Text>

            <Text
              style={
                styles.editNoticeText
              }
            >
              Ret elevernes status og
              gem ændringerne nederst.
            </Text>
          </View>
        </View>
      )}

      {/* STATISTIK */}

      <View
        style={
          styles.statsRow
        }
      >
        <View
          style={
            styles.statCard
          }
        >
          <View
            style={
              styles.statIcon
            }
          >
            <Ionicons
              name="people-outline"
              size={19}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.statValue
            }
          >
            {totalStudents}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            Elever
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <View
            style={
              styles.statIcon
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.statValue
            }
          >
            {
              attendancePercentage
            }
            %
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            {attendanceCount}{' '}
            {attendanceCount ===
            1
              ? 'fremmødt'
              : 'fremmødte'}
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <View
            style={
              styles.statIcon
            }
          >
            <Ionicons
              name="remove-circle-outline"
              size={19}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.statValue
            }
          >
            {
              absencePercentage
            }
            %
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            {absentCount}{' '}
            fraværende
          </Text>
        </View>
      </View>

      {/* SKILLELINJE */}

      <View
        style={
          styles.sectionDivider
        }
      />

      {/* SØG ELEV */}

      {session.attendance_records
        .length > 0 && (
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
              studentSearch
            }
            onChangeText={
              setStudentSearch
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

          {studentSearch
            .trim()
            .length > 0 && (
            <View
              style={
                styles.searchResultRow
              }
            >
              <Text
                style={
                  styles.searchResultText
                }
              >
                {
                  filteredRecords.length
                }{' '}
                {filteredRecords.length ===
                1
                  ? 'elev fundet'
                  : 'elever fundet'}
              </Text>

              <Pressable
                onPress={() =>
                  setStudentSearch(
                    ''
                  )
                }
                hitSlop={8}
                style={({
                  pressed,
                }) => [
                  styles.clearSearch,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.clearSearchText
                  }
                >
                  Ryd
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ELEVER */}

      {filteredRecords.length ===
        0 &&
      studentSearch.trim()
        .length > 0 ? (
        <View
          style={
            styles.emptySearch
          }
        >
          <View
            style={
              styles.emptySearchIcon
            }
          >
            <Ionicons
              name="search-outline"
              size={25}
              color={
                COLORS.navy
              }
            />
          </View>

          <Text
            style={
              styles.emptySearchTitle
            }
          >
            Ingen elever fundet
          </Text>

          <Text
            style={
              styles.emptySearchText
            }
          >
            Prøv at søge efter et
            andet navn.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.list
          }
        >
          {filteredRecords.map(
            (record) => {
              const currentStatus =
                editing
                  ? draftStatuses[
                      record.id
                    ] ??
                    record.status
                  : record.status;

              const changed =
                editing &&
                currentStatus !==
                  record.status;

              return (
                <View
                  key={
                    record.id
                  }
                  style={[
                    styles.card,

                    editing &&
                      styles.cardEditing,

                    changed &&
                      styles.cardChanged,
                  ]}
                >
                  <View
                    style={
                      styles.studentTop
                    }
                  >
                    <View
                      style={
                        styles.studentInfo
                      }
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
                          {record.students
                            ?.first_name
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ??
                            ''}

                          {record.students
                            ?.last_name
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ??
                            ''}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.studentNameArea
                        }
                      >
                        <Text
                          style={
                            styles.name
                          }
                        >
                          {record.students
                            ?.first_name ??
                            ''}{' '}
                          {record.students
                            ?.last_name ??
                            ''}
                        </Text>

                        {changed && (
                          <View
                            style={
                              styles.changedRow
                            }
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={11}
                              color={
                                COLORS.navy
                              }
                            />

                            <Text
                              style={
                                styles.changedText
                              }
                            >
                              Ændret
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {!editing && (
                      <View
                        style={
                          styles.statusContainer
                        }
                      >
                        <Ionicons
                          name={getStatusIcon(
                            currentStatus
                          )}
                          size={17}
                          color={
                            COLORS.navy
                          }
                        />

                        <Text
                          style={
                            styles.status
                          }
                        >
                          {getStatusLabel(
                            currentStatus
                          )}
                        </Text>
                      </View>
                    )}
                  </View>

                  {editing && (
                    <View
                      style={
                        styles.statusOptions
                      }
                    >
                      <StatusButton
                        label="Til stede"
                        icon="checkmark-circle-outline"
                        active={
                          currentStatus ===
                          'present'
                        }
                        disabled={
                          saving
                        }
                        onPress={() =>
                          changeStatus(
                            record.id,
                            'present'
                          )
                        }
                      />

                      <StatusButton
                        label="Forsinket"
                        icon="time-outline"
                        active={
                          currentStatus ===
                          'late'
                        }
                        disabled={
                          saving
                        }
                        onPress={() =>
                          changeStatus(
                            record.id,
                            'late'
                          )
                        }
                      />

                      <StatusButton
                        label="Fravær"
                        icon="remove-circle-outline"
                        active={
                          currentStatus ===
                          'absent'
                        }
                        disabled={
                          saving
                        }
                        onPress={() =>
                          changeStatus(
                            record.id,
                            'absent'
                          )
                        }
                      />
                    </View>
                  )}
                </View>
              );
            }
          )}
        </View>
      )}

      {/* GEM / ANNULLER */}

      {editing && (
        <View
          style={
            styles.editActions
          }
        >
          <Pressable
            onPress={
              cancelEditing
            }
            disabled={
              saving
            }
            style={({
              pressed,
            }) => [
              styles.cancelButton,

              pressed &&
                styles.pressed,

              saving &&
                styles.disabled,
            ]}
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Annuller
            </Text>
          </Pressable>

          <Pressable
            onPress={
              saveChanges
            }
            disabled={
              saving ||
              !hasChanges
            }
            style={({
              pressed,
            }) => [
              styles.saveButton,

              pressed &&
                hasChanges &&
                styles.saveButtonPressed,

              (saving ||
                !hasChanges) &&
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
                  styles.saveButtonContent
                }
              >
                <Ionicons
                  name="checkmark-outline"
                  size={19}
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
        </View>
      )}
    </ScrollView>
  );
}

function StatusButton({
  label,
  icon,
  active,
  disabled,
  onPress,
}: {
  label: string;

  icon:
    keyof typeof Ionicons.glyphMap;

  active: boolean;
  disabled: boolean;

  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      disabled={
        disabled
      }
      style={({
        pressed,
      }) => [
        styles.statusButton,

        active &&
          styles.statusButtonActive,

        pressed &&
          !active &&
          styles.statusButtonPressed,

        disabled &&
          styles.disabled,
      ]}
    >
      <Ionicons
        name={
          icon
        }
        size={16}
        color={
          active
            ? COLORS.white
            : COLORS.navy
        }
      />

      <Text
        style={[
          styles.statusButtonText,

          active &&
            styles.statusButtonTextActive,
        ]}
        numberOfLines={
          1
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getStatusLabel(
  status: AttendanceStatus
) {
  switch (
    status
  ) {
    case 'present':
      return 'Til stede';

    case 'absent':
      return 'Fravær';

    case 'late':
      return 'Forsinket';
  }
}

function getStatusIcon(
  status: AttendanceStatus
):
  | 'checkmark-circle-outline'
  | 'remove-circle-outline'
  | 'time-outline' {
  switch (
    status
  ) {
    case 'present':
      return 'checkmark-circle-outline';

    case 'absent':
      return 'remove-circle-outline';

    case 'late':
      return 'time-outline';
  }
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
  value: string
) {
  return new Date(
    value
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
      paddingBottom: 120,
    },

    center: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,
    },

    notFoundText: {
      fontSize: 15,

      color:
        COLORS.muted,
    },

    /* DATO + TID + EDIT */

    metaHeaderRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 12,

      marginTop: 10,
    },

    dateRow: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,

      flexWrap:
        'wrap',
    },

    dateMeta: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
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

    editButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    editButtonPressed: {
      opacity: 0.7,

      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    /* HEADER */

    title: {
      fontSize: 36,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop: 7,
    },

    teacherRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      marginTop: 7,
      marginBottom: 22,
    },

    teacher: {
      flex: 1,

      fontSize: 14,

      color:
        COLORS.muted,
    },

    teacherName: {
      fontWeight:
        '600',

      color:
        COLORS.text,
    },

    /* EDIT NOTICE */

    editNotice: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 11,

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 16,

      padding: 13,

      marginBottom: 22,
    },

    editNoticeIcon: {
      width: 36,
      height: 36,

      borderRadius: 11,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    editNoticeContent: {
      flex: 1,
    },

    editNoticeTitle: {
      fontSize: 14,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    editNoticeText: {
      fontSize: 12,

      color:
        COLORS.muted,

      marginTop: 2,

      lineHeight: 17,
    },

    /* STATISTIK */

    statsRow: {
      flexDirection:
        'row',

      gap: 10,

      marginBottom: 20,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    statCard: {
      flex: 1,

      minHeight: 108,

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      paddingVertical: 13,
      paddingHorizontal: 8,

      alignItems:
        'center',

      justifyContent:
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

    statIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 7,
    },

    statValue: {
      fontSize: 21,

      fontWeight:
        '800',

      color:
        COLORS.navy,
    },

    statLabel: {
      fontSize: 11,

      fontWeight:
        '600',

      color:
        COLORS.muted,

      marginTop: 3,

      textAlign:
        'center',
    },

    /* DIVIDER */

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginBottom: 22,
    },

    /* SEARCH */

    searchSection: {
      marginBottom: 20,
    },

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

    searchInput: {
      height: 52,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 16,

      color:
        COLORS.text,
    },

    searchResultRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop: 7,

      paddingHorizontal: 2,
    },

    searchResultText: {
      fontSize: 11,

      color:
        COLORS.lightMuted,
    },

    clearSearch: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },

    clearSearchText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    /* ELEVER */

    list: {
      gap: 14,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
      minHeight: 70,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      paddingHorizontal: 16,
      paddingVertical: 14,

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

    cardEditing: {
      paddingBottom: 15,
    },

    cardChanged: {
      backgroundColor:
        '#FBFCFE',
    },

    studentTop: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    studentInfo: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingRight: 12,
    },

    studentNameArea: {
      flex: 1,
    },

    avatar: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 11,
    },

    avatarText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    name: {
      fontSize: 16,

      fontWeight:
        '600',

      color:
        COLORS.text,
    },

    changedRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 3,

      marginTop: 3,
    },

    changedText: {
      fontSize: 10,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    statusContainer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      backgroundColor:
        COLORS.navySoft,

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 10,
    },

    status: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    /* EMPTY SEARCH */

    emptySearch: {
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

    emptySearchIcon: {
      width: 50,
      height: 50,

      borderRadius: 16,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 12,
    },

    emptySearchTitle: {
      fontSize: 17,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    emptySearchText: {
      fontSize: 14,

      color:
        COLORS.muted,

      marginTop: 5,

      textAlign:
        'center',
    },

    /* STATUS */

    statusOptions: {
      flexDirection:
        'row',

      gap: 7,

      marginTop: 14,
    },

    statusButton: {
      flex: 1,

      minHeight: 42,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#DCE3EA',

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 5,

      paddingHorizontal: 5,
    },

    statusButtonActive: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    statusButtonPressed: {
      backgroundColor:
        COLORS.navySoft,
    },

    statusButtonText: {
      fontSize: 11,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    statusButtonTextActive: {
      color:
        COLORS.white,
    },

    /* ACTIONS */

    editActions: {
      flexDirection:
        'row',

      gap: 10,

      marginTop: 24,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    cancelButton: {
      flex: 1,

      height: 56,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    cancelButtonText: {
      fontSize: 15,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    saveButton: {
      flex: 1.6,

      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

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

    saveButtonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,
    },

    saveButtonText: {
      fontSize: 15,

      fontWeight:
        '700',

      color:
        COLORS.white,
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.45,
    },
  });