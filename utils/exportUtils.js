// utils/exportUtils.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Generate formatted content for export
const generateContent = (results, format) => {
  const date = new Date().toLocaleDateString();
  
  // HTML Template for PDF
  if (format === 'pdf') {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; color: #2c3e50; }
            .date { color: #7f8c8d; margin-bottom: 30px; }
            .verse { margin-bottom: 25px; page-break-inside: avoid; }
            .version { color: #3498db; font-weight: bold; }
            .reference { color: #2c3e50; margin: 5px 0; }
            .text { color: #34495e; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Bible Study Export</h1>
            <div class="date">Generated: ${date}</div>
          </div>
          ${results.map(item => `
            <div class="verse">
              <div class="version">${item.VersionName} (${item.VersionAbbreviation})</div>
              <div class="reference">${item.Verse}</div>
              <div class="text">${item.Text}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  // Plain Text Template for DOCX
  return results.map(item => 
    `${item.VersionName} (${item.VersionAbbreviation})\n` +
    `${item.Verse}\n` +
    `${item.Text}\n\n` +
    '―'.repeat(40) + '\n\n'
  ).join('');
};

// Main export function
export const exportContent = async (results, format = 'pdf') => {
  try {
    if (!results || results.length === 0) {
      throw new Error('No results to export');
    }

    const content = generateContent(results, format);
    const fileName = `BibleVerses_${Date.now()}.${format}`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    if (format === 'pdf') {
      // Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: content,
        width: 612,   // 8.5" * 72 (standard PDF dimensions)
        height: 792,  // 11" * 72
        padding: 30
      });
      return uri;
    }

    if (format === 'docx') {
      // Generate text file with DOCX extension
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8
      });
      return fileUri;
    }

    throw new Error('Unsupported format');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Share generated file
export const shareDocument = async (fileUri) => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      alert('Sharing not available on this device');
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: fileUri.endsWith('.pdf') ? 
        'application/pdf' : 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dialogTitle: 'Share Bible Verses',
      UTI: fileUri.endsWith('.pdf') ? 
        'com.adobe.pdf' : 
        'org.openxmlformats.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Sharing error:', error);
    throw error;
  }
};