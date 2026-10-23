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
          <ActivityIndicator size="large" color="#7C3AED" />
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
    backgroundColor: '#F3E8FF', // Soft warm lavender backdrop for desktop web
    alignItems: 'center',
    justifyContent: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    backgroundColor: '#FAF5FF', // Clean, warm light background
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#581C87',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.12,
          shadowRadius: 36,
          overflow: 'hidden',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#E9D5FF',
        }
      : {}),
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

registerRootComponent(App);
