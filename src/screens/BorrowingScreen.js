// ============================================================
// Borrowing Screen
// View borrow records and create new borrow requests
// ============================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomButton from "../components/CustomButton";
import InputField from "../components/InputField";
import { useBorrow } from "../stores/borrowStore";
import { useAuth } from "../stores/authStore";
import { formatDate, formatRelativeTime } from "../utils/formatters";
import { confirmAction } from "../utils/confirm";

const BorrowingScreen = ({ navigation, route }) => {
  const {
    isLoading,
    isRefreshing,
    fetchBorrowRecords,
    returnItem,
    approveBorrowRequest,
    activateBorrow,
    createBorrowRequest,
  } = useBorrow();
  const { user } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const [filter, setFilter] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allRecords, setAllRecords] = useState([]);

  const selectedItemId = route?.params?.itemId;
  const selectedItemName = route?.params?.itemName;

  const loadRecords = useCallback(
    async (status = filter, refresh = false, pageNum = 1) => {
      const params = { page: pageNum, limit: 20 };
      // For admin users, "active" filter shows both approved and active records
      if (status) {
        if (isAdmin && status === "active") {
          // Admin sees both approved and active as "Active/Out"
          params.status = "active";
        } else {
          params.status = status;
        }
      }
      const result = await fetchBorrowRecords(params, refresh);
      if (result?.success) {
        let newRecords = result.data?.data || [];
        // For admin with "active" filter, also include approved records
        if (isAdmin && status === "active" && pageNum === 1) {
          const approvedResult = await fetchBorrowRecords(
            { page: 1, limit: 100, status: "approved" },
            false,
          );
          if (approvedResult?.success) {
            const approvedRecords = approvedResult.data?.data || [];
            newRecords = [...approvedRecords, ...newRecords];
          }
        }
        if (pageNum === 1) {
          setAllRecords(newRecords);
        } else {
          setAllRecords((prev) => [...prev, ...newRecords]);
        }
        setHasMore(newRecords.length === 20);
        setPage(pageNum);
      }
      return result;
    },
    [fetchBorrowRecords, filter, isAdmin],
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore || isProcessing) return;
    const nextPage = page + 1;
    await loadRecords(filter, false, nextPage);
  }, [isLoading, hasMore, isProcessing, page, filter, loadRecords]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const expectedReturnDate = useMemo(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  const handleReturn = (borrowId) => {
    if (Platform.OS === "web") {
      const condition = window.prompt(
        "Return Item\n\nEnter condition: good, damaged, or lost",
        "good",
      );
      if (
        condition &&
        ["good", "damaged", "lost"].includes(condition.toLowerCase())
      ) {
        processReturn(borrowId, condition.toLowerCase());
      }
      return;
    }
    Alert.alert("Return Item", "What is the condition of the item?", [
      { text: "Good", onPress: () => processReturn(borrowId, "good") },
      { text: "Damaged", onPress: () => processReturn(borrowId, "damaged") },
      { text: "Lost", onPress: () => processReturn(borrowId, "lost") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const processReturn = async (borrowId, condition) => {
    setIsProcessing(true);
    try {
      const result = await returnItem(borrowId, {
        return_condition: condition,
      });
      if (result.success) {
        if (Platform.OS === "web") {
          window.alert("Item returned successfully.");
        } else {
          Alert.alert("Success", "Item returned successfully.");
        }
        loadRecords();
      } else {
        if (Platform.OS === "web") {
          window.alert(result.error || "Failed to return item.");
        } else {
          Alert.alert("Error", result.error || "Failed to return item.");
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = (borrowId, approved) => {
    confirmAction({
      title: approved ? "Approve Request" : "Reject Request",
      message: `Are you sure you want to ${approved ? "approve" : "reject"} this request?`,
      confirmText: approved ? "Approve" : "Reject",
    }).then(async (confirmed) => {
      if (!confirmed) return;
      setIsProcessing(true);
      try {
        const result = await approveBorrowRequest(borrowId, { approved });
        if (result.success) {
          loadRecords();
        } else {
          if (Platform.OS === "web") {
            window.alert(result.error || "Error processing request.");
          } else {
            Alert.alert("Error", result.error);
          }
        }
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleActivate = (borrowId) => {
    confirmAction({
      title: "Pick Up Item",
      message: "Confirm you are picking up this item now?",
      confirmText: "Pick Up",
    }).then(async (confirmed) => {
      if (!confirmed) return;
      setIsProcessing(true);
      try {
        const result = await activateBorrow(borrowId);
        if (result.success) {
          if (Platform.OS === "web") {
            window.alert("Item checked out successfully.");
          } else {
            Alert.alert("Success", "Item checked out successfully.");
          }
          loadRecords();
        } else {
          if (Platform.OS === "web") {
            window.alert(result.error || "Failed to activate borrow.");
          } else {
            Alert.alert("Error", result.error || "Failed to activate borrow.");
          }
        }
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleCreateRequest = async () => {
    if (!selectedItemId) return;
    if (purpose.trim().length < 5) {
      Alert.alert(
        "Purpose Required",
        "Please enter at least 5 characters for the borrowing purpose.",
      );
      return;
    }

    setRequesting(true);
    const result = await createBorrowRequest({
      item_id: selectedItemId,
      purpose: purpose.trim(),
      expected_return_date: expectedReturnDate,
    });
    setRequesting(false);

    if (result.success) {
      Alert.alert(
        "Request Sent",
        "Your borrow request was submitted successfully.",
      );
      setPurpose("");
      navigation?.setParams?.({ itemId: undefined, itemName: undefined });
      loadRecords();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const renderBorrowItem = ({ item }) => (
    <View style={styles.borrowCard}>
      <View style={styles.borrowHeader}>
        <View style={styles.borrowInfo}>
          <Text style={styles.itemName}>
            {item.item?.name || "Unknown Item"}
          </Text>
          <StatusBadge value={item.status} type="status" size="sm" />
        </View>
        <Text style={styles.borrowTime}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      <Text style={styles.purpose} numberOfLines={2}>
        {item.purpose}
      </Text>

      <View style={styles.borrowMeta}>
        <View style={styles.metaItem}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>
            Due: {formatDate(item.expected_return_date)}
          </Text>
        </View>
        {item.borrower && (
          <View style={styles.metaItem}>
            <Ionicons
              name="person-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>{item.borrower.full_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.borrowActions}>
        {["active", "overdue", "approved"].includes(item.status) &&
          (item.borrower?.id === user?.id || isAdmin) && (
            <CustomButton
              title="Return Item"
              onPress={() => handleReturn(item.id)}
              size="sm"
              fullWidth={false}
              disabled={isProcessing}
              loading={isProcessing}
            />
          )}
        {item.status === "approved" &&
          (item.borrower?.id === user?.id || isAdmin) && (
            <CustomButton
              title={isProcessing ? "Processing..." : "Pick Up Item"}
              onPress={() => handleActivate(item.id)}
              size="sm"
              fullWidth={false}
              disabled={isProcessing}
              loading={isProcessing}
            />
          )}
        {isAdmin && item.status === "pending" && (
          <>
            <CustomButton
              title="Approve"
              onPress={() => handleApprove(item.id, true)}
              size="sm"
              fullWidth={false}
              disabled={isProcessing}
              loading={isProcessing}
            />
            <CustomButton
              title="Reject"
              onPress={() => handleApprove(item.id, false)}
              variant="danger"
              size="sm"
              fullWidth={false}
              disabled={isProcessing}
            />
          </>
        )}
        {isAdmin && item.borrower?.id !== user?.id && (
          <View style={styles.borrowerInfo}>
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.borrowerText}>
              Borrower:{" "}
              {item.borrower?.full_name || item.borrower?.email || "Unknown"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const filters = useMemo(() => {
    const baseFilters = [
      { value: "", label: "All" },
      { value: "pending", label: "Pending" },
      { value: "active", label: isAdmin ? "Active/Out" : "Active" },
      { value: "overdue", label: "Overdue" },
      { value: "returned", label: "Returned" },
    ];
    return baseFilters;
  }, [isAdmin]);

  return (
    <View style={styles.container}>
      <Header
        title="Borrowing"
        subtitle="Manage borrowed items"
        onBack={() => navigation?.goBack?.()}
      />

      {selectedItemId && (
        <View style={styles.requestPanel}>
          <Text style={styles.requestTitle}>Request to borrow</Text>
          <Text style={styles.requestItem}>
            {selectedItemName || "Selected item"}
          </Text>
          <Text style={styles.requestHint}>
            Default return target: 3 days from now
          </Text>
          <InputField
            label="Purpose"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Classroom demonstration"
            icon="document-text-outline"
          />
          <View style={styles.requestActions}>
            <CustomButton
              title="Submit Request"
              onPress={handleCreateRequest}
              loading={requesting}
              disabled={!purpose.trim()}
              size="md"
            />
            <CustomButton
              title="Dismiss"
              variant="outline"
              onPress={() =>
                navigation?.setParams?.({
                  itemId: undefined,
                  itemName: undefined,
                })
              }
              size="md"
            />
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading && !isRefreshing ? (
        <LoadingSpinner message="Loading records..." />
      ) : (
        <FlatList
          data={allRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderBorrowItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRecords(filter, true)}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="arrow-redo-outline"
              title="No borrow records"
              message="Scan a QR code to borrow an item."
              actionTitle="Scan QR"
              onAction={() => navigation?.navigate?.("QRScanner")}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && allRecords.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <CustomButton
                  title="Load More"
                  onPress={handleLoadMore}
                  loading={isLoading}
                  disabled={isLoading || isProcessing}
                  size="sm"
                  variant="outline"
                />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  requestPanel: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  requestItem: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  requestHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  requestActions: { gap: spacing.sm },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: { color: colors.white, fontWeight: "600" },
  listContent: { padding: spacing.md },
  borrowCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  borrowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  borrowInfo: { flex: 1, gap: spacing.xs },
  itemName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  borrowTime: { fontSize: fontSize.xs, color: colors.textMuted },
  purpose: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  borrowMeta: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.textSecondary },
  borrowActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  loadMoreContainer: { paddingVertical: spacing.md, alignItems: "center" },
  borrowerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    width: "100%",
  },
  borrowerText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "500",
  },
});

export default BorrowingScreen;
