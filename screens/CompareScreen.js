// screens/CompareScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const CompareScreen = () => {
  const [itemsToCompare, setItemsToCompare] = React.useState([]);

  const handleCompare = async () => {
    // Call your server.js compare endpoint here
    // Example: fetch('/api/compare', { method: 'POST', body: ... })
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compare Items</Text>
      {/* Add comparison interface here */}
      <Button title="Compare" onPress={handleCompare} />
      {/* Display comparison results here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
});

export default CompareScreen;