import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SignInScreen = () => {
  const router = useRouter();
  const auth = useAuth();
  const navigation = useNavigation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load remembered user on component mount
  useEffect(() => {
    const loadRememberedUser = async () => {
      try {
        const rememberedIdentifier = await AsyncStorage.getItem(
          "rememberedUser"
        );
        if (rememberedIdentifier) {
          setIdentifier(rememberedIdentifier);
          setRememberMe(true);
        }
      } catch (e) {
        console.error("Failed to load remembered user.", e);
      }
    };
    loadRememberedUser();
  }, []);

  useEffect(() => {
    // Disable Android hardware back button
    const onBackPress = () => true;
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    // Disable swipe-back / header back button if available
    if (navigation && navigation.setOptions) {
      navigation.setOptions({
        gestureEnabled: false,
        headerLeft: () => null,
      });
    }

    return () => {
      sub.remove();
    };
  }, [navigation]);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      return Alert.alert("Error", "Mohon isi semua field");
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/signin", {
        identifier,
        password,
      });

      const { token, data: userData } = response.data;
      // console.log("Login success:", userData);

      if (rememberMe) {
        await AsyncStorage.setItem("rememberedUser", identifier);
      } else {
        await AsyncStorage.removeItem("rememberedUser");
      }

      await auth.login(token, userData);
      Alert.alert("Sukses", "Login berhasil!");
      router.replace("/home");
    } catch (err) {
      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";

      if (err.isAxiosError) {
        // Error dari server atau jaringan
        if (err.response) {
          // Server merespons dengan status error (4xx, 5xx)
          const status = err.response.status;
          const serverMessage = err.response.data?.message;

          if (status === 401 || status === 404) {
            errorMessage = "Username atau kata sandi salah.";
          } else if (serverMessage) {
            errorMessage = serverMessage;
          } else {
            errorMessage = `Terjadi masalah pada server (Status: ${status}).`;
          }
          console.error("Login Server Error:", {
            status,
            data: err.response.data,
          });
        } else if (err.request) {
          // Request dibuat tapi tidak ada respons (masalah jaringan)
          errorMessage =
            "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
          console.error("Login Network Error:", err.request);
        }
      }
      Alert.alert("Login Gagal", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.appName}>E-Retribusi Pasar</Text>
            <Text style={styles.byText}>by PalindoDev</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username atau Email"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Kata Sandi"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>Ingat saya</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 4,
  },
  byText: {
    fontSize: 14,
    color: "#777",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: "absolute",
    right: 10,
    top: 10,
    bottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#2e7d32",
  },
  rememberText: {
    fontSize: 14,
    color: "#333",
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#81c784",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SignInScreen;
