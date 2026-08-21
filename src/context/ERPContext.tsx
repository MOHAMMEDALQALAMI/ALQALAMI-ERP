import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  ActiveScreen,
  AuditActionType,
  AuditLogEntry,
  Branch,
  Category,
  CompanySettings,
  CostCenter,
  Currency,
  CurrencyCode,
  Customer,
  Employee,
  ERPModule,
  ERPUser,
  Invoice,
  InvoiceItem,
  JournalEntry,
  PaymentMethod,
  PermissionAction,
  Product,
  Quotation,
  Role,
  RolePermissions,
  Shift,
  StockMovement,
  StockTransfer,
  Supplier,
  Voucher,
  Warehouse,
} from '../types/erp';
import {
  initialAccounts,
  initialBranches,
  initialCategories,
  initialCompanySettings,
  initialCostCenters,
  initialCurrencies,
  initialCustomers,
  initialEmployees,
  initialInvoices,
  initialJournalEntries,
  initialProducts,
  initialQuotations,
  initialShift,
  initialStockTransfers,
  initialSuppliers,
  initialVouchers,
  initialWarehouses,
} from '../data/initialData';
import {
  initialAuditLogs,
  initialERPUsers,
  initialRoles,
} from '../data/rbacInitialData';

const STORAGE_KEYS = {
  SETTINGS: '@alqalami_settings',
  CURRENCY: '@alqalami_currency',
  BRANCH_ID: '@alqalami_active_branch',
  PRODUCTS: '@alqalami_products',
  CATEGORIES: '@alqalami_categories',
  CUSTOMERS: '@alqalami_customers',
  SUPPLIERS: '@alqalami_suppliers',
  INVOICES: '@alqalami_invoices',
  QUOTATIONS: '@alqalami_quotations',
  TRANSFERS: '@alqalami_transfers',
  COST_CENTERS: '@alqalami_cost_centers',
  ACCOUNTS: '@alqalami_accounts',
  JOURNAL_ENTRIES: '@alqalami_journal',
  VOUCHERS: '@alqalami_vouchers',
  SHIFT: '@alqalami_shift',
  EMPLOYEES: '@alqalami_employees',
  ROLES: '@alqalami_roles',
  USERS: '@alqalami_users',
  CURRENT_USER_ID: '@alqalami_current_user_id',
  AUDIT_LOGS: '@alqalami_audit_logs',
};

interface HeldCart {
  id: string;
  name: string;
  date: string;
  items: InvoiceItem[];
  customerId?: string;
  customerName?: string;
}

interface ERPContextType {
  // Navigation & Layout
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  calculatorVisible: boolean;
  setCalculatorVisible: (v: boolean) => void;

  // RBAC & Security Engine (المرحلة الحالية)
  roles: Role[];
  erpUsers: ERPUser[];
  currentUserId: string;
  currentUser: ERPUser;
  currentUserRole: Role;
  auditLogs: AuditLogEntry[];
  hasPermission: (module: ERPModule, action: PermissionAction, branchId?: string) => boolean;
  canAccessModule: (module: ERPModule) => boolean;
  canAccessBranch: (branchId: string) => boolean;
  switchSimulatedUser: (userId: string) => void;
  createRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>) => Promise<Role>;
  updateRole: (role: Role) => Promise<void>;
  toggleRoleStatus: (roleId: string) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  createERPUser: (userData: Omit<ERPUser, 'id' | 'createdAt'>) => Promise<ERPUser>;
  updateERPUser: (user: ERPUser) => Promise<void>;
  toggleERPUserStatus: (userId: string) => Promise<void>;
  logAuditEvent: (data: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => Promise<AuditLogEntry>;

  // Master Settings & Currencies
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  currencies: Currency[];
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (curr: CurrencyCode) => void;
  formatCurrency: (amount: number, overrideCode?: CurrencyCode) => string;
  convertAmount: (amountInSAR: number, toCode?: CurrencyCode) => number;

  // Branches & Warehouses
  branches: Branch[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  activeBranch: Branch | undefined;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  setActiveWarehouseId: (id: string) => void;

  // Products & Categories
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, qtyDiff: number, reason: string, warehouseId?: string) => Promise<void>;

  // Stock Transfers
  stockTransfers: StockTransfer[];
  createStockTransfer: (transferData: Omit<StockTransfer, 'id' | 'transferNumber'>) => Promise<StockTransfer>;

  // Quotations
  quotations: Quotation[];
  createQuotation: (quotData: Omit<Quotation, 'id' | 'quotationNumber'>) => Promise<Quotation>;
  convertQuotationToInvoice: (quotationId: string) => Promise<Invoice>;

  // Cost Centers
  costCenters: CostCenter[];
  addCostCenter: (ccData: Omit<CostCenter, 'id'>) => Promise<CostCenter>;

  // Customers & Suppliers
  customers: Customer[];
  suppliers: Supplier[];
  addCustomer: (customer: Omit<Customer, 'id' | 'balance'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balance'>) => Promise<Supplier>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // POS & Cart
  cartItems: InvoiceItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, newPrice: number) => void;
  updateCartItemDiscount: (productId: string, discountAmount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTaxTotal: number;
  cartGrandTotal: number;
  cartItemCount: number;
  heldCarts: HeldCart[];
  holdCurrentCart: (name?: string) => void;
  restoreHeldCart: (heldCartId: string) => void;
  deleteHeldCart: (heldCartId: string) => void;

  // Invoices
  invoices: Invoice[];
  createSaleInvoice: (data: {
    customerId?: string;
    customerName?: string;
    items: InvoiceItem[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountTotal?: number;
    notes?: string;
    warehouseId?: string;
  }) => Promise<Invoice>;
  createPurchaseInvoice: (data: {
    supplierId: string;
    supplierName: string;
    items: InvoiceItem[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountTotal?: number;
    notes?: string;
    warehouseId?: string;
  }) => Promise<Invoice>;
  getInvoiceById: (id: string) => Invoice | undefined;

  // Finance & General Ledger
  accounts: Account[];
  journalEntries: JournalEntry[];
  vouchers: Voucher[];
  addVoucher: (voucherData: Omit<Voucher, 'id' | 'voucherNumber'>) => Promise<Voucher>;
  addJournalEntry: (entryData: Omit<JournalEntry, 'id' | 'entryNumber'>) => Promise<JournalEntry>;
  addAccount: (account: Omit<Account, 'id' | 'balance'>) => Promise<Account>;

  // Shift Management
  currentShift: Shift | null;
  openNewShift: (startingCash: number, cashierName: string) => Promise<void>;
  closeCurrentShift: (actualCash: number, notes?: string) => Promise<void>;

  // Employees & HR
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<Employee>;
  updateEmployee: (emp: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  payEmployeeSalary: (employeeId: string, paymentMethod: PaymentMethod, treasuryAccountId: string) => Promise<void>;

  // System
  resetAllData: () => Promise<void>;
  isLoaded: boolean;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);

  // RBAC State
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [erpUsers, setErpUsers] = useState<ERPUser[]>(initialERPUsers);
  const [currentUserId, setCurrentUserId] = useState<string>(initialERPUsers[0].id);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  const [settings, setSettings] = useState<CompanySettings>(initialCompanySettings);
  const [currencies] = useState<Currency[]>(initialCurrencies);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('SAR');
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [activeBranchId, setActiveBranchId] = useState<string>(initialBranches[0].id);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(initialWarehouses[0].id);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(initialStockTransfers);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialCostCenters);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [currentShift, setCurrentShift] = useState<Shift | null>(initialShift);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  // Cart & POS State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedRoles = await AsyncStorage.getItem(STORAGE_KEYS.ROLES);
        if (storedRoles) setRoles(JSON.parse(storedRoles));

        const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsers) setErpUsers(JSON.parse(storedUsers));

        const storedCurrentUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        if (storedCurrentUserId) setCurrentUserId(storedCurrentUserId);

        const storedAudit = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
        if (storedAudit) setAuditLogs(JSON.parse(storedAudit));

        const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedSettings) setSettings(JSON.parse(storedSettings));

        const storedCurr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY);
        if (storedCurr) setSelectedCurrency(storedCurr as CurrencyCode);

        const storedBranch = await AsyncStorage.getItem(STORAGE_KEYS.BRANCH_ID);
        if (storedBranch) setActiveBranchId(storedBranch);

        const storedProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (storedProducts) setProducts(JSON.parse(storedProducts));

        const storedCustomers = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));

        const storedSuppliers = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLIERS);
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));

        const storedInvoices = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
        if (storedInvoices) setInvoices(JSON.parse(storedInvoices));

        const storedQuotations = await AsyncStorage.getItem(STORAGE_KEYS.QUOTATIONS);
        if (storedQuotations) setQuotations(JSON.parse(storedQuotations));

        const storedTransfers = await AsyncStorage.getItem(STORAGE_KEYS.TRANSFERS);
        if (storedTransfers) setStockTransfers(JSON.parse(storedTransfers));

        const storedCostCenters = await AsyncStorage.getItem(STORAGE_KEYS.COST_CENTERS);
        if (storedCostCenters) setCostCenters(JSON.parse(storedCostCenters));

        const storedAccounts = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (storedAccounts) setAccounts(JSON.parse(storedAccounts));

        const storedVouchers = await AsyncStorage.getItem(STORAGE_KEYS.VOUCHERS);
        if (storedVouchers) setVouchers(JSON.parse(storedVouchers));

        const storedJournal = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
        if (storedJournal) setJournalEntries(JSON.parse(storedJournal));

        const storedShift = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT);
        if (storedShift) setCurrentShift(JSON.parse(storedShift));

        const storedEmployees = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES);
        if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
      } catch (e) {
        console.error('Error loading stored ERP data:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredData();
  }, []);

  const saveState = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Current active user & assigned role
  const currentUser = erpUsers.find((u) => u.id === currentUserId) || erpUsers[0];
  const currentUserRole = roles.find((r) => r.id === currentUser?.roleId) || roles[0];

  // ==========================================
  // RBAC PERMISSION CHECK ENGINE (محرك التحقق الأمني)
  // ==========================================

  const hasPermission = (module: ERPModule, action: PermissionAction, branchId?: string): boolean => {
    if (!currentUser || !currentUser.isActive) return false;
    if (!currentUserRole || !currentUserRole.isActive) return false;

    // Requirement #9: مدير النظام يمتلك جميع الصلاحيات
    if (currentUserRole.isSystemAdmin) {
      return true;
    }

    // Requirement #6: التحقق من صلاحية الفرع المحدد للمستخدم
    const targetBranch = branchId || activeBranchId;
    if (targetBranch) {
      const allowed = currentUser.allowedBranchIds;
      if (!allowed.includes('*') && !allowed.includes(targetBranch)) {
        return false;
      }
    }

    // Requirement #4 & #5: التحقق من الصلاحية الدقيقة للقسم والإجراء
    const modulePerms = currentUserRole.permissions?.[module];
    if (!modulePerms) return false;

    return Boolean(modulePerms[action]);
  };

  const canAccessModule = (module: ERPModule): boolean => {
    return hasPermission(module, 'view');
  };

  const canAccessBranch = (branchId: string): boolean => {
    if (!currentUser || !currentUser.isActive) return false;
    if (currentUserRole?.isSystemAdmin) return true;
    return currentUser.allowedBranchIds.includes('*') || currentUser.allowedBranchIds.includes(branchId);
  };

  // Requirement #10: تسجيل عمليات تغيير الصلاحيات في سجل العمليات
  const logAuditEvent = async (
    data: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>
  ): Promise<AuditLogEntry> => {
    const newEntry: AuditLogEntry = {
      ...data,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'مدير النظام',
      userRole: currentUserRole?.name || 'مدير النظام العام',
    };

    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);
    await saveState(STORAGE_KEYS.AUDIT_LOGS, updated);
    return newEntry;
  };

  const switchSimulatedUser = async (userId: string) => {
    const targetUser = erpUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    setCurrentUserId(userId);
    await saveState(STORAGE_KEYS.CURRENT_USER_ID, userId);

    // If user has restricted branches and activeBranchId is not allowed, switch to their first allowed branch
    if (!targetUser.allowedBranchIds.includes('*') && !targetUser.allowedBranchIds.includes(activeBranchId)) {
      const firstAllowed = targetUser.allowedBranchIds[0] || branches[0].id;
      setActiveBranchId(firstAllowed);
      await saveState(STORAGE_KEYS.BRANCH_ID, firstAllowed);
    }
  };

  // Roles CRUD (Requirement #1 & #2)
  const createRole = async (
    roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>
  ): Promise<Role> => {
    if (!hasPermission('accounting', 'add') && !currentUserRole.isSystemAdmin) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لإنشاء دور وظيفي',
        targetType: 'role',
        targetId: 'new-role',
        targetName: roleData.name,
        details: `المستخدم (${currentUser.name}) لا يمتلك صلاحية إنشاء أدوار وظيفية.`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بإنشاء أدوار وظيفية جديدة.');
    }

    const newRole: Role = {
      ...roleData,
      id: `role-${Date.now()}`,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...roles, newRole];
    setRoles(updated);
    await saveState(STORAGE_KEYS.ROLES, updated);

    await logAuditEvent({
      action: 'create_role',
      actionTitle: 'إنشاء دور وظيفي جديد',
      targetType: 'role',
      targetId: newRole.id,
      targetName: newRole.name,
      details: `تم إنشاء الدور الوظيفي "${newRole.name}" مع مصفوفة الصلاحيات المخصصة.`,
      severity: 'info',
    });

    return newRole;
  };

  const updateRole = async (updatedRole: Role) => {
    if (!currentUserRole.isSystemAdmin && !hasPermission('accounting', 'edit')) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لتعديل دور وظيفي',
        targetType: 'role',
        targetId: updatedRole.id,
        targetName: updatedRole.name,
        details: `المستخدم (${currentUser.name}) حاول تعديل الصلاحيات دون تصريح مدير.`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بتعديل الأدوار والصلاحيات.');
    }

    // Protect System Admin Role from being demoted
    const prev = roles.find((r) => r.id === updatedRole.id);
    if (prev?.isSystemAdmin && !updatedRole.isSystemAdmin) {
      throw new Error('لا يمكن إلغاء صلاحيات الإدارة الشاملة عن دور مدير النظام.');
    }

    const roleToSave = {
      ...updatedRole,
      updatedAt: new Date().toISOString(),
    };

    const updated = roles.map((r) => (r.id === updatedRole.id ? roleToSave : r));
    setRoles(updated);
    await saveState(STORAGE_KEYS.ROLES, updated);

    // Update user role name in user list if changed
    if (prev && prev.name !== updatedRole.name) {
      const updatedUsers = erpUsers.map((u) =>
        u.roleId === updatedRole.id ? { ...u, roleName: updatedRole.name } : u
      );
      setErpUsers(updatedUsers);
      await saveState(STORAGE_KEYS.USERS, updatedUsers);
    }

    await logAuditEvent({
      action: 'update_role',
      actionTitle: 'تحديث مصفوفة صلاحيات الدور',
      targetType: 'role',
      targetId: updatedRole.id,
      targetName: updatedRole.name,
      details: `تم تحديث الصلاحيات والأذونات الخاصة بالدور "${updatedRole.name}".`,
      severity: 'info',
    });
  };

  const toggleRoleStatus = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.isSystemAdmin) {
      throw new Error('لا يمكن تعطيل دور مدير النظام العام.');
    }

    const newStatus = !role.isActive;
    const updated = roles.map((r) =>
      r.id === roleId ? { ...r, isActive: newStatus, updatedAt: new Date().toISOString() } : r
    );
    setRoles(updated);
    await saveState(STORAGE_KEYS.ROLES, updated);

    await logAuditEvent({
      action: 'toggle_role_status',
      actionTitle: newStatus ? 'تفعيل دور وظيفي' : 'تعطيل دور وظيفي',
      targetType: 'role',
      targetId: role.id,
      targetName: role.name,
      details: `تم تغيير حالة الدور "${role.name}" إلى (${newStatus ? 'نشط ومفعل' : 'معطل وموقوف'}).`,
      severity: 'warning',
    });
  };

  const deleteRole = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (role.isSystemAdmin) {
      throw new Error('لا يمكن حذف دور مدير النظام العام.');
    }

    const assignedUsersCount = erpUsers.filter((u) => u.roleId === roleId).length;
    if (assignedUsersCount > 0) {
      throw new Error(`لا يمكن حذف الدور لأنه مرتبط بـ (${assignedUsersCount}) مستخدمين. يرجى نقل المستخدمين لدور آخر أولاً.`);
    }

    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    await saveState(STORAGE_KEYS.ROLES, updated);

    await logAuditEvent({
      action: 'delete_role',
      actionTitle: 'حذف دور وظيفي',
      targetType: 'role',
      targetId: role.id,
      targetName: role.name,
      details: `تم حذف الدور الوظيفي "${role.name}" نهائياً من النظام.`,
      severity: 'warning',
    });
  };

  // User Management CRUD (Requirement #3 & #6)
  const createERPUser = async (userData: Omit<ERPUser, 'id' | 'createdAt'>): Promise<ERPUser> => {
    const targetRole = roles.find((r) => r.id === userData.roleId);
    const newUser: ERPUser = {
      ...userData,
      id: `u-${Date.now()}`,
      roleName: targetRole?.name || 'مستخدم عام',
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...erpUsers];
    setErpUsers(updated);
    await saveState(STORAGE_KEYS.USERS, updated);

    // Update role user count
    const updatedRoles = roles.map((r) => {
      const count = updated.filter((u) => u.roleId === r.id).length;
      return { ...r, userCount: count };
    });
    setRoles(updatedRoles);
    await saveState(STORAGE_KEYS.ROLES, updatedRoles);

    await logAuditEvent({
      action: 'create_user',
      actionTitle: 'إضافة مستخدم وتعيين الصلاحيات',
      targetType: 'user',
      targetId: newUser.id,
      targetName: newUser.name,
      details: `تم إنشاء المستخدم "${newUser.name}" برتبة (${newUser.roleName}) وتحديد الفروع: [${newUser.allowedBranchIds.join(', ')}].`,
      severity: 'info',
    });

    return newUser;
  };

  const updateERPUser = async (user: ERPUser) => {
    const targetRole = roles.find((r) => r.id === user.roleId);
    const userToSave = {
      ...user,
      roleName: targetRole?.name || user.roleName,
    };

    const updated = erpUsers.map((u) => (u.id === user.id ? userToSave : u));
    setErpUsers(updated);
    await saveState(STORAGE_KEYS.USERS, updated);

    // Update role user count
    const updatedRoles = roles.map((r) => {
      const count = updated.filter((u) => u.roleId === r.id).length;
      return { ...r, userCount: count };
    });
    setRoles(updatedRoles);
    await saveState(STORAGE_KEYS.ROLES, updatedRoles);

    await logAuditEvent({
      action: 'update_user',
      actionTitle: 'تحديث بيانات وصلاحيات المستخدم',
      targetType: 'user',
      targetId: user.id,
      targetName: user.name,
      details: `تم تحديث دور المستخدم إلى (${userToSave.roleName}) وتعديل الفروع المسموحة.`,
      severity: 'info',
    });
  };

  const toggleERPUserStatus = async (userId: string) => {
    const user = erpUsers.find((u) => u.id === userId);
    if (!user) return;

    if (user.id === 'u-1') {
      throw new Error('لا يمكن تعطيل حساب مدير النظام الرئيسي.');
    }

    const newStatus = !user.isActive;
    const updated = erpUsers.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u));
    setErpUsers(updated);
    await saveState(STORAGE_KEYS.USERS, updated);

    await logAuditEvent({
      action: 'toggle_user_status',
      actionTitle: newStatus ? 'تنشيط حساب مستخدم' : 'إيقاف حساب مستخدم',
      targetType: 'user',
      targetId: user.id,
      targetName: user.name,
      details: `تم تغيير حالة المستخدم "${user.name}" إلى (${newStatus ? 'نشط' : 'موقوف'}).`,
      severity: 'warning',
    });
  };

  const convertAmount = (amountInSAR: number, toCode?: CurrencyCode) => {
    const targetCode = toCode || selectedCurrency;
    const curr = currencies.find((c) => c.code === targetCode) || currencies[0];
    if (targetCode === 'SAR') return amountInSAR;
    return amountInSAR / curr.exchangeRate;
  };

  const formatCurrency = (amount: number, overrideCode?: CurrencyCode) => {
    const targetCode = overrideCode || selectedCurrency;
    const curr = currencies.find((c) => c.code === targetCode) || currencies[0];
    const converted = convertAmount(amount, targetCode);
    return `${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr.symbol}`;
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveState(STORAGE_KEYS.SETTINGS, updated);
  };

  // Products CRUD with Authorization check (Requirement #8)
  const addProduct = async (prodData: Omit<Product, 'id'>): Promise<Product> => {
    if (!hasPermission('inventory', 'add')) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة إضافة صنف بدون صلاحية',
        targetType: 'module',
        targetId: 'inventory',
        targetName: 'المخزون',
        details: `المستخدم (${currentUser.name}) حاول إضافة صنف جديد "${prodData.name}" بدون إذن (إضافة مخزون).`,
        severity: 'warning',
      });
      throw new Error('غير مصرح لك بإضافة أصناف جديدة إلى المخزون.');
    }

    const newProduct: Product = {
      ...prodData,
      id: `p-${Date.now()}`,
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    await saveState(STORAGE_KEYS.PRODUCTS, updated);
    return newProduct;
  };

  const updateProduct = async (product: Product) => {
    if (!hasPermission('inventory', 'edit')) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة تعديل صنف بدون صلاحية',
        targetType: 'module',
        targetId: 'inventory',
        targetName: 'المخزون',
        details: `المستخدم (${currentUser.name}) حاول تعديل بيانات الصنف "${product.name}".`,
        severity: 'warning',
      });
      throw new Error('غير مصرح لك بتعديل بيانات الأصناف.');
    }

    const updated = products.map((p) => (p.id === product.id ? product : p));
    setProducts(updated);
    await saveState(STORAGE_KEYS.PRODUCTS, updated);
  };

  const deleteProduct = async (id: string) => {
    if (!hasPermission('inventory', 'delete')) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة حذف صنف بدون صلاحية',
        targetType: 'module',
        targetId: 'inventory',
        targetName: 'المخزون',
        details: `المستخدم (${currentUser.name}) حاول حذف الصنف (${id}).`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بحذف أصناف من المخزون.');
    }

    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    await saveState(STORAGE_KEYS.PRODUCTS, updated);
  };

  const adjustStock = async (productId: string, qtyDiff: number, reason: string, warehouseId?: string) => {
    if (!hasPermission('inventory', 'edit')) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة تسوية مخزنية بدون صلاحية',
        targetType: 'module',
        targetId: 'inventory',
        targetName: 'المخزون',
        details: `المستخدم (${currentUser.name}) حاول تعديل رصيد الصنف (${productId}).`,
        severity: 'warning',
      });
      throw new Error('غير مصرح لك بإجراء تسويات وتعديل كميات المخزون.');
    }

    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.currentStock + qtyDiff);
        return { ...p, currentStock: newStock };
      }
      return p;
    });
    setProducts(updated);
    await saveState(STORAGE_KEYS.PRODUCTS, updated);
  };

  // Stock Transfers with Security Check
  const createStockTransfer = async (transferData: Omit<StockTransfer, 'id' | 'transferNumber'>): Promise<StockTransfer> => {
    if (!hasPermission('inventory', 'post', transferData.fromWarehouseId)) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة مناقلة مخزنية غير مصرح بها',
        targetType: 'module',
        targetId: 'inventory',
        targetName: 'المخزون والتحويلات',
        details: `المستخدم (${currentUser.name}) لا يمتلك صلاحية التحويل والترحيل من المستودع المحدد.`,
        severity: 'warning',
      });
      throw new Error('غير مصرح لك بترحيل ونقل بضائع من هذا المستودع.');
    }

    const transferNumber = `TR-${new Date().getFullYear()}-${String(stockTransfers.length + 1).padStart(4, '0')}`;
    const newTransfer: StockTransfer = {
      ...transferData,
      id: `tr-${Date.now()}`,
      transferNumber,
    };
    const updated = [newTransfer, ...stockTransfers];
    setStockTransfers(updated);
    await saveState(STORAGE_KEYS.TRANSFERS, updated);
    return newTransfer;
  };

  // Quotations with Security Check
  const createQuotation = async (quotData: Omit<Quotation, 'id' | 'quotationNumber'>): Promise<Quotation> => {
    if (!hasPermission('sales', 'add')) {
      throw new Error('غير مصرح لك بإنشاء عروض أسعار.');
    }

    const quotationNumber = `QUOT-${new Date().getFullYear()}-${String(quotations.length + 101).padStart(5, '0')}`;
    const newQuot: Quotation = {
      ...quotData,
      id: `quot-${Date.now()}`,
      quotationNumber,
    };
    const updated = [newQuot, ...quotations];
    setQuotations(updated);
    await saveState(STORAGE_KEYS.QUOTATIONS, updated);
    return newQuot;
  };

  const convertQuotationToInvoice = async (quotationId: string): Promise<Invoice> => {
    if (!hasPermission('sales', 'approve')) {
      throw new Error('غير مصرح لك باعتماد وتحويل عروض الأسعار لفواتير.');
    }

    const quot = quotations.find((q) => q.id === quotationId);
    if (!quot) throw new Error('عرض السعر غير موجود');

    const inv = await createSaleInvoice({
      customerId: quot.customerId,
      customerName: quot.customerName,
      items: quot.items,
      paymentMethod: 'credit',
      paidAmount: 0,
      notes: `محول تلقائياً من عرض السعر رقم: ${quot.quotationNumber}`,
    });

    const updatedQuotations = quotations.map((q) =>
      q.id === quotationId ? { ...q, status: 'converted' as const } : q
    );
    setQuotations(updatedQuotations);
    await saveState(STORAGE_KEYS.QUOTATIONS, updatedQuotations);

    return inv;
  };

  // Cost Centers with Security Check
  const addCostCenter = async (ccData: Omit<CostCenter, 'id'>): Promise<CostCenter> => {
    if (!hasPermission('accounting', 'add')) {
      throw new Error('غير مصرح لك بإنشاء مراكز تكلفة.');
    }

    const newCC: CostCenter = {
      ...ccData,
      id: `cc-${Date.now()}`,
    };
    const updated = [...costCenters, newCC];
    setCostCenters(updated);
    await saveState(STORAGE_KEYS.COST_CENTERS, updated);
    return newCC;
  };

  // Customers & Suppliers CRUD with Security Check
  const addCustomer = async (custData: Omit<Customer, 'id' | 'balance'>): Promise<Customer> => {
    if (!hasPermission('sales', 'add')) {
      throw new Error('غير مصرح لك بإضافة عملاء جدد.');
    }

    const newCust: Customer = {
      ...custData,
      id: `c-${Date.now()}`,
      balance: 0,
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    await saveState(STORAGE_KEYS.CUSTOMERS, updated);
    return newCust;
  };

  const updateCustomer = async (cust: Customer) => {
    if (!hasPermission('sales', 'edit')) {
      throw new Error('غير مصرح لك بتعديل بيانات العملاء.');
    }

    const updated = customers.map((c) => (c.id === cust.id ? cust : c));
    setCustomers(updated);
    await saveState(STORAGE_KEYS.CUSTOMERS, updated);
  };

  const deleteCustomer = async (id: string) => {
    if (!hasPermission('sales', 'delete')) {
      throw new Error('غير مصرح لك بحذف العملاء.');
    }

    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    await saveState(STORAGE_KEYS.CUSTOMERS, updated);
  };

  const addSupplier = async (suppData: Omit<Supplier, 'id' | 'balance'>): Promise<Supplier> => {
    if (!hasPermission('purchases', 'add')) {
      throw new Error('غير مصرح لك بإضافة موردين.');
    }

    const newSupp: Supplier = {
      ...suppData,
      id: `s-${Date.now()}`,
      balance: 0,
    };
    const updated = [newSupp, ...suppliers];
    setSuppliers(updated);
    await saveState(STORAGE_KEYS.SUPPLIERS, updated);
    return newSupp;
  };

  const updateSupplier = async (supp: Supplier) => {
    if (!hasPermission('purchases', 'edit')) {
      throw new Error('غير مصرح لك بتعديل بيانات الموردين.');
    }

    const updated = suppliers.map((s) => (s.id === supp.id ? supp : s));
    setSuppliers(updated);
    await saveState(STORAGE_KEYS.SUPPLIERS, updated);
  };

  const deleteSupplier = async (id: string) => {
    if (!hasPermission('purchases', 'delete')) {
      throw new Error('غير مصرح لك بحذف الموردين.');
    }

    const updated = suppliers.filter((s) => s.id !== id);
    setSuppliers(updated);
    await saveState(STORAGE_KEYS.SUPPLIERS, updated);
  };

  // POS & Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const taxRate = settings.enableVat ? (product.taxRate || settings.vatRate) : 0;
      const unitPrice = product.sellingPrice;

      if (existing) {
        const newQty = existing.quantity + quantity;
        const subtotal = newQty * unitPrice - existing.discount;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;

        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQty, taxAmount, total }
            : item
        );
      } else {
        const itemSubtotal = quantity * unitPrice;
        const taxAmount = (itemSubtotal * taxRate) / 100;
        const total = itemSubtotal + taxAmount;

        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unit: product.unit,
          quantity,
          unitPrice,
          costPrice: product.costPrice,
          discount: 0,
          taxRate,
          taxAmount,
          total,
        };
        return [newItem, ...prev];
      }
    });
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const subtotal = quantity * item.unitPrice - item.discount;
          const taxAmount = (subtotal * item.taxRate) / 100;
          const total = subtotal + taxAmount;
          return { ...item, quantity, taxAmount, total };
        }
        return item;
      })
    );
  };

  const updateCartItemPrice = (productId: string, newPrice: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const subtotal = item.quantity * newPrice - item.discount;
          const taxAmount = (subtotal * item.taxRate) / 100;
          const total = subtotal + taxAmount;
          return { ...item, unitPrice: newPrice, taxAmount, total };
        }
        return item;
      })
    );
  };

  const updateCartItemDiscount = (productId: string, discountAmount: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const subtotal = Math.max(0, item.quantity * item.unitPrice - discountAmount);
          const taxAmount = (subtotal * item.taxRate) / 100;
          const total = subtotal + taxAmount;
          return { ...item, discount: discountAmount, taxAmount, total };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const holdCurrentCart = (name?: string) => {
    if (cartItems.length === 0) return;
    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      name: name || `فاتورة معلقة #${heldCarts.length + 1} (${cartItems.length} صنف)`,
      date: new Date().toLocaleTimeString('ar-SA'),
      items: [...cartItems],
    };
    setHeldCarts([newHeld, ...heldCarts]);
    clearCart();
  };

  const restoreHeldCart = (heldCartId: string) => {
    const found = heldCarts.find((h) => h.id === heldCartId);
    if (found) {
      setCartItems(found.items);
      setHeldCarts(heldCarts.filter((h) => h.id !== heldCartId));
    }
  };

  const deleteHeldCart = (heldCartId: string) => {
    setHeldCarts(heldCarts.filter((h) => h.id !== heldCartId));
  };

  // Cart Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
  const cartTaxTotal = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const cartGrandTotal = cartSubtotal + cartTaxTotal;
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Requirement #8: منع تجاوز الصلاحيات Backend authorization barrier
  const createSaleInvoice = async (data: {
    customerId?: string;
    customerName?: string;
    items: InvoiceItem[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountTotal?: number;
    notes?: string;
    warehouseId?: string;
  }): Promise<Invoice> => {
    // Strict Authorization Guard
    if (!hasPermission('sales', 'add', activeBranchId)) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لإصدار فاتورة مبيعات',
        targetType: 'module',
        targetId: 'sales',
        targetName: 'المبيعات ونقاط البيع',
        details: `المستخدم (${currentUser.name}) لا يمتلك صلاحية إصدار فواتير بيع في الفرع (${activeBranch?.name}).`,
        severity: 'critical',
      });
      throw new Error(`غير مصرح لك بإصدار فواتير مبيعات في هذا الفرع.`);
    }

    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity - (i.discount || 0), 0);
    const taxTotal = data.items.reduce((sum, i) => sum + i.taxAmount, 0);
    const grandTotal = subtotal + taxTotal - (data.discountTotal || 0);
    const paidAmount = data.paidAmount ?? grandTotal;
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (paidAmount === 0) status = 'unpaid';
    else if (paidAmount < grandTotal) status = 'partial';

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1001).padStart(6, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      type: 'sale',
      date: new Date().toISOString(),
      customerId: data.customerId || 'c-6',
      customerName: data.customerName || 'عميل نقدي عام (نقاط البيع السريعة)',
      branchId: activeBranchId,
      warehouseId: data.warehouseId || activeWarehouseId,
      items: data.items,
      subtotal,
      discountTotal: data.discountTotal || 0,
      taxTotal,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentMethod: data.paymentMethod,
      status,
      cashierName: currentUser?.name || currentShift?.cashierName || 'كاشير رئيسي',
      notes: data.notes,
      shiftId: currentShift?.id,
    };

    // 1. Deduct Stock
    const updatedProducts = products.map((prod) => {
      const match = data.items.find((i) => i.productId === prod.id);
      if (match) {
        return { ...prod, currentStock: Math.max(0, prod.currentStock - match.quantity) };
      }
      return prod;
    });
    setProducts(updatedProducts);
    await saveState(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // 2. Customer balance update
    if (data.customerId && data.customerId !== 'c-6' && remainingAmount > 0) {
      const updatedCusts = customers.map((c) => {
        if (c.id === data.customerId) {
          return { ...c, balance: c.balance + remainingAmount };
        }
        return c;
      });
      setCustomers(updatedCusts);
      await saveState(STORAGE_KEYS.CUSTOMERS, updatedCusts);
    }

    // 3. Shift update
    if (currentShift && currentShift.status === 'open') {
      const isCash = data.paymentMethod === 'cash';
      const isCard = data.paymentMethod === 'card';
      const isCredit = data.paymentMethod === 'credit';

      const updatedShift: Shift = {
        ...currentShift,
        cashSales: isCash ? currentShift.cashSales + paidAmount : currentShift.cashSales,
        cardSales: isCard ? currentShift.cardSales + paidAmount : currentShift.cardSales,
        creditSales: isCredit ? currentShift.creditSales + grandTotal : currentShift.creditSales,
        expectedCash: isCash ? currentShift.expectedCash + paidAmount : currentShift.expectedCash,
      };
      setCurrentShift(updatedShift);
      await saveState(STORAGE_KEYS.SHIFT, updatedShift);
    }

    // 4. General ledger auto entry
    const debitAccountCode = data.paymentMethod === 'cash' ? '1101' : data.paymentMethod === 'card' ? '1103' : '1105';
    const debitAccountName = data.paymentMethod === 'cash' ? 'صندوق النقدية الرئيسي (الخزينة)' : data.paymentMethod === 'card' ? 'حساب مصرف الراجحي الجاري' : 'العملاء والذمم المدينة';

    const journalEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString(),
      referenceType: 'invoice',
      referenceId: newInvoice.id,
      description: `قيد مبيعات فاتورة رقم ${invoiceNumber} - ${newInvoice.customerName}`,
      lines: [
        {
          accountId: 'acc-' + debitAccountCode,
          accountCode: debitAccountCode,
          accountName: debitAccountName,
          debit: grandTotal,
          credit: 0,
        },
        {
          accountId: 'acc-4101',
          accountCode: '4101',
          accountName: 'إيرادات مبيعات التجزئة والسوبرماركت',
          debit: 0,
          credit: subtotal,
        },
        {
          accountId: 'acc-2102',
          accountCode: '2102',
          accountName: 'ضريبة القيمة المضافة المستحقة (VAT Payable)',
          debit: 0,
          credit: taxTotal,
        },
      ],
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      branchId: activeBranchId,
      createdBy: currentUser?.name || 'النظام الآلي',
    };

    const updatedJournal = [journalEntry, ...journalEntries];
    setJournalEntries(updatedJournal);
    await saveState(STORAGE_KEYS.JOURNAL_ENTRIES, updatedJournal);

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    await saveState(STORAGE_KEYS.INVOICES, updatedInvoices);

    return newInvoice;
  };

  // Requirement #8: Purchase Invoice Security Barrier
  const createPurchaseInvoice = async (data: {
    supplierId: string;
    supplierName: string;
    items: InvoiceItem[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountTotal?: number;
    notes?: string;
    warehouseId?: string;
  }): Promise<Invoice> => {
    if (!hasPermission('purchases', 'add', activeBranchId)) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لإنشاء فاتورة مشتريات',
        targetType: 'module',
        targetId: 'purchases',
        targetName: 'المشتريات والموردين',
        details: `المستخدم (${currentUser.name}) لا يمتلك صلاحية إنشاء فواتير شراء وتوريد.`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بإصدار وتسجيل فواتير مشتريات.');
    }

    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity - (i.discount || 0), 0);
    const taxTotal = data.items.reduce((sum, i) => sum + i.taxAmount, 0);
    const grandTotal = subtotal + taxTotal - (data.discountTotal || 0);
    const paidAmount = data.paidAmount ?? grandTotal;
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (paidAmount === 0) status = 'unpaid';
    else if (paidAmount < grandTotal) status = 'partial';

    const invoiceNumber = `PUR-${new Date().getFullYear()}-${String(invoices.length + 2001).padStart(6, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-pur-${Date.now()}`,
      invoiceNumber,
      type: 'purchase',
      date: new Date().toISOString(),
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      branchId: activeBranchId,
      warehouseId: data.warehouseId || activeWarehouseId,
      items: data.items,
      subtotal,
      discountTotal: data.discountTotal || 0,
      taxTotal,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentMethod: data.paymentMethod,
      status,
      cashierName: currentUser?.name || 'مدير المشتريات',
      notes: data.notes,
    };

    const updatedProducts = products.map((prod) => {
      const match = data.items.find((i) => i.productId === prod.id);
      if (match) {
        return {
          ...prod,
          currentStock: prod.currentStock + match.quantity,
          costPrice: match.unitPrice,
        };
      }
      return prod;
    });
    setProducts(updatedProducts);
    await saveState(STORAGE_KEYS.PRODUCTS, updatedProducts);

    if (data.supplierId && remainingAmount > 0) {
      const updatedSupps = suppliers.map((s) => {
        if (s.id === data.supplierId) {
          return { ...s, balance: s.balance + remainingAmount };
        }
        return s;
      });
      setSuppliers(updatedSupps);
      await saveState(STORAGE_KEYS.SUPPLIERS, updatedSupps);
    }

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    await saveState(STORAGE_KEYS.INVOICES, updatedInvoices);

    return newInvoice;
  };

  const getInvoiceById = (id: string) => {
    return invoices.find((inv) => inv.id === id);
  };

  // Vouchers with Security Check
  const addVoucher = async (voucherData: Omit<Voucher, 'id' | 'voucherNumber'>): Promise<Voucher> => {
    if (!hasPermission('treasury', 'add', activeBranchId)) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لإصدار سند مالي',
        targetType: 'module',
        targetId: 'treasury',
        targetName: 'الصندوق والبنوك',
        details: `المستخدم (${currentUser.name}) لا يمتلك إذن إصدار سندات قبض أو صرف.`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بإصدار سندات مالية من الخزينة.');
    }

    const isReceipt = voucherData.type === 'receipt';
    const prefix = isReceipt ? 'RCV' : 'PAY';
    const voucherNumber = `${prefix}-${new Date().getFullYear()}-${String(vouchers.length + 101).padStart(5, '0')}`;

    const newVoucher: Voucher = {
      ...voucherData,
      id: `v-${Date.now()}`,
      voucherNumber,
    };

    if (voucherData.partyType === 'customer' && voucherData.partyId) {
      const updatedCusts = customers.map((c) => {
        if (c.id === voucherData.partyId) {
          return {
            ...c,
            balance: isReceipt ? Math.max(0, c.balance - voucherData.amount) : c.balance + voucherData.amount,
          };
        }
        return c;
      });
      setCustomers(updatedCusts);
      await saveState(STORAGE_KEYS.CUSTOMERS, updatedCusts);
    } else if (voucherData.partyType === 'supplier' && voucherData.partyId) {
      const updatedSupps = suppliers.map((s) => {
        if (s.id === voucherData.partyId) {
          return {
            ...s,
            balance: isReceipt ? s.balance + voucherData.amount : Math.max(0, s.balance - voucherData.amount),
          };
        }
        return s;
      });
      setSuppliers(updatedSupps);
      await saveState(STORAGE_KEYS.SUPPLIERS, updatedSupps);
    }

    if (currentShift && currentShift.status === 'open' && voucherData.paymentMethod === 'cash') {
      const updatedShift: Shift = {
        ...currentShift,
        cashReceived: isReceipt ? currentShift.cashReceived + voucherData.amount : currentShift.cashReceived,
        cashExpenses: !isReceipt ? currentShift.cashExpenses + voucherData.amount : currentShift.cashExpenses,
        expectedCash: isReceipt
          ? currentShift.expectedCash + voucherData.amount
          : currentShift.expectedCash - voucherData.amount,
      };
      setCurrentShift(updatedShift);
      await saveState(STORAGE_KEYS.SHIFT, updatedShift);
    }

    const updatedVouchers = [newVoucher, ...vouchers];
    setVouchers(updatedVouchers);
    await saveState(STORAGE_KEYS.VOUCHERS, updatedVouchers);

    return newVoucher;
  };

  // Journal Entry with Security Check
  const addJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'entryNumber'>): Promise<JournalEntry> => {
    if (!hasPermission('accounting', 'add', activeBranchId)) {
      await logAuditEvent({
        action: 'security_access_denied',
        actionTitle: 'محاولة غير مصرح بها لإنشاء قيد يومية',
        targetType: 'module',
        targetId: 'accounting',
        targetName: 'المحاسبة',
        details: `المستخدم (${currentUser.name}) حاول إنشاء قيد يومية عام دون صلاحية محاسبة.`,
        severity: 'critical',
      });
      throw new Error('غير مصرح لك بإنشاء قيود يومية عامة.');
    }

    const entryNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`;
    const newEntry: JournalEntry = {
      ...entryData,
      id: `je-${Date.now()}`,
      entryNumber,
    };

    const updatedJournal = [newEntry, ...journalEntries];
    setJournalEntries(updatedJournal);
    await saveState(STORAGE_KEYS.JOURNAL_ENTRIES, updatedJournal);
    return newEntry;
  };

  const addAccount = async (accData: Omit<Account, 'id' | 'balance'>): Promise<Account> => {
    if (!hasPermission('accounting', 'add')) {
      throw new Error('غير مصرح لك بإضافة حسابات في دليل الشجرة المحاسبية.');
    }

    const newAccount: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
      balance: 0,
    };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    await saveState(STORAGE_KEYS.ACCOUNTS, updated);
    return newAccount;
  };

  // Shift Management
  const openNewShift = async (startingCash: number, cashierName: string) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      shiftNumber: (currentShift?.shiftNumber || 1000) + 1,
      cashierName,
      branchId: activeBranchId,
      startTime: new Date().toISOString(),
      startingCash,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      cashExpenses: 0,
      cashReceived: 0,
      expectedCash: startingCash,
      status: 'open',
    };
    setCurrentShift(newShift);
    await saveState(STORAGE_KEYS.SHIFT, newShift);
  };

  const closeCurrentShift = async (actualCash: number, notes?: string) => {
    if (!currentShift) return;
    const difference = actualCash - currentShift.expectedCash;
    const closedShift: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      actualCashEnding: actualCash,
      difference,
      status: 'closed',
      notes: notes || currentShift.notes,
    };
    setCurrentShift(closedShift);
    await saveState(STORAGE_KEYS.SHIFT, closedShift);
  };

  // Employees & HR with Security Check
  const addEmployee = async (empData: Omit<Employee, 'id'>): Promise<Employee> => {
    if (!hasPermission('payroll', 'add')) {
      throw new Error('غير مصرح لك بإضافة موظفين في سجل الموارد البشرية.');
    }

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      netSalary: empData.basicSalary + empData.allowances - empData.deductions,
    };
    const updated = [newEmp, ...employees];
    setEmployees(updated);
    await saveState(STORAGE_KEYS.EMPLOYEES, updated);
    return newEmp;
  };

  const updateEmployee = async (emp: Employee) => {
    if (!hasPermission('payroll', 'edit')) {
      throw new Error('غير مصرح لك بتعديل بيانات الموظفين.');
    }

    const netSalary = emp.basicSalary + emp.allowances - emp.deductions;
    const updated = employees.map((e) => (e.id === emp.id ? { ...emp, netSalary } : e));
    setEmployees(updated);
    await saveState(STORAGE_KEYS.EMPLOYEES, updated);
  };

  const deleteEmployee = async (id: string) => {
    if (!hasPermission('payroll', 'delete')) {
      throw new Error('غير مصرح لك بحذف موظفين.');
    }

    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    await saveState(STORAGE_KEYS.EMPLOYEES, updated);
  };

  const payEmployeeSalary = async (employeeId: string, paymentMethod: PaymentMethod, treasuryAccountId: string) => {
    if (!hasPermission('payroll', 'approve')) {
      throw new Error('غير مصرح لك باعتماد وصرف مسيرات الرواتب.');
    }

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    await addVoucher({
      type: 'payment',
      date: new Date().toISOString(),
      amount: emp.netSalary,
      paymentMethod,
      accountId: treasuryAccountId,
      accountName: treasuryAccountId === 'acc-1101' ? 'صندوق النقدية الرئيسي (الخزينة)' : 'حساب مصرف الراجحي الجاري',
      partyType: 'employee',
      partyId: emp.id,
      partyName: emp.name,
      description: `صرف راتب الموظف ${emp.name} لشهر ${new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`,
      branchId: activeBranchId,
      treasuryId: treasuryAccountId,
      createdBy: currentUser?.name || 'مدير الموارد البشرية',
    });
  };

  const resetAllData = async () => {
    await AsyncStorage.clear();
    setRoles(initialRoles);
    setErpUsers(initialERPUsers);
    setCurrentUserId(initialERPUsers[0].id);
    setAuditLogs(initialAuditLogs);
    setSettings(initialCompanySettings);
    setSelectedCurrency('SAR');
    setBranches(initialBranches);
    setActiveBranchId(initialBranches[0].id);
    setWarehouses(initialWarehouses);
    setActiveWarehouseId(initialWarehouses[0].id);
    setProducts(initialProducts);
    setCategories(initialCategories);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setInvoices(initialInvoices);
    setQuotations(initialQuotations);
    setStockTransfers(initialStockTransfers);
    setCostCenters(initialCostCenters);
    setAccounts(initialAccounts);
    setJournalEntries(initialJournalEntries);
    setVouchers(initialVouchers);
    setCurrentShift(initialShift);
    setEmployees(initialEmployees);
    setCartItems([]);
    setHeldCarts([]);
  };

  return (
    <ERPContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        calculatorVisible,
        setCalculatorVisible,
        roles,
        erpUsers,
        currentUserId,
        currentUser,
        currentUserRole,
        auditLogs,
        hasPermission,
        canAccessModule,
        canAccessBranch,
        switchSimulatedUser,
        createRole,
        updateRole,
        toggleRoleStatus,
        deleteRole,
        createERPUser,
        updateERPUser,
        toggleERPUserStatus,
        logAuditEvent,
        settings,
        updateSettings,
        currencies,
        selectedCurrency,
        setSelectedCurrency,
        formatCurrency,
        convertAmount,
        branches,
        activeBranchId,
        setActiveBranchId,
        activeBranch,
        warehouses,
        activeWarehouseId,
        setActiveWarehouseId,
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        stockTransfers,
        createStockTransfer,
        quotations,
        createQuotation,
        convertQuotationToInvoice,
        costCenters,
        addCostCenter,
        customers,
        suppliers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        cartItems,
        addToCart,
        updateCartItemQuantity,
        updateCartItemPrice,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTaxTotal,
        cartGrandTotal,
        cartItemCount,
        heldCarts,
        holdCurrentCart,
        restoreHeldCart,
        deleteHeldCart,
        invoices,
        createSaleInvoice,
        createPurchaseInvoice,
        getInvoiceById,
        accounts,
        journalEntries,
        vouchers,
        addVoucher,
        addJournalEntry,
        addAccount,
        currentShift,
        openNewShift,
        closeCurrentShift,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        payEmployeeSalary,
        resetAllData,
        isLoaded,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
