import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',

  white: '#FFFFFF',
};

export default function StatisticsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>
          Statistik
        </Text>

        <Text style={styles.subtitle}>
          Få overblik over fremmøde og fravær
          for både klasser og elever.
        </Text>
      </View>

      {/* KLASSESTATISTIK */}

      <Pressable
        onPress={() =>
          router.push(
            '/(tabs)/statistics/classes'
          )
        }
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardIcon}>
          <Ionicons
            name="school-outline"
            size={28}
            color={COLORS.navy}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Klassestatistik
          </Text>

          <Text style={styles.cardDescription}>
            Se klassens samlede fremmøde,
            fravær, forsinkelser og udvikling
            over tid.
          </Text>

          <View style={styles.cardMeta}>
            <Ionicons
              name="stats-chart-outline"
              size={15}
              color={COLORS.navy}
            />

            <Text style={styles.cardMetaText}>
              Statistik og grafer
            </Text>
          </View>
        </View>

        <View style={styles.chevron}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.navy}
          />
        </View>
      </Pressable>

      {/* ELEVSTATISTIK */}

      <Pressable
        onPress={() =>
          router.push(
            '/(tabs)/statistics/students'
          )
        }
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardIcon}>
          <Ionicons
            name="person-outline"
            size={28}
            color={COLORS.navy}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Elevstatistik
          </Text>

          <Text style={styles.cardDescription}>
            Vælg en elev og se personligt
            fremmøde, fravær og udvikling
            over tid.
          </Text>

          <View style={styles.cardMeta}>
            <Ionicons
              name="analytics-outline"
              size={15}
              color={COLORS.navy}
            />

            <Text style={styles.cardMetaText}>
              Individuel statistik
            </Text>
          </View>
        </View>

        <View style={styles.chevron}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.navy}
          />
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
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 30,
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
    maxWidth: 330,
  },

  card: {
    minHeight: 170,

    backgroundColor: COLORS.white,

    borderRadius: 22,

    padding: 20,

    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 18,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.04,
    shadowRadius: 14,

    elevation: 1,
  },

  cardPressed: {
    transform: [
      {
        scale: 0.99,
      },
    ],

    opacity: 0.9,
  },

  cardIcon: {
    width: 54,
    height: 54,

    borderRadius: 17,

    backgroundColor:
      COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 15,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '700',

    color: COLORS.text,

    marginTop: 2,
  },

  cardDescription: {
    fontSize: 14,

    color: COLORS.muted,

    lineHeight: 20,

    marginTop: 7,

    paddingRight: 6,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 14,
  },

  cardMetaText: {
    fontSize: 12,
    fontWeight: '600',

    color: COLORS.navy,
  },

  chevron: {
    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor:
      COLORS.navySoft,

    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',

    marginLeft: 8,
  },
});