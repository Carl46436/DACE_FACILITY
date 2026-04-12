// ============================================================
// Borrowing Screen
// View borrow records and create new borrow requests
// ============================================================

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useBorrow } from '../stores/borrowStore';
import { useAuth } from '../stores/authStore';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { confirmAction } from '../utils/confirm';

const BorrowingScreen = ({ navigation, route }) => {
  const {
    borrowRecords,
    isLoading,
    isRefreshing,
    fetchBorrowRecords,
    returnItem,
    approveBorrowRequest,
    createBorrowRequest,
  } = useBorrow();
  const { user } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const [filter, setFilter] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requesting, setRequesting] = useState(false);

  const selectedItemId = route?.params?.itemId;
  const selectedItemName = route?.params?.itemName;

  const loadRecords = useCallback((status = filter, refresh = false) => {
    const params = { page: 1, limit: 20 };
    if (status) params.status = status;
    fetchBorrowRecords(params, refresh);
  }, [fetchBorrowRecords, filter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const expectedReturnDate = useMemo(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    []
  );

  const handleReturn = (borrowId) => {
    confirmAction({
      title: 'Return Item',
      message: 'Confirm item return?',
      confirmText: 'Return',
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const result = await returnItem(borrowId, { return_condition: 'good' });
      if (result.success) {
        Alert.alert('Success', 'Item returned.');
        loadRecords();
      } else {
        Alert.alert('Error', result.error);
      }
    });
  };

  const handleApprove = (borrowId, approved) => {
    confirmAction({
      title: approved ? 'Approve Request' : 'Reject Request',
      message: `Are you sure you want to ${approved ? 'approve' : 'reject'} this request?`,
      confirmText: approved ? 'Approve' : 'Reject',
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const result = await approveBorrowRequest(borrowId, { approved });
      if (result.success) {
        loadRecords();
      } else {
        Alert.alert('Error', result.error);
      }
    });
  };

  const handleCreateRequest = async () => {
    if (!selectedItemId) return;
    if (purpose.trim().length < 5) {
      Alert.alert('Purpose Required', 'Please enter at least 5 characters for the borrowing purpose.');
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
      Alert.alert('Request Sent', 'Your borrow request was submitted successfully.');
      setPurpose('');
      navigation?.setParams?.({ itemId: undefined, itemName: undefined });
      loadRecords();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const renderBorrowItem = ({ item }) => (
    <View style={styles.borrowCard}>
      <View style={styles.borrowHeader}>
        <View style={styles.borrowInfo}>
          <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
          <StatusBadge value={item.status} type="status" size="sm" />
        </View>
        <Text style={styles.borrowTime}>{formatRelativeTime(item.created_at)}</Text>
      </View>

      <Text style={styles.purpose} numberOfLines={2}>{item.purpose}</Text>

      <View style={styles.borrowMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>Due: {formatDate(item.expected_return_date)}</Text>
        </View>
        {item.borrower && (
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.borrower.full_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.borrowActions}>
        {['active', 'overdue', 'approved'].includes(item.status) &&
          (item.borrower?.id === user?.id || isAdmin) && (
            <CustomButton title="Return Item" onPress={() => handleReturn(item.id)} size="sm" fullWidth={false} />
          )}
        {isAdmin && item.status === 'pending' && (
          <>
            <CustomButton title="Approve" onPress={() => handleApprove(item.id, true)} size="sm" fullWidth={false} />
            <CustomButton title="Reject" onPress={() => handleApprove(item.id, false)} variant="danger" size="sm" fullWidth={false} />
          </>
        )}
      </View>
    </View>
  );

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'returned', label: 'Returned' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Borrowing" subtitle="Manage borrowed items" onBack={() => navigation?.goBack?.()} />

      {selectedItemId && (
        <View style={styles.requestPanel}>
          <Text style={styles.requestTitle}>Request to borrow</Text>
          <Text style={styles.requestItem}>{selectedItemName || 'Selected item'}</Text>
          <Text style={styles.requestHint}>Default return target: 3 days from now</Text>
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
              onPress={() => navigation?.setParams?.({ itemId: undefined, itemName: undefined })}
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
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
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
          data={borrowRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderBorrowItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadRecords(filter, true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="arrow-redo-outline"
              title="No borrow records"
              message="Scan a QR code to borrow an item."
              actionTitle="Scan QR"
              onAction={() => navigation?.navigate?.('QRScanner')}
            />
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
  requestTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  requestItem: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: 4 },
  requestHint: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.sm },
  requestActions: { gap: spacing.sm },
  filterContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { padding: spacing.md },
  borrowCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  borrowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  borrowInfo: { flex: 1, gap: spacing.xs },
  itemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  borrowTime: { fontSize: fontSize.xs, color: colors.textMuted },
  purpose: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 18 },
  borrowMeta: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.textSecondary },
  borrowActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});

export default BorrowingScreen;
