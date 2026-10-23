import { registerRootComponent } from 'expo';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { isAuthenticated } from './src/api';
import LoginScreen from './app/index';
import DashboardScreen from './app/dashboard';
import AddLoanScreen from './app/add-loan';
import LoanDetailsScreen from './app/loan-details';

type Screen = 'login' | 'dashboard' | 'add-loan' | 'loan-details';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Check existing session token on launch
  useEffect(() => {
    async function checkAuth() {
      try {
        const authed = await isAuthenticated();
        if (authed) {
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('login');
        }
      } catch {
        setCurrentScreen('login');
      } finally {
        setInitializing(false);
      }
    }
    checkAuth();
  }, []);

  if (initializing) {
    return (
      <View style={styles.webBackdrop}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  // Navigation handlers
  const handleLoginSuccess = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
    setSelectedLoanId(null);
  };

  const handleNavigateAddLoan = () => {
    setCurrentScreen('add-loan');
  };

  const handleNavigateLoanDetails = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentScreen('loan-details');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateAddLoan={handleNavigateAddLoan}
            onNavigateLoanDetails={handleNavigateLoanDetails}
            onLogout={handleLogout}
          />
        );

      case 'add-loan':
        return (
          <AddLoanScreen
            onBack={handleBackToDashboard}
            onSuccess={handleBackToDashboard}
          />
        );

      case 'loan-details':
        return (
          <LoanDetailsScreen
            loanId={selectedLoanId || ''}
            onBack={handleBackToDashboard}
            onRepaymentRecorded={handleBackToDashboard}
          />
        );

      case 'login':
      default:
        return <LoginScreen onSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <View style={styles.webBackdrop}>
      <View style={styles.appShell}>
        {renderScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    backgroundColor: '#07090E', // Ultra-deep dark luxury backdrop
    alignItems: 'center',
    justifyContent: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined, // Mobile viewport width on desktop
    backgroundColor: '#0B0F19', // Main app background
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.6,
          shadowRadius: 36,
          overflow: 'hidden',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }
      : {}),
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

registerRootComponent(App);
