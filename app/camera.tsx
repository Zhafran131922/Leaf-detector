import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImageManipulator from 'expo-image-manipulator';

export default function CameraAlternative() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [treatment, setTreatment] = useState<string | null>(null);

  // Fungsi untuk menerjemahkan dan mendapatkan penanganan
  const translateAndGetTreatment = (label: string) => {
    const translations: Record<string, { display: string; treatment: string }> =
      {
        daun_berjamur: {
          display: "Daun Berjamur",
          treatment:
            "1. Potong dan buang daun yang terinfeksi\n2. Semprot dengan fungisida alami (larutan baking soda 1 sdm/liter air)\n3. Tingkatkan sirkulasi udara\n4. Hindari penyiraman daun secara langsung",
        },
        bukan_daun: {
          display: "Bukan Daun",
          treatment:
            "Arahkan kamera pada bagian belakang daun kelengkeng untuk diidentifikasi penyakitnya!",
        },
        daun_kurang_nutrisi: {
          display: "Daun Kurang Nutrisi",
          treatment:
            "1. Berikan pupuk NPK seimbang (15-15-15)\n2. Tambahkan pupuk organik seperti kompos\n3. Untuk defisiensi spesifik:\n   - Kekurangan N: Pupuk urea/darah ternak\n   - Kekurangan P: Pupuk fosfat/guano\n   - Kekurangan K: Pupuk kalium/abu kayu",
        },
        daun_sehat: {
          display: "Daun Sehat",
          treatment:
            "1. Pertahankan perawatan rutin\n2. Lanjutkan penyiraman dan pemupukan sesuai jadwal\n3. Pantau secara berkala untuk deteksi dini masalah",
        },
      };

    return (
      translations[label.toLowerCase()] || {
        display: label,
        treatment: "Penanganan belum tersedia untuk kondisi ini",
      }
    );
  };

  const pickImage = async (fromCamera: boolean) => {
    setPrediction(null);
    setTreatment(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      alert(`Izin akses ${fromCamera ? "kamera" : "galeri"} diperlukan!`);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          base64: true,
        });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
      // Kompres gambar sebelum upload
      const compressedImage = await compressAndResizeImage(result.assets[0].uri);
      uploadImage(compressedImage.base64);
    }
  };

  const compressAndResizeImage = async (uri: string) => {
    // Kompres dan resize gambar ke 224x224
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
  };

  const uploadImage = async (base64Image: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://2598-103-23-103-95.ngrok-free.app/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const confidencePercent = (data.confidence * 100).toFixed(2);
        const { display, treatment } = translateAndGetTreatment(data.label);
        setPrediction(`${display} (${confidencePercent}% akurasi)`);
        setTreatment(treatment);
      } else {
        Alert.alert("Error", data.error || "Prediksi gagal");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Deteksi Penyakit Tanaman</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cameraButton]}
          onPress={() => pickImage(true)}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.buttonText}>Ambil Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.galleryButton]}
          onPress={() => pickImage(false)}
        >
          <Ionicons name="image" size={24} color="white" />
          <Text style={styles.buttonText}>Dari Galeri</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            Menganalisis kesehatan tanaman...
          </Text>
        </View>
      )}

      {prediction && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Hasil Deteksi:</Text>
          <Text style={styles.resultText}>{prediction}</Text>
        </View>
      )}

      {treatment && (
        <View style={styles.treatmentContainer}>
          <Text style={styles.treatmentTitle}>Langkah Penanganan:</Text>
          <Text style={styles.treatmentText}>{treatment}</Text>
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips Pertanian Cerdas:</Text>
        <Text style={styles.tipsText}>
          • Ambil foto daun pada bagian belakang dengan pencahayaan cukup
        </Text>
        <Text style={styles.tipsText}>
          • Periksa tanaman secara berkala untuk deteksi dini
        </Text>
        <Text style={styles.tipsText}>
          • Jaga kelembaban tanah yang optimal
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5fdf4",
    padding: 20,
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  headerText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: "45%",
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: "#388E3C",
  },
  galleryButton: {
    backgroundColor: "#689F38",
  },
  buttonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: "#C8E6C9",
    borderRadius: 10,
    padding: 5,
    backgroundColor: "white",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#2E7D32",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#2E7D32",
    marginBottom: 20,
  },
  resultTitle: {
    fontWeight: "bold",
    color: "#1B5E20",
    fontSize: 18,
    marginBottom: 5,
  },
  resultText: {
    color: "#2E7D32",
    fontSize: 16,
  },
  tipsContainer: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  tipsTitle: {
    fontWeight: "bold",
    color: "#1B5E20",
    fontSize: 16,
    marginBottom: 8,
  },
  tipsText: {
    color: "#2E7D32",
    marginBottom: 5,
  },
  treatmentContainer: {
    backgroundColor: "#e8f5e9", // warna hijau muda
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treatmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32", // warna hijau gelap
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 16,
    color: "#333",
    marginTop: 8,
    lineHeight: 22,
  },
});