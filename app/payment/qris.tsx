import Icon from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useIuranContext } from "../../context/IuranContext";
import { Lapak } from "../../context/LapakContext";
import api from "../../services/api";
import { SelectedIuran } from "../../types/paymentTypes";
import { formatCurrency } from "../../utils/formatUtils";

const QrisPaymentScreen = () => {
  const { updateIuranStatus } = useIuranContext();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // Parse params
  const selectedIurans = JSON.parse(
    params.selectedIurans as string
  ) as SelectedIuran[];
  const totalAmount = parseFloat(params.totalAmount as string);
  const customerData = JSON.parse(params.customerData as string);
  const lapakData = JSON.parse(params.lapakData as string) as Lapak;
  const pasarName = params.pasarName as string;
  const pasarCode = params.pasarCode as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [qrString, setQrString] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  useEffect(() => {
    const generateQris = async () => {
      if (totalAmount <= 0) {
        Alert.alert("Error", "Jumlah total tidak valid untuk membuat QRIS.");
        setIsLoadingQr(false);
        return;
      }
      if (!pasarCode) {
        Alert.alert(
          "Error",
          "Kode pasar tidak ditemukan. Tidak bisa membuat QRIS."
        );
        setIsLoadingQr(false);
        return;
      }

      setIsLoadingQr(true);
      try {
        const response = await api.post("/mobile/generate-qris", {
          nominal: totalAmount,
          pasar_code: pasarCode,
        });

        if (response.data?.data?.qris) {
          setQrString(response.data.data.qris);
        } else {
          throw new Error("Format respons QRIS tidak valid");
        }
      } catch (err) {
        console.error("Failed to generate QRIS:", err);
        Alert.alert("Error", "Gagal membuat kode QRIS. Silakan coba lagi.");
      } finally {
        setIsLoadingQr(false);
      }
    };

    generateQris();
  }, [totalAmount, pasarCode]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    try {
      const iuranCodes = selectedIurans.map((i) => i.IURAN_CODE);
      const waktuBayar = new Date().toISOString();

      const success = await updateIuranStatus(
        iuranCodes,
        "paid",
        "qris", // Payment method is hardcoded to qris
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
              paymentMethod: "qris",
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
      } else {
        Alert.alert(
          "Error",
          "Gagal memproses pembayaran. Status iuran tidak berhasil diubah."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Gagal memproses pembayaran");
      console.error("QRIS Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pembayaran QRIS - {pasarName}</Text>
        <Text style={styles.subtitle}>
          Scan kode QR di bawah ini untuk membayar
        </Text>

        <View style={styles.qrContainer}>
          {isLoadingQr ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.qrPlaceholderText}>Membuat kode QRIS...</Text>
            </View>
          ) : qrString ? (
            <View style={styles.qrCodeWrapper}>
              <QRCode value={qrString} size={250} />
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Icon name="error-outline" size={100} color="#E53935" />
              <Text style={styles.qrPlaceholderText}>
                Gagal membuat kode QRIS. Silakan coba kembali.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Pembayaran</Text>
          <Text style={styles.amountText}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isProcessing || isLoadingQr) && styles.disabledButton,
          ]}
          onPress={handleConfirmPayment}
          disabled={isProcessing || isLoadingQr}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Konfirmasi Sudah Bayar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: "center",
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  qrCodeWrapper: {
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 250,
    height: 250, // Menyamakan tinggi placeholder dengan gambar QR
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 8,
  },
  qrPlaceholderText: {
    marginTop: 16,
    color: "#999",
    textAlign: "center",
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  amountContainer: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default QrisPaymentScreen;
