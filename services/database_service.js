import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DATABASE_NAME = 'bible.db';
const DATABASE_PATH = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
const TAGALOG_VERSIONS = ['ILODS','ILOMB','BUGNA','SPV','PMPV','PNPV','BPV'];

// Initialize database connection
export const initializeDatabase = async () => {
  // Create SQLite directory if needed
  if (!(await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)).exists) {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
      intermediates: true,
    });
  }

  // Copy database if not exists
  if (!(await FileSystem.getInfoAsync(DATABASE_PATH)).exists) {
    await FileSystem.downloadAsync(
      Asset.fromModule(require('../assets/data/bible.db')).uri,
      DATABASE_PATH
    );
  }

  return SQLite.openDatabase(DATABASE_NAME);
};

// Execute SQL query with parameters
const executeQuery = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Database service functions
export default {
  // Get all available Bible versions
  getAvailableVersions: async (db) => {
    try {
      const result = await executeQuery(
        db,
        `SELECT 
          _id, 
          File AS tableName, 
          Name AS fullName, 
          Version AS abbreviation,
          Details AS description
        FROM Versions 
        ORDER BY Version`
      );
      return result.rows._array;
    } catch (error) {
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }
  },

  // Validate if a version table exists
  validateVersion: async (db, version) => {
    try {
      const result = await executeQuery(
        db,
        `SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?`,
        [version]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Version validation failed: ${error.message}`);
    }
  },

  // Search across multiple versions
  searchVerses: async (db, searchTerm, versions) => {
    try {
      const validVersions = await Promise.all(
        versions.map(async version => {
          const isValid = await this.validateVersion(db, version);
          return isValid ? version : null;
        })
      );

      const searchPromises = validVersions
        .filter(v => v !== null)
        .map(async version => {
          const language = TAGALOG_VERSIONS.includes(version) ? '0' : '1';
          
          const result = await executeQuery(
            db,
            `SELECT 
              b.BookName || ' ' || v.Chapter || ':' || v.Verse AS reference,
              v.Text AS content,
              ver.Name AS versionName,
              ver.Version AS versionCode,
              b.Book AS bookId,
              v.Chapter AS chapter,
              v.Verse AS verseNumber
            FROM ${version} v
            JOIN BookList b ON v.Book = b.Book AND b.Language = ?
            JOIN Versions ver ON ver.File = ?
            WHERE v.Text LIKE ?`,
            [language, version, `%${searchTerm}%`]
          );

          return result.rows._array.map(item => ({
            ...item,
            versionId: version,
          }));
        });

      const results = await Promise.all(searchPromises);
      return results.flat();
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  },

  // Get single verse details
  getVerse: async (db, version, bookName, chapter, verse) => {
    try {
      const isValid = await this.validateVersion(db, version);
      if (!isValid) throw new Error('Invalid Bible version');

      const language = TAGALOG_VERSIONS.includes(version) ? '0' : '1';

      const result = await executeQuery(
        db,
        `SELECT 
          v.Text AS content,
          b.BookName || ' ' || v.Chapter || ':' || v.Verse AS fullReference,
          ver.Name AS versionName,
          ver.Version AS versionCode
        FROM ${version} v
        JOIN BookList b ON v.Book = b.Book AND b.Language = ?
        JOIN Versions ver ON ver.File = ?
        WHERE b.BookName = ? AND v.Chapter = ? AND v.Verse = ?`,
        [language, version, bookName, chapter, verse]
      );

      return result.rows._array[0] || null;
    } catch (error) {
      throw new Error(`Failed to get verse: ${error.message}`);
    }
  },

  // Compare multiple versions of a verse
  compareVerses: async (db, bookName, chapter, verse, versions) => {
    try {
      const validVersions = await Promise.all(
        versions.map(version => this.validateVersion(db, version))
      );

      const comparePromises = versions
        .filter((_, index) => validVersions[index])
        .map(async version => {
          const language = TAGALOG_VERSIONS.includes(version) ? '0' : '1';

          const result = await executeQuery(
            db,
            `SELECT 
              v.Text AS content,
              ver.Name AS versionName,
              ver.Version AS versionCode
            FROM ${version} v
            JOIN BookList b ON v.Book = b.Book AND b.Language = ?
            JOIN Versions ver ON ver.File = ?
            WHERE b.BookName = ? AND v.Chapter = ? AND v.Verse = ?`,
            [language, version, bookName, chapter, verse]
          );

          return result.rows._array[0] || null;
        });

      const results = await Promise.all(comparePromises);
      return results.filter(r => r !== null);
    } catch (error) {
      throw new Error(`Comparison failed: ${error.message}`);
    }
  },

  // Get books by language
  getBooksByLanguage: async (db, languageCode) => {
    try {
      const result = await executeQuery(
        db,
        `SELECT 
          Book AS id, 
          BookName AS name 
        FROM BookList 
        WHERE Language = ? 
        ORDER BY Book`,
        [languageCode]
      );
      return result.rows._array;
    } catch (error) {
      throw new Error(`Failed to fetch books: ${error.message}`);
    }
  },

  // Get chapter content
  getChapterVerses: async (db, version, bookId, chapter) => {
    try {
      const isValid = await this.validateVersion(db, version);
      if (!isValid) throw new Error('Invalid Bible version');

      const result = await executeQuery(
        db,
        `SELECT 
          Verse AS verseNumber,
          Text AS content
        FROM ${version}
        WHERE Book = ? AND Chapter = ?
        ORDER BY Verse`,
        [bookId, chapter]
      );
      return result.rows._array;
    } catch (error) {
      throw new Error(`Failed to fetch chapter: ${error.message}`);
    }
  }
};