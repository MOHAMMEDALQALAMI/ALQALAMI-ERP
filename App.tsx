import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { ERPProvider, useERP } from './src/context/ERPContext';
import { SidebarDrawer } from './src/components/SidebarDrawer';
import { CalculatorModal } from './src/components/CalculatorModal';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { POSScreen } from './src/screens/POSScreen';
import { SalesScreen } from './src/screens/SalesScreen';
import { PurchasesScreen } from './src/screens/PurchasesScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { HRScreen } from './src/screens/HRScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { QuotationsScreen } from './src/screens/QuotationsScreen';
import { TransfersScreen } from './src/screens/TransfersScreen';
import { CostCentersScreen } from './src/screens/CostCentersScreen';
import { StatementLedgerScreen } from './src/screens/StatementLedgerScreen';
import { BarcodeLabelsScreen } from './src/screens/BarcodeLabelsScreen';
import { RolesScreen } from './src/screens/RolesScreen';
import { UsersManagementScreen } from './src/screens/UsersManagementScreen';
import { AuditLogsScreen } from './src/screens/AuditLogsScreen';
import { PermissionTesterScreen } from './src/screens/PermissionTesterScreen';

function MainAppContent() {
  const { activeScreen, isSidebarOpen, setIsSidebarOpen } = useERP();

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'pos':
        return <POSScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'quotations':
        return <QuotationsScreen />;
      case 'purchases':
        return <PurchasesScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'transfers':
        return <TransfersScreen />;
      case 'barcode_labels':
        return <BarcodeLabelsScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'statement_ledger':
        return <StatementLedgerScreen />;
      case 'cost_centers':
        return <CostCentersScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'hr':
        return <HRScreen />;
      case 'roles':
        return <RolesScreen />;
      case 'users_management':
        return <UsersManagementScreen />;
      case 'audit_logs':
        return <AuditLogsScreen />;
      case 'permission_tester':
        return <PermissionTesterScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {/* Current Screen View */}
      <View style={styles.screenWrapper}>{renderActiveScreen()}</View>

      {/* Enterprise Side Navigation Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Global Quick Financial Calculator */}
      <CalculatorModal />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ERPProvider>
        <MainAppContent />
      </ERPProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
