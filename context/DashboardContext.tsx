import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../services/api";

interface MetricData {
  totalIncome: number;
  totalTransactions: number;
  tunaiTransactions: number;
  nonTunaiTransactions: number;
}

interface IuranTransaction {
  IURAN_CODE: string;
  IURAN_JUMLAH: number;
  IURAN_METODE_BAYAR: string | null;
  IURAN_WAKTU_BAYAR: string | null;
  IURAN_STATUS: string;
  DB_PEDAGANG: {
    CUST_NAMA: string;
  };
  updatedAt?: string;
}

interface PaymentMethodStatItem {
  IURAN_METODE_BAYAR: string;
  count: number;
}

interface DailyTransactionStats {
  dates: string[];
  tunaiData: number[];
  nonTunaiData: number[];
}

interface IuranStatusStatItem {
  IURAN_STATUS: string;
  count: number;
}

interface DashboardContextType {
  metrics: MetricData | null;
  recentTransactions: IuranTransaction[];
  paymentMethodStats: PaymentMethodStatItem[] | null;

  loadingMetrics: boolean;
  loadingRecentTransactions: boolean;
  loadingPaymentMethodStats: boolean;
  loadingDailyStats: boolean;
  loadingIuranStatusStats: boolean;
  iuranStatusStats: IuranStatusStatItem[] | null;
  dailyStats: DailyTransactionStats | null;

  error: string | null;

  startDate: Date | null;
  endDate: Date | null;
  setDashboardDates: (start: Date | null, end: Date | null) => void;
  refreshData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
}) => {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    IuranTransaction[]
  >([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<
    PaymentMethodStatItem[] | null
  >(null);
  const [dailyStats, setDailyStats] = useState<DailyTransactionStats | null>(
    null
  );
  const [iuranStatusStats, setIuranStatusStats] = useState<
    IuranStatusStatItem[] | null
  >(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingRecentTransactions, setLoadingRecentTransactions] =
    useState(true);
  const [loadingPaymentMethodStats, setLoadingPaymentMethodStats] =
    useState(true);
  const [loadingDailyStats, setLoadingDailyStats] = useState(true);
  const [loadingIuranStatusStats, setLoadingIuranStatusStats] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const buildQueryString = (
    currentStartDate?: Date | null,
    currentEndDate?: Date | null,
    params: Record<string, string | number> = {}
  ) => {
    const queryParams = new URLSearchParams();
    if (currentStartDate) {
      queryParams.append(
        "startDate",
        currentStartDate.toISOString().split("T")[0]
      );
    }
    if (currentEndDate) {
      queryParams.append("endDate", currentEndDate.toISOString().split("T")[0]);
    }
    for (const key in params) {
      queryParams.append(key, String(params[key]));
    }
    const qs = queryParams.toString();
    return qs ? `?${qs}` : "";
  };

  const fetchAllDashboardData = useCallback(
    async (sDate?: Date | null, eDate?: Date | null) => {
      setLoadingMetrics(true);
      setLoadingRecentTransactions(true);
      setLoadingPaymentMethodStats(true);
      setLoadingDailyStats(true);
      setLoadingIuranStatusStats(true);
      setError(null);

      try {
        const dateFilteredQueryString = buildQueryString(sDate, eDate);
        const recentTrxQueryString = buildQueryString(sDate, eDate, {
          limit: 5,
        });

        const [
          incomeRes,
          totalTrxRes,
          tunaiRes,
          nonTunaiRes,
          recentTrxRes,
          paymentStatsRes,
          dailyStatsRes,
          iuranStatusStatsRes,
        ] = await Promise.all([
          api.get<{ totalIncome: number }>(
            `/iuran/total-income${dateFilteredQueryString}`
          ),
          api.get<{ totalTransactions: number }>(
            `/iuran/total-transactions${dateFilteredQueryString}`
          ),
          api.get<{ tunaiTransactions: number }>(
            `/iuran/tunai${dateFilteredQueryString}`
          ),
          api.get<{ nonTunaiTransactions: number }>(
            `/iuran/non-tunai${dateFilteredQueryString}`
          ),
          api.get<IuranTransaction[]>(
            `/iuran/recent-transactions${recentTrxQueryString}`
          ),
          api.get<PaymentMethodStatItem[]>(
            `/iuran/metode-bayar${dateFilteredQueryString}`
          ),
          api.get<DailyTransactionStats>(
            `/iuran/daily-transaction-stats${dateFilteredQueryString}`
          ),
          api.get<IuranStatusStatItem[]>(
            `/iuran/iuran-status-stats${dateFilteredQueryString}`
          ),
        ]);

        setMetrics({
          totalIncome: incomeRes.data.totalIncome || 0,
          totalTransactions: totalTrxRes.data.totalTransactions || 0,
          tunaiTransactions: tunaiRes.data.tunaiTransactions || 0,
          nonTunaiTransactions: nonTunaiRes.data.nonTunaiTransactions || 0,
        });
        setLoadingMetrics(false);

        setRecentTransactions(recentTrxRes.data);
        setLoadingRecentTransactions(false);

        setPaymentMethodStats(paymentStatsRes.data);
        setLoadingPaymentMethodStats(false);

        setDailyStats(dailyStatsRes.data);
        setLoadingDailyStats(false);

        setIuranStatusStats(iuranStatusStatsRes.data);
        setLoadingIuranStatusStats(false)

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Gagal memuat data dashboard.";
        setError(errorMessage);
        // Reset states on error
        setMetrics(null);
        setRecentTransactions([]);
        setPaymentMethodStats(null);
        setDailyStats(null);
        setIuranStatusStats(null);

        setLoadingMetrics(false);
        setLoadingRecentTransactions(false);
        setLoadingPaymentMethodStats(false);
        setLoadingDailyStats(false);
        setLoadingIuranStatusStats(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAllDashboardData(startDate, endDate);
  }, [startDate, endDate, fetchAllDashboardData]);

  const setDashboardDates = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const refreshData = () => {
    fetchAllDashboardData(startDate, endDate);
  };

  return (
    <DashboardContext.Provider
      value={{
        metrics,
        recentTransactions,
        paymentMethodStats,
        dailyStats,
        loadingMetrics,
        loadingRecentTransactions,
        loadingPaymentMethodStats,
        loadingDailyStats,
        loadingIuranStatusStats,
        iuranStatusStats,
        error,
        startDate,
        endDate,
        setDashboardDates,
        refreshData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
