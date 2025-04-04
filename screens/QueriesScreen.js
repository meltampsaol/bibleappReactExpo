// screens/QueriesScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const QueriesScreen = () => {
  const [queries, setQueries] = React.useState([]);

  // Fetch queries from server.js when component mounts
  React.useEffect(() => {
    const fetchQueries = async () => {
      // Call your server.js API endpoint here
      // const response = await fetch('/api/queries');
      // setQueries(response.data);
    };
    fetchQueries();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Queries</Text>
      <FlatList
        data={queries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.queryItem}>
            <Text>{item.name}</Text>
            <Text>{item.query}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  queryItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});

export default QueriesScreen;