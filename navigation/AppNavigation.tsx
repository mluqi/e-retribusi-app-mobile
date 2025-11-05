import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import IuranListScreen from "../screens/IuranListScreen";
import PaymentScreen from "../screens/PaymentScreen";
import PaymentReceiptScreen from "../screens/PaymentReceiptScreen";

export type RootStackParamList = {
  Home: undefined;
  IuranList: {
    pedagang: PedagangLite;
    lapak: Lapak;
    pasarName: string;
  };
  PaymentScreen: {
    selectedIurans: SelectedIuran[];
    totalAmount: number;
    customerData: PedagangLite;
    lapakData: Lapak;
    pasarName: string;
  };
  PaymentReceipt: {
    paymentData: PaymentData & {
      paymentDate: string;
      paymentCode: string;
    };
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="IuranList" 
        component={IuranListScreen} 
        options={{ title: 'Daftar Iuran' }} 
      />
      <Stack.Screen 
        name="PaymentScreen" 
        component={PaymentScreen} 
        options={{ title: 'Pembayaran' }} 
      />
      <Stack.Screen 
        name="PaymentReceipt" 
        component={PaymentReceiptScreen} 
        options={{ 
          title: 'Struk Pembayaran',
          headerLeft: () => null
        }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigation;