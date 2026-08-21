import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { Quotation, InvoiceItem } from '../types/erp';

export const QuotationsScreen = () => {
  const {
    quotations,
    createQuotation,
    convertQuotationToInvoice,
    customers,
    products,
    formatCurrency,
    settings,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewQuotModal, setShowNewQuotModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 'c-1');
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleAddItem = (prod: any) => {
    const isWholesale = customer?.priceLevel === 'wholesale';
    const price = isWholesale ? prod.wholesalePrice : prod.sellingPrice;
    const taxRate = settings.enableVat ? prod.taxRate : 0;
    const sub = 1 * price;
    const taxAmount = (sub * taxRate) / 100;

    const newItem: InvoiceItem = {
      productId: prod.id,
      productName: prod.name,
      barcode: prod.barcode,
      unit: prod.unit,
      quantity: 1,
      unitPrice: price,
      costPrice: prod.costPrice,
      discount: 0,
      taxRate,
      taxAmount,
      total: sub + taxAmount,
    };
    setSelectedItems([newItem, ...selectedItems]);
  };

  const handleSaveQuotation = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('تنبيه', 'يرجى إضافة صنف واحد على الأقل في عرض السعر.');
      return;
    }

    const subtotal = selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const taxTotal = selectedItems.reduce((sum, i) => sum + i.taxAmount, 0);
    const grandTotal = subtotal + taxTotal;

    await createQuotation({
      date: new Date().toISOString(),
      validUntil: '2025-07-31',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: selectedItems,
      subtotal,
      taxTotal,
      grandTotal,
      status: 'sent',
      notes: notes || 'عرض أسعار معتمد',
    });

    Alert.alert('تم الحفظ', 'تم إصدار عرض السعر بنجاح.');
    setSelectedItems([]);
    setNotes('');
    setShowNewQuotModal(false);
  };

  const handleConvert = (quot: Quotation) => {
    Alert.alert(
      'تحويل إلى فاتورة مبيعات',
      `هل ترغب في اعتماد عرض السعر رقم (${quot.quotationNumber}) وتحويله تلقائياً إلى فاتورة مبيعات ضريبية مسجلة وخصم البضاعة من المخزون؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، تحويل الآن',
          onPress: async () => {
            try {
              const inv = await convertQuotationToInvoice(quot.id);
              Alert.alert('نجاح العملية', `تم تحويل العرض إلى فاتورة رقم: ${inv.invoiceNumber}`);
            } catch (e: any) {
              Alert.alert('خطأ', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="عروض الأسعار وأوامر البيع"
        subtitle="إصدار عروض رسمية وتحويلها إلى فواتير بضغطة زر"
      />

      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث برقم العرض أو اسم العميل..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowNewQuotModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>عرض سعر جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredQuotations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isConverted = item.status === 'converted';
          return (
            <View style={styles.quotCard}>
              <View style={styles.quotTop}>
                <View style={styles.quotLeft}>
                  <Text style={styles.quotNumber}>{item.quotationNumber}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isConverted ? styles.pillConverted : styles.pillSent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isConverted ? styles.textConverted : styles.textSent,
                      ]}
                    >
                      {isConverted ? 'محول لفاتورة' : 'عرض سعر ساري'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.quotAmount}>{formatCurrency(item.grandTotal)}</Text>
              </View>

              <Text style={styles.quotCustomer}>العميل: {item.customerName}</Text>
              <Text style={styles.quotItemsCount}>{item.items.length} أصناف مسجلة</Text>

              {item.notes && <Text style={styles.quotNotes}>{item.notes}</Text>}

              <View style={styles.quotBottom}>
                <Text style={styles.quotDate}>
                  تاريخ العرض: {new Date(item.date).toLocaleDateString('ar-SA')}
                </Text>

                {!isConverted && (
                  <TouchableOpacity
                    style={styles.convertBtn}
                    onPress={() => handleConvert(item)}
                  >
                    <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                    <Text style={styles.convertBtnText}>تحويل إلى فاتورة بيع</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* New Quotation Modal */}
      <Modal visible={showNewQuotModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إنشاء عرض أسعار جديد</Text>
              <TouchableOpacity onPress={() => setShowNewQuotModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 14 }}>
              <Text style={styles.label}>اختر العميل:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {customers.map((c) => {
                  const isSel = c.id === selectedCustomerId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, isSel && styles.chipActive]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>أضف أصناف العرض:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {products.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.prodChip}
                    onPress={() => handleAddItem(p)}
                  >
                    <Text style={styles.prodChipName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.prodChipPrice}>{p.sellingPrice} ر.س</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Items Table */}
              <View style={{ marginTop: 6 }}>
                {selectedItems.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={{ flex: 2, fontSize: 11, fontWeight: 'bold' }} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 11, textAlign: 'center' }}>
                      {item.quantity} {item.unit}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 11, textAlign: 'right', fontWeight: 'bold', color: '#2563EB' }}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 10 }]}>ملاحظات وشروط العرض:</Text>
              <TextInput
                style={styles.input}
                placeholder="شروط التسليم والدفع..."
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewQuotModal(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuotation}>
                <Text style={styles.saveBtnText}>حفظ وإصدار العرض</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBarRow: {
    flexDirection: 'row',
    padding: 12,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  quotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quotNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillSent: {
    backgroundColor: '#EFF6FF',
  },
  pillConverted: {
    backgroundColor: '#ECFDF5',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  textSent: {
    color: '#2563EB',
  },
  textConverted: {
    color: '#059669',
  },
  quotAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  quotCustomer: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  quotItemsCount: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  quotNotes: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  quotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 6,
  },
  quotDate: {
    fontSize: 10,
    color: '#64748B',
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  convertBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  prodChip: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
    width: 120,
  },
  prodChipName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  prodChipPrice: {
    fontSize: 10,
    color: '#2563EB',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
