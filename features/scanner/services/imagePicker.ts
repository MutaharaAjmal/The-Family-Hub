import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

// 📸 Common Function for Base64 (Duplicate code bachane ke liye)
const getBase64 = async (uri: string) => {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

// 1. Camera Function
export const takePhoto = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Camera permission denied');

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
  });

  if (result.canceled || !result.assets) return null;
  return await getBase64(result.assets[0].uri);
};

// 2. Gallery Function
export const pickFromGallery = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new Error('Gallery permission denied');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });

  if (result.canceled || !result.assets) return null;
  return await getBase64(result.assets[0].uri);
};