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
        <ActivityIndicator size="large" color="#7C3AED" />
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
      <StatusBar barStyle="dark-content" />
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
              placeholderTextColor="#94A3B8"
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
    backgroundColor: '#FAF5FF',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7C3AED',
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
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#581C87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  overdueCardBorder: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFFBFB',
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
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
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
    backgroundColor: '#EDE9FE',
  },
  statusBadgeOverdue: {
    backgroundColor: '#FFE4E6',
  },
  statusBadgeRepaid: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  statusTextOverdue: {
    color: '#BE123C',
  },
  statusTextRepaid: {
    color: '#065F46',
  },
  notesBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 3,
  },
  balanceHighlight: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: -0.5,
  },
  amountOverdue: {
    color: '#E11D48',
  },
  amountRepaid: {
    color: '#059669',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3E8FF',
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
    fontWeight: '800',
    color: '#059669',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
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
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
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
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
  },
  quickPayButton: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  quickPayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
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
    backgroundColor: '#FDFBFD',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E1B4B',
    marginBottom: 16,
    minWidth: 0,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
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
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    alignItems: 'center',
    paddingVertical: 24,
  },
  settledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#047857',
  },
  settledSubtitle: {
    fontSize: 13,
    color: '#065F46',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
});
