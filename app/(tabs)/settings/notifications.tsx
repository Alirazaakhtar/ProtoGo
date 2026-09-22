import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import BackButton from '@/app/components/BackButton';

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

const NOTIFICATION_CHANNEL_ID =
  'attendance-reminders';

const STORAGE_KEYS = {
  enabled:
    'protogo.notifications.attendance.enabled',

  time:
    'protogo.notifications.attendance.time',

  days:
    'protogo.notifications.attendance.days',

  identifiers:
    'protogo.notifications.attendance.identifiers',
};

const DAYS = [
  {
    weekday: 2,
    short: 'Man',
    full: 'Mandag',
  },
  {
    weekday: 3,
    short: 'Tir',
    full: 'Tirsdag',
  },
  {
    weekday: 4,
    short: 'Ons',
    full: 'Onsdag',
  },
  {
    weekday: 5,
    short: 'Tor',
    full: 'Torsdag',
  },
  {
    weekday: 6,
    short: 'Fre',
    full: 'Fredag',
  },
  {
    weekday: 7,
    short: 'Lør',
    full: 'Lørdag',
  },
  {
    weekday: 1,
    short: 'Søn',
    full: 'Søndag',
  },
];

const WEEKDAYS = [
  2,
  3,
  4,
  5,
  6,
];

const DEFAULT_DAYS: number[] = [];

type PermissionState =
  | 'granted'
  | 'denied'
  | 'undetermined';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function NotificationsScreen() {
  const [
    enabled,
    setEnabled,
  ] = useState(false);

  const [
    reminderTime,
    setReminderTime,
  ] = useState('08:00');

  const [
    selectedDays,
    setSelectedDays,
  ] = useState<number[]>(
    DEFAULT_DAYS
  );

  const [
    permissionState,
    setPermissionState,
  ] =
    useState<PermissionState>(
      'undetermined'
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      await setupAndroidChannel();

      const values =
        await AsyncStorage.multiGet([
          STORAGE_KEYS.enabled,
          STORAGE_KEYS.time,
          STORAGE_KEYS.days,
        ]);

      const storedEnabled =
        values[0][1];

      const storedTime =
        values[1][1];

      const storedDays =
        values[2][1];

      setEnabled(
        storedEnabled === 'true'
      );

      setReminderTime(
        storedTime ?? '08:00'
      );

      if (storedDays) {
        try {
          const parsedDays =
            JSON.parse(
              storedDays
            );

          if (
            Array.isArray(
              parsedDays
            ) &&
            parsedDays.every(
              (day) =>
                typeof day ===
                  'number' &&
                day >= 1 &&
                day <= 7
            )
          ) {
            setSelectedDays(
              parsedDays
            );
          } else {
            setSelectedDays(
              DEFAULT_DAYS
            );
          }
        } catch {
          setSelectedDays(
            DEFAULT_DAYS
          );
        }
      } else {
        setSelectedDays(
          DEFAULT_DAYS
        );
      }

      const permissions =
        await Notifications.getPermissionsAsync();

      setPermissionState(
        getPermissionState(
          permissions
        )
      );
    } catch (error) {
      console.error(
        'Kunne ikke hente notifikationsindstillinger:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function setupAndroidChannel() {
    if (
      Platform.OS !== 'android'
    ) {
      return;
    }

    await Notifications.setNotificationChannelAsync(
      NOTIFICATION_CHANNEL_ID,
      {
        name:
          'Protokolpåmindelser',

        description:
          'Påmindelser om at tage dagens protokol.',

        importance:
          Notifications.AndroidImportance.DEFAULT,

        sound:
          'default',
      }
    );
  }

  function toggleDay(
    weekday: number
  ) {
    setSelectedDays(
      (currentDays) => {
        if (
          currentDays.includes(
            weekday
          )
        ) {
          return currentDays.filter(
            (day) =>
              day !== weekday
          );
        }

        return [
          ...currentDays,
          weekday,
        ];
      }
    );
  }

  async function requestNotificationPermission() {
    await setupAndroidChannel();

    const currentPermissions =
      await Notifications.getPermissionsAsync();

    if (
      isPermissionGranted(
        currentPermissions
      )
    ) {
      setPermissionState(
        'granted'
      );

      return true;
    }

    if (
      currentPermissions.status ===
        Notifications.PermissionStatus.DENIED &&
      !currentPermissions.canAskAgain
    ) {
      setPermissionState(
        'denied'
      );

      return false;
    }

    const newPermissions =
      await Notifications.requestPermissionsAsync();

    const granted =
      isPermissionGranted(
        newPermissions
      );

    setPermissionState(
      granted
        ? 'granted'
        : newPermissions.status ===
            Notifications.PermissionStatus.DENIED
          ? 'denied'
          : 'undetermined'
    );

    return granted;
  }

  async function saveSettings() {
    const parsedTime =
      parseTime(
        reminderTime
      );

    if (!parsedTime) {
      Alert.alert(
        'Ugyldigt tidspunkt',
        'Skriv tidspunktet som fx 08:00.'
      );

      return;
    }

    if (
      enabled &&
      selectedDays.length === 0
    ) {
      Alert.alert(
        'Vælg en dag',
        'Vælg mindst én dag, hvor du vil modtage protokolpåmindelsen.'
      );

      return;
    }

    try {
      setSaving(true);

      const formattedTime =
        formatTime(
          parsedTime.hour,
          parsedTime.minute
        );

      /*
       * NOTIFIKATIONER SLÅET FRA
       */

      if (!enabled) {
        await cancelExistingReminders();

        await AsyncStorage.multiSet([
          [
            STORAGE_KEYS.enabled,
            'false',
          ],
          [
            STORAGE_KEYS.time,
            formattedTime,
          ],
          [
            STORAGE_KEYS.days,
            JSON.stringify(
              selectedDays
            ),
          ],
        ]);

        setReminderTime(
          formattedTime
        );

        Alert.alert(
          'Notifikationer gemt',
          'Protokolpåmindelser er slået fra.'
        );

        return;
      }

      /*
       * TILLADELSE
       */

      const hasPermission =
        await requestNotificationPermission();

      if (!hasPermission) {
        Alert.alert(
          'Notifikationer er ikke tilladt',
          'Du skal give ProtoGo adgang til at sende notifikationer på din enhed.',
          [
            {
              text: 'Annuller',
              style: 'cancel',
            },
            {
              text:
                'Åbn indstillinger',

              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]
        );

        return;
      }

      /*
       * FJERN GAMLE
       */

      await cancelExistingReminders();

      /*
       * OPRET NYE
       */

      const identifiers =
        await scheduleReminders(
          selectedDays,
          parsedTime.hour,
          parsedTime.minute
        );

      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.enabled,
          'true',
        ],
        [
          STORAGE_KEYS.time,
          formattedTime,
        ],
        [
          STORAGE_KEYS.days,
          JSON.stringify(
            selectedDays
          ),
        ],
        [
          STORAGE_KEYS.identifiers,
          JSON.stringify(
            identifiers
          ),
        ],
      ]);

      setReminderTime(
        formattedTime
      );

      Alert.alert(
        'Notifikationer gemt',
        `Du får en protokolpåmindelse ${formatSelectedDays(
          selectedDays
        )} kl. ${formattedTime}.`
      );
    } catch (error) {
      console.error(
        'Kunne ikke gemme notifikationer:',
        error
      );

      Alert.alert(
        'Kunne ikke gemme',
        'Der opstod en fejl under opsætningen af notifikationerne.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function scheduleReminders(
    days: number[],
    hour: number,
    minute: number
  ) {
    const identifiers:
      string[] = [];

    try {
      for (
        const weekday of days
      ) {
        const identifier =
          await Notifications.scheduleNotificationAsync(
            {
              content: {
                title:
                  'Husk dagens protokol',

                body:
                  'Åbn ProtoGo og registrer dagens fremmøde.',

                sound:
                  'default',

                data: {
                  type:
                    'attendance-reminder',
                },
              },

              trigger: {
                type:
                  Notifications
                    .SchedulableTriggerInputTypes
                    .WEEKLY,

                weekday,

                hour,

                minute,

                channelId:
                  NOTIFICATION_CHANNEL_ID,
              },
            }
          );

        identifiers.push(
          identifier
        );
      }

      return identifiers;
    } catch (error) {
      await Promise.all(
        identifiers.map(
          (identifier) =>
            Notifications.cancelScheduledNotificationAsync(
              identifier
            ).catch(
              () =>
                undefined
            )
        )
      );

      throw error;
    }
  }

  async function cancelExistingReminders() {
    const rawIdentifiers =
      await AsyncStorage.getItem(
        STORAGE_KEYS.identifiers
      );

    if (!rawIdentifiers) {
      return;
    }

    try {
      const identifiers =
        JSON.parse(
          rawIdentifiers
        );

      if (
        Array.isArray(
          identifiers
        )
      ) {
        await Promise.all(
          identifiers.map(
            (
              identifier
            ) =>
              typeof identifier ===
              'string'
                ? Notifications.cancelScheduledNotificationAsync(
                    identifier
                  ).catch(
                    () =>
                      undefined
                  )
                : Promise.resolve()
          )
        );
      }
    } catch (error) {
      console.error(
        'Kunne ikke læse eksisterende notifikationer:',
        error
      );
    }

    await AsyncStorage.removeItem(
      STORAGE_KEYS.identifiers
    );
  }

  function handleTimeChange(
    value: string
  ) {
    const digits =
      value.replace(
        /\D/g,
        ''
      );

    const limited =
      digits.slice(
        0,
        4
      );

    if (
      limited.length <= 2
    ) {
      setReminderTime(
        limited
      );

      return;
    }

    setReminderTime(
      `${limited.slice(
        0,
        2
      )}:${limited.slice(
        2
      )}`
    );
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
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <BackButton />

        {/* HEADER */}

        <Text
          style={
            styles.title
          }
        >
          Notifikationer
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Vælg hvilke dage og
          hvornår ProtoGo skal minde
          dig om dagens protokol.
        </Text>

        {/* PROTOKOLPÅMINDELSE */}

        <View
          style={
            styles.reminderCard
          }
        >
          <View
            style={
              styles.reminderHeader
            }
          >
            <View
              style={
                styles.reminderIcon
              }
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={
                  COLORS.navy
                }
              />
            </View>

            <View
              style={
                styles.reminderText
              }
            >
              <Text
                style={
                  styles.reminderTitle
                }
              >
                Protokolpåmindelse
              </Text>

              <Text
                style={
                  styles.reminderDescription
                }
              >
                Få en påmindelse om
                at tage dagens
                protokol.
              </Text>
            </View>

            <Switch
              value={
                enabled
              }
              onValueChange={
                setEnabled
              }
              disabled={
                saving
              }
              trackColor={{
                false:
                  '#E5E7EB',

                true:
                  COLORS.navySoft,
              }}
              thumbColor={
                enabled
                  ? COLORS.navy
                  : '#F9FAFB'
              }
            />
          </View>

          {enabled && (
            <>
              {/* DAGE */}

              <View
                style={
                  styles.cardDivider
                }
              />

              <View
                style={
                  styles.optionHeader
                }
              >
                <View
                  style={
                    styles.smallIconBox
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={
                      COLORS.navy
                    }
                  />
                </View>

                <View
                  style={
                    styles.optionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.optionLabel
                    }
                  >
                    Dage
                  </Text>

                  <Text
                    style={
                      styles.optionDescription
                    }
                  >
                    Vælg hvilke dage du
                    vil modtage
                    påmindelsen
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.daysContainer
                }
              >
                {DAYS.map(
                  (day) => {
                    const selected =
                      selectedDays.includes(
                        day.weekday
                      );

                    return (
                      <Pressable
                        key={
                          day.weekday
                        }
                        onPress={() =>
                          toggleDay(
                            day.weekday
                          )
                        }
                        disabled={
                          saving
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          day.full
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.dayButton,

                          selected &&
                            styles.dayButtonSelected,

                          pressed &&
                            styles.dayButtonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,

                            selected &&
                              styles.dayButtonTextSelected,
                          ]}
                        >
                          {day.short}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {/* TIDSPUNKT */}

              <View
                style={
                  styles.innerDivider
                }
              />

              <View
                style={
                  styles.optionHeader
                }
              >
                <View
                  style={
                    styles.smallIconBox
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={
                      COLORS.navy
                    }
                  />
                </View>

                <View
                  style={
                    styles.optionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.optionLabel
                    }
                  >
                    Tidspunkt
                  </Text>

                  <Text
                    style={
                      styles.optionDescription
                    }
                  >
                    Samme tidspunkt på
                    alle valgte dage
                  </Text>
                </View>
              </View>

              <TextInput
                value={
                  reminderTime
                }
                onChangeText={
                  handleTimeChange
                }
                placeholder="08:00"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="done"
                editable={
                  !saving
                }
                style={
                  styles.timeInput
                }
              />

              {/* OPSUMMERING */}

              <View
                style={
                  styles.reminderPreview
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={17}
                  color={
                    COLORS.navy
                  }
                />

                <Text
                  style={
                    styles.reminderPreviewText
                  }
                >
                  {selectedDays.length >
                  0
                    ? `${formatSelectedDays(
                        selectedDays
                      )} kl. ${
                        reminderTime ||
                        '--:--'
                      }`
                    : 'Ingen dage valgt'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* DIVIDER */}

        <View
          style={
            styles.sectionDivider
          }
        />

        {/* SYSTEMTILLADELSE */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Systemtilladelse
        </Text>

        <View
          style={
            styles.permissionCard
          }
        >
          <View
            style={
              styles.permissionIcon
            }
          >
            <Ionicons
              name={
                permissionState ===
                'granted'
                  ? 'checkmark-circle-outline'
                  : 'notifications-off-outline'
              }
              size={21}
              color={
                COLORS.navy
              }
            />
          </View>

          <View
            style={
              styles.permissionText
            }
          >
            <Text
              style={
                styles.permissionTitle
              }
            >
              {permissionState ===
              'granted'
                ? 'Notifikationer er tilladt'
                : permissionState ===
                    'denied'
                  ? 'Notifikationer er slået fra'
                  : 'Tilladelse er ikke valgt'}
            </Text>

            <Text
              style={
                styles.permissionDescription
              }
            >
              {permissionState ===
              'granted'
                ? 'ProtoGo må sende notifikationer på denne enhed.'
                : 'Tillad ProtoGo at sende notifikationer for at bruge påmindelser.'}
            </Text>
          </View>

          {permissionState ===
            'denied' && (
            <Pressable
              onPress={() => {
                void Linking.openSettings();
              }}
              hitSlop={8}
              style={({
                pressed,
              }) => [
                styles.settingsButton,

                pressed &&
                  styles.settingsButtonPressed,
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={
                  COLORS.navy
                }
              />
            </Pressable>
          )}
        </View>

        {/* GEM */}

        <Pressable
          onPress={
            saveSettings
          }
          disabled={
            saving
          }
          style={({
            pressed,
          }) => [
            styles.saveButton,

            pressed &&
              !saving &&
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
                name="checkmark-outline"
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
                Gem indstillinger
              </Text>
            </View>
          )}
        </Pressable>

          <Text style={styles.footer}>
                  © 2026 ProtoGo
            </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseTime(
  value: string
) {
  const match =
    value
      .trim()
      .match(
        /^(\d{2}):(\d{2})$/
      );

  if (!match) {
    return null;
  }

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return {
    hour,
    minute,
  };
}

function formatTime(
  hour: number,
  minute: number
) {
  return `${String(
    hour
  ).padStart(
    2,
    '0'
  )}:${String(
    minute
  ).padStart(
    2,
    '0'
  )}`;
}

function formatSelectedDays(
  selectedDays: number[]
) {
  const orderedDays =
    DAYS.filter(
      (day) =>
        selectedDays.includes(
          day.weekday
        )
    );

  if (
    orderedDays.length === 7
  ) {
    return 'hver dag';
  }

  const isMondayToFriday =
    selectedDays.length === 5 &&
    WEEKDAYS.every(
      (weekday) =>
        selectedDays.includes(
          weekday
        )
    );

  if (
    isMondayToFriday
  ) {
    return 'mandag – fredag';
  }

  return orderedDays
    .map(
      (day) =>
        day.full.toLocaleLowerCase(
          'da-DK'
        )
    )
    .join(', ');
}

function isPermissionGranted(
  permissions:
    Notifications.NotificationPermissionsStatus
) {
  if (
    Platform.OS === 'ios'
  ) {
    const iosStatus =
      permissions.ios
        ?.status;

    return (
      iosStatus ===
        Notifications
          .IosAuthorizationStatus
          .AUTHORIZED ||
      iosStatus ===
        Notifications
          .IosAuthorizationStatus
          .PROVISIONAL ||
      iosStatus ===
        Notifications
          .IosAuthorizationStatus
          .EPHEMERAL
    );
  }

  return permissions.granted;
}

function getPermissionState(
  permissions:
    Notifications.NotificationPermissionsStatus
): PermissionState {
  if (
    isPermissionGranted(
      permissions
    )
  ) {
    return 'granted';
  }

  if (
    permissions.status ===
    Notifications.PermissionStatus.DENIED
  ) {
    return 'denied';
  }

  return 'undetermined';
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.white,
    },

    content: {
      flexGrow: 1,

      paddingHorizontal: 20,

      paddingTop: 70,

      paddingBottom: 50,
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

    /* HEADER */

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
    },

    subtitle: {
      fontSize: 15,

      lineHeight: 21,

      color:
        COLORS.muted,

      marginTop: 7,

      marginBottom: 26,
    },

    /* REMINDER */

    reminderCard: {
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

    reminderHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    reminderIcon: {
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

    reminderText: {
      flex: 1,

      paddingRight: 10,
    },

    reminderTitle: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    reminderDescription: {
      fontSize: 13,

      lineHeight: 18,

      color:
        COLORS.muted,

      marginTop: 4,
    },

    cardDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 20,

      marginBottom: 18,
    },

    /* OPTIONS */

    optionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 12,
    },

    smallIconBox: {
      width: 30,

      height: 30,

      borderRadius: 9,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    optionHeaderText: {
      flex: 1,

      marginLeft: 9,
    },

    optionLabel: {
      fontSize: 14,

      fontWeight:
        '600',

      color:
        COLORS.navy,
    },

    optionDescription: {
      fontSize: 12,

      color:
        COLORS.lightMuted,

      marginTop: 1,
    },

    /* DAYS */

    daysContainer: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 8,
    },

    dayButton: {
      minWidth: 52,

      height: 42,

      paddingHorizontal: 12,

      borderRadius: 13,

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

    dayButtonSelected: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    dayButtonPressed: {
      opacity: 0.7,
    },

    dayButtonText: {
      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    dayButtonTextSelected: {
      color:
        COLORS.white,
    },

    innerDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 20,

      marginBottom: 18,
    },

    /* TIME */

    timeInput: {
      height: 56,

      backgroundColor:
        COLORS.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      paddingHorizontal: 18,

      fontSize: 18,

      fontWeight:
        '600',

      color:
        COLORS.text,
    },

    reminderPreview: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginTop: 14,

      paddingHorizontal: 2,
    },

    reminderPreviewText: {
      flex: 1,

      fontSize: 12,

      lineHeight: 17,

      color:
        COLORS.muted,
    },

    /* DIVIDER */

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 28,

      marginBottom: 24,
    },

    /* PERMISSION */

    sectionTitle: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginBottom: 12,
    },

    permissionCard: {
      minHeight: 82,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      padding: 16,

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

    permissionIcon: {
      width: 42,

      height: 42,

      borderRadius: 13,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    permissionText: {
      flex: 1,
    },

    permissionTitle: {
      fontSize: 14,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    permissionDescription: {
      fontSize: 12,

      lineHeight: 17,

      color:
        COLORS.muted,

      marginTop: 3,
    },

    settingsButton: {
      width: 38,

      height: 38,

      borderRadius: 12,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginLeft: 10,
    },

    settingsButtonPressed: {
      opacity: 0.65,
    },

    /* SAVE */

    saveButton: {
      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 28,

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
      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.white,
    },

    disabled: {
      opacity: 0.5,
    },

      /* FOOTER */

  footer: {
    fontSize: 12,
    color: COLORS.lightMuted,

    textAlign: 'center',

    marginTop: 30,
  },
  });