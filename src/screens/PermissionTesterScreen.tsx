import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { ERP_MODULES, PERMISSION_ACTIONS } from '../data/rbacInitialData';
import { ERPModule, PermissionAction } from '../types/erp';

export const PermissionTesterScreen = () => {
  const {
    erpUsers,
    currentUserId,
    switchSimulatedUser,
    currentUser,
    currentUserRole,
    hasPermission,
    canAccessModule,
    canAccessBranch,
    branches,
    createSaleInvoice,
    createPurchaseInvoice,
    addJournalEntry,
    addVoucher,
    adjustStock,
    activeBranchId,
    setActiveBranchId,
    formatCurrency,
  } = useERP();

  const [testResult, setTestResult] = useState<{
    status: 'success' | 'blocked';
    message: string;
    timestamp: string;
  } | null>(null);

  // Live real permission invocation test
  const handleExecuteRealActionTest = async (module: ERPModule, action: PermissionAction, actionName: string) => {
    try {
      if (module === 'sales' && action === 'add') {
        await createSaleInvoice({
          items: [
            {
              productId: 'p-1',
              productName: 'أرز بسمتي الشعلان 10 كجم',
              barcode: '628100100101',
              unit: 'كيس',
              quantity: 1,
              unitPrice: 85,
              costPrice: 62,
              discount: 0,
              taxRate: 15,
              taxAmount: 12.75,
              total: 97.75,
            },
          ],
          paymentMethod: 'cash',
          paidAmount: 97.75,
        });
      } else if (module === 'purchases' && action === 'add') {
        await createPurchaseInvoice({
          supplierId: 's-1',
          supplierName: 'شركة المراعي',
          items: [
            {
              productId: 'p-4',
              productName: 'حليب المراعي طويل الأجل',
              barcode: '628100100104',
              unit: 'كرتون',
              quantity: 2,
              unitPrice: 48,
              costPrice: 48,
              discount: 0,
              taxRate: 15,
              taxAmount: 14.4,
              total: 110.4,
            },
          ],
          paymentMethod: 'cash',
          paidAmount: 110.4,
        });
      } else if (module === 'accounting' && action === 'add') {
        await addJournalEntry({
          date: new Date().toISOString(),
          referenceType: 'manual',
          description: 'قيد اختبار صلاحيات أمني',
          lines: [
            { accountId: 'acc-1101', accountCode: '1101', accountName: 'صندوق النقدية', debit: 100, credit: 0 },
            { accountId: 'acc-4101', accountCode: '4101', accountName: 'إيرادات مبيعات', debit: 0, credit: 100 },
          ],
          totalDebit: 100,
          totalCredit: 100,
          branchId: activeBranchId,
          createdBy: currentUser.name,
        });
      } else if (module === 'treasury' && action === 'add') {
        await addVoucher({
          type: 'receipt',
          date: new Date().toISOString(),
          amount: 50,
          paymentMethod: 'cash',
          accountId: 'acc-1101',
          accountName: 'صندوق النقدية الرئيسي',
          partyType: 'customer',
          partyName: 'عميل اختبار',
          description: 'سند اختبار حقيقي للصلاحيات',
          branchId: activeBranchId,
          treasuryId: 'acc-1101',
          createdBy: currentUser.name,
        });
      } else if (module === 'inventory' && action === 'edit') {
        await adjustStock('p-1', 1, 'تسوية اختبار صلاحيات');
      } else {
        // Generic permission verification check
        if (!hasPermission(module, action, activeBranchId)) {
          throw new Error(`غير مصرح للمستخدم (${currentUser.name}) بإجراء "${actionName}" على قسم (${module}).`);
        }
      }

      setTestResult({
        status: 'success',
        message: `✓ نجاح التنفيذ: يمتلك المستخدم (${currentUser.name}) صلاحية [${actionName}] في قسم [${module}] وتم التحقق الأمني بنجاح.`,
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    } catch (err: any) {
      setTestResult({
        status: 'blocked',
        message: `✕ تم الحظر الأمني: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="مختبر التحقق من الصلاحيات والأدوار"
        subtitle="محاكاة المستخدمين واختبار جدار الحماية الأمني الفعلي"
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step 1: User Simulator Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.secTitle}>1. اختر المستخدم لمحاكاة دوره وصلاحياته المحددة:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {erpUsers.map((u) => {
              const isSel = u.id === currentUserId;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userChip, isSel && styles.userChipActive]}
                  onPress={() => switchSimulatedUser(u.id)}
                >
                  <View style={styles.userChipTop}>
                    <Ionicons
                      name={isSel ? 'radio-button-on' : 'person-circle-outline'}
                      size={16}
                      color={isSel ? '#FFFFFF' : '#2563EB'}
                    />
                    <Text style={[styles.userChipName, isSel && styles.userChipNameActive]}>
                      {u.name}
                    </Text>
                  </View>
                  <Text style={[styles.userChipRole, isSel && styles.userChipRoleActive]}>
                    {u.roleName}
                  </Text>
                  <Text style={[styles.userChipBranch, isSel && styles.userChipBranchActive]}>
                    الفروع: {u.allowedBranchIds.includes('*') ? 'كل الفروع' : u.allowedBranchIds.join(', ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Current User Security Profile */}
        <View style={styles.profileBox}>
          <View style={styles.profileHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileTitle}>الملف الأمني النشط: {currentUser.name}</Text>
              <Text style={styles.profileSub}>
                الدور: {currentUserRole.name} {currentUserRole.isSystemAdmin ? '★ (صلاحيات كاملة)' : ''}
              </Text>
            </View>
            <View
              style={[
                styles.adminPill,
                currentUserRole.isSystemAdmin ? styles.pillAdmin : styles.pillRole,
              ]}
            >
              <Text style={styles.adminPillText}>
                {currentUserRole.isSystemAdmin ? 'مدير نظام (Super Admin)' : 'دور مخصص'}
              </Text>
            </View>
          </View>

          {/* Branch Access Checker */}
          <Text style={styles.branchCheckTitle}>صلاحيات الوصول حسب الفروع:</Text>
          <View style={styles.branchesCheckRow}>
            {branches.map((b) => {
              const hasBranch = canAccessBranch(b.id);
              return (
                <View
                  key={b.id}
                  style={[
                    styles.branchBadge,
                    hasBranch ? styles.branchAllowed : styles.branchBlocked,
                  ]}
                >
                  <Ionicons
                    name={hasBranch ? 'checkmark-circle' : 'close-circle'}
                    size={14}
                    color={hasBranch ? '#059669' : '#DC2626'}
                  />
                  <Text style={[styles.branchBadgeText, hasBranch ? { color: '#065F46' } : { color: '#991B1B' }]}>
                    {b.city}: {hasBranch ? 'مسموح' : 'محظور'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Live Execution Result Banner */}
        {testResult && (
          <View
            style={[
              styles.testResultBox,
              testResult.status === 'success' ? styles.resSuccess : styles.resBlocked,
            ]}
          >
            <View style={styles.resTop}>
              <Ionicons
                name={testResult.status === 'success' ? 'shield-checkmark' : 'shield-half'}
                size={20}
                color={testResult.status === 'success' ? '#059669' : '#DC2626'}
              />
              <Text
                style={[
                  styles.resStatusTitle,
                  testResult.status === 'success' ? { color: '#065F46' } : { color: '#991B1B' },
                ]}
              >
                نتيجة الفحص الأمني المباشر:
              </Text>
              <Text style={styles.resTime}>{testResult.timestamp}</Text>
            </View>
            <Text style={styles.resMessage}>{testResult.message}</Text>
          </View>
        )}

        {/* Step 2: Live Test Actions Grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.secTitle}>2. اختبر تنفيذ عمليات فعلية للتحقق من جدار الحماية الأمني:</Text>
          <Text style={styles.secSub}>
            انقر على أي عملية لاختبار استجابة النظام ومطابقة الصلاحية المحددة للدور:
          </Text>

          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('sales', 'add', 'إصدار فاتورة مبيعات')}
            >
              <Ionicons name="cart" size={16} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>إصدار فاتورة بيع (Sales Add)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('sales', 'add') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('purchases', 'add', 'إنشاء فاتورة شراء')}
            >
              <Ionicons name="bag-add" size={16} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>إنشاء فاتورة شراء (Purchases Add)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('purchases', 'add') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('accounting', 'add', 'ترحيل قيد يومية')}
            >
              <Ionicons name="book" size={16} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>ترحيل قيد يومية (Accounting Add)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('accounting', 'add') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('treasury', 'add', 'إصدار سند قبض')}
            >
              <Ionicons name="wallet" size={16} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>إصدار سند قبض (Treasury Add)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('treasury', 'add') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('inventory', 'edit', 'تسوية رصيد مخزني')}
            >
              <Ionicons name="cube" size={16} color="#0891B2" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>تعديل رصيد المخزون (Inventory Edit)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('inventory', 'edit') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTestBtn}
              onPress={() => handleExecuteRealActionTest('reports', 'export', 'تصدير القوائم المالية')}
            >
              <Ionicons name="bar-chart" size={16} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTestTitle}>تصدير التقارير (Reports Export)</Text>
                <Text style={styles.actionTestDesc}>
                  الحالة: {hasPermission('reports', 'export') ? '✓ مصرح' : '✕ غير مصرح'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 9 Modules Matrix Readout */}
        <View style={styles.sectionCard}>
          <Text style={styles.secTitle}>3. مصفوفة الصلاحيات الكاملة للمستخدم النشط:</Text>
          <View style={styles.matrixTable}>
            <View style={styles.matrixHeaderRow}>
              <Text style={[styles.mTh, { flex: 2 }]}>القسم (Module)</Text>
              {PERMISSION_ACTIONS.map((a) => (
                <Text key={a.id} style={[styles.mTh, { flex: 1, textAlign: 'center' }]}>
                  {a.name}
                </Text>
              ))}
            </View>

            {ERP_MODULES.map((mod, idx) => (
              <View key={mod.id} style={[styles.matrixRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                <Text style={[styles.mTd, { flex: 2, fontWeight: 'bold' }]} numberOfLines={1}>
                  {mod.name}
                </Text>
                {PERMISSION_ACTIONS.map((act) => {
                  const allowed = hasPermission(mod.id, act.id);
                  return (
                    <View key={act.id} style={{ flex: 1, alignItems: 'center' }}>
                      <Ionicons
                        name={allowed ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={allowed ? '#059669' : '#CBD5E1'}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  body: {
    padding: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  secSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  userChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 170,
  },
  userChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  userChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userChipName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userChipNameActive: {
    color: '#FFFFFF',
  },
  userChipRole: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 3,
  },
  userChipRoleActive: {
    color: '#E0E7FF',
  },
  userChipBranch: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 2,
  },
  userChipBranchActive: {
    color: '#BFDBFE',
  },
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  adminPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillAdmin: {
    backgroundColor: '#ECFDF5',
  },
  pillRole: {
    backgroundColor: '#EFF6FF',
  },
  adminPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  branchCheckTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  branchesCheckRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  branchAllowed: {
    backgroundColor: '#ECFDF5',
  },
  branchBlocked: {
    backgroundColor: '#FEF2F2',
  },
  branchBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  testResultBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  resSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  resBlocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resStatusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  resTime: {
    fontSize: 9,
    color: '#64748B',
  },
  resMessage: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 16,
  },
  actionButtonsGrid: {
    gap: 8,
  },
  actionTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionTestTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  actionTestDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  matrixTable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 6,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  mTh: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mTd: {
    fontSize: 10,
    color: '#0F172A',
  },
});
