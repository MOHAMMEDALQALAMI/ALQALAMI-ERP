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
import { PaymentMethod } from '../types/erp';

interface NewVoucherModalProps {
  visible: boolean;
  defaultType?: 'receipt' | 'payment';
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewVoucherModal: React.FC<NewVoucherModalProps> = ({
  visible,
  defaultType = 'receipt',
  onClose,
  onSuccess,
}) => {
  const {
    customers,
    suppliers,
    employees,
    accounts,
    addVoucher,
    activeBranchId,
    formatCurrency,
  } = useERP();

  const [type, setType] = useState<'receipt' | 'payment'>(defaultType);
  const [partyType, setPartyType] = useState<'customer' | 'supplier' | 'employee' | 'other'>(
    defaultType === 'receipt' ? 'customer' : 'supplier'
  );
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPartyName, setCustomPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [treasuryAccountId, setTreasuryAccountId] = useState('acc-1101');
  const [description, setDescription] = useState('');

  const isReceipt = type === 'receipt';

  // Treasury accounts (Cashier, main treasury, banks)
  const treasuryAccounts = accounts.filter(
    (a) => a.code.startsWith('1101') || a.code.startsWith('1102') || a.code.startsWith('1103') || a.code.startsWith('1104')
  );

  const selectedAccount = accounts.find((a) => a.id === treasuryAccountId) || accounts[2];

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح للسند.');
      return;
    }

    let partyName = customPartyName;
    if (partyType === 'customer') {
      const c = customers.find((x) => x.id === selectedPartyId);
      partyName = c ? c.name : 'عميل عام';
    } else if (partyType === 'supplier') {
      const s = suppliers.find((x) => x.id === selectedPartyId);
      partyName = s ? s.name : 'مورد عام';
    } else if (partyType === 'employee') {
      const e = employees.find((x) => x.id === selectedPartyId);
      partyName = e ? e.name : 'موظف';
    }

    if (!partyName) {
      Alert.alert('تنبيه', 'يرجى تحديد الطرف المستلم أو المسدد.');
      return;
    }

    try {
      const created = await addVoucher({
        type,
        date: new Date().toISOString(),
        amount: numAmount,
        paymentMethod,
        accountId: treasuryAccountId,
        accountName: selectedAccount.name,
        partyType,
        partyId: selectedPartyId || undefined,
        partyName,
        description: description || (isReceipt ? `سند قبض من ${partyName}` : `سند صرف إلى ${partyName}`),
        branchId: activeBranchId,
        treasuryId: treasuryAccountId,
        createdBy: 'المحاسب المالي',
      });

      Alert.alert(
        'تم الحفظ',
        `تم إصدار ${isReceipt ? 'سند القبض' : 'سند الصرف'} بنجاح برقم: ${created.voucherNumber}`
      );
      setAmount('');
      setDescription('');
      setCustomPartyName('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء حفظ السند');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={[styles.header, isReceipt ? styles.headerReceipt : styles.headerPayment]}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name={isReceipt ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={24}
                color="#FFFFFF"
              />
              <View>
                <Text style={styles.headerTitle}>
                  {isReceipt ? 'سند قبض نقدية / بنك (Receipt Voucher)' : 'سند صرف نقدية / بنك (Payment Voucher)'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isReceipt ? 'إيداع وقبض مبالغ مالية إلى الخزينة' : 'صرف وسداد مبالغ مالية من الخزينة'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Voucher Type Switcher */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[styles.typeBtn, isReceipt && styles.typeBtnReceiptActive]}
                onPress={() => {
                  setType('receipt');
                  setPartyType('customer');
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color={isReceipt ? '#FFFFFF' : '#059669'} />
                <Text style={[styles.typeBtnText, isReceipt && styles.typeBtnTextActive]}>
                  سند قبض (Receipt)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, !isReceipt && styles.typeBtnPaymentActive]}
                onPress={() => {
                  setType('payment');
                  setPartyType('supplier');
                }}
              >
                <Ionicons name="remove-circle-outline" size={16} color={!isReceipt ? '#FFFFFF' : '#DC2626'} />
                <Text style={[styles.typeBtnText, !isReceipt && styles.typeBtnTextActive]}>
                  سند صرف (Payment)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Party Type Tabs */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>الطرف المعني بالسند:</Text>
              <View style={styles.partyTabs}>
                {[
                  { id: 'customer', label: 'عميل' },
                  { id: 'supplier', label: 'مورد' },
                  { id: 'employee', label: 'موظف' },
                  { id: 'other', label: 'جهة أخرى' },
                ].map((pt) => {
                  const isSelected = partyType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[styles.partyTab, isSelected && styles.partyTabActive]}
                      onPress={() => {
                        setPartyType(pt.id as any);
                        setSelectedPartyId('');
                      }}
                    >
                      <Text style={[styles.partyTabText, isSelected && styles.partyTabTextActive]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Party Selection List */}
              {partyType === 'customer' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {customers.map((c) => {
                    const isSelected = c.id === selectedPartyId;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedPartyId(c.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {c.name} {c.balance > 0 ? `(${formatCurrency(c.balance)})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {partyType === 'supplier' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {suppliers.map((s) => {
                    const isSelected = s.id === selectedPartyId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedPartyId(s.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {s.name} {s.balance > 0 ? `(${formatCurrency(s.balance)})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {partyType === 'employee' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {employees.map((e) => {
                    const isSelected = e.id === selectedPartyId;
                    return (
                      <TouchableOpacity
                        key={e.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedPartyId(e.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {e.name} ({e.jobTitle})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {partyType === 'other' && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="اكتب اسم الجهة / الحساب (مثال: شركة الكهرباء، مالك العقار)..."
                  value={customPartyName}
                  onChangeText={setCustomPartyName}
                />
              )}
            </View>

            {/* Treasury / Account & Payment Method */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {isReceipt ? 'إيداع إلى حساب / خزينة:' : 'سحب من حساب / خزينة:'}
              </Text>
              <View style={styles.accountsGrid}>
                {treasuryAccounts.map((acc) => {
                  const isSelected = acc.id === treasuryAccountId;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accBtn, isSelected && styles.accBtnActive]}
                      onPress={() => setTreasuryAccountId(acc.id)}
                    >
                      <Ionicons
                        name={acc.code.includes('1103') || acc.code.includes('1104') ? 'business' : 'wallet'}
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#2563EB'}
                      />
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={[styles.accBtnTitle, isSelected && styles.accBtnTitleActive]} numberOfLines={1}>
                          {acc.name}
                        </Text>
                        <Text style={[styles.accBtnCode, isSelected && styles.accBtnCodeActive]}>
                          رصيد: {formatCurrency(acc.balance)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Amount & Description */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>المبلغ المالي:</Text>
              <View style={styles.amountInputRow}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>ر.س</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>البيان والشرح:</Text>
              <TextInput
                style={styles.descInput}
                placeholder="أدخل تفاصيل وشرح السند المحاسبي..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isReceipt ? styles.submitBtnReceipt : styles.submitBtnPayment]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                حفظ وإصدار {isReceipt ? 'سند القبض' : 'سند الصرف'}
              </Text>
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
    maxWidth: 540,
    maxHeight: '92%',
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
  },
  headerReceipt: {
    backgroundColor: '#059669',
  },
  headerPayment: {
    backgroundColor: '#DC2626',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#F8FAFC',
    opacity: 0.9,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 14,
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeBtnReceiptActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeBtnPaymentActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  partyTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  partyTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  partyTabActive: {
    backgroundColor: '#2563EB',
  },
  partyTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  partyTabTextActive: {
    color: '#FFFFFF',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
  },
  accountsGrid: {
    gap: 6,
  },
  accBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  accBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  accBtnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  accBtnTitleActive: {
    color: '#FFFFFF',
  },
  accBtnCode: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  accBtnCodeActive: {
    color: '#E0E7FF',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  currencyBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  currencyBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  descInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 50,
    fontSize: 12,
    textAlignVertical: 'top',
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
  },
  submitBtnReceipt: {
    backgroundColor: '#059669',
  },
  submitBtnPayment: {
    backgroundColor: '#DC2626',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
