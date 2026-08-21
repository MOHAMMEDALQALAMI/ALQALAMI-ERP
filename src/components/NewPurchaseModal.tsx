import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { InvoiceItem, PaymentMethod, Product } from '../types/erp';

interface NewPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { suppliers, products, createPurchaseInvoice, formatCurrency, settings } = useERP();

  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || 's-1');
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const handleAddItem = (prod: Product) => {
    const taxRate = settings.enableVat ? prod.taxRate : 0;
    const existingIndex = selectedItems.findIndex((i) => i.productId === prod.id);

    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + 1;
      const sub = newQty * updated[existingIndex].unitPrice;
      const taxAmount = (sub * taxRate) / 100;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        taxAmount,
        total: sub + taxAmount,
      };
      setSelectedItems(updated);
    } else {
      const costPrice = prod.costPrice;
      const sub = 1 * costPrice;
      const taxAmount = (sub * taxRate) / 100;
      const newItem: InvoiceItem = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        unit: prod.unit,
        quantity: 1,
        unitPrice: costPrice,
        costPrice: costPrice,
        discount: 0,
        taxRate,
        taxAmount,
        total: sub + taxAmount,
      };
      setSelectedItems([newItem, ...selectedItems]);
    }
  };

  const handleUpdateItemPrice = (idx: number, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr) || 0;
    const updated = [...selectedItems];
    const cur = updated[idx];
    const sub = cur.quantity * newPrice - cur.discount;
    const taxAmount = (sub * cur.taxRate) / 100;
    updated[idx] = {
      ...cur,
      unitPrice: newPrice,
      costPrice: newPrice,
      taxAmount,
      total: sub + taxAmount,
    };
    setSelectedItems(updated);
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    const updated = [...selectedItems];
    const cur = updated[idx];
    const newQty = cur.quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      const sub = newQty * cur.unitPrice - cur.discount;
      const taxAmount = (sub * cur.taxRate) / 100;
      updated[idx] = {
        ...cur,
        quantity: newQty,
        taxAmount,
        total: sub + taxAmount,
      };
    }
    setSelectedItems(updated);
  };

  // Calculations
  const subtotal = selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const taxTotal = selectedItems.reduce((sum, i) => sum + i.taxAmount, 0);
  const grandTotal = subtotal + taxTotal;
  const paidAmount = paidAmountInput === '' ? grandTotal : parseFloat(paidAmountInput) || 0;
  const remaining = Math.max(0, grandTotal - paidAmount);

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('تنبيه', 'يرجى إضافة صنف مشتريات واحد على الأقل.');
      return;
    }

    try {
      const created = await createPurchaseInvoice({
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: selectedItems,
        paymentMethod,
        paidAmount,
        notes,
      });

      Alert.alert('تمت العملية', `تم تسجيل فاتورة الشراء وتحديث المخزون بنجاح: ${created.invoiceNumber}`);
      setSelectedItems([]);
      setPaidAmountInput('');
      setNotes('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء حفظ فاتورة الشراء');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="bag-add" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>فاتورة مشتريات وتوريد مخزني</Text>
                <Text style={styles.headerSubtitle}>إدخال بضائع للمستودع وإثبات التكلفة</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Supplier Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>المورد المعتمد:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suppliers.map((s) => {
                  const isSelected = s.id === selectedSupplierId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.suppChip, isSelected && styles.suppChipActive]}
                      onPress={() => setSelectedSupplierId(s.id)}
                    >
                      <Ionicons
                        name="storefront-outline"
                        size={15}
                        color={isSelected ? '#FFFFFF' : '#059669'}
                      />
                      <Text
                        style={[styles.suppChipText, isSelected && styles.suppChipTextActive]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {supplier?.balance > 0 && (
                <Text style={styles.suppBalanceText}>
                  رصيد مستحقات المورد الحالية: {formatCurrency(supplier.balance)}
                </Text>
              )}
            </View>

            {/* Product search and addition */}
            <View style={styles.sectionCard}>
              <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={16} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ابحث عن صنف لإضافته للمشتريات..."
                    value={searchQuery}
                    onChangeText={(t) => {
                      setSearchQuery(t);
                      setShowPicker(t.length > 0);
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => setShowPicker(!showPicker)}
                >
                  <Ionicons name="list" size={16} color="#059669" />
                  <Text style={styles.browseBtnText}>القائمة</Text>
                </TouchableOpacity>
              </View>

              {showPicker && (
                <View style={styles.productsDropdown}>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {filteredProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.productPickerItem}
                        onPress={() => {
                          handleAddItem(p);
                          setShowPicker(false);
                          setSearchQuery('');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prodPickerName}>{p.name}</Text>
                          <Text style={styles.prodPickerMeta}>سعر التكلفة الحالي: {p.costPrice} ر.س</Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color="#059669" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Items in purchase */}
              <View style={{ marginTop: 10 }}>
                {selectedItems.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>أضف أصناف الفاتورة لتسجيل الشراء</Text>
                  </View>
                ) : (
                  selectedItems.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemUnit}>الوحدة: {item.unit}</Text>
                      </View>

                      {/* Editable Cost Price */}
                      <View style={{ width: 80, marginRight: 8 }}>
                        <Text style={{ fontSize: 9, color: '#64748B' }}>سعر الشراء:</Text>
                        <TextInput
                          style={styles.costInput}
                          keyboardType="numeric"
                          defaultValue={String(item.unitPrice)}
                          onChangeText={(v) => handleUpdateItemPrice(idx, v)}
                        />
                      </View>

                      {/* Quantity */}
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(idx, -1)}>
                          <Ionicons name="remove" size={12} color="#DC2626" />
                        </TouchableOpacity>
                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(idx, 1)}>
                          <Ionicons name="add" size={12} color="#16A34A" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ width: 75, alignItems: 'flex-end' }}>
                        <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Payment & Totals */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>طريقة السداد للمورد:</Text>
              <View style={styles.paymentMethodsRow}>
                {(['bank_transfer', 'cash', 'credit'] as PaymentMethod[]).map((pm) => {
                  const isSelected = paymentMethod === pm;
                  const label =
                    pm === 'bank_transfer' ? 'تحويل بنكي' :
                    pm === 'cash' ? 'نقداً من الصندوق' : 'آجل (ذمم دائنة)';
                  return (
                    <TouchableOpacity
                      key={pm}
                      style={[styles.pmBtn, isSelected && styles.pmBtnActive]}
                      onPress={() => setPaymentMethod(pm)}
                    >
                      <Text style={[styles.pmText, isSelected && styles.pmTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>المبلغ المدفوع فعلياً للمورد:</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder={grandTotal.toFixed(2)}
                  keyboardType="numeric"
                  value={paidAmountInput}
                  onChangeText={setPaidAmountInput}
                />
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>ملاحظات ورقم إرسالية المورد:</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="أدخل رقم سند التوريد أو السجل..."
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>إجمالي المشتريات (قبل الضريبة):</Text>
                  <Text style={styles.sumVal}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>ضريبة القيمة المضافة ({settings.vatRate}%):</Text>
                  <Text style={styles.sumVal}>{formatCurrency(taxTotal)}</Text>
                </View>
                <View style={[styles.sumRow, styles.sumGrandRow]}>
                  <Text style={styles.sumGrandLabel}>إجمالي فاتورة الشراء:</Text>
                  <Text style={styles.sumGrandVal}>{formatCurrency(grandTotal)}</Text>
                </View>
                {remaining > 0 && (
                  <View style={styles.sumRow}>
                    <Text style={[styles.sumLabel, { color: '#DC2626', fontWeight: 'bold' }]}>
                      يضاف لحساب المورد (آجل):
                    </Text>
                    <Text style={[styles.sumVal, { color: '#DC2626', fontWeight: 'bold' }]}>
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>حفظ وتحديث المخزون</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 580,
    maxHeight: '94%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#064E3B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#A7F3D0',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 14,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  suppChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  suppChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  suppChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  suppChipTextActive: {
    color: '#FFFFFF',
  },
  suppBalanceText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 6,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  browseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  productsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 8,
    overflow: 'hidden',
  },
  productPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prodPickerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  prodPickerMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  costInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    height: 30,
    fontSize: 11,
    color: '#0F172A',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 18,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pmBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  pmText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  pmTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  numberInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: '#0F172A',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sumLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  sumVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  sumGrandRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 4,
  },
  sumGrandLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#064E3B',
  },
  sumGrandVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
