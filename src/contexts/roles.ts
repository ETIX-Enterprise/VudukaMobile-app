export enum UserRole {
  DRIVER = 'DRIVER',
  AGENT  = 'AGENT',
  RNP    = 'RNP',
  RURA   = 'RURA',
  DOCTOR = 'DOCTOR',
  ADMIN  = 'ADMIN',
}

export type Permission =
  | 'scan_student_ticket'
  | 'start_journey'
  | 'end_journey'
  | 'view_active_journey'
  | 'book_ticket'
  | 'verify_ticket'
  | 'view_buses_live_gps'
  | 'view_daily_stats'
  | 'transfer_student_hostings'
  | 'report_issue'
  | 'view_all_issues'
  | 'view_audit_logs'
  | 'register_medical_case'
  | 'update_medical_case'
  | 'view_medical_history'
  | 'manage_users'
  | 'system_config';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.DRIVER]: [
    'scan_student_ticket', 'start_journey', 'end_journey',
    'view_active_journey', 'verify_ticket', 'report_issue',
  ],
  [UserRole.AGENT]: [
    'book_ticket', 'verify_ticket', 'view_active_journey',
    'view_buses_live_gps', 'view_daily_stats',
    'transfer_student_hostings', 'report_issue',
  ],
  [UserRole.RNP]: [
    'verify_ticket', 'view_active_journey', 'view_buses_live_gps',
    'view_daily_stats', 'transfer_student_hostings',
    'view_all_issues', 'view_audit_logs',
  ],
  [UserRole.RURA]: [
    'verify_ticket', 'view_active_journey', 'view_buses_live_gps',
    'view_daily_stats', 'transfer_student_hostings',
    'view_all_issues', 'view_audit_logs',
  ],
  [UserRole.DOCTOR]: [
    'register_medical_case', 'update_medical_case', 'view_medical_history',
  ],
  [UserRole.ADMIN]: [
    'scan_student_ticket', 'start_journey', 'end_journey',
    'view_active_journey', 'book_ticket', 'verify_ticket',
    'view_buses_live_gps', 'view_daily_stats', 'transfer_student_hostings',
    'report_issue', 'view_all_issues', 'view_audit_logs',
    'register_medical_case', 'update_medical_case', 'view_medical_history',
    'manage_users', 'system_config',
  ],
};