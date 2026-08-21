import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { InvoiceModal } from '../components/InvoiceModal';
import { NewPurchaseModal } from '../components/NewPurchaseModal';
import { CustomerSupplierModal } from '../components/CustomerSupplierModal';
import { Invoice, Supplier } from '../types/erp';

export const PurchasesScreen = () => {
  const { invoices, suppliers, formatCurrency } = useERP();

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const purchaseInvoices = invoices.filter((i) => i.type === 'purchase');

  // Filters
  const filteredPurchases = purchaseInvoices.filter((inv) => {
    return (
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  const totalPurchasesAmount = purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);

  return (
    <View style={styles.container}>
      <HeaderBar
        title="إدارة المشتريات والموردين"
        subtitle="أوامر الشراء، فواتير التوريد، والذمم الدائنة"
      />

      {/* Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'purchases' && styles.tabBtnActive]}
          onPress={() => setActiveTab('purchases')}
        >
          <Ionicons
            name="bag-handle-outline"
            size={16}
            color={activeTab === 'purchases' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabText, activeTab === 'purchases' && styles.tabTextActive]}>
            فواتير الشراء ({purchaseInvoices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'suppliers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('suppliers')}
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={activeTab === 'suppliers' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabText, activeTab === 'suppliers' && styles.tabTextActive]}>
            دليل الموردين ({suppliers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.sumLabel}>إجمالي المشتريات:</Text>
          <Text style={styles.sumVal}>{formatCurrency(totalPurchasesAmount)}</Text>
        </View>
        <View style={styles.sumDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.sumLabel}>مستحقات الموردين (ذمم دائنة):</Text>
          <Text style={[styles.sumVal, { color: '#DC2626' }]}>{formatCurrency(totalPayables)}</Text>
        </View>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'purchases'
                ? 'ابحث برقم فاتورة الشراء أو اسم المورد...'
                : 'ابحث باسم المورد أو رقم الهاتف...'
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
            if (activeTab === 'purchases') {
              setShowNewPurchaseModal(true);
            } else {
              setEditingSupplier(null);
              setShowSupplierModal(true);
            }
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addMainBtnText}>
            {activeTab === 'purchases' ? 'شراء جديد' : 'مورد جديد'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'purchases' ? (
        <FlatList
          data={filteredPurchases}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد فواتير مشتريات مسجلة</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.purCard}
              onPress={() => setSelectedInvoice(item)}
              activeOpacity={0.7}
            >
              <View style={styles.purCardTop}>
                <View style={styles.purNumRow}>
                  <Text style={styles.purNumber}>{item.invoiceNumber}</Text>
                  <View style={styles.purTypePill}>
                    <Text style={styles.purTypePillText}>توريد مخزني</Text>
                  </View>
                </View>
                <Text style={styles.purAmount}>{formatCurrency(item.grandTotal)}</Text>
              </View>

              <View style={styles.purCardMid}>
                <Text style={styles.purSuppName} numberOfLines={1}>
                  المورد: {item.supplierName}
                </Text>
                <Text style={styles.purCount}>{item.items.length} أصناف</Text>
              </View>

              <View style={styles.purCardBottom}>
                <Text style={styles.purDate}>
                  {new Date(item.date).toLocaleDateString('ar-SA')}
                </Text>
                <View style={styles.viewPurBtn}>
                  <Text style={styles.viewPurBtnText}>عرض الفاتورة</Text>
                  <Ionicons name="chevron-forward" size={12} color="#059669" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لم يتم العثور على موردين</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.suppCard}>
              <View style={styles.suppCardTop}>
                <View style={styles.suppAvatar}>
                  <Ionicons name="storefront" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suppName}>{item.name}</Text>
                  <Text style={styles.suppPhone}>هاتف: {item.phone}</Text>
                  {item.taxNumber && (
                    <Text style={styles.suppTax}>الرقم الضريبي: {item.taxNumber}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.suppEditBtn}
                  onPress={() => {
                    setEditingSupplier(item);
                    setShowSupplierModal(true);
                  }}
                >
                  <Ionicons name="pencil-sharp" size={15} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.suppCardBottom}>
                <View>
                  <Text style={styles.suppBalLabel}>الرصيد الدائن (مستحق للمورد):</Text>
                  <Text
                    style={[
                      styles.suppBalVal,
                      item.balance > 0 ? { color: '#DC2626' } : { color: '#059669' },
                    ]}
                  >
                    {formatCurrency(item.balance)}
                  </Text>
                </View>

                {item.address && (
                  <Text style={styles.suppAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                )}
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

      {/* New Purchase Modal */}
      <NewPurchaseModal
        visible={showNewPurchaseModal}
        onClose={() => setShowNewPurchaseModal(false)}
      />

      {/* Supplier Modal */}
      <CustomerSupplierModal
        visible={showSupplierModal}
        type="supplier"
        editItem={editingSupplier}
        onClose={() => setShowSupplierModal(false)}
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
    backgroundColor: '#059669',
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
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addMainBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  purCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  purNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  purTypePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purTypePillText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  purAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  purCardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  purSuppName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  purCount: {
    fontSize: 11,
    color: '#64748B',
  },
  purCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  purDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  viewPurBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewPurBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
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
  suppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suppCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  suppAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suppName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  suppPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  suppTax: {
    fontSize: 10,
    color: '#94A3B8',
  },
  suppEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  suppCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  suppBalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  suppBalVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  suppAddress: {
    fontSize: 10,
    color: '#64748B',
    maxWidth: 160,
  },
});
