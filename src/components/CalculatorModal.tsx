import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';

export const CalculatorModal: React.FC = () => {
  const { calculatorVisible, setCalculatorVisible, formatCurrency } = useERP();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  // Discount / VAT helpers
  const [basePrice, setBasePrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [vatPercent, setVatPercent] = useState('15');

  const baseNum = parseFloat(basePrice) || 0;
  const discNum = parseFloat(discountPercent) || 0;
  const vatNum = parseFloat(vatPercent) || 0;

  const discountAmount = (baseNum * discNum) / 100;
  const afterDiscount = baseNum - discountAmount;
  const taxAmount = (afterDiscount * vatNum) / 100;
  const finalPrice = afterDiscount + taxAmount;

  const handlePressNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handlePressOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleCalculate = () => {
    try {
      const full = equation + display;
      // evaluate sanitized math
      const sanitized = full.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('خطأ');
    }
  };

  return (
    <Modal
      visible={calculatorVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCalculatorVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calculator" size={20} color="#2563EB" />
              <Text style={styles.headerTitle}>الحاسبة المالية ومحاكي الخصم والضريبة</Text>
            </View>
            <TouchableOpacity onPress={() => setCalculatorVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick VAT & Discount Simulator Box */}
          <View style={styles.simBox}>
            <Text style={styles.simTitle}>محاكي الخصم وضريبة القيمة المضافة ZATCA:</Text>
            <View style={styles.simInputRow}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.simInputLabel}>السعر الأساسي:</Text>
                <TextInput
                  style={styles.simInput}
                  placeholder="100.00"
                  keyboardType="numeric"
                  value={basePrice}
                  onChangeText={setBasePrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.simInputLabel}>خصم (%):</Text>
                <TextInput
                  style={styles.simInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.simInputLabel}>الضريبة (%):</Text>
                <TextInput
                  style={styles.simInput}
                  placeholder="15"
                  keyboardType="numeric"
                  value={vatPercent}
                  onChangeText={setVatPercent}
                />
              </View>
            </View>

            {baseNum > 0 && (
              <View style={styles.simResultBox}>
                <View style={styles.simResRow}>
                  <Text style={styles.simResLabel}>مبلغ الخصم:</Text>
                  <Text style={[styles.simResVal, { color: '#DC2626' }]}>- {formatCurrency(discountAmount)}</Text>
                </View>
                <View style={styles.simResRow}>
                  <Text style={styles.simResLabel}>مبلغ الضريبة ({vatNum}%):</Text>
                  <Text style={styles.simResVal}>+ {formatCurrency(taxAmount)}</Text>
                </View>
                <View style={[styles.simResRow, { borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 4, marginTop: 4 }]}>
                  <Text style={[styles.simResLabel, { fontWeight: 'bold' }]}>الصافي النهائي المطلوب:</Text>
                  <Text style={[styles.simResVal, { fontWeight: '800', color: '#2563EB' }]}>
                    {formatCurrency(finalPrice)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Standard Calculator Keypad */}
          <View style={styles.calcDisplay}>
            <Text style={styles.calcEquation}>{equation}</Text>
            <Text style={styles.calcDisplayVal}>{display}</Text>
          </View>

          <View style={styles.keypad}>
            <View style={styles.keyRow}>
              <TouchableOpacity style={[styles.key, styles.keyFunc]} onPress={handleClear}>
                <Text style={styles.keyFuncText}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.keyOp]} onPress={() => handlePressOp('÷')}>
                <Text style={styles.keyOpText}>÷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.keyOp]} onPress={() => handlePressOp('×')}>
                <Text style={styles.keyOpText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.keyOp]} onPress={() => handlePressOp('-')}>
                <Text style={styles.keyOpText}>-</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('7')}>
                <Text style={styles.keyNum}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('8')}>
                <Text style={styles.keyNum}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('9')}>
                <Text style={styles.keyNum}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.keyOp]} onPress={() => handlePressOp('+')}>
                <Text style={styles.keyOpText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('4')}>
                <Text style={styles.keyNum}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('5')}>
                <Text style={styles.keyNum}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('6')}>
                <Text style={styles.keyNum}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, styles.keyApply]}
                onPress={() => setBasePrice(display)}
              >
                <Text style={styles.keyApplyText}>محاكاة</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('1')}>
                <Text style={styles.keyNum}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('2')}>
                <Text style={styles.keyNum}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('3')}>
                <Text style={styles.keyNum}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.keyEquals]} onPress={handleCalculate}>
                <Text style={styles.keyEqualsText}>=</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyRow}>
              <TouchableOpacity style={[styles.key, { flex: 2 }]} onPress={() => handlePressNumber('0')}>
                <Text style={styles.keyNum}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNumber('.')}>
                <Text style={styles.keyNum}>.</Text>
              </TouchableOpacity>
            </View>
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
    padding: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  simBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  simTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  simInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  simInputLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  simInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    height: 32,
    fontSize: 11,
    color: '#0F172A',
  },
  simResultBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  simResRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  simResLabel: {
    fontSize: 10,
    color: '#334155',
  },
  simResVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  calcDisplay: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  calcEquation: {
    fontSize: 11,
    color: '#94A3B8',
  },
  calcDisplayVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  keypad: {
    gap: 6,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyNum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  keyFunc: {
    backgroundColor: '#FEE2E2',
  },
  keyFuncText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  keyOp: {
    backgroundColor: '#E0E7FF',
  },
  keyOpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  keyApply: {
    backgroundColor: '#FEF3C7',
  },
  keyApplyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
  },
  keyEquals: {
    backgroundColor: '#2563EB',
  },
  keyEqualsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
