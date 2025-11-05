import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useIuranContext } from "../../context/IuranContext";
import { Lapak, PedagangLite } from "../../context/LapakContext";
import { formatDate } from "../../utils/formatUtils";

const AddIuranScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const pedagang = JSON.parse(params.pedagang as string) as PedagangLite;
  const lapak = JSON.parse(params.lapak as string) as Lapak;

  const { addIuran } = useIuranContext();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formTanggal, setFormTanggal] = useState<Date>(new Date());
  const [formJumlah, setFormJumlah] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formBuktiFoto, setFormBuktiFoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const handlePickBuktiFoto = async (fromCamera: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    };

    try {
      if (fromCamera) {
        if (!cameraPermission?.granted) {
          const { granted } = await requestCameraPermission();
          if (!granted) {
            Alert.alert("Izin Diperlukan", "Izin kamera dibutuhkan.");
            return;
          }
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        if (!mediaLibraryPermission?.granted) {
          const { granted } = await requestMediaLibraryPermission();
          if (!granted) {
            Alert.alert("Izin Diperlukan", "Izin galeri dibutuhkan.");
            return;
          }
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormBuktiFoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil gambar.");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Pilih Sumber Foto", "Ambil foto dari kamera atau galeri?", [
      { text: "Kamera", onPress: () => handlePickBuktiFoto(true) },
      { text: "Galeri", onPress: () => handlePickBuktiFoto(false) },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleSubmitIuran = async () => {
    if (!formJumlah || isNaN(Number(formJumlah))) {
      Alert.alert("Error", "Jumlah iuran harus diisi dan berupa angka.");
      return;
    }
    if (formStatus === "tidak berjualan" && !formBuktiFoto) {
      Alert.alert(
        "Error",
        "Bukti foto wajib diisi untuk status 'Tidak Berjualan'."
      );
      return;
    }

    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append("IURAN_PEDAGANG", pedagang.CUST_CODE);
      formData.append("IURAN_TANGGAL", formTanggal.toISOString().split("T")[0]);
      formData.append("IURAN_JUMLAH", formJumlah);
      formData.append("IURAN_STATUS", formStatus);

      if (formStatus === "tidak berjualan" && formBuktiFoto) {
        let imageUri = formBuktiFoto.uri;
        if (Platform.OS === "android" && imageUri.startsWith("content://")) {
          const newUri = `${
            FileSystem.cacheDirectory
          }iuran_bukti_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: imageUri, to: newUri });
          imageUri = newUri;
        }

        formData.append("bukti_foto_iuran", {
          uri: imageUri,
          name: formBuktiFoto.fileName || "bukti_foto.jpg",
          type: formBuktiFoto.mimeType || "image/jpeg",
        } as any);
      }

      await addIuran(formData);
      Alert.alert("Sukses", "Iuran berhasil ditambahkan.");

      // Kembali ke home dan trigger refresh
      router.replace({
        pathname: "/home",
        params: { refreshWithCode: lapak.LAPAK_CODE },
      });
    } catch (err) {
      Alert.alert("Gagal", "Gagal menambah iuran.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Tambah Iuran Manual</Text>
        <Text style={styles.subtitle}>
          Untuk: {pedagang.CUST_NAMA} ({lapak.LAPAK_NAMA})
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Tanggal Iuran</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateInput}
          >
            <Text style={{ color: "#333" }}>
              {formatDate(formTanggal.toISOString())}
            </Text>
            <Icon name="event" size={20} color="#555" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formTanggal}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setFormTanggal(date);
              }}
            />
          )}

          <Text style={styles.label}>Jumlah Iuran</Text>
          <TextInput
            value={formJumlah}
            onChangeText={setFormJumlah}
            keyboardType="numeric"
            placeholder="Rp 0"
            style={styles.textInput}
          />

          <Text style={styles.label}>Status</Text>
          <RNPickerSelect
            onValueChange={(value) => value && setFormStatus(value)}
            items={[
              { label: "Pending", value: "pending" },
              { label: "Tidak Berjualan", value: "tidak berjualan" },
              { label: "Tidak Bayar", value: "tidak bayar" },
            ]}
            style={pickerSelectStyles}
            value={formStatus}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
            Icon={() => <Icon name="arrow-drop-down" size={24} color="gray" />}
          />

          {formStatus === "tidak berjualan" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Bukti Foto (wajib)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={showImagePickerOptions}
              >
                <Icon name="camera-alt" size={20} color="#fff" />
                <Text style={styles.photoButtonText}>
                  {formBuktiFoto ? "Ganti Foto" : "Ambil/Pilih Foto"}
                </Text>
              </TouchableOpacity>
              {formBuktiFoto && (
                <Image
                  source={{ uri: formBuktiFoto.uri }}
                  style={styles.previewImage}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmitIuran}
          disabled={formLoading}
        >
          {formLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Simpan Iuran</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  form: { backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  label: { fontSize: 14, color: "#555", marginBottom: 8 },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  photoButton: {
    flexDirection: "row",
    backgroundColor: "#FF9800",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  previewImage: {
    width: 120,
    height: 120,
    marginTop: 12,
    borderRadius: 8,
    alignSelf: "center",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButton: { backgroundColor: "#4CAF50" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    color: "black",
    paddingRight: 30,
    marginBottom: 16,
  },
  inputAndroid: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    color: "black",
    paddingRight: 30,
    marginBottom: 16,
  },
  iconContainer: { top: 15, right: 15 },
});

export default AddIuranScreen;
