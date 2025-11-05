import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const BASE_URL = "https://dev1-p3.palindo.id/uploads/";

interface UserProfile {
  user_id: string;
  user_name: string;
  user_email: string;
  user_level: string;
  user_owner: string;
  user_phone: string;
  user_foto: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string, userData: UserProfile) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  refreshUser: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const processUserData = (data: UserProfile): UserProfile => {
    return {
      ...data,
      user_foto: data.user_foto ? `${BASE_URL}${data.user_foto}` : null,
    };
  };

  const fetchProfileAndSetUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/auth/profile");
      const rawData: UserProfile = response.data;
      setUser(processUserData(rawData));
    } catch (err: any) {
      // Logika penanganan 401/403 dipindahkan ke interceptor global
      setError(err.message || "Gagal mengambil data profil.");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Interceptor: Unauthorized/Forbidden. Logging out.");
          await AsyncStorage.removeItem("token");
          setUser(null);
          setError("Sesi Anda telah berakhir. Silakan login kembali.");
          router.replace("/signin");
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(responseInterceptor);
  }, [router]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          // Token exists, api interceptor should handle adding it to headers
          await fetchProfileAndSetUser();
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth check error:", e);
        setUser(null);
        setError("Gagal memeriksa status autentikasi.");
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (token: string, userDataFromLogin: UserProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      await AsyncStorage.setItem("token", token);
      // API interceptor will use this token for subsequent requests
      setUser(processUserData(userDataFromLogin));
    } catch (e) {
      console.error("Login process error in AuthContext:", e);
      setError("Terjadi kesalahan saat memproses login.");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
      // Continue with client-side logout even if API call fails
    } finally {
      await AsyncStorage.removeItem("token");
      setUser(null);
      setError(null);
      router.replace("/signin");
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      await fetchProfileAndSetUser();
    } else {
      setIsLoading(true);
      setUser(null);
      setError(
        "Tidak dapat memuat ulang data pengguna, token tidak ditemukan."
      );
      router.replace("/signin");
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
