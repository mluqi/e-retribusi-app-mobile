import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface LogActivity {
  id: number;
  LOG_TARGET: string;
  LOG_USER: string;
  LOG_ACTION: string;
  LOG_DETAIL: string;
  LOG_SOURCE: string;
  LOG_RECORD: string;
  LOG_OWNER: string;
}

interface LogAkses {
  id: number;
  AKSES_USER: string;
  AKSES_IP: string;
  AKSES_BROWSER: string;
  AKSES_STATUS: string;
  AKSES_RECORD: string;
}

interface LogContextProps {
  logActivities: LogActivity[];
  logAkses: LogAkses[];
  fetchLogActivity: (
    page?: number,
    limit?: number,
    search?: string,
    status?:string,
    actionFilter?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<{ totalPages: number }>;
  fetchLogAkses: (
    page?: number,
    limit?: number,
    search?: string,
    statusFilter?: string,
    userFilter?: string,
    browserFilter?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<{ totalPages: number }>;
}

const LogContext = createContext<LogContextProps | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logActivities, setLogActivity] = useState<LogActivity[]>([]);
  const [logAkses, setLogAkses] = useState<LogAkses[]>([]);

  const fetchLogActivity = async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    actionFilter = "",
    startDate = "",
    endDate = ""
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(actionFilter && { action: actionFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const res = await api.get(`/log-activity?${params.toString()}`);
      // console.log("API Response in Context:", res.data);
      setLogActivity(res.data.data);
      return { totalPages: res.data.totalPages };
    } catch (error) {
      console.error("Failed to fetch log activity in Context:", error);
      return { totalPages: 1 };
    }
  };

  const fetchLogAkses = async (
    page = 1,
    limit = 10,
    search = "",
    statusFilter = "",
    browserFilter = "",
    startDate = "",
    endDate = ""
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(browserFilter && { browser: browserFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const res = await api.get(`/log-akses?${params.toString()}`);
      setLogAkses(res.data.data);
      return { totalPages: res.data.totalPages };
    } catch (error) {
      console.error("Failed to fetch log access:", error);
      return { totalPages: 1 };
    }
  };

  return (
    <LogContext.Provider value={{ logActivities, logAkses, fetchLogActivity, fetchLogAkses }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLog must be used within a LogProvider");
  }
  return context;
};