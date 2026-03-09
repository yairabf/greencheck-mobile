import { View, Text, StyleSheet } from 'react-native';

export function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Stack (placeholder)</Text>
      <Text>Phone OTP flow will be added in S2.1.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600' },
});
