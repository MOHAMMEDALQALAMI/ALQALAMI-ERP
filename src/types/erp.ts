export type CurrencyCode = 'SAR' | 'USD' | 'AED' | 'YER' | 'EGP';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  exchangeRate: number; // relative to base currency (SAR)
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'bank_transfer' | 'multi';

export type InvoiceType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'quotation';

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'cancelled';

export interface InvoiceItem {
  productId: string;
  productName: string;
  barcode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  date: string;
  dueDate?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  branchId: string;
  warehouseId: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  cashierName: string;
  notes?: string;
  shiftId?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'accepted' | 'converted';
  notes?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
  status: 'pending' | 'completed';
  notes?: string;
  createdBy: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  managerName?: string;
  totalExpenses: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  barcode: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  minSellingPrice?: number;
  taxRate: number;
  currentStock: number;
  minStockAlert: number;
  maxStockAlert?: number;
  warehouseId: string;
  expiryDate?: string;
  image?: string;
  isService?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  taxNumber?: string;
  address?: string;
  balance: number;
  creditLimit: number;
  priceLevel: 'retail' | 'wholesale';
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  taxNumber?: string;
  companyName?: string;
  address?: string;
  balance: number;
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  phone: string;
  taxNumber: string;
  isMain: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
  location: string;
  managerName?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentCode?: string;
  balance: number;
  isDebitNormal: boolean;
  isHeader?: boolean;
}

export interface JournalEntryLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  referenceType?: 'manual' | 'invoice' | 'payment' | 'receipt' | 'payroll';
  referenceId?: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  branchId: string;
  createdBy: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'receipt' | 'payment';
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  accountName: string;
  partyType: 'customer' | 'supplier' | 'employee' | 'other';
  partyId?: string;
  partyName: string;
  description: string;
  branchId: string;
  treasuryId: string;
  createdBy: string;
}

export interface Shift {
  id: string;
  shiftNumber: number;
  cashierName: string;
  branchId: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
  cashExpenses: number;
  cashReceived: number;
  expectedCash: number;
  actualCashEnding?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  phone: string;
  nationalId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  joinDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  branchId: string;
}

export interface PayrollRecord {
  id: string;
  month: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending';
  paymentDate?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  referenceId?: string;
  notes?: string;
  warehouseId: string;
}

export interface CompanySettings {
  name: string;
  nameEn: string;
  slogan: string;
  taxNumber: string;
  commercialRecord: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  defaultCurrency: CurrencyCode;
  vatRate: number;
  enableVat: boolean;
  invoiceFooterNote: string;
  printThermalLogo: boolean;
  posAutoPrint: boolean;
}

// ==========================================
// RBAC & PERMISSIONS ENGINE TYPES (المرحلة الحالية)
// ==========================================

export type PermissionAction =
  | 'view'      // عرض
  | 'add'       // إضافة
  | 'edit'      // تعديل
  | 'delete'    // حذف
  | 'approve'   // اعتماد
  | 'post'      // ترحيل
  | 'print'     // طباعة
  | 'export';   // تصدير

export type ERPModule =
  | 'accounting'    // المحاسبة
  | 'sales'         // المبيعات
  | 'purchases'     // المشتريات
  | 'inventory'     // المخزون
  | 'manufacturing' // التصنيع
  | 'treasury'      // الصندوق والبنوك
  | 'assets'        // الأصول
  | 'payroll'       // الرواتب
  | 'reports';      // التقارير

export type ModulePermissions = Record<PermissionAction, boolean>;

export type RolePermissions = Record<ERPModule, ModulePermissions>;

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemAdmin: boolean; // مدير النظام يمتلك كافة الصلاحيات ولا يمكن حذفه
  isActive: boolean;      // تمكين أو تعطيل الدور
  permissions: RolePermissions;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ERPUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  allowedBranchIds: string[]; // ['*'] لجميع الفروع أو معرفات فروع محددة
  companyAccess: string[];    // الشركات المسموح له بها
  avatar?: string;
  createdAt: string;
}

export type AuditActionType =
  | 'create_role'
  | 'update_role'
  | 'toggle_role_status'
  | 'delete_role'
  | 'create_user'
  | 'update_user'
  | 'assign_user_role'
  | 'update_user_branches'
  | 'toggle_user_status'
  | 'security_access_denied';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditActionType;
  actionTitle: string;
  targetType: 'role' | 'user' | 'permission' | 'module';
  targetId: string;
  targetName: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'critical';
}

export type ActiveScreen =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'transfers'
  | 'quotations'
  | 'finance'
  | 'cost_centers'
  | 'reports'
  | 'statement_ledger'
  | 'hr'
  | 'barcode_labels'
  | 'roles'             // شاشة الأدوار والصلاحيات (جديد)
  | 'users_management'  // شاشة المستخدمين وتحديد الفروع (جديد)
  | 'audit_logs'        // سجل العمليات وتغيير الصلاحيات (جديد)
  | 'permission_tester' // شاشة اختبار الصلاحيات ومحاكاة المستخدمين (جديد)
  | 'settings';
