import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const COLORS = {
  navy: '#1E3A5F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Indstillinger
      </Text>

      {/* KONTO */}

      <Text style={styles.sectionLabel}>
        Konto
      </Text>

      <View style={styles.sectionShadow}>
        <View style={styles.section}>
          <SettingRow
            icon="person-outline"
            title="Profil"
            subtitle="Navn og konto"
            onPress={() =>
              router.push('/settings/profile')
            }
          />
        </View>
      </View>

      {/* APP */}

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionLabel}>
        App
      </Text>

      <View style={styles.sectionShadow}>
        <View style={styles.section}>
          <SettingRow
            icon="notifications-outline"
            title="Notifikationer"
            subtitle="Administrer påmindelser"
            onPress={() =>
              router.push('/settings/notifications')
            }
          />
        </View>
      </View>

      {/* HJÆLP OG INFORMATION */}

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionLabel}>
        Hjælp og information
      </Text>

      <View style={styles.sectionShadow}>
        <View style={styles.section}>
          <SettingRow
            icon="chatbubble-ellipses-outline"
            title="Kontakt & support"
            subtitle="Få hjælp eller kontakt os"
            onPress={() =>
              router.push('/settings/support')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="book-outline"
            title="Brugervejledning"
            subtitle="Sådan bruger du ProtoGo"
            onPress={() =>
              router.push('/settings/guide')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="information-circle-outline"
            title="Om ProtoGo"
            subtitle="Version og information"
            onPress={() =>
              router.push('/settings/about')
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.navy}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.chevronBox}>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.navy}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  content: {
    flexGrow: 1,

    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 50,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,

    marginTop: 4,
    marginBottom: 28,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,

    marginLeft: 2,
    marginBottom: 12,
  },

  sectionShadow: {
    borderRadius: 20,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.06,
    shadowRadius: 14,

    elevation: 2,
  },

  section: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    overflow: 'hidden',
  },

  sectionDivider: {
    height: 1,

    backgroundColor: '#EEF0F3',

    marginTop: 28,
    marginBottom: 24,
  },

  row: {
    minHeight: 76,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
  },

  rowPressed: {
    backgroundColor: '#F8FAFC',
  },

  iconBox: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  rowText: {
    flex: 1,

    marginLeft: 14,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: '600',

    color: COLORS.text,
  },

  rowSubtitle: {
    fontSize: 13,

    color: COLORS.lightMuted,

    marginTop: 3,
  },

  chevronBox: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,

    backgroundColor: '#F0F2F5',

    marginLeft: 72,
  },
});