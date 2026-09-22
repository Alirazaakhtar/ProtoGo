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
import * as Clipboard from 'expo-clipboard';

import BackButton from '@/app/components/BackButton';

const SUPPORT_EMAIL = 'protogo.support@proton.me';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

export default function SupportScreen() {
  async function handleOpenEmail() {
    try {
      const subject =
        'ProtoGo support';

      const url =
        `mailto:${SUPPORT_EMAIL}` +
        `?subject=${encodeURIComponent(subject)}`;

      const canOpen =
        await Linking.canOpenURL(url);

      if (!canOpen) {
        Alert.alert(
          'Kunne ikke åbne mail',
          `Du kan kontakte os på ${SUPPORT_EMAIL}.`
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
        `Du kan kontakte os på ${SUPPORT_EMAIL}.`
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

      <Text style={styles.title}>
        Kontakt & support
      </Text>

      <Text style={styles.subtitle}>
        Har du fundet en fejl eller
        brug for hjælp til ProtoGo?
        Du er altid velkommen til at
        kontakte os.
      </Text>

      {/* CONTACT */}

      <Text style={styles.sectionTitle}>
        Kontaktoplysninger
      </Text>

      <View style={styles.contactCard}>
        <View style={styles.contactTop}>
          <View style={styles.contactIcon}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={COLORS.navy}
            />
          </View>

          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>
              Supportmail
            </Text>

            <Text
              selectable
              style={styles.contactValue}
            >
              {SUPPORT_EMAIL}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.actions}>
          <Pressable
            onPress={handleOpenEmail}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.primaryButtonPressed,
            ]}
          >
            <View
              style={styles.buttonContent}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.white}
              />

              <Text
                style={styles.primaryButtonText}
              >
                Skriv en mail
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleCopyEmail}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed &&
                styles.secondaryButtonPressed,
            ]}
          >
            <View
              style={styles.buttonContent}
            >
              <Ionicons
                name="copy-outline"
                size={19}
                color={COLORS.navy}
              />

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Kopiér mail
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* INFO */}

      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={COLORS.navy}
        />

        <Text style={styles.infoText}>
          Ved fejl hjælper det, hvis du
          beskriver hvad du gjorde, hvad
          der skete, og hvad du
          forventede skulle ske.
        </Text>
      </View>

      <Text style={styles.footer}>
              © 2026 ProtoGo
            </Text>
    </ScrollView>
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

  /* SUPPORT */

  supportCard: {
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

  heroIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 16,
  },

  supportTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,

    textAlign: 'center',
  },

  supportDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,

    textAlign: 'center',

    marginTop: 8,
  },

  /* DIVIDER */

  sectionDivider: {
    height: 1,
    backgroundColor: '#EEF0F3',

    marginTop: 28,
    marginBottom: 24,
  },

  /* CONTACT */

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,

    marginBottom: 12,
  },

  contactCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    padding: 18,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,

    elevation: 1,
  },

  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactIcon: {
    width: 46,
    height: 46,

    borderRadius: 14,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  contactText: {
    flex: 1,
  },

  contactLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },

  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,

    marginTop: 3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#EEF0F3',

    marginTop: 18,
    marginBottom: 18,
  },

  /* BUTTONS */

  actions: {
    gap: 10,
  },

  primaryButton: {
    height: 54,

    borderRadius: 16,

    backgroundColor: COLORS.navy,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.navyDark,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 2,
  },

  primaryButtonPressed: {
    backgroundColor: COLORS.navyDark,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  secondaryButton: {
    height: 54,

    borderRadius: 16,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonPressed: {
    opacity: 0.7,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  /* INFO */

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: COLORS.navySoft,

    borderRadius: 16,

    padding: 16,

    marginTop: 18,
  },

  infoText: {
    flex: 1,

    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,

    marginLeft: 10,
  },

    /* FOOTER */

  footer: {
    fontSize: 12,
    color: COLORS.lightMuted,

    textAlign: 'center',

    marginTop: 30,
  },
});