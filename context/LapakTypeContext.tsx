import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface TypeLapak {
  TYPE_CODE: string;
  TYPE_NAMA: string;
}

interface LapakTypeContextProps {
  typeLapaks: TypeLapak[];
  fetchTypeLapaks: () => Promise<void>;
  addTypeLapak: (formData: FormData) => Promise<void>;
  editTypeLapak: (TYPE_CODE: string, formData: FormData) => Promise<void>;
  deleteTypeLapak: (TYPE_CODE: string) => Promise<void>;
}

const LapakTypeContext = createContext<LapakTypeContextProps | undefined>(undefined);

export const LapakTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typeLapaks, setTypeLapaks] = useState<TypeLapak[]>([]);

  const fetchTypeLapaks = async () => {
    try {
      const res = await api.get("/lapak/type");
      setTypeLapaks(res.data);
    } catch (error) {
      console.error("Failed to fetch type lapaks:", error);
    }
  };

  const addTypeLapak = async (formData: FormData) => {
    // console.log(FormData)
    try {
      await api.post("/lapak/type", formData);
      await fetchTypeLapaks();
    } catch (error) {
      console.error("Failed to add type lapak:", error);
    }
  };

  const editTypeLapak = async (TYPE_CODE: string, formData: FormData) => {
    try {
      await api.put(`/lapak/type/${TYPE_CODE}`, formData);
      await fetchTypeLapaks();
    } catch (error) {
      console.error("Failed to edit type lapak:", error);
    }
  };

  const deleteTypeLapak = async (TYPE_CODE: string) => {
    try {
      await api.delete(`/lapak/type/${TYPE_CODE}`);
      await fetchTypeLapaks();
    } catch (error) {
      console.error("Failed to delete type lapak:", error);
    }
  };

  return (
    <LapakTypeContext.Provider
      value={{ typeLapaks, fetchTypeLapaks, addTypeLapak, editTypeLapak, deleteTypeLapak }}
    >
      {children}
    </LapakTypeContext.Provider>
  );
};

export const useLapakTypeContext = () => {
  const context = useContext(LapakTypeContext);
  if (!context) {
    throw new Error("useLapakTypeContext must be used within a LapakTypeProvider");
  }
  return context;
};