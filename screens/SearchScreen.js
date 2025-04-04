import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { initializeDatabase, databaseService } from '../services/database_service';

const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [db, setDb] = useState(null);

  // Initialize database and load versions
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await initializeDatabase();
        setDb(database);
        const versionList = await databaseService.getAvailableVersions(database);
        setVersions(versionList);
      } catch (error) {
        console.error('Database init error:', error);
      }
    };
    initDB();
  }, []);

  // Toggle version selection
  const toggleVersion = (versionId) => {
    setSelectedVersions(prev => 
      prev.includes(versionId)
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  // Handle search
  const handleSearch = async () => {
    if (!db || selectedVersions.length === 0) return;

    try {
      const searchResults = await databaseService.searchVerses(
        db,
        searchTerm,
        selectedVersions
      );
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Version Selection */}
      <Text style={styles.sectionTitle}>Select Translations:</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.versionContainer}
      >
        {versions.map(version => (
          <View key={version.tableName} style={styles.versionItem}>
            <Checkbox
              value={selectedVersions.includes(version.tableName)}
              onValueChange={() => toggleVersion(version.tableName)}
              color={selectedVersions.includes(version.tableName) ? '#2196F3' : undefined}
            />
            <Text style={styles.versionText}>
              {version.abbreviation}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Search Input */}
      <TextInput
        style={styles.input}
        placeholder="Search Bible verses..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />

      {/* Search Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.versionId}-${item.bookId}-${item.chapter}-${item.verseNumber}`}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.versionHeader}>
              {item.versionName} ({item.versionCode})
            </Text>
            <Text style={styles.reference}>{item.reference}</Text>
            <Text style={styles.text}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedVersions.length === 0 
              ? 'Select at least one translation' 
              : 'No results found'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  versionContainer: {
    paddingBottom: 12,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  versionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  resultItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  versionHeader: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  reference: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
    fontSize: 16,
  },
});

export default SearchScreen;