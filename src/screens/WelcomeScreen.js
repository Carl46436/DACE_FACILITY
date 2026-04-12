// ============================================================
// Welcome Screen
// Landing page with login and registration options
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import RoleSelector from '../components/RoleSelector';
import { useAuth } from '../stores/authStore';
import { validators } from '../utils/validators';

const WelcomeScreen = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form extras
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formErrors, setFormErrors] = useState({});

  const resetInlineFeedback = () => {
    if (error) clearError();
    if (Object.keys(formErrors).length > 0) setFormErrors({});
  };

  const handleEmailChange = (value) => {
    resetInlineFeedback();
    setEmail(value);
  };

  const handlePasswordChange = (value) => {
    resetInlineFeedback();
    setPassword(value);
  };

  const handleFullNameChange = (value) => {
    resetInlineFeedback();
    setFullName(value);
  };

  const handleDepartmentChange = (value) => {
    resetInlineFeedback();
    setDepartment(value);
  };

  const handlePhoneChange = (value) => {
    resetInlineFeedback();
    setPhone(value);
  };

  const handleConfirmPasswordChange = (value) => {
    resetInlineFeedback();
    setConfirmPassword(value);
  };

  const validateLoginForm = () => {
    const errors = {};
    const emailErr = validators.email(email);
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = 'Password is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors = {};
    const emailErr = validators.email(email);
    if (emailErr) errors.email = emailErr;
    const passwordErr = validators.password(password);
    if (passwordErr) errors.password = passwordErr;
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    const nameErr = validators.fullName(fullName);
    if (nameErr) errors.fullName = nameErr;
    if (!role) errors.role = 'Please select a role.';
    const phoneErr = validators.phone(phone);
    if (phoneErr) errors.phone = phoneErr;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validateLoginForm()) return;
    await login(email.trim().toLowerCase(), password);
  };

  const handleRegister = async () => {
    clearError();
    if (!validateRegisterForm()) return;
    const result = await register({
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      role,
      department: department.trim(),
      phone: phone.trim(),
    });
    if (result.success) {
      Alert.alert('Registration Successful', result.message || 'Your account is ready for testing.', [
        {
          text: 'OK',
          onPress: () => {
            setMode('login');
            setPassword('');
            setConfirmPassword('');
          },
        },
      ]);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
    setFormErrors({});
  };

  const canSubmit = useMemo(() => {
    if (mode === 'login') {
      return Boolean(email.trim() && password);
    }

    return Boolean(email.trim() && password && confirmPassword && fullName.trim() && role);
  }, [confirmPassword, email, fullName, mode, password, role]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={48} color={colors.white} />
          </View>
          <Text style={styles.appName}>DACE Facility</Text>
          <Text style={styles.tagline}>
            Maintenance & Reporting System
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? 'Sign in to continue'
              : 'Register to submit reports and borrow items'}
          </Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {mode === 'register' && (
            <>
              <InputField
                label="Full Name"
                value={fullName}
                onChangeText={handleFullNameChange}
                placeholder="John Doe"
                icon="person-outline"
                error={formErrors.fullName}
                autoCapitalize="words"
              />
              <RoleSelector
                selectedRole={role}
                onSelectRole={setRole}
                error={formErrors.role}
              />
            </>
          )}

          <InputField
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="your@email.com"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={formErrors.email}
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Enter your password"
            icon="lock-closed-outline"
            secureTextEntry
            error={formErrors.password}
          />

          {mode === 'register' && (
            <>
              <InputField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                icon="lock-closed-outline"
                secureTextEntry
                error={formErrors.confirmPassword}
              />
              <InputField
                label="Department (Optional)"
                value={department}
                onChangeText={handleDepartmentChange}
                placeholder="e.g. Science Department"
                icon="business-outline"
              />
              <InputField
                label="Phone (Optional)"
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+1234567890"
                icon="call-outline"
                keyboardType="phone-pad"
                error={formErrors.phone}
              />
            </>
          )}

          <CustomButton
            title={mode === 'login' ? 'Sign In' : 'Create Account'}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            loading={isLoading}
            icon={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
            size="lg"
            disabled={!canSubmit}
          />

          <TouchableOpacity style={styles.switchMode} onPress={switchMode}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.heading,
    fontWeight: '800',
    color: colors.white,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    minHeight: 400,
  },
  formTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEECEE',
    borderWidth: 1,
    borderColor: '#F7C7CD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  switchMode: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  switchText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
