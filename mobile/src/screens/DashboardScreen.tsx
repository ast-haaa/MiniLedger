import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { fetchSummary, fetchLoans, logout } from '../api';
import { Summary, Loan } from '../types';

interface DashboardScreenProps {
  onNavigateAddLoan: () => void;
  onNavigateLoanDetails: (loanId: string) => void;
  onLogout: () => void;
}

export default function DashboardScreen({
  onNavigateAddLoan,
  onNavigateLoanDetails,
  onLogout,
}: DashboardScreenProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load summary stats and loan records
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [summaryData, loansData] = await Promise.all([
        fetchSummary(),
        fetchLoans(),
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not load data. Check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogoutPress = async () => {
    await logout();
    onLogout();
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderLoanCard = ({ item }: { item: Loan }) => {
    const isOverdue = item.status === 'OVERDUE';
    const isRepaid = item.status === 'REPAID';

    return (
      <TouchableOpacity
        style={[styles.loanCard, isOverdue && styles.overdueCardBorder]}
        activeOpacity={0.7}
        onPress={() => onNavigateLoanDetails(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.friendAvatar}>
            <Text style={styles.friendAvatarText}>
              {item.friendName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.friendName}</Text>
            <Text style={styles.dueDateText}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isOverdue && styles.statusBadgeOverdue,
              isRepaid && styles.statusBadgeRepaid,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isOverdue && styles.statusTextOverdue,
                isRepaid && styles.statusTextRepaid,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Amount Details */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Original Lent</Text>
            <Text style={styles.amountValue}>₹{item.amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.amountRight}>
            <Text style={styles.amountLabel}>Outstanding</Text>
            <Text
              style={[
                styles.outstandingValue,
                isOverdue && styles.outstandingOverdueText,
                isRepaid && styles.outstandingRepaidText,
              ]}
            >
              ₹{item.outstanding.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading MiniLedger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>MiniLedger</Text>
          <Text style={styles.headerSubtitle}>Money Lent Tracker</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoanCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListHeaderComponent={
          <View>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 4 Summary Cards Grid */}
            <View style={styles.summaryGrid}>
              {/* Total Lent */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Lent</Text>
                <Text style={styles.summaryValue}>
                  ₹{(summary?.totalLent || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Total Repaid */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Repaid</Text>
                <Text style={[styles.summaryValue, styles.repaidValue]}>
                  ₹{(summary?.totalRepaid || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Outstanding */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Outstanding</Text>
                <Text style={[styles.summaryValue, styles.outstandingValueHighlight]}>
                  ₹{(summary?.outstanding || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Overdue */}
              <View
                style={[
                  styles.summaryCard,
                  (summary?.overdue || 0) > 0 && styles.overdueSummaryCard,
                ]}
              >
                <Text
                  style={[
                    styles.summaryLabel,
                    (summary?.overdue || 0) > 0 && styles.overdueSummaryLabel,
                  ]}
                >
                  Overdue
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    (summary?.overdue || 0) > 0 && styles.overdueSummaryValue,
                  ]}
                >
                  ₹{(summary?.overdue || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Create Loan Button */}
            <TouchableOpacity
              style={styles.addLoanButton}
              activeOpacity={0.8}
              onPress={onNavigateAddLoan}
            >
              <Text style={styles.addLoanButtonText}>+ Add New Loan</Text>
            </TouchableOpacity>

            {/* Loans Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Loans</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{loans.length}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No loans recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+ Add New Loan" button above to track your first friend loan.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF', // Lavender background
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6D28D9',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  overdueSummaryCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  overdueSummaryLabel: {
    color: '#B91C1C',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  repaidValue: {
    color: '#059669',
  },
  outstandingValueHighlight: {
    color: '#7C3AED',
  },
  overdueSummaryValue: {
    color: '#DC2626',
  },
  addLoanButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  addLoanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  overdueCardBorder: {
    borderColor: '#F87171',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7C3AED',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dueDateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  statusBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeRepaid: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  statusTextOverdue: {
    color: '#DC2626',
  },
  statusTextRepaid: {
    color: '#059669',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  amountRight: {
    alignItems: 'flex-end',
  },
  outstandingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
  },
  outstandingOverdueText: {
    color: '#DC2626',
  },
  outstandingRepaidText: {
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
});
