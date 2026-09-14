import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

export default function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>
        ‹
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 16,
  },

  icon: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '400',
    color: '#111827',
  },

  pressed: {
    opacity: 0.5,
  },
});