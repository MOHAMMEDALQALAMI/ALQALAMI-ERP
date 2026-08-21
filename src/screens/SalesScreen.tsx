import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { InvoiceModal } from '../components/InvoiceModal';
import { NewSaleModal } from '../components/NewSaleModal';
import { CustomerSupplierModal } from '../components/CustomerSupplierModal';
import { Customer, Invoice } from '../types/erp';

export const SalesScreen = () => {
  const { invoices, customers, formatCurrency } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const salesInvoices = invoices.filter((i) => i.type === 'sale');

  // Filtered invoices
  const filteredInvoices = salesInvoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalSalesVal = salesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);

  return (
    <View style={styles.container}>
      <HeaderBar title="إدارة المبيعات والعملاء" subtitle="فواتير ضريبية، كشوف حسابات العملاء والذمم" />

      {/* Segment Tabs (Invoices vs Customers) */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'invoices' && styles.tabBtnActive]}
          onPress={() => setActiveTab('invoices')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'invoices' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
            فواتير المبيعات ({salesInvoices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'customers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === 'customers' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
            دليل العملاء ({customers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.sumLabel}>إجمالي المبيعات:</Text>
          <Text style={styles.sumVal}>{formatCurrency(totalSalesVal)}</Text>
        </View>
        <View style={styles.sumDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.sumLabel}>إجمالي الديون والذمم:</Text>
          <Text style={[styles.sumVal, { color: '#D97706' }]}>{formatCurrency(totalReceivables)}</Text>
        </View>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'invoices'
                ? 'ابحث برقم الفاتورة أو اسم العميل...'
                : 'ابحث باسم العميل أو رقم الجوال...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addMainBtn}
          onPress={() => {
            if (activeTab === 'invoices') {
              setShowNewSaleModal(true);
            } else {
              setEditingCustomer(null);
              setShowCustomerModal(true);
            }
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addMainBtnText}>
            {activeTab === 'invoices' ? 'فاتورة بيع' : 'عميل جديد'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filters (Only for Invoices) */}
      {activeTab === 'invoices' && (
        <View style={styles.statusFilterRow}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'paid', label: 'مدفوعة' },
            { id: 'partial', label: 'جزئية' },
            { id: 'unpaid', label: 'آجلة' },
          ].map((st) => {
            const isSel = statusFilter === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                style={[styles.stFilterBtn, isSel && styles.stFilterBtnActive]}
                onPress={() => setStatusFilter(st.id as any)}
              >
                <Text style={[styles.stFilterText, isSel && styles.stFilterTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Content List */}
      {activeTab === 'invoices' ? (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد فواتير تطابق معايير البحث</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.invCard}
              onPress={() => setSelectedInvoice(item)}
              activeOpacity={0.7}
            >
              <View style={styles.invCardTop}>
                <View style={styles.invNumRow}>
                  <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'paid'
                        ? styles.stPaid
                        : item.status === 'partial'
                        ? styles.stPart
                        : styles.stUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stText,
                        item.status === 'paid'
                          ? styles.stPaidText
                          : item.status === 'partial'
                          ? styles.stPartText
                          : styles.stUnpaidText,
                      ]}
                    >
                      {item.status === 'paid'
                        ? 'مدفوعة'
                        : item.status === 'partial'
                        ? 'سداد جزئي'
                        : 'آجلة (غير مسددة)'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.invAmount}>{formatCurrency(item.grandTotal)}</Text>
              </View>

              <View style={styles.invCardMid}>
                <Text style={styles.invCustomerName} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <Text style={styles.invItemsCount}>{item.items.length} أصناف</Text>
              </View>

              <View style={styles.invCardBottom}>
                <Text style={styles.invDate}>
                  {new Date(item.date).toLocaleDateString('ar-SA')} - {new Date(item.date).toLocaleTimeString('ar-SA')}
                </Text>
                <View style={styles.viewInvBtn}>
                  <Text style={styles.viewInvBtnText}>معاينة وطباعة</Text>
                  <Ionicons name="chevron-forward" size={12} color="#2563EB" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لم يتم العثور على عملاء</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.custCard}>
              <View style={styles.custCardTop}>
                <View style={styles.custAvatar}>
                  <Ionicons name="person" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.custName}>{item.name}</Text>
                  <Text style={styles.custPhone}>هاتف: {item.phone}</Text>
                  {item.taxNumber && (
                    <Text style={styles.custTax}>الرقم الضريبي: {item.taxNumber}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.custEditBtn}
                  onPress={() => {
                    setEditingCustomer(item);
                    setShowCustomerModal(true);
                  }}
                >
                  <Ionicons name="pencil-sharp" size={15} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.custCardBottom}>
                <View>
                  <Text style={styles.custBalLabel}>الرصيد المدين (المستحق):</Text>
                  <Text
                    style={[
                      styles.custBalVal,
                      item.balance > 0 ? { color: '#DC2626' } : { color: '#059669' },
                    ]}
                  >
                    {formatCurrency(item.balance)}
                  </Text>
                </View>

                <View style={styles.custLimitBox}>
                  <Text style={styles.custLimitLabel}>الحد الائتماني: {formatCurrency(item.creditLimit)}</Text>
                  <Text style={styles.custTier}>فئة: {item.priceLevel === 'wholesale' ? 'جملة' : 'تجزئة'}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Invoice Details Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        visible={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* New Sale Modal */}
      <NewSaleModal
        visible={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSuccess={(id) => {
          const inv = invoices.find((i) => i.id === id);
          if (inv) setSelectedInvoice(inv);
        }}
      />

      {/* Customer Modal */}
      <CustomerSupplierModal
        visible={showCustomerModal}
        type="customer"
        editItem={editingCustomer}
        onClose={() => setShowCustomerModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topTabs: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  sumDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  sumLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addMainBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  stFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stFilterBtnActive: {
    backgroundColor: '#1E293B',
  },
  stFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stFilterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  invCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  invCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  stPaid: {
    backgroundColor: '#ECFDF5',
  },
  stPaidText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stPart: {
    backgroundColor: '#FEF3C7',
  },
  stPartText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stUnpaid: {
    backgroundColor: '#FEF2F2',
  },
  stUnpaidText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stText: {},
  invAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  invCardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invCustomerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  invItemsCount: {
    fontSize: 11,
    color: '#64748B',
  },
  invCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  invDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  viewInvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewInvBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  custCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  custCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  custAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  custName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  custPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  custTax: {
    fontSize: 10,
    color: '#94A3B8',
  },
  custEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  custCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  custBalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  custBalVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  custLimitBox: {
    alignItems: 'flex-end',
  },
  custLimitLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  custTier: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
    marginTop: 1,
  },
});
