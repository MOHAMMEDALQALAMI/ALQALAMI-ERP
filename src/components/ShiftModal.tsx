import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';

interface ShiftModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ visible, onClose }) => {
  const { currentShift, openNewShift, closeCurrentShift, formatCurrency, activeBranch } = useERP();

  const [startingCashInput, setStartingCashInput] = useState('500');
  const [cashierNameInput, setCashierNameInput] = useState('أحمد القلمي');
  const [actualCashCount, setActualCashCount] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  const isOpen = currentShift?.status === 'open';

  const handleOpenShift = async () => {
    const startingCash = parseFloat(startingCashInput) || 0;
    if (!cashierNameInput.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الكاشير لفتح الوردية.');
      return;
    }
    await openNewShift(startingCash, cashierNameInput);
    Alert.alert('تم فتح الوردية', `تم بدء الوردية بنجاح للكاشير ${cashierNameInput}`);
    onClose();
  };

  const handleCloseShift = async () => {
    if (!actualCashCount) {
      Alert.alert('تنبيه', 'يرجى إدخال المبلغ الفعلي الموجود في الدرج لإغلاق الوردية ومطابقة الحساب.');
      return;
    }
    const actual = parseFloat(actualCashCount) || 0;
    await closeCurrentShift(actual, shiftNotes);
    Alert.alert('تم إغلاق الوردية', 'تم جرد الدرج وإغلاق الوردية بنجاح.');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={[styles.header, isOpen ? styles.headerOpen : styles.headerClosed]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="time" size={22} color="#FFFFFF" />
              <View>
                <Text style={styles.headerTitle}>
                  {isOpen ? `الوردية الحالية #${currentShift?.shiftNumber || 101}` : 'فتح وردية كاشير جديدة'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  الفرع: {activeBranch?.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isOpen && currentShift ? (
              /* Shift Open Summary & Closing Flow */
              <View>
                {/* Cashier Info */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الكاشير المسؤول:</Text>
                  <Text style={styles.infoVal}>{currentShift.cashierName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>وقت الفتح:</Text>
                  <Text style={styles.infoVal}>
                    {new Date(currentShift.startTime).toLocaleTimeString('ar-SA')} - {new Date(currentShift.startTime).toLocaleDateString('ar-SA')}
                  </Text>
                </View>

                {/* Sales Breakdown */}
                <View style={styles.breakdownCard}>
                  <Text style={styles.cardTitle}>ملخص مبيعات الوردية الحالية:</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>رصيد العهدة الافتتاحية:</Text>
                    <Text style={styles.statVal}>{formatCurrency(currentShift.startingCash)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>مبيعات الكاش (نقدي):</Text>
                    <Text style={[styles.statVal, { color: '#059669' }]}>
                      + {formatCurrency(currentShift.cashSales)}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>مبيعات الشبكة والبطاقات:</Text>
                    <Text style={[styles.statVal, { color: '#2563EB' }]}>
                      {formatCurrency(currentShift.cardSales)}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>مبيعات الحسابات الآجلة:</Text>
                    <Text style={styles.statVal}>{formatCurrency(currentShift.creditSales)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>مصروفات نقدية من الدرج:</Text>
                    <Text style={[styles.statVal, { color: '#DC2626' }]}>
                      - {formatCurrency(currentShift.cashExpenses)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.expectedBox}>
                    <Text style={styles.expectedLabel}>النقدية المفترضة بالدرج (Expected Cash):</Text>
                    <Text style={styles.expectedVal}>{formatCurrency(currentShift.expectedCash)}</Text>
                  </View>
                </View>

                {/* Close Drawer Reconciliation */}
                <View style={styles.closingSection}>
                  <Text style={styles.closingTitle}>جرد وإغلاق الوردية:</Text>
                  <Text style={styles.closingSubtitle}>
                    قم بعد النقدية الفعلية الموجودة في الدرج وأدخل المبلغ هنا:
                  </Text>

                  <TextInput
                    style={styles.cashCountInput}
                    placeholder="أدخل المبلغ الفعلي بالدرج..."
                    keyboardType="numeric"
                    value={actualCashCount}
                    onChangeText={setActualCashCount}
                  />

                  {actualCashCount !== '' && (
                    <View
                      style={[
                        styles.diffBox,
                        parseFloat(actualCashCount) - currentShift.expectedCash >= 0
                          ? styles.diffSurplus
                          : styles.diffDeficit,
                      ]}
                    >
                      <Text style={styles.diffText}>
                        الفارق: {formatCurrency(parseFloat(actualCashCount) - currentShift.expectedCash)}
                        {parseFloat(actualCashCount) - currentShift.expectedCash === 0
                          ? ' (متطابق تماماً ✓)'
                          : parseFloat(actualCashCount) - currentShift.expectedCash > 0
                          ? ' (فائض بالدرج)'
                          : ' (عجز بالدرج ✕)'}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={styles.notesInput}
                    placeholder="ملاحظات الإغلاق..."
                    value={shiftNotes}
                    onChangeText={setShiftNotes}
                  />

                  <TouchableOpacity style={styles.closeShiftBtn} onPress={handleCloseShift}>
                    <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                    <Text style={styles.closeShiftBtnText}>إغلاق وتسكير الوردية</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Shift Closed - Open New Flow */
              <View>
                <Text style={styles.openDesc}>
                  لا توجد وردية مفتوحة حالياً. يرجى إدخال بيانات الكاشير ورصيد افتتاح الدرج للبدء في عمليات البيع.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم الكاشير / المستخدم:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل اسم الكاشير..."
                    value={cashierNameInput}
                    onChangeText={setCashierNameInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رصيد افتتاح الصندوق (العهدة النقدية):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="500.00"
                    keyboardType="numeric"
                    value={startingCashInput}
                    onChangeText={setStartingCashInput}
                  />
                </View>

                <TouchableOpacity style={styles.openShiftBtn} onPress={handleOpenShift}>
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.openShiftBtnText}>فتح وردية جديدة وبدء البيع</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
  headerOpen: {
    backgroundColor: '#065F46',
  },
  headerClosed: {
    backgroundColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#475569',
  },
  statVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  expectedBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  expectedLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  expectedVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginTop: 2,
  },
  closingSection: {
    marginTop: 10,
  },
  closingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  closingSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  cashCountInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  diffBox: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  diffSurplus: {
    backgroundColor: '#ECFDF5',
  },
  diffDeficit: {
    backgroundColor: '#FEF2F2',
  },
  diffText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    marginVertical: 8,
  },
  closeShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  closeShiftBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  openDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  openShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 10,
  },
  openShiftBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
