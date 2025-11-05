import Icon from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useIuranContext } from "../../context/IuranContext";
import { SelectedIuran } from "../../types/paymentTypes";
import { formatCurrency } from "../../utils/formatUtils";

const PaymentScreen = () => {
  const { updateIuranStatus } = useIuranContext();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const selectedIurans = JSON.parse(
    params.selectedIurans as string
  ) as SelectedIuran[];
  const totalAmount = parseFloat(params.totalAmount as string);
  const customerData = JSON.parse(params.customerData as string);
  const lapakData = JSON.parse(params.lapakData as string);
  const pasarName = params.pasarName as string;
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: {
    id: string;
    name: string;
    icon: React.ComponentProps<typeof Icon>["name"];
  }[] = [
    { id: "qris", name: "QRIS", icon: "qr-code" },
    { id: "tunai", name: "Tunai", icon: "money" },
  ];

  const handlePayment = async () => {
    if (!paymentMethod) {
      Alert.alert("Peringatan", "Silakan pilih metode pembayaran");
      return;
    }

    if (paymentMethod === "qris") {
      router.push({
        pathname: "/payment/qris",
        params: {
          selectedIurans: JSON.stringify(selectedIurans),
          totalAmount: totalAmount.toString(),
          customerData: JSON.stringify(customerData),
          lapakData: JSON.stringify(lapakData),
          pasarName,
          pasarCode: lapakData.LAPAK_OWNER,
        },
      });
      return;
    }

    setIsProcessing(true);

    try {
      const iuranCodes = selectedIurans.map((i) => i.IURAN_CODE);
      const waktuBayar = new Date().toISOString();

      const success = await updateIuranStatus(
        iuranCodes,
        "paid",
        paymentMethod,
        user?.user_id || "",
        waktuBayar
      );

      if (success) {
        router.push({
          pathname: "/receipt",
          params: {
            paymentData: JSON.stringify({
              selectedIurans: selectedIurans.map((iuran) => ({
                // Hapus DB_PEDAGANG dari setiap iuran
                IURAN_CODE: iuran.IURAN_CODE,
                IURAN_JUMLAH: iuran.IURAN_JUMLAH,
                IURAN_TANGGAL: iuran.IURAN_TANGGAL,
              })),
              totalAmount,
              paymentMethod,
              customerData,
              lapakData,
              paymentDate: waktuBayar,
              paymentCode: `PAY-${Date.now()}`,
              pasarName,
              userId: user?.user_id || "",
              userNama: user?.user_name || "",
            }),
          },
        });
      } // No else block, assuming updateIuranStatus throws on error or returns false
    } catch (error) {
      Alert.alert("Error", "Gagal memproses pembayaran");
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Pembayaran Iuran</Text>
          <Text style={styles.subtitle}>
            {customerData.CUST_NAMA} - {pasarName}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Pembayaran</Text>
          <View style={styles.detailCard}>
            {selectedIurans.map((item, index) => (
              <View key={item.IURAN_CODE} style={styles.detailRow}>
                <Text style={styles.detailText}>{item.IURAN_CODE}</Text>
                <Text style={styles.detailAmount}>
                  {formatCurrency(item.IURAN_JUMLAH)}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  paymentMethod === method.id && styles.selectedMethod,
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Icon
                  name={method.icon}
                  size={24}
                  color={paymentMethod === method.id ? "#4CAF50" : "#555"}
                />
                <Text
                  style={[
                    styles.methodText,
                    paymentMethod === method.id && styles.selectedMethodText,
                  ]}
                >
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    color: "#555",
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  methodButton: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
  },
  selectedMethod: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0f9f0",
  },
  methodText: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  selectedMethodText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  footer: {
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
  payButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentScreen;
