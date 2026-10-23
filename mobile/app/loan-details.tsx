import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { fetchLoanDetails, recordRepayment, LoanDetail } from '../src/api';

interface LoanDetailsScreenProps {
  loanId: string;
  onBack: () => void;
  onRepaymentRecorded: () => void;
}

export default function LoanDetailsScreen({
  loanId,
  onBack,
  onRepaymentRecorded,
}: LoanDetailsScreenProps) {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchLoanDetails(loanId);
      setLoan(data);
    } catch (err: any) {
      setError('Failed to load loan details.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

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

  const handleQuickFullRepay = () => {
    if (!loan) return;
    setRepaymentAmount(loan.outstanding.toString());
    setError(null);
  };

  const handleRecordRepayment = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!loan) return;

    const numAmount = parseFloat(repaymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid repayment amount');
      return;
    }

    // Client-side prevention of overpayment
    if (numAmount > loan.outstanding) {
      setError(
        `Repayment amount (₹${numAmount.toLocaleString('en-IN')}) cannot exceed outstanding balance of ₹${loan.outstanding.toLocaleString('en-IN')}`
      );
      return;
    }

    try {
      setSubmitting(true);
      await recordRepayment(loan.id, numAmount);
      setRepaymentAmount('');
      setSuccessMsg(`Successfully recorded payment of ₹${numAmount.toLocaleString('en-IN')}`);
      await loadDetails();
      onRepaymentRecorded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Loan record not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = loan.status === 'OVERDUE';
  const isRepaid = loan.status === 'REPAID';
  const progressPercent = loan.amount > 0 ? Math.min(100, Math.round((loan.totalRepaid / loan.amount) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={[styles.card, isOverdue && styles.overdueCardBorder]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {loan.friendName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{loan.friendName}</Text>
              <Text style={styles.dueDateText}>Due: {formatDate(loan.dueDate)}</Text>
            </View>
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
                {loan.status}
              </Text>
            </View>
          </View>

          {loan.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>NOTE</Text>
              <Text style={styles.notesText}>{loan.notes}</Text>
            </View>
          )}

          {/* Outstanding Display */}
          <View style={styles.balanceHighlight}>
            <Text style={styles.balanceLabel}>CURRENT OUTSTANDING</Text>
            <Text
              style={[
                styles.balanceAmount,
                isOverdue && styles.amountOverdue,
                isRepaid && styles.amountRepaid,
              ]}
            >
              ₹{loan.outstanding.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Progress Bar */}
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
              <Text style={styles.progressText}>{progressPercent}% Settled</Text>
              <Text style={styles.progressSubtext}>
                ₹{loan.totalRepaid.toLocaleString('en-IN')} of ₹{loan.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Repayment Form or Settled Banner */}
        {!isRepaid ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Record Payment</Text>
            <Text style={styles.sectionSubtitle}>
              Log payment received from {loan.friendName}
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {successMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Quick full repayment button */}
            <TouchableOpacity
              style={styles.quickPayButton}
              activeOpacity={0.8}
              onPress={handleQuickFullRepay}
            >
              <Text style={styles.quickPayButtonText}>
                ⚡ Fill Full Balance (₹{loan.outstanding.toLocaleString('en-IN')})
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>REPAYMENT AMOUNT (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Max ₹${loan.outstanding}`}
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              value={repaymentAmount}
              onChangeText={(text) => {
                setRepaymentAmount(text);
                setError(null);
                setSuccessMsg(null);
              }}
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={handleRecordRepayment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Record Repayment</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.settledCard]}>
            <Text style={styles.settledTitle}>🎉 Loan Fully Settled!</Text>
            <Text style={styles.settledSubtitle}>
              All ₹{loan.amount.toLocaleString('en-IN')} has been repaid by {loan.friendName}.
            </Text>
          </View>
        )}

        {/* Repayment History Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repayment History</Text>
          {loan.repayments.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No repayments have been recorded for this loan yet.
            </Text>
          ) : (
            loan.repayments.map((rep, idx) => (
              <View key={rep.id || idx} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyAmount}>
                    + ₹{rep.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(rep.repaidAt)}
                  </Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>Repaid</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 4,
  },
  overdueCardBorder: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: '#13111C',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A78BFA',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  dueDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  statusBadgeOverdue: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  statusBadgeRepaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
  },
  statusTextOverdue: {
    color: '#FDA4AF',
  },
  statusTextRepaid: {
    color: '#6EE7B7',
  },
  notesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
  },
  balanceHighlight: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  amountOverdue: {
    color: '#F43F5E',
  },
  amountRepaid: {
    color: '#34D399',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
    marginRight: 8,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '600',
  },
  quickPayButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  quickPayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 16,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settledCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    paddingVertical: 24,
  },
  settledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34D399',
  },
  settledSubtitle: {
    fontSize: 13,
    color: '#6EE7B7',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34D399',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
  },
});
