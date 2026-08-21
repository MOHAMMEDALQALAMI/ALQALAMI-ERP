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

interface NewSaleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (invoiceId: string) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    products,
    customers,
    createSaleInvoice,
    formatCurrency,
    settings,
  } = useERP();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[5]?.id || 'c-6');
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountTotal, setDiscountTotal] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleAddItem = (prod: Product) => {
    const isWholesale = customer?.priceLevel === 'wholesale';
    const price = isWholesale ? prod.wholesalePrice : prod.sellingPrice;
    const taxRate = settings.enableVat ? prod.taxRate : 0;

    const existingIndex = selectedItems.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + 1;
      const sub = newQty * price;
      const taxAmount = (sub * taxRate) / 100;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        taxAmount,
        total: sub + taxAmount,
      };
      setSelectedItems(updated);
    } else {
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
    }
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    const updated = [...selectedItems];
    const current = updated[idx];
    const newQty = current.quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      const sub = newQty * current.unitPrice - current.discount;
      const taxAmount = (sub * current.taxRate) / 100;
      updated[idx] = {
        ...current,
        quantity: newQty,
        taxAmount,
        total: sub + taxAmount,
      };
    }
    setSelectedItems(updated);
  };

  // Calculations
  const subtotal = selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity - i.discount, 0);
  const taxTotal = selectedItems.reduce((sum, i) => sum + i.taxAmount, 0);
  const discountVal = parseFloat(discountTotal) || 0;
  const grandTotal = Math.max(0, subtotal + taxTotal - discountVal);
  const paidAmount = paidAmountInput === '' ? grandTotal : parseFloat(paidAmountInput) || 0;
  const remaining = Math.max(0, grandTotal - paidAmount);

  const handleSaveInvoice = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('تنبيه', 'يرجى إضافة صنف واحد على الأقل لإصدار الفاتورة.');
      return;
    }

    try {
      const created = await createSaleInvoice({
        customerId: customer.id,
        customerName: customer.name,
        items: selectedItems,
        paymentMethod,
        paidAmount,
        discountTotal: discountVal,
        notes,
      });

      Alert.alert('نجاح العملية', `تم إصدار الفاتورة بنجاح برقم: ${created.invoiceNumber}`);
      setSelectedItems([]);
      setDiscountTotal('');
      setPaidAmountInput('');
      setNotes('');
      onClose();
      if (onSuccess) onSuccess(created.id);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.barcode.includes(searchProductQuery)
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cart" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>فاتورة مبيعات جديدة (Sales)</Text>
                <Text style={styles.headerSubtitle}>إنشاء فاتورة ضريبية نقدية أو آجلة</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Customer Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>العميل والطرف المستلم:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {customers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.customerChip, isSelected && styles.customerChipActive]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Ionicons
                        name="person-circle-outline"
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#2563EB'}
                      />
                      <Text
                        style={[styles.customerChipText, isSelected && styles.customerChipTextActive]}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {customer?.balance > 0 && (
                <Text style={styles.custDebtWarn}>
                  تنبيه: يوجد رصيد مديونية سابقة على هذا العميل بقيمة ({formatCurrency(customer.balance)})
                </Text>
              )}
            </View>

            {/* Item Quick Add & Search */}
            <View style={styles.sectionCard}>
              <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={16} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ابحث بالاسم أو الباركود لإضافة أصناف..."
                    value={searchProductQuery}
                    onChangeText={(t) => {
                      setSearchProductQuery(t);
                      setShowProductPicker(t.length > 0);
                    }}
                  />
                  {searchProductQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchProductQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => setShowProductPicker(!showProductPicker)}
                >
                  <Ionicons name="grid-outline" size={16} color="#2563EB" />
                  <Text style={styles.browseBtnText}>الأصناف</Text>
                </TouchableOpacity>
              </View>

              {/* Product picker drop area */}
              {showProductPicker && (
                <View style={styles.productsDropdown}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {filteredProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.productPickerItem}
                        onPress={() => {
                          handleAddItem(p);
                          setShowProductPicker(false);
                          setSearchProductQuery('');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prodPickerName}>{p.name}</Text>
                          <Text style={styles.prodPickerMeta}>
                            المتوفر: {p.currentStock} {p.unit} | باركود: {p.barcode}
                          </Text>
                        </View>
                        <View style={styles.prodPickerPriceBadge}>
                          <Text style={styles.prodPickerPrice}>
                            {customer?.priceLevel === 'wholesale' ? p.wholesalePrice : p.sellingPrice} ر.س
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Selected Items List */}
              <View style={styles.itemsList}>
                {selectedItems.length === 0 ? (
                  <View style={styles.emptyItemsBox}>
                    <Ionicons name="basket-outline" size={32} color="#CBD5E1" />
                    <Text style={styles.emptyItemsText}>لم يتم إضافة أصناف إلى الفاتورة بعد</Text>
                  </View>
                ) : (
                  selectedItems.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1.8 }}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemMeta}>
                          {item.unitPrice.toFixed(2)} ر.س / {item.unit}
                        </Text>
                      </View>

                      {/* Quantity Controls */}
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQty(idx, -1)}
                        >
                          <Ionicons name="remove" size={14} color="#DC2626" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQty(idx, 1)}
                        >
                          <Ionicons name="add" size={14} color="#16A34A" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.itemTotalCol}>
                        <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Payment Method & Totals */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>طريقة السداد:</Text>
              <View style={styles.paymentMethodsRow}>
                {(['cash', 'card', 'credit', 'bank_transfer'] as PaymentMethod[]).map((pm) => {
                  const isSelected = paymentMethod === pm;
                  const label =
                    pm === 'cash' ? 'نقداً' :
                    pm === 'card' ? 'شبكة / مدى' :
                    pm === 'credit' ? 'آجل (ذمم)' : 'تحويل بنكي';
                  const icon =
                    pm === 'cash' ? 'cash-outline' :
                    pm === 'card' ? 'card-outline' :
                    pm === 'credit' ? 'time-outline' : 'business-outline';

                  return (
                    <TouchableOpacity
                      key={pm}
                      style={[styles.pmBtn, isSelected && styles.pmBtnActive]}
                      onPress={() => setPaymentMethod(pm)}
                    >
                      <Ionicons name={icon as any} size={16} color={isSelected ? '#FFFFFF' : '#475569'} />
                      <Text style={[styles.pmText, isSelected && styles.pmTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Numerical Inputs (Discount & Paid) */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>خصم إضافي (ر.س):</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={discountTotal}
                    onChangeText={setDiscountTotal}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>المبلغ المدفوع (ر.س):</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder={grandTotal.toFixed(2)}
                    keyboardType="numeric"
                    value={paidAmountInput}
                    onChangeText={setPaidAmountInput}
                  />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>ملاحظات الفاتورة:</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="أدخل أي ملاحظات خاصة بالفاتورة..."
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Invoice Summary Box */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>المجموع الفرعي:</Text>
                  <Text style={styles.summaryVal}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ضريبة القيمة المضافة ({settings.vatRate}%):</Text>
                  <Text style={styles.summaryVal}>{formatCurrency(taxTotal)}</Text>
                </View>
                {discountVal > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>الخصم:</Text>
                    <Text style={[styles.summaryVal, { color: '#DC2626' }]}>- {formatCurrency(discountVal)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.grandRow]}>
                  <Text style={styles.grandLabel}>الإجمالي النهائي:</Text>
                  <Text style={styles.grandVal}>{formatCurrency(grandTotal)}</Text>
                </View>
                {remaining > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#DC2626', fontWeight: 'bold' }]}>المتبقي بالآجل:</Text>
                    <Text style={[styles.summaryVal, { color: '#DC2626', fontWeight: 'bold' }]}>
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveInvoice}>
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>حفظ وإصدار الفاتورة</Text>
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
    backgroundColor: '#0F172A',
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
    backgroundColor: '#2563EB',
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
    color: '#94A3B8',
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
  chipScroll: {
    flexDirection: 'row',
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  customerChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  customerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  customerChipTextActive: {
    color: '#FFFFFF',
  },
  custDebtWarn: {
    fontSize: 11,
    color: '#DC2626',
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
    height: 40,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  browseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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
  prodPickerPriceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prodPickerPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemsList: {
    marginTop: 10,
  },
  emptyItemsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyItemsText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
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
  itemMeta: {
    fontSize: 10,
    color: '#64748B',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotalCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  pmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pmBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pmText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  pmTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
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
  notesInput: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 4,
  },
  grandLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  grandVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
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
    backgroundColor: '#2563EB',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
