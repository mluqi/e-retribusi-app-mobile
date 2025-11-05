import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface Pasar {
  pasar_code: string;
  pasar_nama: string;
  pasar_logo: string | null;
  pasar_status: string;
  pasar_qrcode: string | null;
}

interface PasarContextProps {
  pasars: Pasar[];
  fetchPasars: (
    page?: number,
    limit?: number,
    search?: string,
    statusFilter?: string
  ) => Promise<{ totalPages: number }>;
  fetchPasarByCode: (pasar_code: string) => Promise<Pasar | null>;
  addPasar: (formData: FormData) => Promise<void>;
  editPasar: (pasar_code: string, formData: FormData) => Promise<void>;
  deletePasar: (pasar_code: string) => Promise<void>;
}

const PasarContext = createContext<PasarContextProps | undefined>(undefined);

export const PasarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pasars, setPasars] = useState<Pasar[]>([]);

  const fetchPasars = async (
    page = 1,
    limit = 10,
    search = "",
    statusFilter = ""
  ) => {
    try {
      const BASE_URL = "https://dev1-p3.palindo.id/uploads/";
      const res = await api.get(
        `/pasar?page=${page}&limit=${limit}&search=${search}&status=${statusFilter}`
      );
      const dataWithLogo = res.data.data.map((pasar: Pasar) => ({
        ...pasar,
        pasar_logo: pasar.pasar_logo ? `${BASE_URL}${pasar.pasar_logo}` : null,
        pasar_qrcode: pasar.pasar_qrcode
          ? `${BASE_URL}${pasar.pasar_qrcode}`
          : null,
      }));
      setPasars(dataWithLogo);
      return { totalPages: res.data.totalPages };
    } catch (error) {
      console.error("Failed to fetch pasars:", error);
      return { totalPages: 1 };
    }
  };

  const fetchPasarByCode = async (pasar_code: string) => {
    try {
      const BASE_URL = "https://dev1-p3.palindo.id/uploads/";
      const res = await api.get(`/pasar/${pasar_code}`);
      if (res.data) {
        return {
          ...res.data,
          pasar_logo: res.data.pasar_logo
            ? `${BASE_URL}${res.data.pasar_logo}`
            : null,
          pasar_qrcode: res.data.pasar_qrcode
            ? `${BASE_URL}${res.data.pasar_qrcode}`
            : null,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch pasar by code:", error);
      return null;
    }
  };

  const addPasar = async (formData: FormData) => {
    try {
      await api.post("/pasar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchPasars();
    } catch (error) {
      console.error("Failed to add pasar:", error);
    }
  };

  const editPasar = async (pasar_code: string, formData: FormData) => {
    try {
      await api.put(`/pasar/${pasar_code}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchPasars();
    } catch (error) {
      console.error("Failed to edit pasar:", error);
    }
  };

  const deletePasar = async (pasar_code: string) => {
    try {
      await api.delete(`/pasar/${pasar_code}`);
      await fetchPasars();
    } catch (error) {
      console.error("Failed to delete pasar:", error);
    }
  };

  return (
    <PasarContext.Provider
      value={{
        pasars,
        fetchPasars,
        fetchPasarByCode,
        addPasar,
        editPasar,
        deletePasar,
      }}
    >
      {children}
    </PasarContext.Provider>
  );
};

export const usePasarContext = () => {
  const context = useContext(PasarContext);
  if (!context) {
    throw new Error("usePasarContext must be used within a PasarProvider");
  }
  return context;
};
