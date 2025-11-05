import React, { createContext, useContext, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";

interface Iuran {
  IURAN_CODE: string;
  IURAN_PEDAGANG: string;
  IURAN_TANGGAL: string;
  IURAN_JUMLAH: number;
  IURAN_STATUS: string;
  IURAN_METODE_BAYAR: string;
  IURAN_WAKTU_BAYAR: string;
  IURAN_USER: string;
}

interface IuranContextProps {
  iurans: Iuran[];
  fetchIurans: (
    pedagangCode: string,
    page: number,
    limit: number,
    search: string,
    statusFilter: string,
    metodeBayarFilter: string,
    startDate: string,
    endDate: string
  ) => Promise<Iuran[]>;
  addIuran: (formData: FormData) => Promise<void>;
  editIuran: (IURAN_CODE: string, formData: FormData) => Promise<void>;
  deleteIuran: (IURAN_CODE: string) => Promise<void>;
  updateIuranStatus: (
    iuranCodes: string[],
    status: string,
    metodeBayar: string,
    userId: string,
    waktuBayar?: string, // Waktu bayar opsional
    buktiFotoAsset?: ImagePicker.ImagePickerAsset // Menggunakan asset, bukan hanya URI
  ) => Promise<boolean>;
}

const IuranContext = createContext<IuranContextProps | undefined>(undefined);

export const IuranProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [iurans, setIurans] = useState<Iuran[]>([]);
  const fetchIurans = async (
    pedagangCode = "",
    page = 1,
    limit = 100,
    search = "",
    statusFilter = "",
    metodeBayarFilter = "",
    startDate = "",
    endDate = ""
  ): Promise<Iuran[]> => {
    try {
      const res = await api.get(
        `/iuran?pedagangCode=${pedagangCode}&page=${page}&limit=${limit}&search=${search}&status=${statusFilter}&metode=${metodeBayarFilter}&startDate=${startDate}&endDate=${endDate}`
      );
      const fetchedData = res.data.data || [];
      setIurans(fetchedData);
      return fetchedData;
    } catch (error) {
      console.error("Failed to fetch iurans:", error);
      // Return an empty array on error to prevent crashes downstream
      return [];
    }
  };

  const addIuran = async (formData: FormData) => {
    try {
      await api.post("/iuran", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchIurans();
    } catch (error) {
      console.error("Failed to add iuran:", error);
    }
  };

  const editIuran = async (IURAN_CODE: string, formData: FormData) => {
    try {
      await api.put(`/iuran/${IURAN_CODE}`, formData);
      await fetchIurans();
    } catch (error) {
      console.error("Failed to edit iuran:", error);
    }
  };

  const deleteIuran = async (IURAN_CODE: string) => {
    try {
      await api.delete(`/iuran/${IURAN_CODE}`);
      await fetchIurans();
    } catch (error) {
      console.error("Failed to delete iuran:", error);
    }
  };

  const updateIuranStatus = async (
    iuranCodes: string[],
    status: string,
    metodeBayar: string,
    userId: string,
    waktuBayar?: string, // Waktu bayar opsional
    buktiFotoAsset?: ImagePicker.ImagePickerAsset // Menggunakan asset, bukan hanya URI
  ) => {
    try {
      const results = await Promise.allSettled(
        iuranCodes.map(async (code) => {
          if (status === "tidak berjualan" && buktiFotoAsset) {
            const formData = new FormData();
            formData.append("IURAN_STATUS", status);
            formData.append("IURAN_USER", userId);
            formData.append(
              "IURAN_WAKTU_BAYAR",
              waktuBayar || new Date().toISOString()
            );
            formData.append("bukti_foto_iuran", {
              uri: buktiFotoAsset.uri,
              name: buktiFotoAsset.fileName || `bukti_iuran_${code}.jpg`,
              type: buktiFotoAsset.mimeType || "image/jpeg",
            } as any);
            await api.put(`/iuran/${code}`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          } else {
            await api.put(`/iuran/${code}`, {
              IURAN_STATUS: status,
              IURAN_METODE_BAYAR: metodeBayar,
              IURAN_USER: userId,
              IURAN_WAKTU_BAYAR: waktuBayar || new Date().toISOString(),
            });
          }
        })
      );
      console.log("Iuran update results:", results);

      const failedUpdates = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedUpdates.length > 0) {
        console.error("Some updates failed:", failedUpdates);
        throw new Error(`${failedUpdates.length} pembaruan gagal`);
      }

      return true;
    } catch (error) {
      console.error("Failed to update iuran:", error);
      throw error;
    }
  };

  return (
    <IuranContext.Provider
      value={{
        iurans,
        fetchIurans,
        addIuran,
        editIuran,
        deleteIuran,
        updateIuranStatus,
      }}
    >
      {children}
    </IuranContext.Provider>
  );
};

export const useIuranContext = () => {
  const context = useContext(IuranContext);
  if (!context) {
    throw new Error("useIuranContext must be used within an IuranProvider");
  }
  return context;
};
