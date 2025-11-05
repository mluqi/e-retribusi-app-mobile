import React, { createContext, useContext, useState } from "react";
import api from "../services/api";
import { Platform } from "react-native";

export interface PedagangLite {
  CUST_CODE: string;
  CUST_NAMA: string;
  CUST_NIK: string;
  CUST_PHONE: string;
  CUST_OWNER: string;
  CUST_IURAN: string;
  CUST_STATUS: string;
  createdAt: string;
  updatedAt: string;
  iurans: IuranLite[];
}

export interface IuranLite {
  IURAN_BUKTI_FOTO: string | null;
  IURAN_CODE: string;
  IURAN_PEDAGANG: string;
  IURAN_TANGGAL: string;
  IURAN_JUMLAH: number;
  IURAN_STATUS: string;
  IURAN_METODE_BAYAR: string | null;
  IURAN_WAKTU_BAYAR: string | null;
  IURAN_USER: string;
}
export interface Lapak {
  LAPAK_CODE: string;
  LAPAK_NAMA: string;
  LAPAK_BLOK: string;
  LAPAK_UKURAN: string;
  LAPAK_TYPE: string;
  LAPAK_PENYEWA: string | null;
  LAPAK_MULAI: string | null;
  LAPAK_AKHIR: string | null;
  LAPAK_STATUS: "aktif" | "kosong" | "rusak" | "tutup";
  LAPAK_OWNER: string;
  createdAt?: string;
  updatedAt?: string;
  LAPAK_BUKTI_FOTO?: string;
  DB_PEDAGANG?: PedagangLite | null;
  pasar?: {
    pasar_nama: string;
    pasar_code: string;
    pasar_qrcode?: string;
    pasar_logo?: string;
  } | null;
}

export interface EditLapakStatusData {
  LAPAK_STATUS: Lapak["LAPAK_STATUS"];
  LAPAK_PENYEWA?: string;
  LAPAK_MULAI?: string | null;
  LAPAK_AKHIR?: string | null;
  bukti_foto_file?: { uri: string; name: string; type: string } | null;
}

interface LapakContextProps {
  lapaks: Lapak[];
  fetchLapaks: (
    page: number,
    limit: number,
    search: string,
    statusFilter: string,
    pasar: string,
    owner: string
  ) => Promise<void>;
  getLapakByCode: (LAPAK_CODE: string) => Promise<Lapak | null>;
  addLapak: (formData: FormData) => Promise<void>;
  editLapak: (LAPAK_CODE: string, formData: FormData) => Promise<void>; // formData already for editLapak
  editStatusLapak: (
    LAPAK_CODE: string,
    data: EditLapakStatusData
  ) => Promise<void>;
  deleteLapak: (LAPAK_CODE: string) => Promise<void>;
}

const LapakContext = createContext<LapakContextProps | undefined>(undefined);

export const LapakProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lapaks, setLapaks] = useState<Lapak[]>([]);

  const fetchLapaks = async (
    page = 1,
    limit = 10,
    search = "",
    statusFilter = "",
    pasar = "",
    owner = ""
  ) => {
    try {
      const res = await api.get(
        `/lapak?page=${page}&limit=${limit}&search=${search}&status=${statusFilter}&pasar=${pasar}&owner=${owner}`
      );
      setLapaks(res.data.data);
    } catch (error) {
      console.error("Failed to fetch lapaks:", error);
    }
  };

  const getLapakByCode = async (LAPAK_CODE: string) => {
    try {
      const res = await api.get(`/lapak/${LAPAK_CODE}`);
      return res.data;
    } catch (error) {
      console.error("Failed to get lapak by code:", error);
      return null;
    }
  };

  const addLapak = async (formData: FormData) => {
    console.log("Adding lapak with formData:", formData);
    try {
      await api.post("/lapak", formData);
      await fetchLapaks();
    } catch (error) {
      console.error("Failed to add lapak:", error);
    }
  };

  const editLapak = async (LAPAK_CODE: string, formData: FormData) => {
    try {
      await api.put(`/lapak/${LAPAK_CODE}`, formData);
      await fetchLapaks();
    } catch (error) {
      console.error("Failed to edit lapak:", error);
    }
  };

  const editStatusLapak = async (
    LAPAK_CODE: string,
    data: EditLapakStatusData
  ) => {
    try {
      const formData = new FormData();
      formData.append("LAPAK_STATUS", data.LAPAK_STATUS);

      if (data.LAPAK_PENYEWA !== undefined) {
        formData.append("LAPAK_PENYEWA", data.LAPAK_PENYEWA);
      }
      if (data.LAPAK_MULAI !== undefined) {
        formData.append(
          "LAPAK_MULAI",
          data.LAPAK_MULAI === null ? "" : data.LAPAK_MULAI
        );
      }
      if (data.LAPAK_AKHIR !== undefined) {
        formData.append(
          "LAPAK_AKHIR",
          data.LAPAK_AKHIR === null ? "" : data.LAPAK_AKHIR
        );
      }

      if (data.bukti_foto_file) {
        // Pastikan file format yang benar untuk Android
        const fileToUpload = {
          uri:
            Platform.OS === "android"
              ? data.bukti_foto_file.uri
              : data.bukti_foto_file.uri.replace("file://", ""),
          type: data.bukti_foto_file.type,
          name: data.bukti_foto_file.name,
        };

        // Untuk debugging
        console.log("File to upload:", fileToUpload);

        formData.append("bukti_foto", fileToUpload as any);
      }

      console.log("Sending formData with entries:");
      // Debug FormData contents
      for (let [key, value] of (formData as any).entries()) {
        console.log(key, value);
      }

      const res = await api.put(`/lapak/${LAPAK_CODE}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 second timeout
      });

      console.log("Response from editStatusLapak:", res.data);
      await fetchLapaks();
    } catch (error) {
      console.error("Failed to edit lapak status:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      } else if (error.request) {
        console.error("No response received:", error.request);
      }
      throw error;
    }
  };

  const deleteLapak = async (LAPAK_CODE: string) => {
    try {
      await api.delete(`/lapak/${LAPAK_CODE}`);
      await fetchLapaks();
    } catch (error) {
      console.error("Failed to delete lapak:", error);
    }
  };

  return (
    <LapakContext.Provider
      value={{
        lapaks,
        fetchLapaks,
        getLapakByCode,
        addLapak,
        editLapak,
        editStatusLapak,
        deleteLapak,
      }}
    >
      {children}
    </LapakContext.Provider>
  );
};

export const useLapakContext = () => {
  const context = useContext(LapakContext);
  if (!context) {
    throw new Error("useLapakContext must be used within a LapakProvider");
  }
  return context;
};
