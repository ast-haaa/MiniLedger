import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { isAuthenticated } from './api';
import { Screen } from './types';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddLoanScreen from './screens/AddLoanScreen';
import LoanDetailsScreen from './screens/LoanDetailsScreen';

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
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

  // Render current screen component
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
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
