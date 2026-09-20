import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',

  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
};

export default function SettingsScreen() {
  function handleLogout() {
    Alert.alert(
      'Log ud',
      'Er du sikker på, at du vil logge ud?',
      [
        {
          text: 'Annuller',
          style: 'cancel',
        },
        {
          text: 'Log ud',
          style: 'destructive',

          onPress: async () => {
            const { error } =
              await supabase.auth.signOut();

            if (error) {
              Alert.alert(
                'Kunne ikke logge ud',
                error.message
              );
            }
          },
        },
      ]
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
    >
      <Text
        style={
          styles.title
        }
      >
        Indstillinger
      </Text>

      {/* INDSTILLINGER */}

      <View
        style={
          styles.sectionShadow
        }
      >
        <View
          style={
            styles.section
          }
        >
          <SettingRow
            icon="person-outline"
            title="Profil"
            subtitle="Navn, e-mail og konto"
            onPress={() =>
              router.push(
                '/settings/profile'
              )
            }
          />

          <View
            style={
              styles.divider
            }
          />

          <SettingRow
            icon="notifications-outline"
            title="Notifikationer"
            subtitle="Administrer beskeder"
            onPress={() => {}}
          />

          <View
            style={
              styles.divider
            }
          />

          <SettingRow
            icon="options-outline"
            title="App-indstillinger"
            subtitle="Tilpas appen"
            onPress={() => {}}
          />
        </View>
      </View>

      <View
        style={
          styles.spacer
        }
      />

      {/* LOG UD */}

      <Pressable
        onPress={
          handleLogout
        }
        style={({
          pressed,
        }) => [
          styles.logoutButton,

          pressed &&
            styles.logoutButtonPressed,
        ]}
      >
        <Text
          style={
            styles.logoutText
          }
        >
          Log ud
        </Text>
      </Pressable>
    </ScrollView>
  );
}

type SettingRowProps = {
  icon:
    | 'person-outline'
    | 'notifications-outline'
    | 'options-outline';

  title: string;
  subtitle: string;
  onPress: () => void;
};

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.row,

        pressed &&
          styles.rowPressed,
      ]}
    >
      <View
        style={
          styles.iconBox
        }
      >
        <Ionicons
          name={
            icon
          }
          size={20}
          color={
            COLORS.navy
          }
        />
      </View>

      <View
        style={
          styles.rowText
        }
      >
        <Text
          style={
            styles.rowTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.rowSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={
          styles.chevronBox
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
      flexGrow: 1,

      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 40,
    },

    title: {
      fontSize: 34,

      fontWeight:
        '700',

      color:
        COLORS.text,

      marginTop: 4,
      marginBottom: 28,
    },

    /* SETTINGS CARD */

    sectionShadow: {
      borderRadius: 20,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.06,

      shadowRadius: 14,

      elevation: 2,
    },

    section: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      overflow:
        'hidden',
    },

    row: {
      minHeight: 76,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 16,
    },

    rowPressed: {
      backgroundColor:
        '#F8FAFC',
    },

    iconBox: {
      width: 42,
      height: 42,

      borderRadius: 13,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    rowText: {
      flex: 1,

      marginLeft: 14,
    },

    rowTitle: {
      fontSize: 16,

      fontWeight:
        '600',

      color:
        COLORS.text,
    },

    rowSubtitle: {
      fontSize: 13,

      color:
        COLORS.lightMuted,

      marginTop: 3,
    },

    chevronBox: {
      width: 30,
      height: 30,

      borderRadius: 15,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    divider: {
      height: 1,

      backgroundColor:
        '#F0F2F5',

      marginLeft: 72,
    },

    spacer: {
      flex: 1,

      minHeight: 48,
    },

    /* LOGOUT */

    logoutButton: {
      height: 60,

      borderRadius: 17,

      backgroundColor:
        COLORS.dangerSoft,

      borderWidth: 1,

      borderColor:
        COLORS.dangerBorder,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,

      shadowColor:
        COLORS.dangerDark,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.08,

      shadowRadius: 10,

      elevation: 2,
    },

    logoutButtonPressed: {
      backgroundColor:
        '#FEE2E2',

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    logoutText: {
      fontSize: 15,

      fontWeight:
        '700',

      color:
        COLORS.danger,
    },
  });