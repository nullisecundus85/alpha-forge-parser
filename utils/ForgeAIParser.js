import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

export const pickPdfFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    console.log("📄 File selected:", result);
    if (result.type === 'success' && result.name.endsWith('.pdf')) {
      return result;
    } else {
      console.warn('Selected file is not a PDF.');
    }
  } catch (err) {
    console.error('Error picking PDF:', err);
  }
  return null;
};

export const parsePdf = async (uri) => {
  try {
    console.log("📥 parsePdf called with URI:", uri);

    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.size === 0) {
      throw new Error("File does not exist or is empty");
    }

    Alert.alert('📤 Converting PDF', 'Attempting to read and encode PDF...');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.trim().length === 0) {
      throw new Error("Base64 encoding returned empty");
    }

    console.log('📤 Base64 length:', base64.length);

    const response = await fetch('https://alpha-forge-parser.onrender.com/api/parse-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64 }),
    });

    let result;
    try {
      result = await response.json();
      console.log("📨 Parser response JSON:", result);
    } catch (jsonErr) {
      console.error("❌ Failed to parse JSON response:", jsonErr);
      throw new Error("Invalid JSON returned from parser");
    }

    if (!response.ok) {
      throw new Error(result?.message || 'Failed to parse PDF');
    }

    if (!result.text || result.text.trim().length === 0) {
      throw new Error("Parser returned empty response text");
    }

    Alert.alert('✅ AI Response', result.text.slice(0, 200));
    return result.text;
  } catch (err) {
    Alert.alert('❌ Parse Error', err.message || 'Failed to read or parse the PDF.');
    console.error('❌ Error in parsePdf:', err);
    return '';
  }
};
