// ============================================================
// Admin Panel Screen
// Analytics, user management, and system administration
// ============================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Polyline, Rect } from "react-native-svg";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import CustomButton from "../components/CustomButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatRole, formatRelativeTime } from "../utils/formatters";
import { api } from "../services/api";
import { confirmAction } from "../utils/confirm";

const AdminPanelScreen = ({ navigation, route }) => {
  const initialTab = route?.params?.tab || "analytics";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [analytics, setAnalytics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);

  const loadData = async (logsPageNum = 1, appendLogs = false) => {
    try {
      const [analyticsRes, pendingRes, logsRes] = await Promise.allSettled([
        api.admin.getAnalytics(),
        api.admin.getPendingApprovals(),
        api.admin.getActivityLogs({ page: logsPageNum, limit: 20 }),
      ]);

      if (analyticsRes.status === "fulfilled")
        setAnalytics(analyticsRes.value.data);
      if (pendingRes.status === "fulfilled")
        setPendingUsers(pendingRes.value.data || []);
      if (logsRes.status === "fulfilled") {
        const newLogs = logsRes.value.data?.data || [];
        if (appendLogs) {
          setActivityLogs((prev) => [...prev, ...newLogs]);
        } else {
          setActivityLogs(newLogs);
        }
        setHasMoreLogs(newLogs.length === 20);
        setLogsPage(logsPageNum);
      }
    } catch (error) {
      console.log("Admin load error:", error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setIsLoadingMoreLogs(false);
    }
  };

  const handleLoadMoreLogs = async () => {
    if (isLoadingMoreLogs || !hasMoreLogs) return;
    setIsLoadingMoreLogs(true);
    const nextPage = logsPage + 1;
    await loadData(nextPage, true);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const handleApproveUser = async (userId, approved) => {
    const confirmed = await confirmAction({
      title: approved ? "Approve User" : "Reject User",
      message: approved
        ? "Approve this user account?"
        : "Reject this user account?",
      confirmText: approved ? "Approve" : "Reject",
    });

    if (!confirmed) return;

    try {
      await api.admin.approveUser(userId, { is_approved: approved });
      Alert.alert("Success", approved ? "User approved." : "User rejected.");
      loadData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const tabs = [
    { id: "analytics", label: "Analytics", icon: "bar-chart" },
    {
      id: "approvals",
      label: "Approvals",
      icon: "person-add",
      badge: pendingUsers.length,
    },
    { id: "logs", label: "Activity", icon: "time" },
  ];

  const dailyTrend = analytics?.daily_trend || [];
  const maxDaily = dailyTrend.reduce(
    (max, item) => Math.max(max, item.count || 0),
    0,
  );
  const topLocations = analytics?.top_locations || [];

  if (isLoading)
    return <LoadingSpinner fullScreen message="Loading admin panel..." />;

  return (
    <View style={styles.container}>
      <Header
        title="Admin Panel"
        subtitle="System administration"
        onBack={() => navigation?.goBack?.()}
      />

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
            {tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        {activeTab === "analytics" && analytics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.kpiRow}>
                {[
                  {
                    label: "Total Reports",
                    value: analytics.summary?.total_reports,
                    delta: "+12%",
                    color: colors.primary,
                  },
                  {
                    label: "Active Users",
                    value: analytics.summary?.total_users,
                    delta: "+2%",
                    color: colors.success,
                  },
                  {
                    label: "Pending Users",
                    value: analytics.summary?.pending_approvals,
                    delta: "-4%",
                    color: colors.warning,
                  },
                  {
                    label: "In Progress",
                    value: analytics.reports_by_status?.in_progress || 0,
                    delta: "-3%",
                    color: colors.info,
                  },
                  {
                    label: "Resolved",
                    value: analytics.reports_by_status?.resolved || 0,
                    delta: "+20%",
                    color: colors.success,
                  },
                ].map((stat) => (
                  <View key={stat.label} style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{stat.value || 0}</Text>
                    <Text style={styles.kpiLabel}>{stat.label}</Text>
                    <Text style={[styles.kpiDelta, { color: stat.color }]}>
                      {stat.delta}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.chartRow}>
                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>Reports Over Time</Text>
                  {dailyTrend.length === 0 ? (
                    <Text style={styles.emptyText}>No daily data yet.</Text>
                  ) : (
                    <>
                      <Svg width="100%" height="140" viewBox="0 0 300 140">
                        <Polyline
                          points={dailyTrend
                            .map((item, idx) => {
                              const x =
                                (idx / Math.max(1, dailyTrend.length - 1)) *
                                300;
                              const y =
                                110 - (item.count / Math.max(1, maxDaily)) * 70;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#F06C90"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <View style={styles.chartLabels}>
                        {dailyTrend.map((item) => (
                          <Text key={item.date} style={styles.chartLabel}>
                            {item.date.slice(5)}
                          </Text>
                        ))}
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.sectionTitle}>
                    Most Reported Locations
                  </Text>
                  {topLocations.length === 0 ? (
                    <Text style={styles.emptyText}>No locations yet.</Text>
                  ) : (
                    <View style={styles.locationList}>
                      {topLocations.map((item) => (
                        <View key={item.location} style={styles.locationRow}>
                          <Text style={styles.locationLabel}>
                            {item.location}
                          </Text>
                          <Svg width="100%" height="10">
                            <Rect
                              x="0"
                              y="0"
                              width={`${Math.min(100, (item.count / Math.max(1, topLocations[0]?.count || 1)) * 100)}%`}
                              height="10"
                              fill="#F06C90"
                              rx="6"
                            />
                          </Svg>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {analytics.recent_reports?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.chartRow}>
                  <View style={styles.chartCard}>
                    <View style={styles.listHeader}>
                      <Text style={styles.sectionTitle}>Recent Reports</Text>
                      <Text style={styles.viewAll}>View All</Text>
                    </View>
                    {analytics.recent_reports.map((report) => (
                      <View key={report.id} style={styles.logItem}>
                        <StatusBadge
                          value={report.status}
                          type="status"
                          size="sm"
                        />
                        <Text style={styles.logText} numberOfLines={1}>
                          {report.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartCard}>
                    <View style={styles.listHeader}>
                      <Text style={styles.sectionTitle}>Activity Logs</Text>
                      <Text style={styles.viewAll}>View All</Text>
                    </View>
                    {activityLogs.length === 0 ? (
                      <Text style={styles.emptyText}>No activity yet.</Text>
                    ) : (
                      activityLogs.slice(0, 5).map((log) => (
                        <View key={log.id} style={styles.logItem}>
                          <View style={styles.logIcon}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={colors.textMuted}
                            />
                          </View>
                          <View style={styles.logContent}>
                            <Text style={styles.logAction}>
                              {log.action.replace(/_/g, " ")}
                            </Text>
                            <Text style={styles.logMeta}>
                              {log.user?.full_name || "System"} |{" "}
                              {formatRelativeTime(log.created_at)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === "approvals" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Approvals ({pendingUsers.length})
            </Text>
            {pendingUsers.length === 0 ? (
              <Text style={styles.emptyText}>No pending approvals.</Text>
            ) : (
              pendingUsers.map((pendingUser) => (
                <View key={pendingUser.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{pendingUser.full_name}</Text>
                    <Text style={styles.userEmail}>{pendingUser.email}</Text>
                    <Text style={styles.userMeta}>
                      {formatRole(pendingUser.role)} |{" "}
                      {pendingUser.department || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.userActions}>
                    <CustomButton
                      title="Approve"
                      onPress={() => handleApproveUser(pendingUser.id, true)}
                      size="sm"
                      fullWidth={false}
                    />
                    <CustomButton
                      title="Reject"
                      onPress={() => handleApproveUser(pendingUser.id, false)}
                      variant="danger"
                      size="sm"
                      fullWidth={false}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "logs" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Logs</Text>
            {activityLogs.length === 0 ? (
              <Text style={styles.emptyText}>No activity logs yet.</Text>
            ) : (
              <>
                {activityLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logIcon}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logAction}>
                        {log.action.replace(/_/g, " ")}
                      </Text>
                      <Text style={styles.logMeta}>
                        {log.user?.full_name || "System"} | {log.entity_type} |{" "}
                        {formatRelativeTime(log.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
                {hasMoreLogs && (
                  <View style={styles.loadMoreContainer}>
                    <CustomButton
                      title="Load More"
                      onPress={handleLoadMoreLogs}
                      loading={isLoadingMoreLogs}
                      disabled={isLoadingMoreLogs}
                      size="sm"
                      variant="outline"
                    />
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  activeTabLabel: { color: colors.primary, fontWeight: "600" },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 10, color: colors.white, fontWeight: "700" },
  content: { padding: spacing.md },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpiCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiValue: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiDelta: { fontSize: fontSize.xs, marginTop: spacing.xs, fontWeight: "600" },
  chartRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chartCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  chartLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  locationList: { gap: spacing.sm, marginTop: spacing.sm },
  locationRow: { gap: spacing.xs },
  locationLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: { fontSize: fontSize.xs, color: colors.primary },
  section: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    padding: spacing.xl,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userInfo: { marginBottom: spacing.sm },
  userName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  userActions: { flexDirection: "row", gap: spacing.sm },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  logContent: { flex: 1 },
  logAction: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.text,
    textTransform: "capitalize",
  },
  logText: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
  logMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  loadMoreContainer: { paddingVertical: spacing.md, alignItems: "center" },
});

export default AdminPanelScreen;
