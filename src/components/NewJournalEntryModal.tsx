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
import { JournalEntryLine } from '../types/erp';

interface NewJournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewJournalEntryModal: React.FC<NewJournalEntryModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { accounts, addJournalEntry, activeBranchId, formatCurrency } = useERP();

  const selectableAccounts = accounts.filter((a) => !a.isHeader);

  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      accountId: selectableAccounts[0]?.id || 'acc-1101',
      accountCode: selectableAccounts[0]?.code || '1101',
      accountName: selectableAccounts[0]?.name || '',
      debit: 0,
      credit: 0,
    },
    {
      accountId: selectableAccounts[6]?.id || 'acc-4101',
      accountCode: selectableAccounts[6]?.code || '4101',
      accountName: selectableAccounts[6]?.name || '',
      debit: 0,
      credit: 0,
    },
  ]);

  const handleAddLine = () => {
    const nextAcc = selectableAccounts[0];
    setLines([
      ...lines,
      {
        accountId: nextAcc.id,
        accountCode: nextAcc.code,
        accountName: nextAcc.name,
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      Alert.alert('تنبيه', 'يجب أن يحتوي القيد اليومي على طرفين (مدين ودائن) على الأقل.');
      return;
    }
    const updated = [...lines];
    updated.splice(idx, 1);
    setLines(updated);
  };

  const handleUpdateLineAccount = (idx: number, accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return;
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
    };
    setLines(updated);
  };

  const handleUpdateLineAmount = (idx: number, field: 'debit' | 'credit', valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
      // zero out other side if entered
      ...(field === 'debit' && val > 0 ? { credit: 0 } : {}),
      ...(field === 'credit' && val > 0 ? { debit: 0 } : {}),
    };
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة شرح وبيان القيد المحاسبي.');
      return;
    }
    if (!isBalanced) {
      Alert.alert(
        'القيد غير متوازن',
        `الطرف المدين (${formatCurrency(totalDebit)}) لا يساوي الطرف الدائن (${formatCurrency(totalCredit)}). الفارق: ${formatCurrency(diff)}`
      );
      return;
    }

    try {
      const created = await addJournalEntry({
        date: new Date().toISOString(),
        referenceType: 'manual',
        description,
        lines,
        totalDebit,
        totalCredit,
        branchId: activeBranchId,
        createdBy: 'المدير المالي',
      });

      Alert.alert('تم الترحيل بنجاح', `تم ترحيل قيد اليومية العام برقم: ${created.entryNumber}`);
      setDescription('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء ترحيل القيد');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="book" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>قيد يومية عام مزدوج (General Journal Entry)</Text>
                <Text style={styles.headerSubtitle}>تسوية محاسبية مع التحقق التلقائي من التوازن</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>بيان وشرح القيد المحاسبي:</Text>
              <TextInput
                style={styles.descInput}
                placeholder="اكتب شرح القيد بالتفصيل (مثال: إثبات مصاريف، تسوية عهدة، قيد إقفال)..."
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Lines Table */}
            <View style={styles.sectionCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colH, { flex: 2.5 }]}>الحساب المالي</Text>
                <Text style={[styles.colH, { flex: 1.2, textAlign: 'center' }]}>مدين (Debit)</Text>
                <Text style={[styles.colH, { flex: 1.2, textAlign: 'center' }]}>دائن (Credit)</Text>
                <Text style={[styles.colH, { width: 30 }]}></Text>
              </View>

              {lines.map((line, idx) => (
                <View key={idx} style={styles.lineRow}>
                  {/* Account Selector Horizontal Picker */}
                  <View style={{ flex: 2.5 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectableAccounts.slice(0, 8).map((acc) => {
                        const isSelected = acc.id === line.accountId;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            style={[styles.accChip, isSelected && styles.accChipActive]}
                            onPress={() => handleUpdateLineAccount(idx, acc.id)}
                          >
                            <Text style={[styles.accChipText, isSelected && styles.accChipTextActive]}>
                              {acc.code} - {acc.name.split(' ')[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <Text style={styles.lineAccountName} numberOfLines={1}>
                      {line.accountCode} - {line.accountName}
                    </Text>
                  </View>

                  {/* Debit Input */}
                  <View style={{ flex: 1.2, paddingHorizontal: 3 }}>
                    <TextInput
                      style={[styles.amountInput, line.debit > 0 && styles.amountInputFilled]}
                      keyboardType="numeric"
                      placeholder="0.00"
                      value={line.debit ? String(line.debit) : ''}
                      onChangeText={(v) => handleUpdateLineAmount(idx, 'debit', v)}
                    />
                  </View>

                  {/* Credit Input */}
                  <View style={{ flex: 1.2, paddingHorizontal: 3 }}>
                    <TextInput
                      style={[styles.amountInput, line.credit > 0 && styles.amountInputFilled]}
                      keyboardType="numeric"
                      placeholder="0.00"
                      value={line.credit ? String(line.credit) : ''}
                      onChangeText={(v) => handleUpdateLineAmount(idx, 'credit', v)}
                    />
                  </View>

                  {/* Delete Line */}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveLine(idx)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addLineBtn} onPress={handleAddLine}>
                <Ionicons name="add-circle" size={16} color="#2563EB" />
                <Text style={styles.addLineBtnText}>إضافة طرف / سطر قيد جديد</Text>
              </TouchableOpacity>
            </View>

            {/* Balance Status Box */}
            <View
              style={[
                styles.balanceStatusBox,
                isBalanced ? styles.balanceSuccess : styles.balanceDanger,
              ]}
            >
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>إجمالي المدين:</Text>
                <Text style={styles.balanceVal}>{formatCurrency(totalDebit)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>إجمالي الدائن:</Text>
                <Text style={styles.balanceVal}>{formatCurrency(totalCredit)}</Text>
              </View>
              <View style={[styles.balanceRow, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 4, marginTop: 4 }]}>
                <Text style={[styles.balanceLabel, { fontWeight: 'bold' }]}>حالة التوازن:</Text>
                <Text
                  style={[
                    styles.balanceVal,
                    { fontWeight: 'bold', color: isBalanced ? '#059669' : '#DC2626' },
                  ]}
                >
                  {isBalanced ? '✓ القيد متوازن تماماً' : `✕ غير متوازن (الفارق: ${formatCurrency(diff)})`}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, !isBalanced && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!isBalanced}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>ترحيل القيد لدفتر الأستاذ</Text>
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
    maxWidth: 600,
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
    backgroundColor: '#1E293B',
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  descInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginBottom: 8,
  },
  colH: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  accChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  accChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  accChipTextActive: {
    color: '#FFFFFF',
  },
  lineAccountName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 4,
  },
  amountInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    height: 34,
    fontSize: 11,
    textAlign: 'center',
    color: '#0F172A',
  },
  amountInputFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    fontWeight: 'bold',
  },
  removeBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addLineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  balanceStatusBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  balanceSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  balanceDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#334155',
  },
  balanceVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
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
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
