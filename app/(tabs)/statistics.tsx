import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Statistik
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 20,
    paddingTop: 70,
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
});