import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatUtils";

interface IuranTransaction {
  IURAN_CODE: string;
  IURAN_JUMLAH: number;
  IURAN_METODE_BAYAR: string | null;
  IURAN_WAKTU_BAYAR: string | null;
  IURAN_STATUS: string;
  DB_PEDAGANG: {
    CUST_NAMA: string;
  };
  updatedAt?: string;
}

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState<IuranTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState<"start" | "end" | null>(
    null
  );

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: "100", // Ambil lebih banyak data karena backend tidak support pagination
      });

      if (startDate) {
        params.append("startDate", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString().split("T")[0]);
      }

      const response = await api.get(
        `/iuran/recent-transactions?${params.toString()}`
      );
      const newTransactions: IuranTransaction[] = response.data || [];

      setTransactions(newTransactions);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Gagal memuat riwayat transaksi.";
      setError(errorMsg);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions();
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
    setShowDatePicker(false); // Close picker after selection or dismissal
  };

  const showDatepickerFor = (picker: "start" | "end") => {
    setDatePickerFor(picker);
    setShowDatePicker(true);
  };

  const resetDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderItem = ({ item }: { item: IuranTransaction }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.pedagangName}>{item.DB_PEDAGANG.CUST_NAMA}</Text>
        <Text style={styles.amount}>{formatCurrency(item.IURAN_JUMLAH)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailText}>Kode: {item.IURAN_CODE}</Text>
        <Text style={styles.detailText}>
          Metode: {item.IURAN_METODE_BAYAR || "-"}
        </Text>
        <Text style={styles.detailText}>
          Waktu:{" "}
          {formatDate(
            item.IURAN_WAKTU_BAYAR || item.updatedAt || new Date().toISOString()
          )}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          item.IURAN_STATUS === "paid" ? styles.paidBadge : styles.pendingBadge,
        ]}
      >
        <Text style={styles.statusText}>{item.IURAN_STATUS}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
      {loading && !isRefreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Memuat transaksi...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTransactions}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.IURAN_CODE}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                Tidak ada riwayat transaksi untuk filter yang dipilih.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
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
  dateText: {
    marginLeft: 8,
    color: "#333",
    fontSize: 13,
  },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
  pedagangName: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  cardBody: { marginTop: 4 },
  detailText: { fontSize: 14, color: "#555", marginBottom: 4 },
  statusBadge: {
    position: "absolute",
    top: -1,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  paidBadge: { backgroundColor: "#4CAF50" },
  pendingBadge: { backgroundColor: "#FFC107" },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  retryText: {
    color: "#2196F3",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
  loadingText: { marginTop: 10, color: "#666", fontSize: 14 },
});

export default TransactionHistoryScreen;
