// ============================================================
// Role Dashboard Screen
// Routes users to the correct dashboard based on role
// ============================================================

import React from 'react';
import { useAuth } from '../stores/authStore';
import DashboardScreen from './DashboardScreen';
import DashboardStudentScreen from './DashboardStudentScreen';
import DashboardTeacherScreen from './DashboardTeacherScreen';
import DashboardStaffScreen from './DashboardStaffScreen';

const RoleDashboardScreen = (props) => {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'admin' || role === 'super_admin') {
    return <DashboardScreen {...props} />;
  }

  if (role === 'maintenance_staff') {
    return <DashboardStaffScreen {...props} />;
  }

  if (role === 'teacher') {
    return <DashboardTeacherScreen {...props} />;
  }

  return <DashboardStudentScreen {...props} />;
};

export default RoleDashboardScreen;
