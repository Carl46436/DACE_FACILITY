// ============================================================
// Report Submission Screen
// Form to submit a new maintenance report with images
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { colors, spacing, fontSize } from '../theme/colors';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import ImagePickerButton from '../components/ImagePicker';
import Header from '../components/Header';
import { useReports } from '../stores/reportStore';

const categories = [
  { value: 'electrical', label: 'Electrical', icon: 'flash' },
  { value: 'plumbing', label: 'Plumbing', icon: 'water' },
  { value: 'hvac', label: 'HVAC', icon: 'thermometer' },
  { value: 'structural', label: 'Structural', icon: 'construct' },
  { value: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
  { value: 'furniture', label: 'Furniture', icon: 'bed' },
  { value: 'safety', label: 'Safety', icon: 'shield-checkmark' },
  { value: 'technology', label: 'Technology', icon: 'hardware-chip' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle' },
];

const priorities = [
  { value: 'low', label: 'Low', color: colors.priority.low },
  { value: 'medium', label: 'Medium', color: colors.priority.medium },
  { value: 'high', label: 'High', color: colors.priority.high },
  { value: 'critical', label: 'Critical', color: colors.priority.critical },
];

const ReportSubmissionScreen = ({ navigation }) => {
  const { createReport, isLoading } = useReports();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!title || title.length < 5) errs.title = 'Title must be at least 5 characters.';
    if (!description || description.length < 10) errs.description = 'Description must be at least 10 characters.';
    if (!category) errs.category = 'Please select a category.';
    if (!location || location.length < 3) errs.location = 'Location must be at least 3 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const appendImage = async (formData, img, index) => {
    const name = img.fileName || `photo_${index}.jpg`;
    const type = img.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(img.uri);
      const blob = await response.blob();
      const file = new File([blob], name, { type: blob.type || type });
      formData.append('images', file);
      return;
    }

    formData.append('images', {
      uri: img.uri,
      name,
      type,
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('location', location);
    if (roomNumber) formData.append('room_number', roomNumber);

    try {
      for (let i = 0; i < images.length; i += 1) {
        await appendImage(formData, images[i], i);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to prepare images for upload.');
      return;
    }

    const result = await createReport(formData);
    if (result.success) {
      Alert.alert('Success', 'Report submitted successfully!', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to submit report.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="New Report" subtitle="Submit a maintenance report" onBack={() => navigation?.goBack?.()} />
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <InputField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Brief summary of the issue"
          icon="document-text-outline"
          error={errors.title}
          maxLength={255}
        />

        <InputField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail..."
          multiline
          numberOfLines={4}
          error={errors.description}
          maxLength={5000}
        />

        {/* Category Selector */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipGrid}>
          {categories.map((cat) => (
            <CustomButton
              key={cat.value}
              title={cat.label}
              icon={cat.icon}
              variant={category === cat.value ? 'primary' : 'outline'}
              size="sm"
              fullWidth={false}
              onPress={() => setCategory(cat.value)}
              style={styles.chip}
            />
          ))}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

        {/* Priority Selector */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {priorities.map((p) => (
            <CustomButton
              key={p.value}
              title={p.label}
              variant={priority === p.value ? 'primary' : 'outline'}
              size="sm"
              fullWidth={false}
              onPress={() => setPriority(p.value)}
              style={[styles.priorityChip, priority === p.value && { backgroundColor: p.color }]}
            />
          ))}
        </View>

        <InputField
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Building A, 2nd Floor"
          icon="location-outline"
          error={errors.location}
        />

        <InputField
          label="Room Number (Optional)"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="e.g. Room 201"
          icon="grid-outline"
        />

        <ImagePickerButton images={images} onImagesChange={setImages} maxImages={5} />

        <CustomButton
          title="Submit Report"
          onPress={handleSubmit}
          loading={isLoading}
          icon="send"
          size="lg"
          style={{ marginTop: spacing.md }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { marginBottom: spacing.xs },
  priorityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  priorityChip: { flex: 1 },
  errorText: { fontSize: fontSize.xs, color: colors.danger, marginBottom: spacing.sm },
});

export default ReportSubmissionScreen;
