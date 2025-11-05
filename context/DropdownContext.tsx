import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface pasarOptions {
  pasar_code: string;
  pasar_nama: string;
  pasar_status: string;
  pasar_logo?: string | null;
}

interface pedagangOptions {
  CUST_CODE: string;
  CUST_NAMA: string;
  CUST_PHONE: string;
  CUST_NIK: string;
  CUST_OWNER: string;
}

interface lapakOptions {
  LAPAK_CODE: string;
  LAPAK_NAMA: string;
  LAPAK_STATUS: string;
}

interface DropdownContextProps {
  pasars: pasarOptions[];
  pedagangs: pedagangOptions[];
  lapaks: lapakOptions[];
  fetchAllPasars: () => Promise<void>;
  fetchAllPedagangs: () => Promise<void>;
  fetchAllLapaks: () => Promise<void>;
}

const DropdownContext = createContext<DropdownContextProps | undefined>(
  undefined
);

export const DropdownProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pasars, setPasars] = useState<pasarOptions[]>([]);
  const [pedagangs, setPedagangs] = useState<pedagangOptions[]>([]);
  const [lapaks, setLapaks] = useState<lapakOptions[]>([]);

  const fetchAllPasars = async () => {
    try {
      const BASE_URL = "https://dev1-p3.palindo.id/uploads/";
      const response = await api.get("/pasar/all");
      const dataWithFullUrl = (response.data || []).map((pasar: any) => ({
        ...pasar,
        pasar_logo: pasar.pasar_logo ? `${BASE_URL}${pasar.pasar_logo}` : null,
      }));
      setPasars(dataWithFullUrl);
    } catch (error) {
      console.error("Failed to fetch all pasars:", error);
    }
  };

  const fetchAllPedagangs = async () => {
    try {
      const response = await api.get("/pedagang/all");
      setPedagangs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch all pedagangs:", error);
    }
  };

  const fetchAllLapaks = async () => {
    try {
      const response = await api.get("/lapak/all");
      setLapaks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch all lapaks:", error);
    }
  };

  return (
    <DropdownContext.Provider
      value={{
        pasars,
        pedagangs,
        lapaks,
        fetchAllPasars,
        fetchAllPedagangs,
        fetchAllLapaks,
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
};

export const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error(
      "useDropdownContext must be used within a DropdownProvider"
    );
  }
  return context;
};
