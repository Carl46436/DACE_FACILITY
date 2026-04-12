import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Platform } from 'react-native';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import NotificationItem from '../components/NotificationItem';
import CustomButton from '../components/CustomButton';
import { colors, spacing } from '../theme/colors';
import { api } from '../services/api';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isRefresh = false) => {
    try {
      const response = await api.notifications.getAll({ page: 1, limit: 50 });
      setNotifications(response.data?.data || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.notifications.markAsRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
      }
    } catch {
      // Non-blocking: user can still continue
    }

    if (notification.reference_type === 'report' && notification.reference_id) {
      navigation?.navigate?.('ReportDetail', { id: notification.reference_id });
      return;
    }

    if (notification.reference_type === 'borrow') {
      navigation?.navigate?.('Borrowing');
      return;
    }

    Alert.alert(notification.title, notification.message);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark notifications as read.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading notifications..." />;
  }

  const hasUnread = notifications.some((item) => !item.is_read);
  const showWebActions = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        subtitle="Updates and system messages"
        onBack={() => navigation?.goBack?.()}
        rightAction={hasUnread ? {
          icon: 'checkmark-done-outline',
          onPress: handleMarkAllRead,
        } : undefined}
      />

      {showWebActions && (
        <View style={styles.webActions}>
          <CustomButton
            title="Refresh"
            variant="outline"
            size="sm"
            fullWidth={false}
            onPress={() => {
              setRefreshing(true);
              loadNotifications(true);
            }}
          />
          {hasUnread && (
            <CustomButton
              title="Mark All Read"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={handleMarkAllRead}
            />
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={handleOpenNotification} />
        )}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContent : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications(true);
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications"
            message="You are all caught up."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  webActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});

export default NotificationsScreen;
