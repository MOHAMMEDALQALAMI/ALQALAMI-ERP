import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';

export const CostCentersScreen = () => {
  const { costCenters, addCostCenter, formatCurrency } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [manager, setManager] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم مركز التكلفة.');
      return;
    }
    await addCostCenter({
      name,
      code: code || `CC-${costCenters.length + 101}`,
      managerName: manager || 'مدير القسم',
      totalExpenses: 0,
      totalRevenue: 0,
    });
    Alert.alert('تمت الإضافة', 'تم إنشاء مركز التكلفة الجديد بنجاح.');
    setName('');
    setCode('');
    setManager('');
    setShowModal(false);
  };

  const totalExpensesAll = costCenters.reduce((sum, c) => sum + c.totalExpenses, 0);
  const totalRevenueAll = costCenters.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <View style={styles.container}>
      <HeaderBar
        title="مراكز التكلفة والمشاريع"
        subtitle="تتبع أداء الفروع، الأقسام، والمشاريع الاستثمارية"
      />

      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>إجمالي إيرادات المراكز:</Text>
          <Text style={[styles.kpiVal, { color: '#059669' }]}>{formatCurrency(totalRevenueAll)}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>إجمالي مصروفات المراكز:</Text>
          <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{formatCurrency(totalExpensesAll)}</Text>
        </View>
      </View>

      <View style={styles.actionBar}>
        <Text style={styles.secTitle}>دليل مراكز التكلفة ({costCenters.length}):</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>مركز تكلفة جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={costCenters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const net = item.totalRevenue - item.totalExpenses;
          return (
            <View style={styles.ccCard}>
              <View style={styles.ccTop}>
                <View style={styles.ccIconBox}>
                  <Ionicons name="pie-chart" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ccName}>{item.name}</Text>
                  <Text style={styles.ccMeta}>رمز المركز: {item.code} | المسؤول: {item.managerName}</Text>
                </View>
              </View>

              <View style={styles.ccFinancials}>
                <View style={styles.ccFinItem}>
                  <Text style={styles.ccFinLabel}>الإيرادات:</Text>
                  <Text style={[styles.ccFinVal, { color: '#059669' }]}>
                    {formatCurrency(item.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.ccFinItem}>
                  <Text style={styles.ccFinLabel}>المصروفات:</Text>
                  <Text style={[styles.ccFinVal, { color: '#DC2626' }]}>
                    {formatCurrency(item.totalExpenses)}
                  </Text>
                </View>
                <View style={styles.ccFinItem}>
                  <Text style={styles.ccFinLabel}>صافي المركز:</Text>
                  <Text style={[styles.ccFinVal, { fontWeight: 'bold', color: '#2563EB' }]}>
                    {formatCurrency(net)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مركز تكلفة جديد</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 14 }}>
              <Text style={styles.label}>اسم المركز / المشروع *:</Text>
              <TextInput style={styles.input} placeholder="مثال: فرع الخبر، أسطول النقل..." value={name} onChangeText={setName} />

              <Text style={[styles.label, { marginTop: 8 }]}>رمز المركز (Code):</Text>
              <TextInput style={styles.input} placeholder="CC-201" value={code} onChangeText={setCode} />

              <Text style={[styles.label, { marginTop: 8 }]}>مدير المركز / المسؤول:</Text>
              <TextInput style={styles.input} placeholder="اسم المشرف..." value={manager} onChangeText={setManager} />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>حفظ المركز</Text>
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
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  kpiVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  ccCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ccTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  ccIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ccName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  ccMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  ccFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  ccFinItem: {
    alignItems: 'center',
  },
  ccFinLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  ccFinVal: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
    maxWidth: 480,
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
