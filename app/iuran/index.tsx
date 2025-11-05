import Icon from "@react-native-vector-icons/material-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useIuranContext } from "../../context/IuranContext";
import { IuranLite, Lapak, PedagangLite } from "../../context/LapakContext";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatUtils";

const API_FILES_STATIC_PATH = "https://dev1-p3.palindo.id";
const IuranListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    return isSameDay(new Date(dateStr), new Date());
  };

  const pedagang = JSON.parse(params.pedagang as string) as PedagangLite;
  const lapak = JSON.parse(params.lapak as string) as Lapak;
  const pasarName = params.pasarName as string;

  const [selectedIurans, setSelectedIurans] = useState<string[]>([]);

  const { updateIuranStatus } = useIuranContext();
  const [uploading, setUploading] = useState(false);
  const [buktiFotoUri, setBuktiFotoUri] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const [iurans, setIurans] = useState<IuranLite[]>([]);
  const [loadingIuran, setLoadingIuran] = useState(false); // For "load more" indicator
  const [isRefreshing, setIsRefreshing] = useState(false); // For pull-to-refresh
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchIuransByPedagang = async (pageNum: number, isRefresh = false) => {
    // Prevent fetching if already loading or no more data
    if (loadingIuran || isRefreshing) return;
    if (!hasMore && !isRefresh) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingIuran(true); // Loading more
    }

    try {
      const limit = 10;
      const currentPage = isRefresh ? 1 : pageNum;

      const res = await api.get(
        `/iuran?search=&status=pending,tidak berjualan&metode=&pedagangCode=${pedagang.CUST_CODE}&limit=${limit}&page=${currentPage}`
      );
      const received: IuranLite[] = res.data.data || [];
      const newIurans = received.filter(
        (i) =>
          i.IURAN_STATUS === "pending" ||
          (i.IURAN_STATUS === "tidak berjualan" && isToday(i.IURAN_TANGGAL))
      );

      if (isRefresh) {
        setIurans(newIurans);
        setPage(2);
        setHasMore(true);
      } else {
        setIurans((prev) => [...prev, ...newIurans]);
        setPage(pageNum + 1);
      }

      if (newIurans.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      Alert.alert("Gagal", "Gagal mengambil data iuran.");
    } finally {
      setLoadingIuran(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIuransByPedagang(1, true);
  }, []);

  const handleIuranPress = (item: IuranLite) => {
    if (item.IURAN_STATUS === "tidak berjualan") {
      if (item.IURAN_BUKTI_FOTO) {
        setBuktiFotoUri(item.IURAN_BUKTI_FOTO);
      } else {
        Alert.alert(
          "info",
          "Iuran ini diberi status 'tidak berjualan' untuk hari ini."
        );
      }
      return;
    }
    toggleIuranSelection(item.IURAN_CODE, item.IURAN_JUMLAH);
  };

  const pickImage = async (fromCamera: boolean) => {
    let result;

    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Menonaktifkan cropping
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false, // Menonaktifkan cropping
        quality: 0.7,
      });
    }
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      try {
        let imageAsset = result.assets[0];

        // Salin file di Android untuk menghindari masalah dengan content:// URI
        if (
          Platform.OS === "android" &&
          imageAsset.uri.startsWith("content://")
        ) {
          try {
            const newUri =
              FileSystem.cacheDirectory +
              (imageAsset.fileName || `temp_iuran_${Date.now()}.jpg`);
            await FileSystem.copyAsync({ from: imageAsset.uri, to: newUri });
            imageAsset = { ...imageAsset, uri: newUri };
          } catch (e) {
            console.error("Gagal menyalin gambar iuran:", e);
            Alert.alert("Error", "Gagal memproses gambar yang dipilih.");
            setUploading(false);
            return;
          }
        }

        await updateIuranStatus(
          selectedIurans, // iuranCodes
          "tidak berjualan", // status
          "", // metodeBayar
          user?.user_id || "", // userId
          undefined, // waktuBayar (opsional)
          imageAsset // buktiFotoAsset (opsional)
        );

        await fetchIuransByPedagang(1, true); // Refresh list
        Alert.alert(
          "Sukses",
          "Status iuran berhasil diubah menjadi tidak berjualan."
        );
        setSelectedIurans([]);
      } catch (error) {
        Alert.alert("Gagal", "Terjadi kesalahan saat mengubah status iuran.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleTidakBerjualan = () => {
    Alert.alert(
      "Pilih Sumber Foto",
      "Ambil foto bukti dari kamera atau galeri?",
      [
        {
          text: "Kamera",
          onPress: async () => {
            if (!cameraPermission?.granted) {
              const { granted } = await requestCameraPermission();
              if (!granted) {
                Alert.alert(
                  "Izin Diperlukan",
                  "Aplikasi memerlukan izin kamera untuk mengambil foto."
                );
                return;
              }
            }
            pickImage(true);
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
                  "Aplikasi memerlukan izin galeri untuk memilih foto."
                );
                return;
              }
            }
            pickImage(false);
          },
        },
        { text: "Batal", style: "cancel" },
      ]
    );
  };

  const toggleIuranSelection = (iuranCode: string, amount: number) => {
    setSelectedIurans((prev) => {
      if (prev.includes(iuranCode)) {
        return prev.filter((code) => code !== iuranCode);
      } else {
        return [...prev, iuranCode];
      }
    });
  };

  const handleRefresh = () => {
    fetchIuransByPedagang(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loadingIuran && !isRefreshing) {
      fetchIuransByPedagang(page);
    }
  };

  const calculateTotal = () => {
    return iurans
      .filter((iuran) => selectedIurans.includes(iuran.IURAN_CODE))
      .reduce((total, iuran) => total + iuran.IURAN_JUMLAH, 0);
  };

  const handleProceedToPayment = () => {
    router.push({
      pathname: "/payment",
      params: {
        selectedIurans: JSON.stringify(
          iurans
            .filter((iuran) => selectedIurans.includes(iuran.IURAN_CODE))
            .map((iuran) => ({
              ...iuran,
            }))
        ),
        totalAmount: calculateTotal().toString(),
        customerData: JSON.stringify(pedagang),
        lapakData: JSON.stringify(lapak),
        pasarName,
      },
    });
  };

  const handleAddIuran = () => {
    router.push({
      pathname: "/iuran/add",
      params: {
        pedagang: JSON.stringify(pedagang),
        lapak: JSON.stringify(lapak),
      },
    });
  };

  const renderIuranItem = ({ item }: { item: IuranLite }) => (
    <TouchableOpacity
      style={[
        styles.iuranItem,
        selectedIurans.includes(item.IURAN_CODE) && styles.selectedIuranItem,
      ]}
      onPress={() => handleIuranPress(item)}
    >
      <View style={styles.iuranHeader}>
        <Text style={styles.iuranCode}>{item.IURAN_CODE}</Text>
        <View
          style={[
            styles.statusBadge,
            item.IURAN_STATUS === "paid"
              ? styles.paidBadge
              : item.IURAN_STATUS === "tidak berjualan"
              ? { backgroundColor: "#FF5722" }
              : styles.pendingBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.IURAN_STATUS === "tidak berjualan" &&
            isToday(item.IURAN_TANGGAL)
              ? "tidak berjualan (hari ini)"
              : item.IURAN_STATUS}
          </Text>
        </View>
      </View>
      <View style={styles.iuranDetail}>
        <Text style={styles.iuranText}>
          Tanggal: {formatDate(item.IURAN_TANGGAL)}
        </Text>
        <Text style={styles.iuranText}>
          Jumlah: {formatCurrency(item.IURAN_JUMLAH)}
        </Text>
        {item.IURAN_STATUS === "paid" && (
          <>
            <Text style={styles.iuranText}>
              Metode Bayar: {item.IURAN_METODE_BAYAR}
            </Text>
            <Text style={styles.iuranText}>
              Waktu Bayar: {formatDate(item.IURAN_WAKTU_BAYAR)}
            </Text>
          </>
        )}
        {item.IURAN_STATUS === "tidak berjualan" && item.IURAN_BUKTI_FOTO && (
          <Text style={[styles.iuranText, { color: "#FF5722" }]}>
            Ada bukti foto
          </Text>
        )}
      </View>
      {selectedIurans.includes(item.IURAN_CODE) && (
        <View style={styles.selectedOverlay}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={{
          backgroundColor: "#2196F3",
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
          marginBottom: 16, // Tetap ada margin bawah
        }}
        onPress={handleAddIuran}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          + Tambah Iuran
        </Text>
      </TouchableOpacity>
      <Text style={styles.title}>Daftar Iuran</Text>
      <Text style={styles.subtitle}>
        {pedagang.CUST_NAMA} - {pasarName}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingIuran || isRefreshing) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} color="#2196F3" />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={iurans}
        renderItem={renderIuranItem}
        keyExtractor={(item) => item.IURAN_CODE}
        contentContainerStyle={styles.iuranList}
        ListHeaderComponent={renderListHeader}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loadingIuran && !isRefreshing ? (
            <Text style={{ textAlign: "center", marginTop: 24, color: "#888" }}>
              Belum ada iuran untuk pedagang ini.
            </Text>
          ) : null
        }
      />

      {/* Modal Loading */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Mengunggah bukti...</Text>
          </View>
        </View>
      </Modal>

      {/* Modal untuk bukti foto */}
      <Modal
        visible={!!buktiFotoUri}
        transparent
        animationType="fade"
        onRequestClose={() => setBuktiFotoUri(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              maxWidth: "90%",
            }}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
              Bukti Foto Tidak Berjualan
            </Text>
            <Image // Komponen Image tetap ada untuk modal bukti foto
              source={{
                uri: `${API_FILES_STATIC_PATH}/${buktiFotoUri}`,
              }}
              style={{
                width: 250,
                height: 350,
                borderRadius: 8,
                marginBottom: 12,
              }}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={() => setBuktiFotoUri(null)}>
              <Text style={{ color: "#2196F3", fontWeight: "bold" }}>
                Tutup
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedIurans.length > 0 && (
        <View style={styles.paymentFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Pembayaran:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleProceedToPayment}
          >
            <Text style={styles.payButtonText}>Lanjutkan Pembayaran</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payButton, // Menggunakan style payButton
              styles.yellowButton, // Memberi warna kuning
              { marginTop: 8 }, // Memberi jarak atas
            ]}
            onPress={handleTidakBerjualan}
            disabled={uploading}
          >
            <Text style={styles.payButtonText}>
              Tidak Berjualan (Upload Bukti)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  iuranList: {
    paddingHorizontal: 16,
    paddingBottom: 150, // Increased padding to avoid footer overlap
  },
  iuranItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
  },
  selectedIuranItem: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0f9f0",
  },
  selectedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  iuranHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  iuranCode: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  paidBadge: {
    backgroundColor: "#4CAF50",
  },
  pendingBadge: {
    backgroundColor: "#FFC107",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  iuranDetail: {
    marginTop: 4,
  },
  iuranText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
  },
  paymentFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 4,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: "#555",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  yellowButton: {
    backgroundColor: "#FFC107",
  },
  disabledYellowButton: {
    backgroundColor: "#FFD54F",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#333",
  },
});

export default IuranListScreen;
