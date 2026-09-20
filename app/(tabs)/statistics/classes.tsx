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
  status: AttendanceStatus;
};

type Period = {
  label: string;
  days: number;
};

type ChartPoint = {
  key: string;
  label: string;
  date: string;
  value: number;
  attended: number;
  total: number;
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

export default function ClassStatisticsScreen() {
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
    selectedPeriod,
    setSelectedPeriod,
  ] = useState<Period>(
    PERIODS[1]
  );

  const [
    studentCount,
    setStudentCount,
  ] = useState(0);

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
          .select(
            'id',
            {
              count: 'exact',
              head: true,
            }
          )
          .eq(
            'class_id',
            selectedClassId
          )
          .eq(
            'active',
            true
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

      setStudentCount(
        studentsResult.count ??
          0
      );

      const freshSessions =
        (sessionsResult.data ??
          []) as AttendanceSession[];

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
        'Kunne ikke hente klassestatistik:',
        error
      );
    } finally {
      setLoadingStats(
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

  const stats =
    useMemo(() => {
      let present = 0;
      let late = 0;
      let absent = 0;

      for (
        const record of records
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

        attendance:
          total > 0
            ? Math.round(
                ((present + late) /
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

        late:
          total > 0
            ? Math.round(
                (late /
                  total) *
                  100
              )
            : null,
      };
    }, [records]);

  const chartData =
    useMemo<
      ChartPoint[]
    >(() => {
      return sessions
        .map(
          (session) => {
            const sessionRecords =
              records.filter(
                (record) =>
                  record.session_id ===
                  session.id
              );

            if (
              sessionRecords.length ===
              0
            ) {
              return null;
            }

            const attended =
              sessionRecords.filter(
                (record) =>
                  record.status ===
                    'present' ||
                  record.status ===
                    'late'
              ).length;

            const percentage =
              Math.round(
                (attended /
                  sessionRecords.length) *
                  100
              );

            return {
              key:
                session.id,

              date:
                session.finalized_at,

              label:
                formatShortDate(
                  session.finalized_at
                ),

              value:
                percentage,

              attended,

              total:
                sessionRecords.length,
            };
          }
        )
        .filter(
          (
            point
          ): point is ChartPoint =>
            point !== null
        );
    }, [
      sessions,
      records,
    ]);

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
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
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
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
          Klassestatistik
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Følg klassens fremmøde
          og udvikling over tid.
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
                onPress={() =>
                  setSelectedClassId(
                    schoolClass.id
                  )
                }
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

      {/* PERIODE */}

      <Text
        style={
          styles.heading
        }
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
                key={
                  period.days
                }
                onPress={() =>
                  setSelectedPeriod(
                    period
                  )
                }
                style={({
                  pressed,
                }) => [
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
      ) : (
        <>
          {/* OVERBLIK */}

          <View
            style={
              styles.overviewHeader
            }
          >
            <View
              style={
                styles.overviewName
              }
            >
              <Text
                style={
                  styles.overviewEyebrow
                }
              >
                Overblik
              </Text>

              <Text
                style={
                  styles.overviewTitle
                }
              >
                {selectedClass
                  ?.name ??
                  'Klasse'}
              </Text>
            </View>

            <View
              style={
                styles.sessionBadge
              }
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={
                  COLORS.navy
                }
              />

              <Text
                style={
                  styles.sessionBadgeText
                }
              >
                {sessions.length}{' '}
                {sessions.length ===
                1
                  ? 'protokol'
                  : 'protokoller'}
              </Text>
            </View>
          </View>

          {/* HOVEDTAL */}

          <View
            style={
              styles.statsRow
            }
          >
            <StatCard
              icon="people-outline"
              value={`${studentCount}`}
              label="Elever"
            />

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
          </View>

          {/* EKSTRA TAL */}

          <View
            style={
              styles.secondaryStatsRow
            }
          >
            <View
              style={
                styles.secondaryStat
              }
            >
              <View
                style={
                  styles.secondaryStatIcon
                }
              >
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.secondaryStatLabel
                  }
                >
                  Forsinket
                </Text>

                <Text
                  style={
                    styles.secondaryStatValue
                  }
                >
                  {stats.late !==
                  null
                    ? `${stats.late}%`
                    : '–'}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.secondaryStat
              }
            >
              <View
                style={
                  styles.secondaryStatIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.secondaryStatLabel
                  }
                >
                  Protokoller
                </Text>

                <Text
                  style={
                    styles.secondaryStatValue
                  }
                >
                  {sessions.length}
                </Text>
              </View>
            </View>
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
                    sessions.length
                  }{' '}
                  {sessions.length ===
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
              <>
                <AttendanceChart
                  data={
                    chartData
                  }
                  width={Math.max(
                    width - 84,
                    280
                  )}
                />

                <View
                  style={
                    styles.chartHint
                  }
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={14}
                    color={
                      COLORS.lightMuted
                    }
                  />

                  <Text
                    style={
                      styles.chartHintText
                    }
                  >
                    Tryk på et punkt
                    for detaljer
                  </Text>
                </View>
              </>
            ) : (
              <EmptyChart />
            )}
          </View>
        </>
      )}
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
  const [
    selectedPoint,
    setSelectedPoint,
  ] = useState<
    ChartPoint | null
  >(null);

  useEffect(() => {
    setSelectedPoint(null);
  }, [data]);

  const height = 245;

  const left = 42;
  const right = 12;
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

  const timestamps =
    data.map(
      (point) =>
        new Date(
          point.date
        ).getTime()
    );

  const minTime =
    Math.min(
      ...timestamps
    );

  const maxTime =
    Math.max(
      ...timestamps
    );

  const timeRange =
    maxTime -
    minTime;

  function getX(
    point: ChartPoint
  ) {
    if (
      data.length === 1 ||
      timeRange === 0
    ) {
      return (
        left +
        graphWidth / 2
      );
    }

    const timestamp =
      new Date(
        point.date
      ).getTime();

    const progress =
      (timestamp -
        minTime) /
      timeRange;

    return (
      left +
      progress *
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
        (point) =>
          `${getX(
            point
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
    <View>
      <Svg
        width={width}
        height={height}
      >
        {/* HORISONTALE LINJER */}

        {[
          100,
          75,
          50,
          25,
          0,
        ].map(
          (value) => {
            const y =
              getY(value);

            return (
              <React.Fragment
                key={
                  value
                }
              >
                <Line
                  x1={
                    left
                  }
                  y1={y}
                  x2={
                    width -
                    right
                  }
                  y2={y}
                  stroke={
                    COLORS.grid
                  }
                  strokeWidth={
                    1
                  }
                />

                <SvgText
                  x={
                    left -
                    7
                  }
                  y={
                    y +
                    4
                  }
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

        {/* Y-AKSE */}

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

        {/* X-AKSE */}

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

        {/* LINJE */}

        {data.length >
          1 && (
          <Polyline
            points={
              points
            }
            fill="none"
            stroke={
              COLORS.navy
            }
            strokeWidth={
              3
            }
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* PUNKTER */}

        {data.map(
          (point) => {
            const selected =
              selectedPoint
                ?.key ===
              point.key;

            return (
              <React.Fragment
                key={
                  point.key
                }
              >
                {/* STØRRE TRYKOMRÅDE */}

                <Circle
                  cx={
                    getX(
                      point
                    )
                  }
                  cy={
                    getY(
                      point.value
                    )
                  }
                  r={15}
                  fill="transparent"
                  onPress={() =>
                    setSelectedPoint(
                      point
                    )
                  }
                />

                <Circle
                  cx={
                    getX(
                      point
                    )
                  }
                  cy={
                    getY(
                      point.value
                    )
                  }
                  r={
                    selected
                      ? 6
                      : 4.5
                  }
                  fill={
                    selected
                      ? COLORS.navy
                      : COLORS.white
                  }
                  stroke={
                    COLORS.navy
                  }
                  strokeWidth={
                    selected
                      ? 2
                      : 3
                  }
                  onPress={() =>
                    setSelectedPoint(
                      point
                    )
                  }
                />
              </React.Fragment>
            );
          }
        )}

        {/* X LABELS */}

        {labelIndexes.map(
          (index) => {
            const point =
              data[
                index
              ];

            return (
              <SvgText
                key={
                  point.key
                }
                x={
                  getX(
                    point
                  )
                }
                y={
                  height -
                  14
                }
                textAnchor="middle"
                fontSize="10"
                fill={
                  COLORS.lightMuted
                }
              >
                {
                  point.label
                }
              </SvgText>
            );
          }
        )}
      </Svg>

      {/* VALGT PUNKT */}

      {selectedPoint && (
        <View
          style={
            styles.pointDetails
          }
        >
          <View
            style={
              styles.pointDetailsTop
            }
          >
            <View
              style={
                styles.pointDateRow
              }
            >
              <View
                style={
                  styles.pointIcon
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
                  styles.pointDate
                }
              >
                {formatFullDate(
                  selectedPoint.date
                )}
              </Text>
            </View>

            <Text
              style={
                styles.pointPercentage
              }
            >
              {
                selectedPoint.value
              }
              %
            </Text>
          </View>

          <View
            style={
              styles.pointDivider
            }
          />

          <View
            style={
              styles.pointBottom
            }
          >
            <View>
              <Text
                style={
                  styles.pointSmallLabel
                }
              >
                Fremmødt
              </Text>

              <Text
                style={
                  styles.pointSmallValue
                }
              >
                {
                  selectedPoint.attended
                }{' '}
                af{' '}
                {
                  selectedPoint.total
                }
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.pointSmallLabel,
                  styles.pointRight,
                ]}
              >
                Fremmøde
              </Text>

              <Text
                style={[
                  styles.pointSmallValue,
                  styles.pointRight,
                ]}
              >
                {
                  selectedPoint.value
                }
                %
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
        Ingen data i perioden
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        Grafen vises, når der
        findes afsluttede
        protokoller.
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

function formatShortDate(
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

function formatFullDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'da-DK',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
}

function getChartLabelIndexes(
  count: number
) {
  if (
    count <= 0
  ) {
    return [];
  }

  if (
    count <= 5
  ) {
    return Array.from(
      {
        length:
          count,
      },
      (
        _,
        index
      ) =>
        index
    );
  }

  return Array.from(
    new Set([
      0,

      Math.round(
        (count -
          1) *
          0.25
      ),

      Math.round(
        (count -
          1) *
          0.5
      ),

      Math.round(
        (count -
          1) *
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

      color:
        COLORS.text,
    },

    subtitle: {
      fontSize: 15,

      color:
        COLORS.muted,

      lineHeight: 22,

      marginTop: 7,
    },

    /* FILTERS */

    heading: {
      fontSize: 13,
      fontWeight: '600',

      color:
        COLORS.muted,

      marginTop: 18,
      marginBottom: 9,
    },

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

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,
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

      color:
        COLORS.muted,
    },

    classChipTextSelected: {
      color:
        COLORS.white,
    },

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

      color:
        COLORS.muted,
    },

    periodTextSelected: {
      color:
        COLORS.navy,
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

    /* OVERVIEW */

    overviewHeader: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      gap: 12,

      marginTop: 28,
    },

    overviewName: {
      flex: 1,
    },

    overviewEyebrow: {
      fontSize: 12,

      color:
        COLORS.muted,
    },

    overviewTitle: {
      fontSize: 21,
      fontWeight: '700',

      color:
        COLORS.text,

      marginTop: 2,
    },

    sessionBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 10,

      backgroundColor:
        COLORS.navySoft,
    },

    sessionBadgeText: {
      fontSize: 11,
      fontWeight: '600',

      color:
        COLORS.navy,
    },

    /* STATS */

    statsRow: {
      flexDirection: 'row',

      gap: 10,

      marginTop: 18,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    statCard: {
      flex: 1,

      minHeight: 108,

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent:
        'center',

      paddingHorizontal: 7,
      paddingVertical: 12,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity:
        0.04,

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

      color:
        COLORS.navy,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '600',

      color:
        COLORS.muted,

      marginTop: 3,

      textAlign: 'center',
    },

    secondaryStatsRow: {
      flexDirection: 'row',

      gap: 10,

      marginTop: 8,

      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    secondaryStat: {
      flex: 1,

      minHeight: 68,

      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 10,

      paddingHorizontal: 13,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity:
        0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    secondaryStatIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    secondaryStatLabel: {
      fontSize: 11,

      color:
        COLORS.muted,
    },

    secondaryStatValue: {
      fontSize: 17,
      fontWeight: '700',

      color:
        COLORS.navy,

      marginTop: 1,
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

      shadowOpacity:
        0.04,

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

      color:
        COLORS.text,
    },

    chartSubtitle: {
      fontSize: 12,

      color:
        COLORS.muted,

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

    chartHint: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 5,

      marginTop: 2,
    },

    chartHintText: {
      fontSize: 10,

      color:
        COLORS.lightMuted,
    },

    /* POINT DETAILS */

    pointDetails: {
      marginTop: 14,

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 16,

      padding: 14,
    },

    pointDetailsTop: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      gap: 12,
    },

    pointDateRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,
    },

    pointIcon: {
      width: 30,
      height: 30,

      borderRadius: 9,

      backgroundColor:
        COLORS.white,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    pointDate: {
      fontSize: 14,
      fontWeight: '600',

      color:
        COLORS.text,
    },

    pointPercentage: {
      fontSize: 22,
      fontWeight: '800',

      color:
        COLORS.navy,
    },

    pointDivider: {
      height: 1,

      backgroundColor:
        '#DCE5EE',

      marginVertical: 12,
    },

    pointBottom: {
      flexDirection: 'row',

      justifyContent:
        'space-between',
    },

    pointSmallLabel: {
      fontSize: 11,

      color:
        COLORS.muted,
    },

    pointSmallValue: {
      fontSize: 14,
      fontWeight: '700',

      color:
        COLORS.navy,

      marginTop: 2,
    },

    pointRight: {
      textAlign: 'right',
    },

    /* EMPTY */

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

      color:
        COLORS.text,

      marginTop: 10,
    },

    emptyText: {
      fontSize: 13,

      color:
        COLORS.muted,

      textAlign: 'center',

      lineHeight: 19,

      marginTop: 5,
    },
  });