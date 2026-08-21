import {
  AuditLogEntry,
  ERPModule,
  ERPUser,
  PermissionAction,
  Role,
  RolePermissions,
} from '../types/erp';

export const ERP_MODULES: { id: ERPModule; name: string; icon: string; description: string }[] = [
  { id: 'accounting', name: 'المحاسبة', icon: 'book', description: 'دليل الحسابات، قيود اليومية، ومراكز التكلفة' },
  { id: 'sales', name: 'المبيعات', icon: 'receipt', description: 'فواتير البيع، نقاط البيع POS، وعروض الأسعار' },
  { id: 'purchases', name: 'المشتريات', icon: 'bag-handle', description: 'فواتير الشراء، أوامر الشراء، والموردين' },
  { id: 'inventory', name: 'المخزون', icon: 'cube', description: 'دليل الأصناف، المستودعات، والتحويلات المخزنية' },
  { id: 'manufacturing', name: 'التصنيع', icon: 'construct', description: 'أوامر الإنتاج، خطوط التشغيل، وتكاليف التصنيع' },
  { id: 'treasury', name: 'الصندوق والبنوك', icon: 'wallet', description: 'سندات القبض والصرف، الخزائن، والحسابات البنكية' },
  { id: 'assets', name: 'الأصول', icon: 'business', description: 'سجل الأصول الثابتة، الإهلاك، والتسويات' },
  { id: 'payroll', name: 'الرواتب', icon: 'people', description: 'شؤون الموظفين، مسيرات الرواتب، والأجور' },
  { id: 'reports', name: 'التقارير', icon: 'bar-chart', description: 'القوائم المالية، الميزانية، والإقرار الضريبي' },
];

export const PERMISSION_ACTIONS: { id: PermissionAction; name: string; icon: string; color: string }[] = [
  { id: 'view', name: 'عرض', icon: 'eye', color: '#2563EB' },
  { id: 'add', name: 'إضافة', icon: 'add-circle', color: '#059669' },
  { id: 'edit', name: 'تعديل', icon: 'create', color: '#D97706' },
  { id: 'delete', name: 'حذف', icon: 'trash', color: '#DC2626' },
  { id: 'approve', name: 'اعتماد', icon: 'shield-checkmark', color: '#7C3AED' },
  { id: 'post', name: 'ترحيل', icon: 'send', color: '#0891B2' },
  { id: 'print', name: 'طباعة', icon: 'print', color: '#475569' },
  { id: 'export', name: 'تصدير', icon: 'download', color: '#0D9488' },
];

export const createFullPermissions = (): RolePermissions => {
  const perms: any = {};
  ERP_MODULES.forEach((mod) => {
    perms[mod.id] = {
      view: true,
      add: true,
      edit: true,
      delete: true,
      approve: true,
      post: true,
      print: true,
      export: true,
    };
  });
  return perms as RolePermissions;
};

export const createEmptyPermissions = (): RolePermissions => {
  const perms: any = {};
  ERP_MODULES.forEach((mod) => {
    perms[mod.id] = {
      view: false,
      add: false,
      edit: false,
      delete: false,
      approve: false,
      post: false,
      print: false,
      export: false,
    };
  });
  return perms as RolePermissions;
};

export const initialRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'مدير النظام العام (System Administrator)',
    description: 'يمتلك كافة الصلاحيات بدون قيود على جميع الأقسام والفروع والشركات',
    isSystemAdmin: true,
    isActive: true,
    permissions: createFullPermissions(),
    userCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-accountant',
    name: 'محاسب عام مالي (Senior Accountant)',
    description: 'صلاحيات كاملة للمحاسبة، الصندوق، الأصول، والتقارير المالية والترحيل',
    isSystemAdmin: false,
    isActive: true,
    permissions: {
      ...createEmptyPermissions(),
      accounting: { view: true, add: true, edit: true, delete: false, approve: true, post: true, print: true, export: true },
      treasury: { view: true, add: true, edit: true, delete: false, approve: true, post: true, print: true, export: true },
      assets: { view: true, add: true, edit: true, delete: false, approve: true, post: true, print: true, export: true },
      reports: { view: true, add: false, edit: false, delete: false, approve: true, post: true, print: true, export: true },
      sales: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      purchases: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      inventory: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      payroll: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      manufacturing: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
    },
    userCount: 1,
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'role-cashier',
    name: 'مشرف كاشير ونقاط البيع (POS Cashier)',
    description: 'صلاحيات إصدار فواتير البيع، سندات القبض، واستعراض الأصناف بالفرع',
    isSystemAdmin: false,
    isActive: true,
    permissions: {
      ...createEmptyPermissions(),
      sales: { view: true, add: true, edit: true, delete: false, approve: true, post: false, print: true, export: false },
      treasury: { view: true, add: true, edit: false, delete: false, approve: false, post: false, print: true, export: false },
      inventory: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      accounting: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      purchases: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      manufacturing: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      assets: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      payroll: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      reports: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
    },
    userCount: 1,
    createdAt: '2025-01-12T12:00:00.000Z',
    updatedAt: '2025-01-12T12:00:00.000Z',
  },
  {
    id: 'role-warehouse',
    name: 'أمين مستودع ومخازن (Warehouse Manager)',
    description: 'صلاحيات إدارة الأصناف، جرد المخزون، والتحويلات واستلام المشتريات',
    isSystemAdmin: false,
    isActive: true,
    permissions: {
      ...createEmptyPermissions(),
      inventory: { view: true, add: true, edit: true, delete: false, approve: true, post: true, print: true, export: true },
      purchases: { view: true, add: true, edit: false, delete: false, approve: false, post: false, print: true, export: false },
      manufacturing: { view: true, add: true, edit: true, delete: false, approve: false, post: false, print: true, export: false },
      sales: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      accounting: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      treasury: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      assets: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      payroll: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
      reports: { view: false, add: false, edit: false, delete: false, approve: false, post: false, print: false, export: false },
    },
    userCount: 1,
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'role-auditor',
    name: 'مراجع ومدقق حسابات خارجي (Auditor)',
    description: 'صلاحيات القراءة، المعاينة، الطباعة، والتصدير لجميع الأقسام بدون حق الإضافة أو التعديل',
    isSystemAdmin: false,
    isActive: true,
    permissions: {
      accounting: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      sales: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      purchases: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      inventory: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      manufacturing: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      treasury: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      assets: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      payroll: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
      reports: { view: true, add: false, edit: false, delete: false, approve: false, post: false, print: true, export: true },
    },
    userCount: 1,
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-01T08:00:00.000Z',
  },
];

export const initialERPUsers: ERPUser[] = [
  {
    id: 'u-1',
    name: 'أحمد محمد القلمي',
    username: 'admin',
    email: 'admin@alqalami-erp.com',
    phone: '+966 50 123 4567',
    roleId: 'role-admin',
    roleName: 'مدير النظام العام (System Administrator)',
    isActive: true,
    allowedBranchIds: ['*'], // جميع الفروع
    companyAccess: ['*'],
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'u-2',
    name: 'سالم عبدالله الشهري',
    username: 'accountant',
    email: 'salem.acc@alqalami-erp.com',
    phone: '+966 55 876 5432',
    roleId: 'role-accountant',
    roleName: 'محاسب عام مالي (Senior Accountant)',
    isActive: true,
    allowedBranchIds: ['*'], // جميع الفروع
    companyAccess: ['*'],
    createdAt: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'u-3',
    name: 'فارس عمر الغامدي',
    username: 'cashier_jeddah',
    email: 'fares.pos@alqalami-erp.com',
    phone: '+966 54 332 1100',
    roleId: 'role-cashier',
    roleName: 'مشرف كاشير ونقاط البيع (POS Cashier)',
    isActive: true,
    allowedBranchIds: ['b-2'], // فرع جدة فقط
    companyAccess: ['*'],
    createdAt: '2025-01-12T12:00:00.000Z',
  },
  {
    id: 'u-4',
    name: 'محمود عبدالسلام طاهر',
    username: 'warehouse_mgr',
    email: 'mahmoud.wh@alqalami-erp.com',
    phone: '+966 56 445 7788',
    roleId: 'role-warehouse',
    roleName: 'أمين مستودع ومخازن (Warehouse Manager)',
    isActive: true,
    allowedBranchIds: ['b-1', 'b-3'], // الرياض والدمام فقط
    companyAccess: ['*'],
    createdAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'u-5',
    name: 'عمر فاروق الباز',
    username: 'auditor',
    email: 'omar.audit@external.com',
    phone: '+966 59 999 1122',
    roleId: 'role-auditor',
    roleName: 'مراجع ومدقق حسابات خارجي (Auditor)',
    isActive: true,
    allowedBranchIds: ['*'],
    companyAccess: ['*'],
    createdAt: '2025-02-01T08:00:00.000Z',
  },
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    userId: 'u-1',
    userName: 'أحمد محمد القلمي',
    userRole: 'مدير النظام العام',
    action: 'create_role',
    actionTitle: 'إنشاء دور وظيفي جديد',
    targetType: 'role',
    targetId: 'role-accountant',
    targetName: 'محاسب عام مالي',
    details: 'تم إنشاء وتعيين مصفوفة الصلاحيات المحاسبية والمالية للمحاسبين',
    severity: 'info',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    userId: 'u-1',
    userName: 'أحمد محمد القلمي',
    userRole: 'مدير النظام العام',
    action: 'assign_user_role',
    actionTitle: 'تعيين دور ومستخدم',
    targetType: 'user',
    targetId: 'u-3',
    targetName: 'فارس عمر الغامدي',
    details: 'تم تعيين دور "مشرف كاشير ونقاط البيع" وتحديد صلاحية الوصول لـ فرع جدة فقط',
    previousValue: 'بدون فرع محدد',
    newValue: 'فرع جدة (b-2)',
    severity: 'info',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    userId: 'u-3',
    userName: 'فارس عمر الغامدي',
    userRole: 'مشرف كاشير ونقاط البيع',
    action: 'security_access_denied',
    actionTitle: 'محاولة وصول غير مصرح بها تم صدها',
    targetType: 'module',
    targetId: 'accounting',
    targetName: 'المحاسبة والشجرة المالية',
    details: 'محاولة فتح شجرة الحسابات أو إنشاء قيد يومية بواسطة مستخدم كاشير - تم الحظر فورياً من طبقة الحماية Backend',
    severity: 'warning',
  },
];
