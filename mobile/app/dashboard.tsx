import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { fetchSummary, fetchLoans, logout, Summary, Loan } from '../src/api';
import BrandLogo from '../src/components/BrandLogo';

interface DashboardScreenProps {
  onNavigateAddLoan: () => void;
  onNavigateLoanDetails: (loanId: string) => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
}

type FilterType = 'ALL' | 'PENDING' | 'OVERDUE' | 'REPAID';

export default function DashboardScreen({
  onNavigateAddLoan,
  onNavigateLoanDetails,
  onLogout,
  onNavigateHome,
}: DashboardScreenProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
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
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      setError('Could not connect to backend. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

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

  const filteredLoans = useMemo(() => {
    if (activeFilter === 'ALL') return loans;
    return loans.filter((l) => l.status === activeFilter);
  }, [loans, activeFilter]);

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

  const getRelativeDueText = (dueDateStr: string, status: string) => {
    if (status === 'REPAID') return 'Settled';
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)}d`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else {
        return `Due in ${diffDays}d`;
      }
    } catch {
      return formatDate(dueDateStr);
    }
  };

  // Avatar accent colors in warm, rich light tones (NO light blue!)
  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: '#F3E8FF', text: '#7E22CE' }, // Royal Violet
      { bg: '#D1FAE5', text: '#065F46' }, // Fresh Emerald
      { bg: '#FFEDD5', text: '#C2410C' }, // Sunset Orange
      { bg: '#FCE7F3', text: '#BE185D' }, // Vivid Rose
      { bg: '#FEF3C7', text: '#B45309' }, // Warm Amber
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  // Repayment progress percentage
  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const progressPercent = totalLent > 0 ? Math.min(100, Math.round((totalRepaid / totalLent) * 100)) : 0;

  const renderLoanCard = ({ item }: { item: Loan }) => {
    const isOverdue = item.status === 'OVERDUE';
    const isRepaid = item.status === 'REPAID';
    const avatar = getAvatarColor(item.friendName);
    const relativeDue = getRelativeDueText(item.dueDate, item.status);

    return (
      <TouchableOpacity
        style={[styles.loanCard, isOverdue && styles.overdueCardHighlight]}
        activeOpacity={0.8}
        onPress={() => onNavigateLoanDetails(item.id)}
      >
        <View style={styles.cardHeader}>
          {/* Friend Avatar */}
          <View style={[styles.friendAvatar, { backgroundColor: avatar.bg }]}>
            <Text style={[styles.friendAvatarText, { color: avatar.text }]}>
              {item.friendName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Friend Details */}
          <View style={styles.friendDetails}>
            <Text style={styles.friendName} numberOfLines={1}>
              {item.friendName}
            </Text>
            <View style={styles.dueRow}>
              <Text style={[styles.dueText, isOverdue && styles.dueTextOverdue]}>
                {relativeDue}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.dateSubtext}>{formatDate(item.dueDate)}</Text>
            </View>
          </View>

          {/* Amount and Status Pill */}
          <View style={styles.amountCol}>
            <Text
              style={[
                styles.outstandingAmount,
                isOverdue && styles.amountOverdue,
                isRepaid && styles.amountRepaid,
              ]}
            >
              ₹{item.outstanding.toLocaleString('en-IN')}
            </Text>
            <View
              style={[
                styles.statusPill,
                isOverdue && styles.statusPillOverdue,
                isRepaid && styles.statusPillRepaid,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isOverdue && styles.statusTextOverdue,
                  isRepaid && styles.statusTextRepaid,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes if provided */}
        {item.notes ? (
          <View style={styles.cardNoteBox}>
            <Text style={styles.cardNoteText} numberOfLines={1}>
              "{item.notes}"
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Syncing Ledger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.brandRow}
          activeOpacity={0.7}
          onPress={onNavigateHome || handleLogoutPress}
        >
          <BrandLogo size={36} />
          <View style={styles.brandTextContainer}>
            <Text style={styles.appTitle}>MiniLedger</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutPill}
          activeOpacity={0.7}
          onPress={handleLogoutPress}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoanCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9061F9']}
            tintColor="#9061F9"
          />
        }
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {error && (
              <View style={styles.errorBanner}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* VIBRANT ROYAL HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroAuraBlob} />
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>TOTAL OUTSTANDING</Text>
                {summary && summary.overdue > 0 ? (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueBadgeText}>
                      ₹{summary.overdue.toLocaleString('en-IN')} OVERDUE
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Big primary balance */}
              <Text style={styles.heroAmount}>
                ₹{(summary?.outstanding || 0).toLocaleString('en-IN')}
              </Text>

              {/* Progress Track */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressText}>
                    {progressPercent}% Settled
                  </Text>
                  <Text style={styles.progressSubtext}>
                    ₹{(summary?.totalRepaid || 0).toLocaleString('en-IN')} of ₹{(summary?.totalLent || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Bottom stats row */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.statSubLabel}>Total Lent</Text>
                  <Text style={styles.statValue}>
                    ₹{(summary?.totalLent || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={[styles.statSubLabel, styles.repaidLabel]}>Repaid</Text>
                  <Text style={[styles.statValue, styles.repaidStatValue]}>
                    ₹{(summary?.totalRepaid || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Primary Action Button: + Record New Loan */}
            <TouchableOpacity
              style={styles.addLoanButton}
              activeOpacity={0.85}
              onPress={onNavigateAddLoan}
            >
              <View style={styles.plusCircle}>
                <Text style={styles.plusText}>+</Text>
              </View>
              <Text style={styles.addLoanButtonText}>Record New Loan</Text>
            </TouchableOpacity>

            {/* Section & Filter Chips */}
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.sectionTitle}>Ledger History</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{loans.length}</Text>
                </View>
              </View>

              {/* Filter Pills */}
              <View style={styles.filterRow}>
                {(['ALL', 'PENDING', 'OVERDUE', 'REPAID'] as FilterType[]).map((tab) => {
                  const isActive = activeFilter === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setActiveFilter(tab)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🤝</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'ALL'
                ? 'Your ledger is clean'
                : `No ${activeFilter.toLowerCase()} loans`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'ALL'
                ? 'Record funds lent to friends with clear return dates and stay on top of settlements.'
                : 'Switch filters or tap "Record New Loan" above.'}
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
    backgroundColor: '#FAF5FF', // Warm light porcelain background
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextContainer: {
    marginLeft: 12,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.4,
  },
  logoutPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  headerComponent: {
    paddingTop: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    marginRight: 8,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  /* VIBRANT ROYAL HERO CARD */
  heroCard: {
    backgroundColor: '#8B5CF6', // Vibrant luminous royal iris violet
    borderRadius: 24,
    padding: 22,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroAuraBlob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EDE9FE', // Soft luminous lilac
    letterSpacing: 1.2,
  },
  overdueBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  overdueBadgeText: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF', // Luminous crisp white
    letterSpacing: -1,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 18,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399', // Fresh vivid emerald
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A7F3D0', // Mint accent
  },
  progressSubtext: {
    fontSize: 12,
    color: '#EDE9FE',
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)', // Frosted glass container
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroStatItem: {
    flex: 1,
  },
  statSubLabel: {
    fontSize: 11,
    color: '#EDE9FE',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  repaidLabel: {
    color: '#A7F3D0',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  repaidStatValue: {
    color: '#A7F3D0',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginHorizontal: 12,
  },
  /* ACTION BUTTON */
  addLoanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9061F9',
    height: 50,
    borderRadius: 16,
    marginBottom: 22,
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  plusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  addLoanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  /* FILTER BAR */
  sectionHeader: {
    marginBottom: 14,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#7E4BD6',
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  filterChipActive: {
    backgroundColor: '#9061F9',
    borderColor: '#9061F9',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  /* LOAN CARDS */
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#581C87',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  overdueCardHighlight: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dueTextOverdue: {
    color: '#E11D48',
    fontWeight: '700',
  },
  dotSeparator: {
    color: '#CBD5E1',
    marginHorizontal: 5,
    fontSize: 10,
  },
  dateSubtext: {
    fontSize: 11,
    color: '#94A3B8',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 4,
  },
  amountOverdue: {
    color: '#E11D48',
  },
  amountRepaid: {
    color: '#059669',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#EDE9FE',
  },
  statusPillOverdue: {
    backgroundColor: '#FFE4E6',
  },
  statusPillRepaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.3,
  },
  statusTextOverdue: {
    color: '#BE123C',
  },
  statusTextRepaid: {
    color: '#065F46',
  },
  cardNoteBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  cardNoteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  /* EMPTY STATE */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
