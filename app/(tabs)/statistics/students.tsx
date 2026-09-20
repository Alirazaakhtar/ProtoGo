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
  useWindowDimensions,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import Svg, {
  Circle,
  Line,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';

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

type AttendanceSession = {
  id: string;
  finalized_at: string;
};

type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent';

type AttendanceRecord = {
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
};

type Period = {
  label: string;
  days: number;
};

type ChartPoint = {
  key: string;
  label: string;
  value: number;
};

const PERIODS: Period[] = [
  {
    label: '1 uge',
    days: 7,
  },
  {
    label: '1 måned',
    days: 30,
  },
  {
    label: '3 måneder',
    days: 90,
  },
  {
    label: '6 måneder',
    days: 180,
  },
  {
    label: '12 måneder',
    days: 365,
  },
];

export default function StudentStatisticsScreen() {
  const { width } =
    useWindowDimensions();

  const [classes, setClasses] =
    useState<SchoolClass[]>([]);

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
    selectedStudentId,
    setSelectedStudentId,
  ] = useState<string | null>(
    null
  );

  const [
    studentSearch,
    setStudentSearch,
  ] = useState('');

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState<Period>(
    PERIODS[1]
  );

  const [
    sessions,
    setSessions,
  ] = useState<
    AttendanceSession[]
  >([]);

  const [
    records,
    setRecords,
  ] = useState<
    AttendanceRecord[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingStats,
    setLoadingStats,
  ] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    loadStatistics();
  }, [
    selectedClassId,
    selectedPeriod.days,
  ]);

  async function loadClasses() {
    try {
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

      const classData =
        (data ??
          []) as SchoolClass[];

      setClasses(
        classData
      );

      if (
        classData.length > 0
      ) {
        setSelectedClassId(
          classData[0].id
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

  async function loadStatistics() {
    if (!selectedClassId) {
      return;
    }

    try {
      setLoadingStats(true);

      const since =
        getPeriodStart(
          selectedPeriod.days
        );

      const [
        studentsResult,
        sessionsResult,
      ] = await Promise.all([
        supabase
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
          ),

        supabase
          .from(
            'attendance_sessions'
          )
          .select(`
            id,
            finalized_at
          `)
          .eq(
            'class_id',
            selectedClassId
          )
          .not(
            'finalized_at',
            'is',
            null
          )
          .gte(
            'finalized_at',
            since.toISOString()
          )
          .order(
            'finalized_at',
            {
              ascending: true,
            }
          ),
      ]);

      if (
        studentsResult.error
      ) {
        throw studentsResult.error;
      }

      if (
        sessionsResult.error
      ) {
        throw sessionsResult.error;
      }

      const freshStudents =
        (studentsResult.data ??
          []) as Student[];

      const freshSessions =
        (sessionsResult.data ??
          []) as AttendanceSession[];

      setStudents(
        freshStudents
      );

      setStudentSearch('');

      setSelectedStudentId(
        (current) => {
          if (
            current &&
            freshStudents.some(
              (student) =>
                student.id ===
                current
            )
          ) {
            return current;
          }

          return (
            freshStudents[0]
              ?.id ??
            null
          );
        }
      );

      setSessions(
        freshSessions
      );

      if (
        freshSessions.length ===
        0
      ) {
        setRecords([]);
        return;
      }

      const sessionIds =
        freshSessions.map(
          (session) =>
            session.id
        );

      const {
        data,
        error,
      } = await supabase
        .from(
          'attendance_records'
        )
        .select(`
          session_id,
          student_id,
          status
        `)
        .in(
          'session_id',
          sessionIds
        );

      if (error) {
        throw error;
      }

      setRecords(
        (data ??
          []) as AttendanceRecord[]
      );
    } catch (error) {
      console.error(
        'Kunne ikke hente elevstatistik:',
        error
      );
    } finally {
      setLoadingStats(
        false
      );
    }
  }

  const filteredStudents =
    useMemo(() => {
      const search =
        studentSearch
          .trim()
          .toLocaleLowerCase(
            'da-DK'
          );

      if (!search) {
        return students;
      }

      return students.filter(
        (student) => {
          const firstName =
            student.first_name
              .toLocaleLowerCase(
                'da-DK'
              );

          const lastName =
            student.last_name
              .toLocaleLowerCase(
                'da-DK'
              );

          const fullName =
            `${student.first_name} ${student.last_name}`
              .toLocaleLowerCase(
                'da-DK'
              );

          return (
            firstName.includes(
              search
            ) ||
            lastName.includes(
              search
            ) ||
            fullName.includes(
              search
            )
          );
        }
      );
    }, [
      students,
      studentSearch,
    ]);

  const selectedStudent =
    useMemo(
      () =>
        students.find(
          (student) =>
            student.id ===
            selectedStudentId
        ) ?? null,
      [
        students,
        selectedStudentId,
      ]
    );

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

  const studentRecords =
    useMemo(() => {
      if (
        !selectedStudentId
      ) {
        return [];
      }

      return records.filter(
        (record) =>
          record.student_id ===
          selectedStudentId
      );
    }, [
      records,
      selectedStudentId,
    ]);

  const stats =
    useMemo(() => {
      let present = 0;
      let late = 0;
      let absent = 0;

      for (
        const record of
        studentRecords
      ) {
        if (
          record.status ===
          'present'
        ) {
          present++;
        }

        if (
          record.status ===
          'late'
        ) {
          late++;
        }

        if (
          record.status ===
          'absent'
        ) {
          absent++;
        }
      }

      const total =
        present +
        late +
        absent;

      return {
        total,
        present,
        late,
        absent,

        attendance:
          total > 0
            ? Math.round(
                ((present +
                  late) /
                  total) *
                  100
              )
            : null,

        absence:
          total > 0
            ? Math.round(
                (absent /
                  total) *
                  100
              )
            : null,

        latePercentage:
          total > 0
            ? Math.round(
                (late /
                  total) *
                  100
              )
            : null,
      };
    }, [
      studentRecords,
    ]);

  /*
   * Graf:
   *
   * X = protokoldato
   * Y = løbende fremmødeprocent
   *
   * present + late = fremmøde
   */
  const chartData =
    useMemo<
      ChartPoint[]
    >(() => {
      if (
        !selectedStudentId
      ) {
        return [];
      }

      let attended = 0;
      let total = 0;

      const points:
        ChartPoint[] = [];

      for (
        const session of
        sessions
      ) {
        const record =
          studentRecords.find(
            (item) =>
              item.session_id ===
              session.id
          );

        if (!record) {
          continue;
        }

        total++;

        if (
          record.status ===
            'present' ||
          record.status ===
            'late'
        ) {
          attended++;
        }

        const percentage =
          Math.round(
            (attended /
              total) *
              100
          );

        points.push({
          key:
            session.id,

          label:
            formatProtocolDate(
              session.finalized_at
            ),

          value:
            percentage,
        });
      }

      return points;
    }, [
      selectedStudentId,
      studentRecords,
      sessions,
    ]);

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />
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
      keyboardShouldPersistTaps="handled"
    >
      <BackButton />

      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Elevstatistik
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Følg den enkelte elevs
          fremmøde og udvikling over
          tid.
        </Text>
      </View>

      {/* KLASSE */}

      <Text
        style={styles.heading}
      >
        Klasse
      </Text>

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

                  setStudentSearch('');
                }}
                style={({ pressed }) => [
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
                  {schoolClass.name}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {/* ELEV SØGNING */}

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
              color={COLORS.navy}
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
          value={studentSearch}
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

        {studentSearch.length >
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

      {/* ELEVER */}

      <Text
        style={
          styles.headingStudents
        }
      >
        Elev
      </Text>

      {students.length === 0 ? (
        <View
          style={
            styles.noStudentsCard
          }
        >
          <View
            style={
              styles.emptySmallIcon
            }
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={COLORS.navy}
            />
          </View>

          <Text
            style={
              styles.noStudentsTitle
            }
          >
            Ingen elever
          </Text>

          <Text
            style={
              styles.noStudentsText
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
            styles.noStudentsCard
          }
        >
          <View
            style={
              styles.emptySmallIcon
            }
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.navy}
            />
          </View>

          <Text
            style={
              styles.noStudentsTitle
            }
          >
            Ingen elever fundet
          </Text>

          <Text
            style={
              styles.noStudentsText
            }
          >
            Prøv at søge efter et
            andet navn.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.studentRow
          }
        >
          {filteredStudents.map(
            (student) => {
              const selected =
                student.id ===
                selectedStudentId;

              return (
                <Pressable
                  key={
                    student.id
                  }
                  onPress={() =>
                    setSelectedStudentId(
                      student.id
                    )
                  }
                  style={({ pressed }) => [
                    styles.studentChip,

                    selected &&
                      styles
                        .studentChipSelected,

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,

                      selected &&
                        styles
                          .avatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,

                        selected &&
                          styles
                            .avatarTextSelected,
                      ]}
                    >
                      {student.first_name
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.studentChipText,

                        selected &&
                          styles
                            .studentChipTextSelected,
                      ]}
                      numberOfLines={
                        1
                      }
                    >
                      {
                        student.first_name
                      }
                    </Text>

                    <Text
                      style={
                        styles.studentChipLastName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {
                        student.last_name
                      }
                    </Text>
                  </View>
                </Pressable>
              );
            }
          )}
        </ScrollView>
      )}

      {/* PERIODE */}

      <Text
        style={styles.heading}
      >
        Periode
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.chipRow
        }
      >
        {PERIODS.map(
          (period) => {
            const selected =
              period.days ===
              selectedPeriod.days;

            return (
              <Pressable
                key={period.days}
                onPress={() =>
                  setSelectedPeriod(
                    period
                  )
                }
                style={({ pressed }) => [
                  styles.periodChip,

                  selected &&
                    styles
                      .periodChipSelected,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,

                    selected &&
                      styles
                        .periodTextSelected,
                  ]}
                >
                  {period.label}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {loadingStats ? (
        <View
          style={
            styles.loadingArea
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.navy}
          />
        </View>
      ) : selectedStudent ? (
        <>
          {/* VALGT ELEV */}

          <View
            style={
              styles.studentHeader
            }
          >
            <View
              style={
                styles.studentHeaderName
              }
            >
              <Text
                style={
                  styles.studentEyebrow
                }
              >
                {
                  selectedClass
                    ?.name
                }
              </Text>

              <Text
                style={
                  styles.studentName
                }
              >
                {
                  selectedStudent.first_name
                }{' '}
                {
                  selectedStudent.last_name
                }
              </Text>
            </View>

            <View
              style={
                styles.registrationBadge
              }
            >
              <Ionicons
                name="reader-outline"
                size={14}
                color={
                  COLORS.navy
                }
              />

              <Text
                style={
                  styles.registrationText
                }
              >
                {stats.total}{' '}
                registreringer
              </Text>
            </View>
          </View>

          {/* STATS */}

          <View
            style={
              styles.statsRow
            }
          >
            <StatCard
              icon="checkmark-circle-outline"
              value={
                stats.attendance !==
                null
                  ? `${stats.attendance}%`
                  : '–'
              }
              label="Fremmøde"
            />

            <StatCard
              icon="remove-circle-outline"
              value={
                stats.absence !==
                null
                  ? `${stats.absence}%`
                  : '–'
              }
              label="Fravær"
            />

            <StatCard
              icon="time-outline"
              value={
                stats.latePercentage !==
                null
                  ? `${stats.latePercentage}%`
                  : '–'
              }
              label="Forsinket"
            />
          </View>

          {/* GRAF */}

          <View
            style={
              styles.chartCard
            }
          >
            <View
              style={
                styles.chartHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.chartTitle
                  }
                >
                  Fremmøde over tid
                </Text>

                <Text
                  style={
                    styles.chartSubtitle
                  }
                >
                  {
                    selectedPeriod.label
                  }
                  {' · '}
                  {
                    chartData.length
                  }{' '}
                  {chartData.length ===
                  1
                    ? 'protokol'
                    : 'protokoller'}
                </Text>
              </View>

              <View
                style={
                  styles.chartIcon
                }
              >
                <Ionicons
                  name="trending-up-outline"
                  size={19}
                  color={
                    COLORS.navy
                  }
                />
              </View>
            </View>

            <View
              style={
                styles.axisDescription
              }
            >
              <Text
                style={
                  styles.axisText
                }
              >
                Y · Fremmøde %
              </Text>

              <Text
                style={
                  styles.axisText
                }
              >
                X · Protokoldato
              </Text>
            </View>

            {chartData.length >
            0 ? (
              <AttendanceChart
                data={
                  chartData
                }
                width={Math.max(
                  width - 84,
                  280
                )}
              />
            ) : (
              <EmptyChart />
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
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
          name={icon}
          size={18}
          color={COLORS.navy}
        />
      </View>

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function AttendanceChart({
  data,
  width,
}: {
  data: ChartPoint[];
  width: number;
}) {
  const height = 245;

  const left = 42;
  const right = 10;
  const top = 18;
  const bottom = 42;

  const graphWidth =
    width -
    left -
    right;

  const graphHeight =
    height -
    top -
    bottom;

  function getX(
    index: number
  ) {
    if (
      data.length === 1
    ) {
      return (
        left +
        graphWidth / 2
      );
    }

    return (
      left +
      (index /
        (data.length - 1)) *
        graphWidth
    );
  }

  function getY(
    value: number
  ) {
    return (
      top +
      ((100 - value) /
        100) *
        graphHeight
    );
  }

  const points =
    data
      .map(
        (point, index) =>
          `${getX(
            index
          )},${getY(
            point.value
          )}`
      )
      .join(' ');

  const labelIndexes =
    getChartLabelIndexes(
      data.length
    );

  return (
    <Svg
      width={width}
      height={height}
    >
      {[100, 75, 50, 25, 0].map(
        (value) => {
          const y =
            getY(value);

          return (
            <React.Fragment
              key={value}
            >
              <Line
                x1={left}
                y1={y}
                x2={
                  width -
                  right
                }
                y2={y}
                stroke={
                  COLORS.grid
                }
                strokeWidth={1}
              />

              <SvgText
                x={left - 7}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill={
                  COLORS.lightMuted
                }
              >
                {value}%
              </SvgText>
            </React.Fragment>
          );
        }
      )}

      <Line
        x1={left}
        y1={top}
        x2={left}
        y2={
          top +
          graphHeight
        }
        stroke="#D1D5DB"
        strokeWidth={1}
      />

      <Line
        x1={left}
        y1={
          top +
          graphHeight
        }
        x2={
          width -
          right
        }
        y2={
          top +
          graphHeight
        }
        stroke="#D1D5DB"
        strokeWidth={1}
      />

      {data.length > 1 && (
        <Polyline
          points={points}
          fill="none"
          stroke={
            COLORS.navy
          }
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {data.map(
        (point, index) => (
          <Circle
            key={point.key}
            cx={
              getX(index)
            }
            cy={getY(
              point.value
            )}
            r={4.5}
            fill={
              COLORS.white
            }
            stroke={
              COLORS.navy
            }
            strokeWidth={3}
          />
        )
      )}

      {labelIndexes.map(
        (index) => (
          <SvgText
            key={
              data[index]
                .key
            }
            x={
              getX(index)
            }
            y={height - 14}
            textAnchor="middle"
            fontSize="10"
            fill={
              COLORS.lightMuted
            }
          >
            {
              data[index]
                .label
            }
          </SvgText>
        )
      )}
    </Svg>
  );
}

function EmptyChart() {
  return (
    <View
      style={
        styles.emptyChart
      }
    >
      <View
        style={
          styles.emptyIcon
        }
      >
        <Ionicons
          name="analytics-outline"
          size={22}
          color={COLORS.navy}
        />
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        Ingen data i perioden
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        Eleven har ingen
        afsluttede registreringer
        i den valgte periode.
      </Text>
    </View>
  );
}

function getPeriodStart(
  days: number
) {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  date.setDate(
    date.getDate() -
      days +
      1
  );

  return date;
}

function formatProtocolDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'da-DK',
    {
      day: '2-digit',
      month: '2-digit',
    }
  );
}

function getChartLabelIndexes(
  count: number
) {
  if (count <= 0) {
    return [];
  }

  if (count <= 5) {
    return Array.from(
      {
        length: count,
      },
      (_, index) =>
        index
    );
  }

  return Array.from(
    new Set([
      0,

      Math.round(
        (count - 1) *
          0.25
      ),

      Math.round(
        (count - 1) *
          0.5
      ),

      Math.round(
        (count - 1) *
          0.75
      ),

      count - 1,
    ])
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
      paddingHorizontal: 22,
      paddingTop: 64,
      paddingBottom: 120,
    },

    center: {
      flex: 1,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,
    },

    /* HEADER */

    header: {
      marginTop: 4,
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

      lineHeight: 22,

      marginTop: 7,
    },

    /* HEADINGS */

    heading: {
      fontSize: 13,
      fontWeight: '600',

      color: COLORS.muted,

      marginBottom: 9,
    },

    headingStudents: {
      fontSize: 13,
      fontWeight: '600',

      color: COLORS.muted,

      marginTop: 14,
      marginBottom: 9,
    },

    /* CLASS */

    chipRow: {
      gap: 8,

      paddingRight: 22,
      paddingBottom: 4,
    },

    classChip: {
      height: 40,

      paddingHorizontal: 16,

      borderRadius: 13,

      justifyContent:
        'center',

      borderWidth: 1,

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
      fontSize: 14,
      fontWeight: '600',

      color: COLORS.muted,
    },

    classChipTextSelected: {
      color: COLORS.white,
    },

    /* SEARCH */

    searchSection: {
      marginTop: 20,
    },

    searchLabelRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      marginBottom: 8,
    },

    searchLabelIcon: {
      width: 26,
      height: 26,

      borderRadius: 8,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    searchLabel: {
      fontSize: 13,
      fontWeight: '600',

      color: COLORS.navy,
    },

    searchInput: {
      height: 52,

      backgroundColor:
        COLORS.white,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      paddingHorizontal: 16,

      fontSize: 15,

      color: COLORS.text,
    },

    searchResultText: {
      fontSize: 11,

      color:
        COLORS.lightMuted,

      marginTop: 6,
      marginLeft: 2,
    },

    /* STUDENTS */

    studentRow: {
      gap: 9,

      paddingRight: 22,
      paddingBottom: 4,
    },

    studentChip: {
      minHeight: 48,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      paddingLeft: 6,
      paddingRight: 14,
      paddingVertical: 5,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,
    },

    studentChipSelected: {
      backgroundColor:
        COLORS.navySoft,

      borderColor:
        COLORS.navySoft,
    },

    avatar: {
      width: 34,
      height: 34,

      borderRadius: 11,

      backgroundColor:
        COLORS.soft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    avatarSelected: {
      backgroundColor:
        COLORS.navy,
    },

    avatarText: {
      fontSize: 13,
      fontWeight: '700',

      color: COLORS.muted,
    },

    avatarTextSelected: {
      color: COLORS.white,
    },

    studentChipText: {
      maxWidth: 120,

      fontSize: 13,
      fontWeight: '600',

      color: COLORS.text,
    },

    studentChipTextSelected: {
      color: COLORS.navy,
    },

    studentChipLastName: {
      maxWidth: 120,

      fontSize: 11,

      color: COLORS.muted,

      marginTop: 1,
    },

    /* EMPTY STUDENTS */

    noStudentsCard: {
      minHeight: 120,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

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

    emptySmallIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    noStudentsTitle: {
      fontSize: 14,
      fontWeight: '700',

      color: COLORS.text,

      marginTop: 8,
    },

    noStudentsText: {
      fontSize: 12,

      color: COLORS.muted,

      marginTop: 3,

      textAlign: 'center',
    },

    /* PERIOD */

    periodChip: {
      height: 36,

      paddingHorizontal: 14,

      borderRadius: 12,

      justifyContent:
        'center',

      backgroundColor:
        COLORS.soft,
    },

    periodChipSelected: {
      backgroundColor:
        COLORS.navySoft,
    },

    periodText: {
      fontSize: 13,
      fontWeight: '600',

      color: COLORS.muted,
    },

    periodTextSelected: {
      color: COLORS.navy,
    },

    pressed: {
      opacity: 0.7,
    },

    loadingArea: {
      minHeight: 320,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    /* SELECTED STUDENT */

    studentHeader: {
      marginTop: 28,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      gap: 12,
    },

    studentHeaderName: {
      flex: 1,
    },

    studentEyebrow: {
      fontSize: 12,

      color: COLORS.muted,
    },

    studentName: {
      fontSize: 21,
      fontWeight: '700',

      color: COLORS.text,

      marginTop: 2,
    },

    registrationBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      backgroundColor:
        COLORS.navySoft,

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 10,
    },

    registrationText: {
      fontSize: 11,
      fontWeight: '600',

      color: COLORS.navy,
    },

    /* STATS */

    statsRow: {
      flexDirection: 'row',

      gap: 9,

      marginTop: 18,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    statCard: {
      flex: 1,

      minHeight: 108,

      borderRadius: 18,

      backgroundColor:
        COLORS.white,

      alignItems: 'center',
      justifyContent:
        'center',

      paddingHorizontal: 6,

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

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 7,
    },

    statValue: {
      fontSize: 21,
      fontWeight: '800',

      color: COLORS.navy,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '600',

      color: COLORS.muted,

      marginTop: 3,

      textAlign: 'center',
    },

    /* CHART */

    chartCard: {
      marginTop: 26,

      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 18,

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

    chartHeader: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      gap: 12,
    },

    chartTitle: {
      fontSize: 17,
      fontWeight: '700',

      color: COLORS.text,
    },

    chartSubtitle: {
      fontSize: 12,

      color: COLORS.muted,

      marginTop: 3,
    },

    chartIcon: {
      width: 36,
      height: 36,

      borderRadius: 11,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    axisDescription: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      marginTop: 16,
      marginBottom: 4,
    },

    axisText: {
      fontSize: 10,

      color:
        COLORS.lightMuted,
    },

    /* EMPTY CHART */

    emptyChart: {
      minHeight: 220,

      alignItems: 'center',
      justifyContent:
        'center',

      paddingHorizontal: 25,
    },

    emptyIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',

      color: COLORS.text,

      marginTop: 10,
    },

    emptyText: {
      fontSize: 13,

      color: COLORS.muted,

      textAlign: 'center',

      lineHeight: 19,

      marginTop: 5,
    },
  });