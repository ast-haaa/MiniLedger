import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import BrandLogo from '../src/components/BrandLogo';
import { isAuthenticated } from '../src/api';

interface HomeScreenProps {
  onOpenDashboard: () => void;
  onNavigateLogin: () => void;
}

export default function HomeScreen({
  onOpenDashboard,
  onNavigateLogin,
}: HomeScreenProps) {
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Authenticated users go straight to Dashboard; unauthenticated users go to Login
  const handleOpenDashboardPress = async () => {
    try {
      setCheckingAuth(true);
      const authed = await isAuthenticated();
      if (authed) {
        onOpenDashboard();
      } else {
        onNavigateLogin();
      }
    } catch {
      onNavigateLogin();
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navbar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={38} />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.brandSub}>Peer Ledger</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navLoginBtn}
          activeOpacity={0.75}
          onPress={handleOpenDashboardPress}
        >
          <Text style={styles.navLoginText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeadline}>
            Never lose track of money lent to friends.
          </Text>

          {/* Primary Action Button: Open Dashboard */}
          <TouchableOpacity
            style={[styles.openDashboardBtn, checkingAuth && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleOpenDashboardPress}
            disabled={checkingAuth}
          >
            {checkingAuth ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.openDashboardBtnText}>Open Dashboard</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.heroNote}>
            Fast phone login • Zero password hassle
          </Text>
        </View>

        {/* Live Preview Card */}
        <View style={styles.previewCardWrapper}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewLabel}>LIVE SUMMARY PREVIEW</Text>
                <Text style={styles.previewAmount}>₹12,500</Text>
              </View>
              <View style={styles.previewStatusChip}>
                <Text style={styles.previewStatusText}>68% Settled</Text>
              </View>
            </View>

            {/* Mini Progress Bar */}
            <View style={styles.previewProgressTrack}>
              <View style={[styles.previewProgressFill, { width: '68%' }]} />
            </View>

            <View style={styles.previewStatsRow}>
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Total Lent</Text>
                <Text style={styles.previewStatVal}>₹38,000</Text>
              </View>
              <View style={styles.previewStatDivider} />
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Repaid</Text>
                <Text style={[styles.previewStatVal, { color: '#059669' }]}>
                  ₹25,500
                </Text>
              </View>
              <View style={styles.previewStatDivider} />
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatLabel}>Active Friends</Text>
                <Text style={styles.previewStatVal}>4</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3 Core Highlights */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Everything you need</Text>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Text style={styles.featureIcon}>📱</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Phone OTP Sign In</Text>
              <Text style={styles.featureDesc}>
                Instant access with your 10-digit Indian phone number and a secure 6-digit mock OTP.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.featureIcon}>📊</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Executive Balance Tracker</Text>
              <Text style={styles.featureDesc}>
                Real-time metrics for total lent, repayments collected, outstanding balances, and overdue alerts.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.featureIcon}>🤝</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Partial & Full Settlements</Text>
              <Text style={styles.featureDesc}>
                Record repayments easily with automatic status updates and overpayment safeguards.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <BrandLogo size={28} />
          <Text style={styles.footerBrand}>MiniLedger</Text>
          <Text style={styles.footerText}>
            Built for seamless peer ledger tracking • Private & reliable
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF', // Clean, warm light lavender porcelain
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextCol: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9061F9',
    letterSpacing: 0.2,
  },
  navLoginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4BD6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9061F9',
    marginRight: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroSubtext: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
    maxWidth: 380,
  },
  openDashboardBtn: {
    width: '100%',
    maxWidth: 360,
    height: 54,
    backgroundColor: '#9061F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 5,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openDashboardBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnArrowBadge: {
    marginLeft: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  heroNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  previewCardWrapper: {
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E4BD6',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  previewStatusChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  previewProgressTrack: {
    height: 7,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#9061F9',
    borderRadius: 4,
  },
  previewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  previewStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
