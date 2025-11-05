import { useAuth } from "@/context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatUtils";

// Asumsikan respons API untuk /iuran menyertakan DB_PEDAGANG
interface UnpaidIuran {
  IURAN_CODE: string;
  IURAN_JUMLAH: number;
  IURAN_TANGGAL: string;
  IURAN_STATUS: string;
  DB_PEDAGANG: {
    CUST_NAMA: string;
    lapaks?: {
      LAPAK_CODE: string;
      LAPAK_NAMA: string;
      LAPAK_BLOK: string;
      LAPAK_OWNER: string;
      pasar?: {
        pasar_nama: string;
        pasar_code: string;
      };
    }[];
  };
}

const UnpaidIuranScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [iurans, setIurans] = useState<UnpaidIuran[]>([]);
  const [loading, setLoading] = useState(false); // Untuk "load more"
  const [isRefreshing, setIsRefreshing] = useState(false); // Untuk pull-to-refresh dan load awal
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState<"start" | "end" | null>(
    null
  );

  const fetchUnpaidIurans = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (loading || (isRefreshing && !isRefresh)) return;
      if (!hasMore && !isRefresh) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const currentPage = isRefresh ? 1 : pageNum;
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "20",
          status: "pending",
        });

        if (searchQuery) {
          params.append("search", searchQuery);
        }

        if (startDate) {
          params.append("startDate", startDate.toISOString().split("T")[0]);
        }
        if (endDate) {
          params.append("endDate", endDate.toISOString().split("T")[0]);
        }

        const response = await api.get(`/iuran?${params.toString()}`);
        const newIurans: UnpaidIuran[] = response.data.data || [];

        if (isRefresh) {
          setIurans(newIurans);
          setPage(2);
          setHasMore(true);
        } else {
          setIurans((prev) => {
            const existingCodes = new Set(prev.map((p) => p.IURAN_CODE));
            const filtered = newIurans.filter(
              (n) => !existingCodes.has(n.IURAN_CODE)
            );
            return [...prev, ...filtered];
          });
          setPage(pageNum + 1);
        }

        if (newIurans.length < 20) {
          setHasMore(false);
        }
      } catch (err) {
        setError("Gagal memuat iuran yang belum dibayar.");
        console.error(err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [startDate, endDate, searchQuery]
  );

  useEffect(() => {
    fetchUnpaidIurans(1, true);
  }, [fetchUnpaidIurans]);

  const handleRefresh = () => {
    fetchUnpaidIurans(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading && !isRefreshing) {
      fetchUnpaidIurans(page);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && selectedDate) {
      if (datePickerFor === "start") {
        setStartDate(selectedDate);
      } else if (datePickerFor === "end") {
        setEndDate(selectedDate);
      }
    }
    setShowDatePicker(false); // Menutup picker setelah pemilihan atau pembatalan
  };

  const showDatepickerFor = (picker: "start" | "end") => {
    setDatePickerFor(picker);
    setShowDatePicker(true);
  };

  const resetDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handlePayIuran = (item: UnpaidIuran) => {
    const lapak = item.DB_PEDAGANG?.lapaks?.[0];

    if (!lapak || !item.DB_PEDAGANG) {
      alert(
        "Data pedagang atau lapak tidak lengkap untuk melanjutkan pembayaran."
      );
      return;
    }

    if (!user?.user_owner) {
      alert("Data pasar tidak tersedia.");
      return;
    }

    router.push({
      pathname: "/payment",
      params: {
        selectedIurans: JSON.stringify([item]),
        totalAmount: item.IURAN_JUMLAH.toString(),
        customerData: JSON.stringify(item.DB_PEDAGANG),
        lapakData: JSON.stringify(lapak),
        pasarName: lapak.pasar?.pasar_nama || "Pasar",
        pasarCode: lapak.LAPAK_OWNER,
      },
    });
  };

  const renderItem = ({ item }: { item: UnpaidIuran }) => {
    const lapak = item.DB_PEDAGANG?.lapaks?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePayIuran(item)}
      >
        <View>
          <View style={styles.cardHeader}>
            <Text style={styles.pedagangName}>
              {item.DB_PEDAGANG?.CUST_NAMA || "Pedagang tidak diketahui"}
            </Text>
            <Text style={styles.amount}>
              {formatCurrency(item.IURAN_JUMLAH)}
            </Text>
          </View>
          <View style={styles.cardBody}>
            {lapak && (
              <View style={styles.detailRow}>
                <Icon name="store" size={16} color="#555" />
                <Text style={styles.detailText}>
                  {lapak.LAPAK_NAMA} (Blok: {lapak.LAPAK_BLOK})
                </Text>
              </View>
            )}
            {lapak?.pasar && (
              <View style={styles.detailRow}>
                <Icon name="location-city" size={16} color="#555" />
                <Text style={styles.detailText}>{lapak.pasar.pasar_nama}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Icon name="receipt" size={16} color="#555" />
              <Text style={styles.detailText}>Kode: {item.IURAN_CODE}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="event" size={16} color="#555" />
              <Text style={styles.detailText}>
                Tanggal: {formatDate(item.IURAN_TANGGAL)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusText}>{item.IURAN_STATUS}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari berdasarkan nama pedagang..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchUnpaidIurans(1, true)}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => fetchUnpaidIurans(1, true)}>
          <Icon
            name="search"
            size={24}
            color="#555"
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDatepickerFor("start")}
        >
          <Icon name="date-range" size={20} color="#333" />
          <Text style={styles.dateText}>
            {startDate ? formatDate(startDate.toISOString()) : "Tanggal Mulai"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDatepickerFor("end")}
        >
          <Icon name="date-range" size={20} color="#333" />
          <Text style={styles.dateText}>
            {endDate ? formatDate(endDate.toISOString()) : "Tanggal Akhir"}
          </Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity onPress={resetDates}>
            <Icon name="close" size={24} color="#E53935" />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={
            (datePickerFor === "start" ? startDate : endDate) || new Date()
          }
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {isRefreshing && iurans.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : error && !isRefreshing && iurans.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={iurans}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.IURAN_CODE}-${index}`}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            !isRefreshing ? (
              <View style={styles.centered}>
                <Text>
                  Tidak ada iuran belum dibayar untuk filter yang dipilih.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchIcon: { marginLeft: 10 },
  dateText: { marginLeft: 8, color: "#333" },
  listContainer: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  pedagangName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  amount: { fontSize: 16, fontWeight: "bold", color: "#E53935", marginTop: 6 },
  cardBody: { marginTop: 4 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: { marginLeft: 8, fontSize: 14, color: "#555" },
  statusBadge: {
    position: "absolute",
    top: -1,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  pendingBadge: { backgroundColor: "#FFC107" },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  errorText: { color: "red", fontSize: 16, textAlign: "center" },
  retryText: { color: "#2196F3", marginTop: 10, fontSize: 16 },
});

export default UnpaidIuranScreen;
