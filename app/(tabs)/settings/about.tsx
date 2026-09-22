import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';

import BackButton from '@/app/components/BackButton';

const SUPPORT_EMAIL = 'protogo.support@proton.me';

/*
 * Ret disse når ProtoGo udgives.
 */
const RELEASE_DATE = '01. oktober 2026';
const LAST_UPDATED = '22. september 2026';

const APP_VERSION =
  Constants.expoConfig?.version ?? '1.0.0';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

export default function AboutScreen() {
  async function handleOpenEmail() {
    try {
      const url =
        `mailto:${SUPPORT_EMAIL}` +
        `?subject=${encodeURIComponent(
          'ProtoGo'
        )}`;

      const canOpen =
        await Linking.canOpenURL(url);

      if (!canOpen) {
        Alert.alert(
          'Kunne ikke åbne mail',
          SUPPORT_EMAIL
        );

        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error(
        'Kunne ikke åbne mail:',
        error
      );

      Alert.alert(
        'Kunne ikke åbne mail',
        SUPPORT_EMAIL
      );
    }
  }

  async function handleCopyEmail() {
    try {
      await Clipboard.setStringAsync(
        SUPPORT_EMAIL
      );

      Alert.alert(
        'Mail kopieret',
        SUPPORT_EMAIL
      );
    } catch (error) {
      console.error(
        'Kunne ikke kopiere mail:',
        error
      );

      Alert.alert(
        'Kunne ikke kopiere',
        'Mailadressen kunne ikke kopieres.'
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      {/* HEADER */}

      <Text style={styles.eyebrow}>
        Information
      </Text>

      <Text style={styles.title}>
        Om ProtoGo
      </Text>

      <Text style={styles.subtitle}>
        Information om ProtoGo,
        versionen du bruger og hvordan
        du kan få hjælp.
      </Text>

      {/* APP CARD */}

      <View style={styles.appCard}>
        <View style={styles.logoBox}>
          <Ionicons
            name="clipboard-outline"
            size={34}
            color={COLORS.navy}
          />
        </View>

        <Text style={styles.appName}>
          ProtoGo
        </Text>

        <Text style={styles.appDescription}>
          En enkel protokol-app til
          lærere, der gør det hurtigt at
          registrere fremmøde, holde
          styr på elever og få overblik
          over klassens historik.
        </Text>
      </View>

      {/* VERSION */}

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionTitle}>
        Appinformation
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          icon="cube-outline"
          label="Version"
          value={APP_VERSION}
        />

        <View style={styles.rowDivider} />

        <InfoRow
          icon="rocket-outline"
          label="Udgivet"
          value={RELEASE_DATE}
        />

        <View style={styles.rowDivider} />

        <InfoRow
          icon="refresh-outline"
          label="Senest opdateret"
          value={LAST_UPDATED}
        />
      </View>

      {/* ABOUT */}

      <View style={styles.sectionDivider} />

      <Text style={styles.sectionTitle}>
        Hvad kan ProtoGo?
      </Text>

      <View style={styles.featureCard}>
        <FeatureRow
          icon="people-outline"
          title="Klasser og elever"
          description="Opret klasser, administrer elever og tilknyt forældrekontakter."
        />

        <View style={styles.featureDivider} />

        <FeatureRow
          icon="checkbox-outline"
          title="Protokol"
          description="Registrer fremmøde, fravær og forsinkelse hurtigt og enkelt."
        />

        <View style={styles.featureDivider} />

        <FeatureRow
          icon="time-outline"
          title="Historik"
          description="Se tidligere protokoller og rediger registreringer."
        />

        <View style={styles.featureDivider} />

        <FeatureRow
          icon="stats-chart-outline"
          title="Statistik"
          description="Få overblik over fremmøde for både klasser og enkelte elever."
        />

        <View style={styles.featureDivider} />

        <FeatureRow
          icon="notifications-outline"
          title="Påmindelser"
          description="Vælg dage og tidspunkt for påmindelser om at tage protokol."
        />
      </View>

      {/* FOOTER */}

      <Text style={styles.footer}>
        © 2026 ProtoGo
      </Text>
    </ScrollView>
  );
}

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({
  icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.smallIconBox}>
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.navy}
        />
      </View>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

type FeatureRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

function FeatureRow({
  icon,
  title,
  description,
}: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.navy}
        />
      </View>

      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text
          style={styles.featureDescription}
        >
          {description}
        </Text>
      </View>
    </View>
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

  /* HEADER */

  eyebrow: {
    fontSize: 14,
    color: COLORS.muted,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,

    marginTop: 4,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.muted,

    marginTop: 7,
    marginBottom: 26,
  },

  /* APP */

  appCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    paddingHorizontal: 22,
    paddingVertical: 26,

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

  logoBox: {
    width: 66,
    height: 66,

    borderRadius: 20,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 15,
  },

  appName: {
    fontSize: 23,
    fontWeight: '700',
    color: COLORS.text,
  },

  appDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,

    textAlign: 'center',

    marginTop: 8,
  },

  /* SECTIONS */

  sectionDivider: {
    height: 1,
    backgroundColor: '#EEF0F3',

    marginTop: 28,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,

    marginBottom: 12,
  },

  /* INFO */

  infoCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,

    elevation: 1,
  },

  infoRow: {
    minHeight: 68,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
  },

  smallIconBox: {
    width: 36,
    height: 36,

    borderRadius: 11,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  infoLabel: {
    flex: 1,

    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,

    marginLeft: 12,
  },

  infoValue: {
    maxWidth: '45%',

    fontSize: 13,
    color: COLORS.muted,

    textAlign: 'right',
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',

    marginLeft: 64,
  },

  /* FEATURES */

  featureCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,

    elevation: 1,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    padding: 16,
  },

  featureIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,

    marginTop: 4,
  },

  featureDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',

    marginLeft: 71,
  },

  /* CONTACT */

  contactCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    padding: 16,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,

    elevation: 1,
  },

  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  contactText: {
    flex: 1,
  },

  contactLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,

    marginTop: 3,
  },

  contactActions: {
    flexDirection: 'row',
    gap: 10,

    marginTop: 16,
  },

  contactButton: {
    flex: 1,
    height: 48,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    borderRadius: 14,

    backgroundColor: COLORS.navySoft,
  },

  contactButtonPressed: {
    opacity: 0.7,
  },

  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },

  /* FOOTER */

  footer: {
    fontSize: 12,
    color: COLORS.lightMuted,

    textAlign: 'center',

    marginTop: 30,
  },
});