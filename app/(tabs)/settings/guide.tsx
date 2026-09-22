import { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import BackButton from '@/app/components/BackButton';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

type GuideSection = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  steps: string[];
  note?: string;
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'start',
    icon: 'rocket-outline',
    title: 'Kom godt i gang',
    description:
      'Det grundlæggende du skal vide, når du begynder at bruge ProtoGo.',
    steps: [
      'Log ind på din ProtoGo-konto.',
      'Gå til Klasser i menuen nederst.',
      'Opret en ny klasse eller åbn en klasse, du allerede har adgang til.',
      'Tilføj elever til klassen.',
      'Når klassen er klar, kan du begynde at tage protokol.',
    ],
  },

  {
    id: 'classes',
    icon: 'people-outline',
    title: 'Klasser',
    description:
      'Opret og administrer de klasser, du underviser.',
    steps: [
      'Åbn Klasser fra menuen nederst.',
      'Opret en klasse og udfyld klasseoplysninger som navn, skoleår og fag.',
      'Tryk på en klasse for at åbne den.',
      'Fra klassens indstillinger kan klassens oplysninger redigeres.',
      'Hvis du er ejer af klassen, kan du også administrere lærere og andre klassefunktioner.',
    ],
  },

  {
    id: 'students',
    icon: 'person-outline',
    title: 'Elever',
    description:
      'Tilføj elever og administrer deres oplysninger.',
    steps: [
      'Åbn den klasse, eleven skal tilhøre.',
      'Vælg at tilføje en ny elev.',
      'Indtast elevens navn og eventuelle øvrige oplysninger.',
      'Tryk på en elev for at åbne elevens profil.',
      'Fra elevprofilen kan oplysninger redigeres.',
      'En elev kan deaktiveres, hvis eleven ikke længere skal være aktiv i klassen.',
    ],
    note:
      'Deaktivering bevarer elevens eksisterende historik.',
  },

  {
    id: 'guardians',
    icon: 'heart-outline',
    title: 'Forældrekontakter',
    description:
      'Gem kontaktoplysninger på elevens forældre eller andre kontaktpersoner.',
    steps: [
      'Åbn elevens profil.',
      'Tilføj en forældrekontakt eller anden kontaktperson.',
      'Indtast navn, telefonnummer, e-mail og relation, hvor det er relevant.',
      'Kontaktoplysningerne vises efterfølgende på elevens profil.',
      'Telefonnumre kan kopieres, og relevante kontaktmuligheder kan åbnes direkte fra appen.',
    ],
  },

  {
    id: 'attendance',
    icon: 'checkbox-outline',
    title: 'Tag protokol',
    description:
      'Registrer dagens fremmøde hurtigt for hele klassen.',
    steps: [
      'Åbn den klasse, du vil tage protokol for.',
      'Start dagens protokol.',
      'Registrer hver elev som til stede, fraværende eller forsinket.',
      'Kontrollér registreringerne, inden protokollen afsluttes.',
      'Afslut protokollen, når alle elever er registreret.',
      'Den afsluttede protokol bliver derefter en del af klassens historik og statistik.',
    ],
    note:
      'ProtoGo bruger til stede, fraværende og forsinket som de tre protokolstatusser.',
  },

  {
    id: 'recents',
    icon: 'time-outline',
    title: 'Seneste protokoller',
    description:
      'Find og gennemgå tidligere afsluttede protokoller.',
    steps: [
      'Åbn Seneste fra menuen nederst.',
      'Her vises afsluttede protokoller med de nyeste først.',
      'Du kan søge efter blandt andet klasse, lærer, dato og tidspunkt.',
      'Tryk på en protokol for at se elevernes registreringer.',
      'Hvis en registrering er forkert, kan status på en elev ændres på den afsluttede protokol.',
    ],
  },

  {
    id: 'statistics',
    icon: 'stats-chart-outline',
    title: 'Statistik',
    description:
      'Få overblik over fremmøde for både klasser og elever.',
    steps: [
      'Åbn Statistik fra menuen nederst.',
      'Vælg klasseoversigten for at se statistik på klasseniveau.',
      'Vælg elevoversigten for at se statistik for enkelte elever.',
      'Statistikken beregnes ud fra afsluttede protokoller.',
      'Til stede og forsinket tæller med som fremmøde, mens fravær tæller som fravær.',
    ],
    note:
      'Hvis der endnu ikke findes afsluttede protokoller, kan der ikke beregnes en fremmødeprocent.',
  },

  {
    id: 'teachers',
    icon: 'school-outline',
    title: 'Lærere og adgang',
    description:
      'Arbejd sammen med andre lærere omkring en klasse.',
    steps: [
      'Åbn klassens indstillinger.',
      'Som ejer af klassen kan du administrere lærere med adgang til klassen.',
      'Invitér en anden lærer til klassen.',
      'Når invitationen accepteres, får læreren adgang til den pågældende klasse.',
    ],
  },

  {
    id: 'school-year',
    icon: 'copy-outline',
    title: 'Nyt skoleår',
    description:
      'Opret næste skoleårs klasse uden at indtaste elever og kontakter igen.',
    steps: [
      'Åbn den eksisterende klasse.',
      'Gå til klassens indstillinger.',
      'Find sektionen Nyt skoleår.',
      'Tryk på Opret klassen til det nye år.',
      'ProtoGo opretter en ny klasse med næste skoleår.',
      'Aktive elever kopieres til den nye klasse.',
      'Elevernes eksisterende forældrekontakter følger med.',
    ],
    note:
      'Tidligere protokoller og fraværshistorik kopieres ikke. Den nye klasse starter med tom protokolhistorik.',
  },

  {
    id: 'notifications',
    icon: 'notifications-outline',
    title: 'Notifikationer',
    description:
      'Få en påmindelse om at huske dagens protokol.',
    steps: [
      'Åbn Indstillinger.',
      'Vælg Notifikationer.',
      'Slå protokolpåmindelsen til.',
      'Vælg den eller de dage, hvor du vil have en påmindelse.',
      'Vælg tidspunktet.',
      'Tryk på Gem indstillinger.',
      'Første gang skal ProtoGo have tilladelse til at sende notifikationer på enheden.',
    ],
    note:
      'Påmindelserne er knyttet til den enhed, hvor de bliver oprettet.',
  },

  {
    id: 'profile',
    icon: 'settings-outline',
    title: 'Profil og indstillinger',
    description:
      'Administrer din konto og ProtoGo-indstillinger.',
    steps: [
      'Åbn Indstillinger fra menuen nederst.',
      'Under Profil kan du redigere dit navn og se den e-mail, der er knyttet til kontoen.',
      'Du kan også logge ud fra profilsiden.',
      'Under Notifikationer kan protokolpåmindelser administreres.',
      'Kontakt & support viser ProtoGo-supportens kontaktoplysninger.',
      'Om ProtoGo viser blandt andet version og information om appen.',
    ],
  },
];

export default function GuideScreen() {
  const [openSections, setOpenSections] = useState<string[]>([
    'start',
  ]);

  function toggleSection(id: string) {
    setOpenSections((current) => {
      if (current.includes(id)) {
        return current.filter(
          (sectionId) => sectionId !== id
        );
      }

      return [...current, id];
    });
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
        Brugervejledning
      </Text>

      <Text style={styles.subtitle}>
        Her finder du en samlet guide til de vigtigste funktioner i
        ProtoGo.
      </Text>

      {/* INTRO */}

      <View style={styles.introCard}>
        <View style={styles.introIcon}>
          <Ionicons
            name="book-outline"
            size={25}
            color={COLORS.navy}
          />
        </View>

        <View style={styles.introText}>
          <Text style={styles.introTitle}>
            Sådan bruger du ProtoGo
          </Text>

          <Text style={styles.introDescription}>
            Tryk på et emne nedenfor for at åbne den tilhørende
            vejledning.
          </Text>
        </View>
      </View>

      {/* GUIDE */}

      <View style={styles.sectionDivider} />

      <View style={styles.guideCard}>
        {GUIDE_SECTIONS.map((section, index) => {
          const isOpen = openSections.includes(section.id);

          return (
            <View key={section.id}>
              {index > 0 && (
                <View style={styles.rowDivider} />
              )}

              <Pressable
                onPress={() => toggleSection(section.id)}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  pressed && styles.sectionHeaderPressed,
                ]}
              >
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name={section.icon}
                    size={20}
                    color={COLORS.navy}
                  />
                </View>

                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeaderTitle}>
                    {section.title}
                  </Text>

                  <Text style={styles.sectionHeaderDescription}>
                    {section.description}
                  </Text>
                </View>

                <View style={styles.chevronBox}>
                  <Ionicons
                    name={
                      isOpen
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={17}
                    color={COLORS.navy}
                  />
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.sectionContent}>
                  {section.steps.map((step, stepIndex) => (
                    <View
                      key={`${section.id}-${stepIndex}`}
                      style={styles.stepRow}
                    >
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>
                          {stepIndex + 1}
                        </Text>
                      </View>

                      <Text style={styles.stepText}>
                        {step}
                      </Text>
                    </View>
                  ))}

                  {section.note && (
                    <View style={styles.noteBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={19}
                        color={COLORS.navy}
                      />

                      <Text style={styles.noteText}>
                        {section.note}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* SUPPORT */}

      <View style={styles.sectionDivider} />

      <Text style={styles.supportTitle}>
        Har du stadig brug for hjælp?
      </Text>

      <Text style={styles.supportDescription}>
        Hvis du ikke finder svaret i vejledningen, kan du kontakte
        ProtoGo support.
      </Text>

      <Pressable
        onPress={() => router.push('/settings/support')}
        style={({ pressed }) => [
          styles.supportButton,
          pressed && styles.supportButtonPressed,
        ]}
      >
        <View style={styles.buttonContent}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={COLORS.white}
          />

          <Text style={styles.supportButtonText}>
            Kontakt & support
          </Text>
        </View>
      </Pressable>
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

  /* INTRO */

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',

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

  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  introText: {
    flex: 1,
  },

  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  introDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 4,
  },

  /* DIVIDER */

  sectionDivider: {
    height: 1,
    backgroundColor: '#EEF0F3',
    marginTop: 28,
    marginBottom: 24,
  },

  /* GUIDE */

  guideCard: {
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

  sectionHeader: {
    minHeight: 84,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  sectionHeaderPressed: {
    backgroundColor: '#F8FAFC',
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  sectionHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  sectionHeaderDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
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

  rowDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginLeft: 71,
  },

  sectionContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 12,
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,

    backgroundColor: COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },

  stepText: {
    flex: 1,

    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,

    paddingTop: 3,
  },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: COLORS.navySoft,

    borderRadius: 14,
    padding: 13,

    marginTop: 16,
  },

  noteText: {
    flex: 1,

    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,

    marginLeft: 9,
  },

  /* SUPPORT */

  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  supportDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,

    marginTop: 6,
  },

  supportButton: {
    height: 56,

    borderRadius: 16,

    backgroundColor: COLORS.navy,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 18,

    shadowColor: COLORS.navyDark,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 2,
  },

  supportButtonPressed: {
    backgroundColor: COLORS.navyDark,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  supportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});