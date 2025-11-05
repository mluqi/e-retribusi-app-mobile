import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface Level {
  level_code: string;
  level_name: string;
  level_status: string;
}

interface LevelContextProps {
  levels: Level[];
  fetchLevels: () => Promise<void>;
  addLevel: (formData: FormData) => Promise<void>;
  editLevel: (level_code: string, formData: FormData) => Promise<void>;
  deleteLevel: (level_code: string) => Promise<void>;
}

const LevelContext = createContext<LevelContextProps | undefined>(undefined);

export const LevelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [levels, setLevels] = useState<Level[]>([]);

  const fetchLevels = async () => {
    try {
      const res = await api.get("/level");
      setLevels(res.data);
    } catch (error) {
      console.error("Failed to fetch levels:", error);
    }
  };

  const addLevel = async (formData: FormData) => {
    try {
      await api.post("/level", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchLevels();
    } catch (error) {
      console.error("Failed to add level:", error);
    }
  };

  const editLevel = async (level_code: string, formData: FormData) => {
    try {
      await api.put(`/level/${level_code}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchLevels();
    } catch (error) {
      console.error("Failed to edit level:", error);
    }
  };

  const deleteLevel = async (level_code: string) => {
    try {
      await api.delete(`/level/${level_code}`);
      await fetchLevels();
    } catch (error) {
      console.error("Failed to delete level:", error);
    }
  };

  return (
    <LevelContext.Provider value={{ levels, fetchLevels, addLevel, editLevel, deleteLevel }}>
      {children}
    </LevelContext.Provider>
  );
};

export const useLevelContext = () => {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error("useLevelContext must be used within a LevelProvider");
  }
  return context;
};