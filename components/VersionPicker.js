// components/VersionPicker.js
import { View, Picker, StyleSheet } from 'react-native';

const versions = ['NIV', 'KJV', 'ESV', 'NASB', 'NLT'];

export default function VersionPicker({ selectedVersion, onVersionChange }) {
  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedVersion}
        onValueChange={onVersionChange}
        style={styles.picker}
      >
        {versions.map(version => (
          <Picker.Item key={version} label={version} value={version} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  }
});