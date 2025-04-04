// utils/database.js
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const openDatabase = async () => {
  const dbName = 'bible.db';
  const dbDirectory = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbDirectory}${dbName}`;

  // Create directory if needed
  await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });

  // Check if database exists
  const fileInfo = await FileSystem.getInfoAsync(dbPath);

  if (!fileInfo.exists) {
    await FileSystem.downloadAsync(
      Asset.fromModule(require('../assets/data/bible.db')).uri,
      dbPath
    );
  }

  return SQLite.openDatabase(dbName);
};