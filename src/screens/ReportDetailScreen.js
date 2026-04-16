// ============================================================
// Report Detail Screen
// Shows full report details, images, comments, status actions
// ============================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import CustomButton from "../components/CustomButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { useReports } from "../stores/reportStore";
import { useAuth } from "../stores/authStore";
import {
  formatDateTime,
  formatRelativeTime,
  getInitials,
} from "../utils/formatters";
import { confirmAction } from "../utils/confirm";
import { api } from "../services/api";

const ReportDetailScreen = ({ navigation, route }) => {
  const reportId = route?.params?.id;
  const {
    currentReport,
    fetchReportById,
    updateReportStatus,
    addComment,
    isLoading,
  } = useReports();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const isStaff = ["maintenance_staff", "admin", "super_admin"].includes(
    user?.role,
  );
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  useEffect(() => {
    if (reportId) fetchReportById(reportId);
  }, [fetchReportById, reportId]);

  useEffect(() => {
    if (isAdmin) {
      api.admin
        .getStaff()
        .then((res) => setStaffOptions(res.data || []))
        .catch(() => setStaffOptions([]));
    }
  }, [isAdmin]);

  const handleStatusUpdate = async (newStatus) => {
    const confirmed = await confirmAction({
      title: "Update Status",
      message: `Change status to "${newStatus.replace(/_/g, " ")}"?`,
      confirmText: "Confirm",
    });
    if (!confirmed) return;

    setIsUpdating(true);

    const statusPayload = { status: newStatus };
    if (isAdmin && newStatus === "assigned") {
      if (!assigneeId) {
        Alert.alert(
          "Select Assignee",
          "Please choose a maintenance staff member.",
        );
        setIsUpdating(false);
        return;
      }
      statusPayload.assigned_to = assigneeId;
    } else if (
      user?.role === "maintenance_staff" &&
      ["assigned", "in_progress"].includes(newStatus)
    ) {
      statusPayload.assigned_to = user.id;
    }

    try {
      const result = await updateReportStatus(reportId, statusPayload);
      if (result.success) {
        fetchReportById(reportId);
        if (newStatus === "assigned") setAssigneeId("");
        Alert.alert("Success", "Status updated.");
      } else {
        Alert.alert("Error", result.error);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    const result = await addComment(reportId, { comment, is_internal: false });
    setSubmittingComment(false);
    if (result.success) {
      setComment("");
      fetchReportById(reportId); // Refresh to show new comment
    } else {
      Alert.alert("Error", result.error);
    }
  };

  if (isLoading && !currentReport) {
    return <LoadingSpinner fullScreen message="Loading report..." />;
  }

  if (!currentReport) {
    return (
      <View style={styles.container}>
        <Header title="Report" onBack={() => navigation?.goBack?.()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Report not found.</Text>
        </View>
      </View>
    );
  }

  const report = currentReport;
  const statusSteps = [
    "submitted",
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
    "closed",
  ];
  const currentStepIndex = statusSteps.indexOf(report.status);

  return (
    <View style={styles.container}>
      <Header title="Report Details" onBack={() => navigation?.goBack?.()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Status */}
        <View style={styles.card}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge value={report.status} type="status" />
            <StatusBadge value={report.priority} type="priority" />
            <StatusBadge value={report.category} type="category" />
          </View>
          <View style={styles.stepper}>
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              return (
                <View key={step} style={styles.step}>
                  <View
                    style={[styles.stepDot, isActive && styles.stepDotActive]}
                  />
                  <Text
                    style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                    ]}
                  >
                    {step.replace(/_/g, " ")}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Images */}
        {(report.images || []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Photos ({(report.images || []).length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
            >
              {(report.images || []).map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.image_url }}
                  style={styles.reportImage}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {report.location}
              {report.room_number ? ` - ${report.room_number}` : ""}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Submitted {formatDateTime(report.created_at)}
            </Text>
          </View>
          {report.reporter && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                By {report.reporter.full_name} ({report.reporter.role})
              </Text>
            </View>
          )}
          {report.assignee && (
            <View style={styles.detailRow}>
              <Ionicons
                name="construct"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.detailText}>
                Assigned to {report.assignee.full_name}
              </Text>
            </View>
          )}
          {report.resolved_at && (
            <View style={styles.detailRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.detailText}>
                Resolved {formatDateTime(report.resolved_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Status Actions (Staff Only) */}
        {isStaff && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>
            {isAdmin && report.status === "under_review" && (
              <View style={styles.assigneeBlock}>
                <Text style={styles.assigneeLabel}>Assign to</Text>
                <View style={styles.assigneeList}>
                  {staffOptions.map((staff) => (
                    <TouchableOpacity
                      key={staff.id}
                      style={[
                        styles.assigneeChip,
                        assigneeId === staff.id && styles.assigneeChipActive,
                      ]}
                      onPress={() => setAssigneeId(staff.id)}
                    >
                      <Text
                        style={[
                          styles.assigneeText,
                          assigneeId === staff.id && styles.assigneeTextActive,
                        ]}
                      >
                        {staff.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.actionsRow}>
              {report.status === "submitted" && (
                <CustomButton
                  title={isUpdating ? "Updating..." : "Review"}
                  onPress={() => handleStatusUpdate("under_review")}
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
              {report.status === "under_review" && (
                <CustomButton
                  title={isUpdating ? "Assigning..." : "Assign"}
                  onPress={() => handleStatusUpdate("assigned")}
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
              {report.status === "assigned" && (
                <CustomButton
                  title={isUpdating ? "Starting..." : "Start Work"}
                  onPress={() => handleStatusUpdate("in_progress")}
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
              {report.status === "in_progress" && (
                <CustomButton
                  title={isUpdating ? "Resolving..." : "Resolve"}
                  onPress={() => handleStatusUpdate("resolved")}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
              {report.status === "resolved" && (
                <CustomButton
                  title={isUpdating ? "Closing..." : "Close"}
                  onPress={() => handleStatusUpdate("closed")}
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
              {["submitted", "under_review", "assigned"].includes(
                report.status,
              ) && (
                <CustomButton
                  title={isUpdating ? "Rejecting..." : "Reject"}
                  onPress={() => handleStatusUpdate("rejected")}
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  disabled={isUpdating}
                />
              )}
            </View>
          </View>
        )}

        {/* Comments */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Comments ({report.comments?.length || 0})
          </Text>
          {report.comments && report.comments.length > 0 ? (
            report.comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentInitials}>
                    {getInitials(c.user?.full_name)}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {c.user?.full_name}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatRelativeTime(c.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{c.comment}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>No comments yet.</Text>
          )}

          {/* Add Comment */}
          <View style={styles.addComment}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Write a comment..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !comment.trim() && styles.sendDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!comment.trim() || submittingComment}
            >
              <Ionicons
                name="send"
                size={20}
                color={comment.trim() ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: fontSize.md, color: colors.textMuted },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  stepper: { marginTop: spacing.md, gap: spacing.xs },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  stepLabelActive: { color: colors.text, fontWeight: "600" },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  detailText: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1 },
  galleryRow: { paddingVertical: spacing.xs },
  reportImage: {
    width: 260,
    height: 180,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  actionsRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  assigneeBlock: { marginBottom: spacing.md },
  assigneeLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  assigneeList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  assigneeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  assigneeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assigneeText: { fontSize: fontSize.xs, color: colors.textSecondary },
  assigneeTextActive: { color: colors.white, fontWeight: "600" },
  commentItem: { flexDirection: "row", marginBottom: spacing.md },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryFaded,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  commentInitials: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primary,
  },
  commentContent: { flex: 1 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  commentTime: { fontSize: fontSize.xs, color: colors.textMuted },
  commentText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  noComments: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    padding: spacing.md,
  },
  addComment: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
  },
  commentInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.sm,
    maxHeight: 80,
  },
  sendButton: { padding: spacing.md },
  sendDisabled: { opacity: 0.4 },
});

export default ReportDetailScreen;
