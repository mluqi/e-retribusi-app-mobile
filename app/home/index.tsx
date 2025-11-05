import Icon from "@react-native-vector-icons/material-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import {
  EditLapakStatusData,
  Lapak,
  PedagangLite,
  useLapakContext,
} from "../../context/LapakContext";
import { RootStackParamList } from "../../navigation/AppNavigation";
import { formatCurrency, formatDate } from "../../utils/formatUtils";

// import { API_BASE_URL } from '../../config'; // Diasumsikan Anda memiliki konfigurasi base URL

const API_FILES_STATIC_PATH = "https://dev1-p3.palindo.id";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

const HomeScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isLoading, error, logout: authLogout } = useAuth();
  const { getLapakByCode, editStatusLapak } = useLapakContext();
  const params = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Lapak | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [lapakToEditStatus, setLapakToEditStatus] = useState<Lapak | null>(
    null
  );
  const [loadingUpdateStatus, setLoadingUpdateStatus] = useState(false);

  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    const backAction = () => {
      // Mencegah aksi kembali default di halaman home.
      // Mengembalikan `true` akan menghentikan event.
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (params.searchResult && params.scannedCode) {
      try {
        const scannedCode = params.scannedCode as string;
        setSearchQuery(scannedCode);

        const result = JSON.parse(params.searchResult as string);
        setSearchResults(result);

        setSearchError("");
      } catch (err) {
        console.error("Error parsing search result:", err);
        setSearchError("Terjadi kesalahan saat memproses hasil scan");
      }
    }
  }, [params.searchResult, params.scannedCode]);

  useEffect(() => {
    if (params.refreshWithCode) {
      const code = params.refreshWithCode as string;
      setSearchQuery(code);
      handleSearch(code); // Panggil handleSearch dengan kode yang diterima
    }
  }, [params.refreshWithCode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    setSearchError("");

    try {
      const result = await getLapakByCode(searchQuery);
      if (result) {
        setSearchResults(result);
      } else {
        setSearchError("Lapak tidak ditemukan");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Terjadi kesalahan saat mencari lapak");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleViewIuran = (pedagang: PedagangLite, lapak: Lapak) => {
    if (pedagang.CUST_STATUS !== "aktif") {
      Alert.alert(
        "Tidak Dapat Melanjutkan",
        "Pedagang tidak aktif, tidak dapat melihat iuran."
      );
      return;
    }

    router.push({
      pathname: "/iuran",
      params: {
        pedagang: JSON.stringify(pedagang),
        lapak: JSON.stringify(lapak),
        pasarName: lapak.pasar?.pasar_nama || "Pasar",
      },
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Keluar",
          onPress: async () => {
            await authLogout();
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleScanPress = () => {
    if (!isPermissionGranted) {
      requestPermission().then(({ granted }) => {
        if (granted) {
          router.push("/scanner");
        } else {
          Alert.alert(
            "Izin Kamera Dibutuhkan",
            "Untuk melakukan scan kode QR, aplikasi membutuhkan izin untuk mengakses kamera.",
            [
              { text: "Batal", style: "cancel" },
              { text: "Coba Lagi", onPress: requestPermission },
            ]
          );
        }
      });
    } else {
      router.push("/scanner");
    }
  };

  const openStatusModal = (lapak: Lapak) => {
    setLapakToEditStatus(lapak);
    setIsStatusModalVisible(true);
  };

  const closeStatusModal = () => {
    setLapakToEditStatus(null);
    setIsStatusModalVisible(false);
  };

  const pickImageForStatus = async (newStatus: Lapak["LAPAK_STATUS"]) => {
    Alert.alert(
      "Pilih Sumber Foto Bukti",
      "Ambil foto dari kamera atau pilih dari galeri?",
      [
        {
          text: "Kamera",
          onPress: async () => {
            if (!cameraPermission?.granted) {
              const { granted } = await requestCameraPermission();
              if (!granted) {
                Alert.alert(
                  "Izin Diperlukan",
                  "Izin kamera dibutuhkan untuk mengambil foto."
                );
                return;
              }
            }
            launchImagePicker(true, newStatus);
          },
        },
        {
          text: "Galeri",
          onPress: async () => {
            if (!mediaLibraryPermission?.granted) {
              const { granted } = await requestMediaLibraryPermission();
              if (!granted) {
                Alert.alert(
                  "Izin Diperlukan",
                  "Izin galeri dibutuhkan untuk memilih foto."
                );
                return;
              }
            }
            launchImagePicker(false, newStatus);
          },
        },
        { text: "Batal", style: "cancel" },
      ]
    );
  };

  const launchImagePicker = async (
    useCamera: boolean,
    newStatus: Lapak["LAPAK_STATUS"]
  ) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      // Tambahkan opsi untuk Android
      ...(Platform.OS === "android" && {
        allowsMultipleSelection: false,
      }),
    };

    try {
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let imageAsset = result.assets[0];

        // Pastikan URI dalam format yang benar
        let finalUri = imageAsset.uri;

        // Untuk Android, handle content:// URI
        if (
          Platform.OS === "android" &&
          imageAsset.uri.startsWith("content://")
        ) {
          try {
            const fileName =
              imageAsset.fileName || `temp_image_${Date.now()}.jpg`;
            const newUri = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.copyAsync({
              from: imageAsset.uri,
              to: newUri,
            });

            finalUri = newUri;
            console.log("Image copied to:", finalUri);
          } catch (e) {
            console.error("Gagal menyalin gambar:", e);
            Alert.alert("Error", "Gagal memproses gambar yang dipilih.");
            return;
          }
        }

        // Update imageAsset dengan URI yang sudah diproses
        imageAsset = {
          ...imageAsset,
          uri: finalUri,
          // Pastikan mimetype tersedia
          mimeType: imageAsset.mimeType || "image/jpeg",
          // Pastikan filename tersedia
          fileName: imageAsset.fileName || `image_${Date.now()}.jpg`,
        };

        console.log("Final Image Asset:", imageAsset);
        handleUpdateStatus(newStatus, imageAsset);
      }
    } catch (error) {
      console.error("Error in launchImagePicker:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mengambil gambar.");
    }
  };

  // Di handleUpdateStatus
  const handleUpdateStatus = async (
    newStatus: Lapak["LAPAK_STATUS"],
    imageAsset?: ImagePicker.ImagePickerAsset
  ) => {
    if (!lapakToEditStatus) return;
    setLoadingUpdateStatus(true);

    try {
      const payload: EditLapakStatusData = { LAPAK_STATUS: newStatus };

      if (newStatus === "tutup" && imageAsset) {
        payload.bukti_foto_file = {
          uri: imageAsset.uri,
          name:
            imageAsset.fileName || `bukti_${lapakToEditStatus.LAPAK_CODE}.jpg`,
          type: imageAsset.mimeType || "image/jpeg",
        };

        // Log untuk debugging
        console.log("Payload with image:", payload);
      }

      await editStatusLapak(lapakToEditStatus.LAPAK_CODE, payload);
      Alert.alert(
        "Sukses",
        `Status lapak berhasil diubah menjadi ${newStatus}.`
      );
      closeStatusModal();
      handleSearch();
    } catch (err) {
      console.error("Error updating status:", err);
      Alert.alert(
        "Gagal",
        `Gagal mengubah status lapak: ${
          err instanceof Error ? err.message : "Error tidak diketahui"
        }`
      );
    } finally {
      setLoadingUpdateStatus(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Terjadi kesalahan: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.user_foto && (
              <Image
                source={{ uri: user.user_foto }}
                style={styles.userImage}
              />
            )}
            <Text style={styles.greeting}>Halo, {user?.user_name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>Cari Lapak</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Masukkan kode lapak"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loadingSearch}
            >
              {loadingSearch ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="search" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}
        </View>

        {/* Scan Button */}
        <View style={styles.scanButtonContainer}>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
            <Icon
              name="qr-code-scanner"
              size={24}
              color="#fff"
              style={styles.scanIcon}
            />
            <Text style={styles.scanButtonText}>Scan Kode Lapak</Text>
          </TouchableOpacity>

          <View style={styles.rowButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.scanButton,
                styles.halfWidthButton,
                { backgroundColor: "#607D8B" },
              ]}
              onPress={() => router.push("/history")}
            >
              <Icon
                name="history"
                size={24}
                color="#fff"
                style={styles.scanIcon}
              />
              <Text style={styles.scanButtonText}>Riwayat Transaksi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.scanButton,
                styles.halfWidthButton,
                { backgroundColor: "#f44336" },
              ]}
              onPress={() => router.push("/unpaid-iuran")}
            >
              <Icon
                name="payment"
                size={24}
                color="#fff"
                style={styles.scanIcon}
              />
              <Text style={styles.scanButtonText}>Lapak Belum Dibayar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results */}
        {searchResults && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Hasil Pencarian</Text>

            {/* Lapak Info */}
            <View style={styles.lapakCard}>
              <View style={styles.lapakHeader}>
                <Text style={styles.lapakName}>{searchResults.LAPAK_NAMA}</Text>
              </View>
              <Text style={styles.lapakCode}>{searchResults.LAPAK_CODE}</Text>

              <View style={styles.lapakDetail}>
                <View style={styles.detailRow}>
                  <Icon name="location-on" size={18} color="#555" />
                  <Text style={styles.detailText}>
                    Blok: {searchResults.LAPAK_BLOK}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="straighten" size={18} color="#555" />
                  <Text style={styles.detailText}>
                    Ukuran: {searchResults.LAPAK_UKURAN}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="store" size={18} color="#555" />
                  <Text style={styles.detailText}>
                    Pasar: {searchResults.pasar?.pasar_nama}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="calendar-today" size={18} color="#555" />
                  <Text style={styles.detailText}>
                    Sewa: {formatDate(searchResults.LAPAK_MULAI)} -{" "}
                    {formatDate(searchResults.LAPAK_AKHIR)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="info-outline" size={18} color="#555" />
                  <Text style={styles.detailText}>Status:</Text>
                  <Text
                    style={[
                      styles.detailText,
                      searchResults.LAPAK_STATUS === "tutup"
                        ? { color: "red" }
                        : searchResults.LAPAK_STATUS === "kosong"
                        ? { color: "orange" }
                        : { color: "green" },
                    ]}
                  >
                    {searchResults.LAPAK_STATUS.charAt(0).toUpperCase() +
                      searchResults.LAPAK_STATUS.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pedagang Info */}
            {searchResults.DB_PEDAGANG ? (
              <TouchableOpacity
                style={[
                  styles.pedagangCard,
                  searchResults.DB_PEDAGANG.CUST_STATUS !== "aktif" &&
                    styles.pedagangCardInactive,
                ]}
                onPress={() =>
                  handleViewIuran(searchResults.DB_PEDAGANG!, searchResults)
                }
                disabled={searchResults.DB_PEDAGANG.CUST_STATUS !== "aktif"}
              >
                <View style={styles.pedagangHeader}>
                  <Icon name="person" size={24} color="#444" />
                  <Text style={styles.pedagangName}>
                    {searchResults.DB_PEDAGANG.CUST_NAMA}
                  </Text>
                  <Text>({searchResults.DB_PEDAGANG.CUST_CODE})</Text>
                </View>
                {searchResults.DB_PEDAGANG.CUST_STATUS === "aktif" && (
                  <View style={styles.statusBadgeContainer}>
                    {(!searchResults.DB_PEDAGANG.iurans ||
                      searchResults.DB_PEDAGANG.iurans.length === 0) && (
                      <Text style={styles.lunasBadge}>LUNAS</Text>
                    )}
                    {searchResults.DB_PEDAGANG.iurans?.some(
                      (iuran) => iuran.IURAN_STATUS === "tidak berjualan"
                    ) && (
                      <Text style={styles.tidakBerjualanBadge}>
                        TIDAK BERJUALAN
                      </Text>
                    )}
                  </View>
                )}
                {searchResults.DB_PEDAGANG.CUST_STATUS === "aktif" ? (
                  <View style={styles.pedagangDetail}>
                    <Text style={styles.pedagangText}>
                      NIK: {searchResults.DB_PEDAGANG.CUST_NIK}
                    </Text>
                    <Text style={styles.pedagangText}>
                      Telp: {searchResults.DB_PEDAGANG.CUST_PHONE}
                    </Text>
                    {searchResults.DB_PEDAGANG.iurans &&
                    searchResults.DB_PEDAGANG.iurans.length > 0 ? (
                      <Text style={styles.pedagangText}>
                        Sisa Iuran:{" "}
                        {formatCurrency(
                          searchResults.DB_PEDAGANG.iurans.reduce(
                            (sum, iuran) =>
                              iuran.IURAN_STATUS === "pending"
                                ? sum + iuran.IURAN_JUMLAH
                                : sum,
                            0
                          )
                        )}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.pedagangDetail}>
                    <Text style={styles.pedagangInactiveText}>
                      Pedagang Tidak Aktif
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : null}

            {/* Bukti Foto Lapak Tutup */}
            {searchResults.LAPAK_STATUS === "tutup" &&
              searchResults.LAPAK_BUKTI_FOTO && (
                <View style={styles.lapakPhotoCard}>
                  <Text style={styles.photoTitle}>Bukti Foto Lapak Tutup</Text>
                  <Image
                    source={{
                      uri: `${API_FILES_STATIC_PATH}/${searchResults.LAPAK_BUKTI_FOTO}`.replace(
                        /\\/g,
                        "/"
                      ),
                    }} // Mengganti backslash jika ada
                    style={styles.lapakPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}
            {/* Tombol Edit status - dipindahkan ke sini, di luar lapakCard */}
            {searchResults && (
              <TouchableOpacity
                style={[
                  styles.editStatusButton,
                  styles.editStatusButtonOutsideCard,
                ]}
                onPress={() => openStatusModal(searchResults)}
              >
                <Icon name="edit" size={18} color="#fff" />
                <Text style={styles.editStatusButtonText}>Ubah Status</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      {/* Modal Edit Status */}
      {lapakToEditStatus && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isStatusModalVisible}
          onRequestClose={closeStatusModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Ubah Status Lapak: {lapakToEditStatus.LAPAK_NAMA}
              </Text>
              <Text style={styles.modalSubtitle}>
                Status Saat Ini:{" "}
                {lapakToEditStatus.LAPAK_STATUS.charAt(0).toUpperCase() +
                  lapakToEditStatus.LAPAK_STATUS.slice(1)}
              </Text>

              {(
                ["aktif", "kosong", "rusak", "tutup"] as Lapak["LAPAK_STATUS"][]
              ).map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={styles.statusOptionButton}
                  onPress={() => {
                    if (statusOption === "tutup") {
                      pickImageForStatus(statusOption);
                    } else {
                      handleUpdateStatus(statusOption);
                    }
                  }}
                  disabled={loadingUpdateStatus}
                >
                  <Text style={styles.statusOptionText}>
                    {statusOption.charAt(0).toUpperCase() +
                      statusOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}

              {loadingUpdateStatus && (
                <ActivityIndicator
                  size="small"
                  color="#007AFF"
                  style={{ marginTop: 10 }}
                />
              )}

              <TouchableOpacity
                style={[styles.statusOptionButton, styles.cancelButton]}
                onPress={closeStatusModal}
                disabled={loadingUpdateStatus}
              >
                <Text
                  style={[styles.statusOptionText, styles.cancelButtonText]}
                >
                  Batal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 10,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  searchContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanButtonContainer: {
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    elevation: 2,
  },
  scanIcon: {
    marginRight: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  rowButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  halfWidthButton: {
    width: "48%", // Adjust as needed for spacing
    marginTop: 0, // Reset margin top for buttons in a row
    paddingVertical: 12, // Adjust padding for smaller buttons
  },
  resultsContainer: {
    marginTop: 8,
  },
  pedagangCardInactive: {
    opacity: 0.7,
  },
  lapakCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  lapakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  lapakName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  lapakCode: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  lapakDetail: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#555",
  },
  pedagangCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  pedagangHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tidakBerjualanBadge: {
    fontSize: 14,
    color: "#ffffff",
    backgroundColor: "#f44336",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  pedagangName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  pedagangDetail: {
    marginLeft: 32,
  },
  pedagangText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },

  pedagangInactiveText: {
    fontSize: 16,
    color: "#f44336",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  lunasBadge: {
    fontSize: 14,
    color: "#ffffff",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  lapakPhotoCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    elevation: 2,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  lapakPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 6,
  },
  editStatusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800", // Orange color for edit
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: "flex-start", // Or 'stretch' if you want full width
  },
  editStatusButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  editStatusButtonOutsideCard: {
    marginTop: 16, // Add some margin from the card above or photo
    alignSelf: "stretch", // Make it full width or adjust as needed
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  statusOptionButton: {
    backgroundColor: "#007AFF", // Blue color for options
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  statusOptionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0", // Light gray for cancel
  },
  cancelButtonText: {
    color: "#333",
  },
});

export default HomeScreen;
