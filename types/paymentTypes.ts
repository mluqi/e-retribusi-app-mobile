// types/paymentTypes.ts
import { Lapak, PedagangLite } from "../context/LapakContext";

export interface SelectedIuran {
  IURAN_CODE: string;
  IURAN_JUMLAH: number;
  IURAN_TANGGAL?: string;
}

export interface PaymentData {
  selectedIurans: SelectedIuran[];
  totalAmount: number;
  paymentMethod: string;
  customerData: PedagangLite | { CUST_NAMA: string; CUST_CODE?: string };
  lapakData: Lapak;
  paymentDate: string;
  paymentCode: string;
  pasarName: string;
  userId: string;
  userNama: string;
}
