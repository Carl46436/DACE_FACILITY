// ============================================================
// Reports List Screen
// Paginated, filterable list of maintenance reports
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import Header from '../components/Header';
import ReportCard from '../components/ReportCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useReports } from '../stores/reportStore';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const ReportsListScreen = ({ navigation }) => {
  const { reports, pagination, isLoading, isRefreshing, fetchReports } = useReports();
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const loadReports = useCallback((filterStatus = activeFilter, pageNum = 1, refresh = false, searchQuery = search) => {
    const params = { page: pageNum, limit: 15, sort_by: 'created_at', sort_order: 'desc' };
    if (filterStatus) params.status = filterStatus;
    if (searchQuery) params.search = searchQuery;
    fetchReports(params, refresh);
  }, [activeFilter, fetchReports, search]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchDraft.trim();
      setSearch(trimmed);
      setPage(1);
      loadReports(activeFilter, 1, true, trimmed);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDraft, activeFilter, loadReports]);

  const handleFilterChange = (status) => {
    setActiveFilter(status);
    setPage(1);
    loadReports(status, 1);
  };

  const handleRefresh = () => {
    setPage(1);
    loadReports(activeFilter, 1, true, search);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNext && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadReports(activeFilter, nextPage, false, search);
    }
  };

  const renderItem = ({ item }) => (
    <ReportCard
      report={item}
      onPress={() => navigation?.navigate?.('ReportDetail', { id: item.id })}
    />
  );

  const renderFooter = () => {
    if (!isLoading || reports.length === 0) return null;
    return <LoadingSpinner message="Loading more reports..." size="small" />;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Reports"
        subtitle={`${pagination?.total || 0} total reports`}
        onBack={() => navigation?.goBack?.()}
        rightAction={() => navigation?.navigate?.('ReportSubmission')}
        rightIcon="add-circle-outline"
      />

      {/* Filters */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchDraft}
          onChangeText={setSearchDraft}
          placeholder="Search reports by title, description, or location"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
      </View>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.value && styles.filterChipActive]}
              onPress={() => handleFilterChange(item.value)}
            >
              <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Reports List */}
      {isLoading && !isRefreshing && reports.length === 0 ? (
        <LoadingSpinner message="Loading reports..." />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No reports found"
              message="Submit a new report to get started."
              actionTitle="New Report"
              onAction={() => navigation?.navigate?.('ReportSubmission')}
            />
          }
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { paddingVertical: spacing.md },
});

export default ReportsListScreen;
