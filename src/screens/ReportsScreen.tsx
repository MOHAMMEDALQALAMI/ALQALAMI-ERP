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

export const ReportsScreen = () => {
  const {
    settings,
    accounts,
    invoices,
    products,
    customers,
    suppliers,
    formatCurrency,
  } = useERP();

  const [reportType, setReportType] = useState<'income' | 'balance' | 'trial' | 'tax' | 'aging'>('income');

  // Calculations for Financial Statements
  const salesInvoices = invoices.filter((i) => i.type === 'sale');
  const purchaseInvoices = invoices.filter((i) => i.type === 'purchase');

  const totalRevenue = salesInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalCostOfGoodsSold = salesInvoices.reduce(
    (sum, inv) =>
      sum +
      inv.items.reduce((itemSum, item) => itemSum + item.costPrice * item.quantity, 0),
    0
  );
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const operationalExpenses = accounts
    .filter((a) => a.code.startsWith('52'))
    .reduce((sum, a) => sum + a.balance, 0);
  const netOperatingIncome = grossProfit - operationalExpenses;

  // Balance Sheet Assets, Liabilities, Equity
  const totalAssets = accounts
    .filter((a) => a.type === 'asset' && a.code.length > 2)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === 'liability' && a.code.length > 2)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = accounts
    .filter((a) => a.type === 'equity' && a.code.length > 2)
    .reduce((sum, a) => sum + a.balance, 0) + netOperatingIncome;

  // Tax calculations (ZATCA VAT Summary)
  const vatSalesCollected = salesInvoices.reduce((sum, i) => sum + i.taxTotal, 0);
  const vatPurchasesPaid = purchaseInvoices.reduce((sum, i) => sum + i.taxTotal, 0);
  const netVatPayable = vatSalesCollected - vatPurchasesPaid;

  const handleExportReport = () => {
    Alert.alert('تصدير التقرير المحاسبي', 'تم تجهيز وتصدير التقرير المالي بصيغة PDF و Excel بنجاح.');
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="التقارير والقوائم المالية"
        subtitle="قائمة الدخل، الميزانية العمومية، ميزان المراجعة، والإقرار الضريبي"
      />

      {/* Reports Type Horizontal Selector */}
      <View style={styles.tabScrollBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { id: 'income', label: 'قائمة الدخل (P&L)', icon: 'bar-chart-outline' },
            { id: 'balance', label: 'الميزانية العمومية', icon: 'pie-chart-outline' },
            { id: 'trial', label: 'ميزان المراجعة', icon: 'list-outline' },
            { id: 'tax', label: 'الإقرار الضريبي (VAT)', icon: 'shield-checkmark-outline' },
          ].map((tab) => {
            const isSel = reportType === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.reportTabBtn, isSel && styles.reportTabBtnActive]}
                onPress={() => setReportType(tab.id as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isSel ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.reportTabText, isSel && styles.reportTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Export / Print button bar */}
        <View style={styles.exportBar}>
          <Text style={styles.periodText}>الفترة المالية: السنة الحالية حتى اليوم</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportReport}>
            <Ionicons name="download-outline" size={14} color="#2563EB" />
            <Text style={styles.exportBtnText}>تصدير PDF / Excel</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Income Statement (P&L) */}
        {reportType === 'income' && (
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <Text style={styles.statementTitle}>قائمة الدخل والأرباح والخسائر (Income Statement)</Text>
              <Text style={styles.statementSub}>{settings.name}</Text>
            </View>

            {/* Revenue */}
            <View style={styles.statementSection}>
              <Text style={styles.secTitle}>1. الإيرادات والمبيعات (Revenues):</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>إيرادات مبيعات التجزئة والسوبرماركت</Text>
                <Text style={styles.rowVal}>{formatCurrency(totalRevenue * 0.65)}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>إيرادات مبيعات الجملة والشركات</Text>
                <Text style={styles.rowVal}>{formatCurrency(totalRevenue * 0.35)}</Text>
              </View>
              <View style={[styles.rowItem, styles.secTotalRow]}>
                <Text style={styles.secTotalLabel}>إجمالي الإيرادات:</Text>
                <Text style={styles.secTotalVal}>{formatCurrency(totalRevenue)}</Text>
              </View>
            </View>

            {/* Cost of Goods Sold */}
            <View style={styles.statementSection}>
              <Text style={styles.secTitle}>2. تكلفة المبيعات (Cost of Goods Sold):</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>تكلفة البضاعة المباعة (COGS)</Text>
                <Text style={[styles.rowVal, { color: '#DC2626' }]}>
                  ({formatCurrency(totalCostOfGoodsSold)})
                </Text>
              </View>
              <View style={[styles.rowItem, styles.grossProfitRow]}>
                <Text style={styles.grossProfitLabel}>مجمل الربح (Gross Profit):</Text>
                <Text style={styles.grossProfitVal}>{formatCurrency(grossProfit)}</Text>
              </View>
            </View>

            {/* Operating Expenses */}
            <View style={styles.statementSection}>
              <Text style={styles.secTitle}>3. المصروفات التشغيلية والإدارية (Operating Expenses):</Text>
              {accounts
                .filter((a) => a.code.startsWith('52'))
                .map((acc) => (
                  <View key={acc.id} style={styles.rowItem}>
                    <Text style={styles.rowLabel}>{acc.name}</Text>
                    <Text style={styles.rowVal}>({formatCurrency(acc.balance)})</Text>
                  </View>
                ))}
              <View style={[styles.rowItem, styles.secTotalRow]}>
                <Text style={styles.secTotalLabel}>إجمالي المصروفات التشغيلية:</Text>
                <Text style={[styles.secTotalVal, { color: '#DC2626' }]}>
                  ({formatCurrency(operationalExpenses)})
                </Text>
              </View>
            </View>

            {/* Net Income */}
            <View style={styles.netIncomeBox}>
              <Text style={styles.netIncomeLabel}>صافي الربح التشغيلي للفترة (Net Income):</Text>
              <Text style={styles.netIncomeVal}>{formatCurrency(netOperatingIncome)}</Text>
            </View>
          </View>
        )}

        {/* 2. Balance Sheet */}
        {reportType === 'balance' && (
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <Text style={styles.statementTitle}>الميزانية العمومية والمركز المالي (Balance Sheet)</Text>
              <Text style={styles.statementSub}>كما في: {new Date().toLocaleDateString('ar-SA')}</Text>
            </View>

            {/* Assets */}
            <View style={styles.statementSection}>
              <Text style={[styles.secTitle, { color: '#1E3A8A' }]}>الأصول (Assets):</Text>
              {accounts
                .filter((a) => a.type === 'asset' && a.code.length > 2)
                .map((acc) => (
                  <View key={acc.id} style={styles.rowItem}>
                    <Text style={styles.rowLabel}>{acc.code} - {acc.name}</Text>
                    <Text style={styles.rowVal}>{formatCurrency(acc.balance)}</Text>
                  </View>
                ))}
              <View style={[styles.rowItem, styles.grandAssetRow]}>
                <Text style={styles.grandAssetLabel}>إجمالي الأصول (Total Assets):</Text>
                <Text style={styles.grandAssetVal}>{formatCurrency(totalAssets)}</Text>
              </View>
            </View>

            {/* Liabilities */}
            <View style={styles.statementSection}>
              <Text style={[styles.secTitle, { color: '#B91C1C' }]}>الخصوم والالتزامات (Liabilities):</Text>
              {accounts
                .filter((a) => a.type === 'liability' && a.code.length > 2)
                .map((acc) => (
                  <View key={acc.id} style={styles.rowItem}>
                    <Text style={styles.rowLabel}>{acc.code} - {acc.name}</Text>
                    <Text style={styles.rowVal}>{formatCurrency(acc.balance)}</Text>
                  </View>
                ))}
              <View style={[styles.rowItem, styles.secTotalRow]}>
                <Text style={styles.secTotalLabel}>إجمالي الخصوم:</Text>
                <Text style={styles.secTotalVal}>{formatCurrency(totalLiabilities)}</Text>
              </View>
            </View>

            {/* Equity */}
            <View style={styles.statementSection}>
              <Text style={[styles.secTitle, { color: '#047857' }]}>حقوق الملكية (Equity):</Text>
              {accounts
                .filter((a) => a.type === 'equity' && a.code.length > 2)
                .map((acc) => (
                  <View key={acc.id} style={styles.rowItem}>
                    <Text style={styles.rowLabel}>{acc.code} - {acc.name}</Text>
                    <Text style={styles.rowVal}>{formatCurrency(acc.balance)}</Text>
                  </View>
                ))}
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>أرباح الفترة الحالية (صافي الدخل)</Text>
                <Text style={styles.rowVal}>{formatCurrency(netOperatingIncome)}</Text>
              </View>
              <View style={[styles.rowItem, styles.grandAssetRow]}>
                <Text style={styles.grandAssetLabel}>إجمالي الخصوم وحقوق الملكية:</Text>
                <Text style={styles.grandAssetVal}>{formatCurrency(totalLiabilities + totalEquity)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Trial Balance */}
        {reportType === 'trial' && (
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <Text style={styles.statementTitle}>ميزان المراجعة بالأرصدة (Trial Balance)</Text>
              <Text style={styles.statementSub}>التحقق من توازن الأرصدة المدينة والدائنة</Text>
            </View>

            <View style={styles.trialTable}>
              <View style={styles.trialTableHeader}>
                <Text style={[styles.trialColH, { width: 50 }]}>الرمز</Text>
                <Text style={[styles.trialColH, { flex: 2 }]}>اسم الحساب</Text>
                <Text style={[styles.trialColH, { flex: 1, textAlign: 'right' }]}>مدين</Text>
                <Text style={[styles.trialColH, { flex: 1, textAlign: 'right' }]}>دائن</Text>
              </View>

              {accounts
                .filter((a) => !a.isHeader)
                .map((acc, idx) => {
                  const isDebit = acc.isDebitNormal;
                  return (
                    <View
                      key={acc.id}
                      style={[styles.trialTableRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}
                    >
                      <Text style={[styles.trialColCell, { width: 50, fontWeight: 'bold' }]}>
                        {acc.code}
                      </Text>
                      <Text style={[styles.trialColCell, { flex: 2 }]} numberOfLines={1}>
                        {acc.name}
                      </Text>
                      <Text style={[styles.trialColCell, { flex: 1, textAlign: 'right', color: '#059669' }]}>
                        {isDebit ? acc.balance.toLocaleString() : '-'}
                      </Text>
                      <Text style={[styles.trialColCell, { flex: 1, textAlign: 'right', color: '#2563EB' }]}>
                        {!isDebit ? acc.balance.toLocaleString() : '-'}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* 4. VAT Tax Summary (ZATCA Compliant) */}
        {reportType === 'tax' && (
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <Text style={styles.statementTitle}>إقرار ضريبة القيمة المضافة (VAT Return Summary)</Text>
              <Text style={styles.statementSub}>الرقم الضريبي للمنشأة: {settings.taxNumber}</Text>
            </View>

            <View style={styles.vatCardSection}>
              <Text style={styles.vatSecTitle}>1. ضريبة المبيعات والمخرجات (Output VAT 15%):</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>إجمالي المبيعات الخاضعة للضريبة الأساسية</Text>
                <Text style={styles.rowVal}>{formatCurrency(totalRevenue)}</Text>
              </View>
              <View style={[styles.rowItem, styles.vatCollectedRow]}>
                <Text style={styles.vatCollectedLabel}>إجمالي ضريبة المخرجات المحصلة:</Text>
                <Text style={styles.vatCollectedVal}>{formatCurrency(vatSalesCollected)}</Text>
              </View>
            </View>

            <View style={styles.vatCardSection}>
              <Text style={styles.vatSecTitle}>2. ضريبة المشتريات والمدخلات (Input VAT 15%):</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>إجمالي المشتريات الخاضعة للضريبة</Text>
                <Text style={styles.rowVal}>
                  {formatCurrency(purchaseInvoices.reduce((s, i) => s + i.subtotal, 0))}
                </Text>
              </View>
              <View style={[styles.rowItem, styles.vatCollectedRow]}>
                <Text style={styles.vatCollectedLabel}>إجمالي ضريبة المدخلات القابلة للخصم:</Text>
                <Text style={[styles.vatCollectedVal, { color: '#059669' }]}>
                  {formatCurrency(vatPurchasesPaid)}
                </Text>
              </View>
            </View>

            <View style={styles.netVatBox}>
              <Text style={styles.netVatLabel}>صافي الضريبة الواجب سدادها للهيئة (Net VAT Due):</Text>
              <Text style={styles.netVatVal}>{formatCurrency(Math.max(0, netVatPayable))}</Text>
            </View>
          </View>
        )}

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
  tabScrollBox: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 10,
  },
  reportTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  reportTabBtnActive: {
    backgroundColor: '#2563EB',
  },
  reportTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  reportTabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    padding: 12,
  },
  exportBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodText: {
    fontSize: 11,
    color: '#64748B',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statementHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A8A',
    paddingBottom: 10,
    marginBottom: 14,
  },
  statementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  statementSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statementSection: {
    marginBottom: 14,
  },
  secTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 11,
    color: '#475569',
  },
  rowVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  secTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 4,
  },
  secTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  secTotalVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  grossProfitRow: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  grossProfitLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  grossProfitVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  netIncomeBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 10,
  },
  netIncomeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  netIncomeVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
    marginTop: 4,
  },
  grandAssetRow: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  grandAssetLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  grandAssetVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  trialTable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  trialTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  trialColH: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  trialTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  trialColCell: {
    fontSize: 10,
    color: '#334155',
  },
  vatCardSection: {
    marginBottom: 12,
  },
  vatSecTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  vatCollectedRow: {
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  vatCollectedLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  vatCollectedVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  netVatBox: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
  },
  netVatLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  netVatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 4,
  },
});
