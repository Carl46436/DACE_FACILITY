// ============================================================
// Dashboard Screen
// Main hub showing stats, recent reports, and quick actions
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { useAuth } from '../stores/authStore';
import { formatRole, getInitials } from '../utils/formatters';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const loadDashboard = useCallback(async () => {
    try {
      const requests = [
        api.reports.getAll({ page: 1, limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
        api.notifications.getUnreadCount(),
      ];

      if (isAdmin) {
        requests.push(api.admin.getActivityLogs({ page: 1, limit: 5 }));
      }

      const results = await Promise.allSettled(requests);
      const reportsRes = results[0];
      const unreadRes = results[1];

      if (reportsRes.status === 'fulfilled') {
        setRecentReports(reportsRes.value.data?.data || []);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.unread_count || 0);
      }

      if (isAdmin) {
        const logsRes = results[2];
        if (logsRes?.status === 'fulfilled') setActivityLogs(logsRes.value.data?.data || []);
      }
    } catch (error) {
      console.log('Dashboard load error:', error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const quickActions = isAdmin
    ? [
      { icon: 'shield-checkmark', label: 'Admin Panel', color: colors.primary, screen: 'AdminPanel' },
      { icon: 'people', label: 'Approvals', color: colors.warning, screen: 'AdminPanel', params: { tab: 'approvals' } },
      { icon: 'qr-code', label: 'Admin Items', color: colors.secondary, screen: 'AdminItems' },
      { icon: 'arrow-redo', label: 'Borrowing', color: colors.success, screen: 'Borrowing' },
      { icon: 'list', label: 'All Reports', color: colors.info, screen: 'ReportsList' },
    ]
    : [
      { icon: 'add-circle', label: 'New Report', color: colors.primary, screen: 'ReportSubmission' },
      { icon: 'list', label: 'My Reports', color: colors.info, screen: 'ReportsList' },
      { icon: 'qr-code', label: 'Scan QR', color: colors.secondary, screen: 'QRScanner' },
      { icon: 'arrow-redo', label: 'Borrowing', color: colors.success, screen: 'Borrowing' },
    ];

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={styles.header}>
        <View style={styles.greeting}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
          </View>
          <View style={styles.greetingText}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Text style={styles.userRole}>{formatRole(user?.role)}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => navigation?.navigate?.('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.white} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation?.navigate?.('Profile')}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation?.navigate?.(action.screen, action.params)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '1A' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('ReportsList')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No reports yet</Text>
          </View>
        ) : (
          recentReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportRow}
              onPress={() => navigation?.navigate?.('ReportDetail', { id: report.id })}
            >
              <View style={[styles.statusDot, { backgroundColor: colors.status[report.status] || colors.textMuted }]} />
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                <Text style={styles.reportMeta}>{report.category} | {report.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>


      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activityLogs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No activity yet</Text>
            </View>
          ) : (
            activityLogs.map((log) => (
              <View key={log.id} style={styles.activityRow}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.activityText} numberOfLines={1}>
                  {log.action?.replace(/_/g, ' ') || 'activity'} | {log.user?.full_name || 'System'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  greeting: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.white },
  greetingText: { flex: 1 },
  welcomeText: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  userRole: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notifButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  profileButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: {
    width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  actionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.md,
    padding: spacing.md, borderLeftWidth: 4,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  statNumber: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  reportRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.white, borderRadius: borderRadius.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.md },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  reportMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  emptyBox: {
    padding: spacing.xl, alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityText: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
});

export default DashboardScreen;
