import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { PasarProvider } from "../context/PasarContext";
import { UserProvider } from "../context/UserContext";
// import { PedagangProvider } from "../context/PedagangContext";
import { LapakProvider } from "../context/LapakContext";
import { IuranProvider } from "../context/IuranContext";
import { LevelProvider } from "../context/LevelContext";
import { LogProvider } from "../context/LogContext";
import { LapakTypeProvider } from "../context/LapakTypeContext";
import { DropdownProvider } from "../context/DropdownContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PasarProvider>
        <UserProvider>
          {/* <PedagangProvider> */}
          <LapakProvider>
            <IuranProvider>
              <LevelProvider>
                <LogProvider>
                  <LapakTypeProvider>
                    <DropdownProvider>
                      {/* <DashboardProvider> */}
                      <Stack>
                        <Stack.Screen
                          name="signin"
                          options={{
                            title: "Sign In",
                            headerShown: false,
                          }}
                        />
                        <Stack.Screen
                          name="home/index"
                          options={{
                            title: "Beranda",
                            headerShown: false,
                            headerLeft: () => null,
                            headerBackVisible: false,
                            gestureEnabled: false,
                          }}
                        />
                        <Stack.Screen
                          name="iuran/index"
                          options={{
                            title: "Daftar Iuran",
                          }}
                        />
                        <Stack.Screen
                          name="iuran/add"
                          options={{
                            title: "Tambah Iuran",
                          }}
                        />
                        <Stack.Screen
                          name="payment/index"
                          options={{
                            title: "Pembayaran",
                          }}
                        />
                        <Stack.Screen
                          name="payment/qris"
                          options={{
                            title: "Pembayaran QRIS",
                          }}
                        />
                        <Stack.Screen
                          name="receipt/index"
                          options={{
                            title: "Bukti Pembayaran",
                            headerLeft: () => null,
                            headerBackVisible: false,
                            gestureEnabled: false,
                          }}
                        />
                        <Stack.Screen
                          name="scanner/index"
                          options={{
                            headerShown: false,
                            statusBarHidden: true,
                          }}
                        />
                        <Stack.Screen
                          name="history/index"
                          options={{
                            title: "Riwayat Transaksi",
                          }}
                        />
                        <Stack.Screen
                          name="unpaid-iuran/index"
                          options={{
                            title: "Iuran Belum Dibayar",
                          }}
                        />
                      </Stack>
                      {/* </DashboardProvider> */}
                    </DropdownProvider>
                  </LapakTypeProvider>
                </LogProvider>
              </LevelProvider>
            </IuranProvider>
          </LapakProvider>
          {/* </PedagangProvider> */}
        </UserProvider>
      </PasarProvider>
    </AuthProvider>
  );
}
