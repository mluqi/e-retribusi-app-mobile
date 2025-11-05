import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useLapakContext } from "../../context/LapakContext";
import Overlay from "./_overlay";

const ScannerScreen = () => {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [searchingLapak, setSearchingLapak] = useState(false);
  const { getLapakByCode } = useLapakContext();

  const [error, setError] = useState("");
  const scanLock = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(true);
      setCameraReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanLock.current || !scanning) return;

    scanLock.current = true;
    setScanning(false);
    setSearchingLapak(true);
    setError("");

    try {
      const result = await getLapakByCode(data);

      if (result) {
        router.replace({
          pathname: "/home",
          params: {
            searchResult: JSON.stringify(result),
            scannedCode: data,
          },
        });
      } else {
        setError("Lapak tidak ditemukan");
        setTimeout(() => {
          scanLock.current = false;
          setScanning(true);
          setSearchingLapak(false);
        }, 2000);
      }
    } catch (err) {
      console.error("QR search error:", err);
      setError("Terjadi kesalahan saat mencari lapak");
      setTimeout(() => {
        scanLock.current = false;
        setScanning(true);
        setSearchingLapak(false);
      }, 2000);
    }
  };

  if (!cameraReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Menyiapkan kamera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {scanning && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}
      <Overlay/>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Icon name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Arahkan kamera ke kode QR lapak
        </Text>
      </View>


      {searchingLapak && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.statusText}>Memproses...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 16,
  },
  backButton: {
    position: "absolute",
    top: 40, // Sesuaikan dengan safe area
    left: 20,
    zIndex: 10,
  },
  instructionContainer: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
    borderRadius: 8,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
  },
  statusContainer: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    color: "white",
    marginLeft: 8,
  },
  errorContainer: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(255,59,48,0.8)",
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    color: "white",
  },
});

export default ScannerScreen;
