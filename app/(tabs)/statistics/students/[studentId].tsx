import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useLocalSearchParams,
} from 'expo-router';

import Svg, {
  Circle,
  Line,
  Path,
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

type Student = {
  id: string;
  class_id: string;
  first_name: string;
  last_name: string;
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
  fullLabel: string;
  value: number;
  status:
    | 'present'
    | 'absent';
  wasLate: boolean;
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

export default function StudentStatisticsDetailScreen() {
  const {
    width,
  } = useWindowDimensions();

  const params =
    useLocalSearchParams<{
      studentId?:
        | string
        | string[];

      classId?:
        | string
        | string[];
    }>();

  const studentId =
    Array.isArray(
      params.studentId
    )
      ? params.studentId[0]
      : params.studentId ??
        null;

  const parameterClassId =
    Array.isArray(
      params.classId
    )
      ? params.classId[0]
      : params.classId ??
        null;

  const [
    student,
    setStudent,
  ] = useState<Student | null>(
    null
  );

  const [
    schoolClass,
    setSchoolClass,
  ] = useState<SchoolClass | null>(
    null
  );

  const [
    resolvedClassId,
    setResolvedClassId,
  ] = useState<
    string | null
  >(parameterClassId);

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

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingStats,
    setLoadingStats,
  ] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    loadStudentContext();
  }, [
    studentId,
    parameterClassId,
  ]);

  useEffect(() => {
    if (
      !studentId ||
      !resolvedClassId
    ) {
      return;
    }

    loadStatistics();
  }, [
    studentId,
    resolvedClassId,
    selectedPeriod.days,
  ]);

  async function loadStudentContext() {
    if (!studentId) {
      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from('students')
        .select(`
          id,
          class_id,
          first_name,
          last_name
        `)
        .eq(
          'id',
          studentId
        )
        .single();

      if (error) {
        throw error;
      }

      const freshStudent =
        data as Student;

      setStudent(
        freshStudent
      );

      const effectiveClassId =
        parameterClassId ??
        freshStudent.class_id;

      setResolvedClassId(
        effectiveClassId
      );

      const {
        data: classData,
        error: classError,
      } = await supabase
        .from('classes')
        .select(`
          id,
          name
        `)
        .eq(
          'id',
          effectiveClassId
        )
        .single();

      if (classError) {
        throw classError;
      }

      setSchoolClass(
        classData as SchoolClass
      );
    } catch (error) {
      console.error(
        'Kunne ikke hente elev:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics() {
    if (
      !studentId ||
      !resolvedClassId
    ) {
      return;
    }

    try {
      setLoadingStats(
        true
      );

      const since =
        getPeriodStart(
          selectedPeriod.days
        );

      const {
        data: sessionsData,
        error: sessionsError,
      } = await supabase
        .from(
          'attendance_sessions'
        )
        .select(`
          id,
          finalized_at
        `)
        .eq(
          'class_id',
          resolvedClassId
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
            ascending:
              true,
          }
        );

      if (sessionsError) {
        throw sessionsError;
      }

      const freshSessions =
        (sessionsData ??
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
        data: recordsData,
        error: recordsError,
      } = await supabase
        .from(
          'attendance_records'
        )
        .select(`
          session_id,
          status
        `)
        .eq(
          'student_id',
          studentId
        )
        .in(
          'session_id',
          sessionIds
        );

      if (recordsError) {
        throw recordsError;
      }

      setRecords(
        (recordsData ??
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

  const stats =
    useMemo(() => {
      let present =
        0;

      let late =
        0;

      let absent =
        0;

      for (
        const record of
        records
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

      const attendanceCount =
        present +
        late;

      const total =
        attendanceCount +
        absent;

      return {
        present,
        late,
        absent,
        total,
        attendanceCount,

        attendance:
          total >
          0
            ? Math.round(
                (
                  attendanceCount /
                  total
                ) *
                  100
              )
            : null,

        absence:
          total >
          0
            ? Math.round(
                (
                  absent /
                  total
                ) *
                  100
              )
            : null,
      };
    }, [
      records,
    ]);

  const latestActivity =
    useMemo(() => {
      let lastAttendance:
        AttendanceSession | null =
        null;

      let lastAbsence:
        AttendanceSession | null =
        null;

      for (
        let index =
          sessions.length -
          1;
        index >= 0;
        index--
      ) {
        const session =
          sessions[index];

        const record =
          records.find(
            (item) =>
              item.session_id ===
              session.id
          );

        if (!record) {
          continue;
        }

        if (
          !lastAttendance &&
          (
            record.status ===
              'present' ||
            record.status ===
              'late'
          )
        ) {
          lastAttendance =
            session;
        }

        if (
          !lastAbsence &&
          record.status ===
            'absent'
        ) {
          lastAbsence =
            session;
        }

        if (
          lastAttendance &&
          lastAbsence
        ) {
          break;
        }
      }

      return {
        attendance:
          lastAttendance
            ? formatFullDate(
                lastAttendance
                  .finalized_at
              )
            : null,

        absence:
          lastAbsence
            ? formatFullDate(
                lastAbsence
                  .finalized_at
              )
            : null,
      };
    }, [
      sessions,
      records,
    ]);

  const chartData =
    useMemo<
      ChartPoint[]
    >(() => {
      let attended =
        0;

      let total =
        0;

      const points:
        ChartPoint[] =
        [];

      for (
        const session of
        sessions
      ) {
        const record =
          records.find(
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

        const value =
          Math.round(
            (
              attended /
              total
            ) *
              100
          );

        points.push({
          key:
            session.id,

          label:
            formatShortDate(
              session.finalized_at
            ),

          fullLabel:
            formatFullDate(
              session.finalized_at
            ),

          value,

          status:
            record.status ===
            'absent'
              ? 'absent'
              : 'present',

          wasLate:
            record.status ===
            'late',
        });
      }

      return points;
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
          color={
            COLORS.navy
          }
        />
      </View>
    );
  }

  if (!student) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Eleven kunne ikke findes
        </Text>
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
            styles.eyebrow
          }
        >
          {
            schoolClass
              ?.name ??
            'Elevstatistik'
          }
        </Text>

        <Text
          style={
            styles.title
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
            styles.subtitle
          }
        >
          Se elevens fremmøde,
          fravær og udvikling over
          tid.
        </Text>
      </View>

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
                  {
                    period.label
                  }
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {loadingStats ? (
        <View
          style={
            styles.loadingStats
          }
        >
          <ActivityIndicator
            size="small"
            color={
              COLORS.navy
            }
          />
        </View>
      ) : (
        <>
          {/* REGISTRERINGER */}

          <View
            style={
              styles.registrationRow
            }
          >
            <View
              style={
                styles.registrationIcon
              }
            >
              <Ionicons
                name="reader-outline"
                size={17}
                color={
                  COLORS.navy
                }
              />
            </View>

            <Text
              style={
                styles.registrationText
              }
            >
              {stats.total}{' '}
              {stats.total ===
              1
                ? 'registrering'
                : 'registreringer'}
            </Text>
          </View>

          {/* FREMMØDE / FRAVÆR */}

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
              count={`${stats.attendanceCount} ${
                stats.attendanceCount ===
                1
                  ? 'gang'
                  : 'gange'
              }`}
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
              count={`${stats.absent} ${
                stats.absent ===
                1
                  ? 'gang'
                  : 'gange'
              }`}
            />
          </View>

          {/* FORSINKELSER */}

          <View
            style={
              styles.lateCard
            }
          >
            <View
              style={
                styles.lateLeft
              }
            >
              <View
                style={
                  styles.lateIcon
                }
              >
                <Ionicons
                  name="time-outline"
                  size={19}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.lateTitle
                  }
                >
                  Forsinkelser
                </Text>

                <Text
                  style={
                    styles.lateSubtitle
                  }
                >
                  Registreret i perioden
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.lateCount
              }
            >
              {
                stats.late
              }
            </Text>
          </View>

          {/* SENESTE */}

          <View
            style={
              styles.latestCard
            }
          >
            <LatestRow
              icon="checkmark-circle-outline"
              label="Seneste fremmøde"
              value={
                latestActivity.attendance ??
                'Ingen i perioden'
              }
            />

            <View
              style={
                styles.latestDivider
              }
            />

            <LatestRow
              icon="remove-circle-outline"
              label="Seneste fravær"
              value={
                latestActivity.absence ??
                'Ingen i perioden'
              }
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
                  width -
                    84,
                  280
                )}
              />
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
  count,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  value:
    string;

  label:
    string;

  count:
    string;
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
          name={
            icon
          }
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

      <Text
        style={
          styles.statCount
        }
      >
        {count}
      </Text>
    </View>
  );
}

function LatestRow({
  icon,
  label,
  value,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;

  value:
    string;
}) {
  return (
    <View
      style={
        styles.latestRow
      }
    >
      <View
        style={
          styles.latestIcon
        }
      >
        <Ionicons
          name={
            icon
          }
          size={17}
          color={
            COLORS.navy
          }
        />
      </View>

      <View
        style={
          styles.latestText
        }
      >
        <Text
          style={
            styles.latestLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.latestValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function AttendanceChart({
  data,
  width,
}: {
  data:
    ChartPoint[];

  width:
    number;
}) {
  const [
    selectedPointKey,
    setSelectedPointKey,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    setSelectedPointKey(
      null
    );
  }, [
    data,
  ]);

  const selectedPoint =
    data.find(
      (point) =>
        point.key ===
        selectedPointKey
    ) ??
    null;

  const height =
    245;

  const left =
    42;

  const right =
    10;

  const top =
    18;

  const bottom =
    42;

  const graphWidth =
    width -
    left -
    right;

  const graphHeight =
    height -
    top -
    bottom;

  function getX(
    index:
      number
  ) {
    if (
      data.length ===
      1
    ) {
      return (
        left +
        graphWidth /
          2
      );
    }

    return (
      left +
      (
        index /
        (
          data.length -
          1
        )
      ) *
        graphWidth
    );
  }

  function getY(
    value:
      number
  ) {
    return (
      top +
      (
        (
          100 -
          value
        ) /
        100
      ) *
        graphHeight
    );
  }

  /*
   * Naturlig spline-kurve.
   */
  function createSmoothPath() {
    if (
      data.length <
      2
    ) {
      return '';
    }

    const chartPoints =
      data.map(
        (
          point,
          index
        ) => ({
          x:
            getX(
              index
            ),

          y:
            getY(
              point.value
            ),
        })
      );

    let path =
      `M ${chartPoints[0].x} ${chartPoints[0].y}`;

    const smoothness =
      0.16;

    for (
      let index =
        0;
      index <
      chartPoints.length -
        1;
      index++
    ) {
      const p0 =
        chartPoints[
          Math.max(
            0,
            index -
              1
          )
        ];

      const p1 =
        chartPoints[
          index
        ];

      const p2 =
        chartPoints[
          index +
            1
        ];

      const p3 =
        chartPoints[
          Math.min(
            chartPoints.length -
              1,
            index +
              2
          )
        ];

      const control1X =
        p1.x +
        (
          p2.x -
          p0.x
        ) *
          smoothness;

      const control1Y =
        p1.y +
        (
          p2.y -
          p0.y
        ) *
          smoothness;

      const control2X =
        p2.x -
        (
          p3.x -
          p1.x
        ) *
          smoothness;

      const control2Y =
        p2.y -
        (
          p3.y -
          p1.y
        ) *
          smoothness;

      path +=
        ` C ${control1X} ${control1Y},` +
        ` ${control2X} ${control2Y},` +
        ` ${p2.x} ${p2.y}`;
    }

    return path;
  }

  const labelIndexes =
    getChartLabelIndexes(
      data.length
    );

  return (
    <View>
      <Svg
        width={
          width
        }
        height={
          height
        }
      >
        {[
          100,
          75,
          50,
          25,
          0,
        ].map(
          (value) => {
            const y =
              getY(
                value
              );

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
                  y1={
                    y
                  }
                  x2={
                    width -
                    right
                  }
                  y2={
                    y
                  }
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
                  {
                    value
                  }
                  %
                </SvgText>
              </React.Fragment>
            );
          }
        )}

        <Line
          x1={
            left
          }
          y1={
            top
          }
          x2={
            left
          }
          y2={
            top +
            graphHeight
          }
          stroke="#D1D5DB"
          strokeWidth={
            1
          }
        />

        <Line
          x1={
            left
          }
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
          strokeWidth={
            1
          }
        />

        {data.length >
          1 && (
          <Path
            d={
              createSmoothPath()
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

        {data.map(
          (
            point,
            index
          ) => {
            const selected =
              point.key ===
              selectedPointKey;

            const x =
              getX(
                index
              );

            const y =
              getY(
                point.value
              );

            return (
              <React.Fragment
                key={
                  point.key
                }
              >
                <Circle
                  cx={
                    x
                  }
                  cy={
                    y
                  }
                  r={
                    14
                  }
                  fill="transparent"
                  onPress={() =>
                    setSelectedPointKey(
                      point.key
                    )
                  }
                />

                <Circle
                  cx={
                    x
                  }
                  cy={
                    y
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
                    3
                  }
                  onPress={() =>
                    setSelectedPointKey(
                      point.key
                    )
                  }
                />
              </React.Fragment>
            );
          }
        )}

        {labelIndexes.map(
          (index) => (
            <SvgText
              key={
                data[
                  index
                ].key
              }
              x={
                getX(
                  index
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
                data[
                  index
                ].label
              }
            </SvgText>
          )
        )}
      </Svg>

      <Text
        style={
          styles.chartHint
        }
      >
        Tryk på et punkt for at se
        registreringen.
      </Text>

      {selectedPoint && (
        <View
          style={
            styles.pointDetails
          }
        >
          <View
            style={
              styles.pointIcon
            }
          >
            <Ionicons
              name={
                selectedPoint.status ===
                'absent'
                  ? 'remove-circle-outline'
                  : selectedPoint.wasLate
                    ? 'time-outline'
                    : 'checkmark-circle-outline'
              }
              size={
                18
              }
              color={
                COLORS.navy
              }
            />
          </View>

          <View
            style={
              styles.pointText
            }
          >
            <Text
              style={
                styles.pointStatus
              }
            >
              {selectedPoint.status ===
              'absent'
                ? 'Fravær'
                : selectedPoint.wasLate
                  ? 'Fremmøde · Forsinket'
                  : 'Fremmøde'}
            </Text>

            <Text
              style={
                styles.pointDate
              }
            >
              {
                selectedPoint.fullLabel
              }
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
          styles.emptyChartIcon
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
          styles.emptyChartTitle
        }
      >
        Ingen data i perioden
      </Text>

      <Text
        style={
          styles.emptyChartText
        }
      >
        Eleven har ingen afsluttede
        registreringer i den valgte
        periode.
      </Text>
    </View>
  );
}

function getPeriodStart(
  days:
    number
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
  value:
    string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'da-DK',
    {
      day:
        '2-digit',

      month:
        '2-digit',
    }
  );
}

function formatFullDate(
  value:
    string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'da-DK',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',
    }
  );
}

function getChartLabelIndexes(
  count:
    number
) {
  if (
    count <=
    0
  ) {
    return [];
  }

  if (
    count <=
    5
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
        (
          count -
          1
        ) *
          0.25
      ),

      Math.round(
        (
          count -
          1
        ) *
          0.5
      ),

      Math.round(
        (
          count -
          1
        ) *
          0.75
      ),

      count -
        1,
    ])
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

      paddingHorizontal:
        24,
    },

    errorTitle: {
      fontSize:
        16,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    header: {
      marginTop:
        4,

      marginBottom:
        28,
    },

    eyebrow: {
      fontSize:
        12,

      fontWeight:
        '600',

      color:
        COLORS.navy,

      marginBottom:
        4,
    },

    title: {
      fontSize:
        32,

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

    periodChip: {
      height:
        36,

      paddingHorizontal:
        14,

      borderRadius:
        12,

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
      fontSize:
        13,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    periodTextSelected: {
      color:
        COLORS.navy,
    },

    pressed: {
      opacity:
        0.7,
    },

    loadingStats: {
      minHeight:
        320,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    registrationRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop:
        26,

      alignSelf:
        'flex-start',

      paddingHorizontal:
        10,

      paddingVertical:
        7,

      borderRadius:
        10,

      backgroundColor:
        COLORS.navySoft,
    },

    registrationIcon: {
      marginRight:
        6,
    },

    registrationText: {
      fontSize:
        11,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    statsRow: {
      flexDirection:
        'row',

      gap:
        9,

      marginTop:
        12,

      paddingHorizontal:
        2,

      paddingVertical:
        4,
    },

    statCard: {
      flex:
        1,

      minHeight:
        126,

      borderRadius:
        18,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        10,

      paddingVertical:
        14,

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

    statIcon: {
      width:
        32,

      height:
        32,

      borderRadius:
        10,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        7,
    },

    statValue: {
      fontSize:
        21,

      fontWeight:
        '800',

      color:
        COLORS.navy,
    },

    statLabel: {
      fontSize:
        11,

      fontWeight:
        '600',

      color:
        COLORS.muted,

      marginTop:
        3,
    },

    statCount: {
      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.navy,

      marginTop:
        6,
    },

    lateCard: {
      minHeight:
        78,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      backgroundColor:
        COLORS.white,

      borderRadius:
        18,

      paddingHorizontal:
        14,

      paddingVertical:
        12,

      marginTop:
        10,

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

    lateLeft: {
      flex:
        1,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    lateIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        12,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        11,
    },

    lateTitle: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    lateSubtitle: {
      fontSize:
        11,

      color:
        COLORS.muted,

      marginTop:
        3,
    },

    lateCount: {
      fontSize:
        22,

      fontWeight:
        '800',

      color:
        COLORS.navy,

      marginLeft:
        12,
    },

    latestCard: {
      backgroundColor:
        COLORS.white,

      borderRadius:
        18,

      overflow:
        'hidden',

      marginTop:
        10,

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

    latestRow: {
      minHeight:
        68,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,
    },

    latestIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        11,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        11,
    },

    latestText: {
      flex:
        1,
    },

    latestLabel: {
      fontSize:
        11,

      color:
        COLORS.muted,
    },

    latestValue: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop:
        2,
    },

    latestDivider: {
      height:
        1,

      backgroundColor:
        COLORS.grid,

      marginLeft:
        61,
    },

    chartCard: {
      marginTop:
        26,

      borderRadius:
        20,

      padding:
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

    chartHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap:
        12,
    },

    chartTitle: {
      fontSize:
        17,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    chartSubtitle: {
      fontSize:
        12,

      color:
        COLORS.muted,

      marginTop:
        3,
    },

    chartIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        11,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    axisDescription: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      marginTop:
        16,

      marginBottom:
        4,
    },

    axisText: {
      fontSize:
        10,

      color:
        COLORS.lightMuted,
    },

    chartHint: {
      fontSize:
        11,

      lineHeight:
        16,

      textAlign:
        'center',

      color:
        COLORS.lightMuted,

      marginTop:
        -2,
    },

    pointDetails: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      marginTop:
        10,

      borderRadius:
        14,

      backgroundColor:
        COLORS.navySoft,
    },

    pointIcon: {
      width:
        32,

      height:
        32,

      borderRadius:
        10,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,

      marginRight:
        9,
    },

    pointText: {
      flex:
        1,
    },

    pointStatus: {
      fontSize:
        13,

      fontWeight:
        '700',

      color:
        COLORS.navy,
    },

    pointDate: {
      fontSize:
        11,

      color:
        COLORS.muted,

      marginTop:
        2,
    },

    pointPercentage: {
      fontSize:
        15,

      fontWeight:
        '800',

      color:
        COLORS.navy,
    },

    emptyChart: {
      minHeight:
        220,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        25,
    },

    emptyChartIcon: {
      width:
        42,

      height:
        42,

      borderRadius:
        13,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navySoft,
    },

    emptyChartTitle: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop:
        10,
    },

    emptyChartText: {
      fontSize:
        13,

      lineHeight:
        19,

      textAlign:
        'center',

      color:
        COLORS.muted,

      marginTop:
        5,
    },
  });