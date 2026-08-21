import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { StatCard } from '../components/StatCard';
import { HeaderBar } from '../components/HeaderBar';
import { InvoiceModal } from '../components/InvoiceModal';
import { ShiftModal } from '../components/ShiftModal';
import { LowStockModal } from '../components/LowStockModal';
import { NewSaleModal } from '../components/NewSaleModal';
import { NewPurchaseModal } from '../components/NewPurchaseModal';
import { NewVoucherModal } from '../components/NewVoucherModal';
import { Invoice } from '../types/erp';

export const DashboardScreen = () => {
  const {
    settings,
    formatCurrency,
    invoices,
    products,
    customers,
    suppliers,
    currentShift,
    accounts,
    setActiveScreen,
    toggleSidebar,
    setCalculatorVisible,
  } = useERP();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);
  const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('receipt');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const salesInvoices = invoices.filter((i) => i.type === 'sale');
  const purchaseInvoices = invoices.filter((i) => i.type === 'purchase');

  const totalSalesAmount = salesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPurchasesAmount = purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTaxCollected = salesInvoices.reduce((sum, i) => sum + i.taxTotal, 0);

  const totalCostOfGoodsSold = salesInvoices.reduce(
    (sum, inv) =>
      sum +
      inv.items.reduce((itemSum, item) => itemSum + item.costPrice * item.quantity, 0),
    0
  );
  const estimatedGrossProfit = Math.max(0, totalSalesAmount - totalTaxCollected - totalCostOfGoodsSold);

  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const liquidCash = accounts
    .filter((a) => a.code === '1101' || a.code === '1102' || a.code === '1103' || a.code === '1104')
    .reduce((sum, a) => sum + a.balance, 0);

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  const weeklyData = [
    { day: 'السبت', amount: 4800, height: 48 },
    { day: 'الأحد', amount: 6200, height: 62 },
    { day: 'الاثنين', amount: 7800, height: 78 },
    { day: 'الثلاثاء', amount: 5900, height: 58 },
    { day: 'الأربعاء', amount: 9400, height: 92 },
    { day: 'الخميس', amount: 12500, height: 118 },
    { day: 'الجمعة', amount: 14200, height: 130 },
  ];

  return (
    <View style={styles.container}>
      <HeaderBar
        title="ALQALAMI ERP"
        subtitle="لوحة القيادة والمؤشرات التنفيذية"
        onOpenShiftModal={() => setShowShiftModal(true)}
        onOpenLowStockModal={() => setShowLowStockModal(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Drawer Navigation Banner */}
        <TouchableOpacity
          style={styles.drawerQuickBanner}
          onPress={toggleSidebar}
          activeOpacity={0.8}
        >
          <View style={styles.drawerBannerLeft}>
            <View style={styles.drawerIconPill}>
              <Ionicons name="apps" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.drawerBannerTitle}>القائمة الجانبية والأقسام الشاملة</Text>
              <Text style={styles.drawerBannerSubtitle}>انقر لفتح 14 قسماً ووحدة محاسبية متقدمة</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#60A5FA" />
        </TouchableOpacity>

        {/* Low Stock Warning */}
        {lowStockCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setShowLowStockModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.alertLeft}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View>
                <Text style={styles.alertTitle}>تنبيه نواقص المخزون!</Text>
                <Text style={styles.alertSub}>
                  يوجد {lowStockCount} أصناف وصلت للحد الحرج لإعادة الطلب
                </Text>
              </View>
            </View>
            <View style={styles.alertActionBtn}>
              <Text style={styles.alertActionText}>عرض النواقص</Text>
              <Ionicons name="chevron-forward" size={14} color="#DC2626" />
            </View>
          </TouchableOpacity>
        )}

        {/* Executive KPI Stats Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard
              title="إجمالي المبيعات المحققة"
              value={formatCurrency(totalSalesAmount)}
              subtitle={`${salesInvoices.length} فواتير بيع`}
              icon="cart-outline"
              iconColor="#2563EB"
              bgColor="#EFF6FF"
              trend="+14.8%"
              trendPositive={true}
              onPress={() => setActiveScreen('sales')}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="صافي الأرباح المقدرة"
              value={formatCurrency(estimatedGrossProfit)}
              subtitle="هامش ربح إجمالي ~28%"
              icon="trending-up-outline"
              iconColor="#059669"
              bgColor="#ECFDF5"
              trend="+9.2%"
              trendPositive={true}
              onPress={() => setActiveScreen('reports')}
            />
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard
              title="السيولة النقدية والبنوك"
              value={formatCurrency(liquidCash)}
              subtitle="الصناديق + الحسابات الجارية"
              icon="wallet-outline"
              iconColor="#7C3AED"
              bgColor="#F5F3FF"
              onPress={() => setActiveScreen('finance')}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="الديون ومستحقات العملاء"
              value={formatCurrency(totalReceivables)}
              subtitle={`مستحقات على ${customers.filter((c) => c.balance > 0).length} عميل`}
              icon="people-outline"
              iconColor="#D97706"
              bgColor="#FEF3C7"
              trend="ذمم مدينة"
              trendPositive={false}
              onPress={() => setActiveScreen('statement_ledger')}
            />
          </View>
        </View>

        {/* Quick Operations Action Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الإجراءات والمعاملات الفورية</Text>
          <Text style={styles.sectionSubtitle}>إصدار الفواتير والسندات بضغطة زر</Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtnCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={() => setActiveScreen('pos')}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnTitle}>الكاشير POS السريع</Text>
            <Text style={styles.actionBtnDesc}>شاشة نقاط البيع للسوبرماركت</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={() => setShowNewSaleModal(true)}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="receipt" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnTitle}>فاتورة مبيعات ضريبية</Text>
            <Text style={styles.actionBtnDesc}>إصدار فاتورة بيع نقدية أو آجلة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={() => setShowNewPurchaseModal(true)}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#059669' }]}>
              <Ionicons name="bag-add" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnTitle}>فاتورة مشتريات وتوريد</Text>
            <Text style={styles.actionBtnDesc}>إدخال بضاعة للمستودع</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => {
              setVoucherType('payment');
              setShowNewVoucherModal(true);
            }}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: '#DC2626' }]}>
              <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnTitle}>سند صرف نقدية</Text>
            <Text style={styles.actionBtnDesc}>سداد مصاريف وموردين</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Revenue Visual Graph */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>حركة المبيعات الأسبوعية</Text>
              <Text style={styles.chartSubtitle}>مقارنة الإيرادات اليومية بالريال السعودي</Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>أسبوعي</Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            {weeklyData.map((item, idx) => (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barValText}>{(item.amount / 1000).toFixed(1)}k</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: item.height,
                        backgroundColor: idx === weeklyData.length - 1 ? '#2563EB' : '#93C5FD',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barDayText}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shift Summary Box if open */}
        {currentShift && currentShift.status === 'open' && (
          <View style={styles.shiftCard}>
            <View style={styles.shiftCardHeader}>
              <View style={styles.shiftLeft}>
                <Ionicons name="radio-button-on" size={16} color="#10B981" />
                <Text style={styles.shiftCardTitle}>الوردية النشطة #{currentShift.shiftNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowShiftModal(true)}>
                <Text style={styles.shiftCardLink}>تقرير الدرج</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.shiftStatsRow}>
              <View style={styles.shiftStatItem}>
                <Text style={styles.shiftStatLabel}>مبيعات الكاش:</Text>
                <Text style={styles.shiftStatVal}>{formatCurrency(currentShift.cashSales)}</Text>
              </View>
              <View style={styles.shiftStatItem}>
                <Text style={styles.shiftStatLabel}>مبيعات الشبكة:</Text>
                <Text style={styles.shiftStatVal}>{formatCurrency(currentShift.cardSales)}</Text>
              </View>
              <View style={styles.shiftStatItem}>
                <Text style={styles.shiftStatLabel}>المتوقع بالدرج:</Text>
                <Text style={[styles.shiftStatVal, { color: '#2563EB' }]}>
                  {formatCurrency(currentShift.expectedCash)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Invoices List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أحدث الفواتير والعمليات</Text>
          <TouchableOpacity onPress={() => setActiveScreen('sales')}>
            <Text style={styles.viewAllText}>عرض الكل ({invoices.length})</Text>
          </TouchableOpacity>
        </View>

        {invoices.slice(0, 5).map((inv) => {
          const isSale = inv.type === 'sale';
          return (
            <TouchableOpacity
              key={inv.id}
              style={styles.invoiceItem}
              onPress={() => setSelectedInvoice(inv)}
              activeOpacity={0.7}
            >
              <View style={styles.invoiceLeft}>
                <View
                  style={[
                    styles.invTypeBadge,
                    isSale ? styles.invSaleBadge : styles.invPurBadge,
                  ]}
                >
                  <Ionicons
                    name={isSale ? 'cart-outline' : 'bag-outline'}
                    size={16}
                    color={isSale ? '#2563EB' : '#059669'}
                  />
                </View>
                <View>
                  <Text style={styles.invNumber}>{inv.invoiceNumber}</Text>
                  <Text style={styles.invParty} numberOfLines={1}>
                    {isSale ? inv.customerName : inv.supplierName}
                  </Text>
                  <Text style={styles.invDate}>
                    {new Date(inv.date).toLocaleDateString('ar-SA')} - {new Date(inv.date).toLocaleTimeString('ar-SA')}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceRight}>
                <Text style={styles.invAmount}>{formatCurrency(inv.grandTotal)}</Text>
                <View
                  style={[
                    styles.invStatusPill,
                    inv.status === 'paid'
                      ? styles.statusPaid
                      : inv.status === 'partial'
                      ? styles.statusPartial
                      : styles.statusUnpaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      inv.status === 'paid'
                        ? styles.statusPaidText
                        : inv.status === 'partial'
                        ? styles.statusPartialText
                        : styles.statusUnpaidText,
                    ]}
                  >
                    {inv.status === 'paid'
                      ? 'مدفوعة'
                      : inv.status === 'partial'
                      ? 'سداد جزئي'
                      : 'آجلة'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <InvoiceModal
        invoice={selectedInvoice}
        visible={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <ShiftModal
        visible={showShiftModal}
        onClose={() => setShowShiftModal(false)}
      />

      <LowStockModal
        visible={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
        onOpenNewPurchase={() => setShowNewPurchaseModal(true)}
      />

      <NewSaleModal
        visible={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSuccess={(id) => {
          const inv = invoices.find((i) => i.id === id);
          if (inv) setSelectedInvoice(inv);
        }}
      />

      <NewPurchaseModal
        visible={showNewPurchaseModal}
        onClose={() => setShowNewPurchaseModal(false)}
      />

      <NewVoucherModal
        visible={showNewVoucherModal}
        defaultType={voucherType}
        onClose={() => setShowNewVoucherModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  drawerQuickBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  drawerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerIconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  drawerBannerSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  alertSub: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 1,
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCol: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  actionBtnCard: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtnDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  chartSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  chartBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chartBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 135,
    paddingTop: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    height: 95,
    width: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
  },
  barDayText: {
    fontSize: 9,
    color: '#475569',
    marginTop: 6,
    fontWeight: '600',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftCardLink: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  shiftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftStatItem: {
    flex: 1,
  },
  shiftStatLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  shiftStatVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  invTypeBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invSaleBadge: {
    backgroundColor: '#EFF6FF',
  },
  invPurBadge: {
    backgroundColor: '#ECFDF5',
  },
  invNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  invParty: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
    maxWidth: 160,
  },
  invDate: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  invStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  statusPaid: {
    backgroundColor: '#ECFDF5',
  },
  statusPaidText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  statusPartialText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusUnpaid: {
    backgroundColor: '#FEF2F2',
  },
  statusUnpaidText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusText: {},
});
