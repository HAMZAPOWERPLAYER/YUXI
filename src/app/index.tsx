import { StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yuxi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0B0B0F',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#F4F4F6',
    fontSize: 32,
    fontWeight: '700',
  },
});
