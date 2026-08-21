import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { Employee } from '../types/erp';

export const HRScreen = () => {
  const { employees, addEmployee, deleteEmployee, payEmployeeSalary, formatCurrency, activeBranchId } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('المبيعات');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [basicSalary, setBasicSalary] = useState('5000');
  const [allowances, setAllowances] = useState('1000');
  const [deductions, setDeductions] = useState('0');

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayroll = employees.reduce((sum, e) => sum + e.netSalary, 0);

  const handleCreateEmployee = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الموظف.');
      return;
    }
    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const ded = parseFloat(deductions) || 0;

    await addEmployee({
      name,
      jobTitle: jobTitle || 'موظف مبيعات',
      department,
      phone,
      nationalId,
      basicSalary: basic,
      allowances: allow,
      deductions: ded,
      netSalary: basic + allow - ded,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      branchId: activeBranchId,
    });

    Alert.alert('تمت الإضافة', `تم إضافة الموظف ${name} إلى سجل الموارد البشرية بنجاح.`);
    setName('');
    setJobTitle('');
    setPhone('');
    setNationalId('');
    setShowAddEmpModal(false);
  };

  const handlePaySalary = (emp: Employee) => {
    Alert.alert(
      'تأكيد صرف الراتب',
      `هل تريد صرف مسير راتب الموظف (${emp.name}) بقيمة صافية ${formatCurrency(emp.netSalary)} وتحميله على صندوق الخزينة الرئيسي؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'صرف الراتب الآن',
          onPress: async () => {
            await payEmployeeSalary(emp.id, 'bank_transfer', 'acc-1103');
            Alert.alert('تم الصرف', `تم صرف راتب الموظف ${emp.name} وإصدار سند الصرف وترحيل القيد آلياً.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="الموارد البشرية والرواتب (HR)"
        subtitle="سجل الموظفين، مسيرات الرواتب، وسندات صرف الأجور"
      />

      {/* Summary KPI Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>إجمالي عدد الموظفين:</Text>
          <Text style={styles.sumVal}>{employees.length} موظف</Text>
        </View>
        <View style={styles.sumDivider} />
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>إجمالي مسير الرواتب الشهري:</Text>
          <Text style={[styles.sumVal, { color: '#2563EB' }]}>{formatCurrency(totalPayroll)}</Text>
        </View>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث باسم الموظف أو المسمى أو القسم..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addEmpBtn}
          onPress={() => setShowAddEmpModal(true)}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addEmpBtnText}>موظف جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Employees List */}
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.empCard}>
            <View style={styles.empCardTop}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.empName}>{item.name}</Text>
                <Text style={styles.empRole}>
                  {item.jobTitle} • {item.department}
                </Text>
                <Text style={styles.empPhone}>هاتف: {item.phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => handlePaySalary(item)}
              >
                <Ionicons name="cash-outline" size={14} color="#FFFFFF" />
                <Text style={styles.payBtnText}>صرف الراتب</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.salaryRow}>
              <View>
                <Text style={styles.salLabel}>الأساسي:</Text>
                <Text style={styles.salVal}>{formatCurrency(item.basicSalary)}</Text>
              </View>
              <View>
                <Text style={styles.salLabel}>البدلات:</Text>
                <Text style={[styles.salVal, { color: '#059669' }]}>+{formatCurrency(item.allowances)}</Text>
              </View>
              <View>
                <Text style={styles.salLabel}>الخصومات:</Text>
                <Text style={[styles.salVal, { color: '#DC2626' }]}>-{formatCurrency(item.deductions)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.salLabel}>صافي المستحق:</Text>
                <Text style={styles.netSalVal}>{formatCurrency(item.netSalary)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add Employee Modal */}
      <Modal visible={showAddEmpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة موظف جديد</Text>
              <TouchableOpacity onPress={() => setShowAddEmpModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>الاسم الرباعي للموظف *:</Text>
              <TextInput style={styles.input} placeholder="مثال: أحمد فهد العتيبي..." value={name} onChangeText={setName} />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>المسمى الوظيفي:</Text>
                  <TextInput style={styles.input} placeholder="محاسب / كاشير / مدير" value={jobTitle} onChangeText={setJobTitle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>القسم والإدارة:</Text>
                  <TextInput style={styles.input} placeholder="المالية / المبيعات" value={department} onChangeText={setDepartment} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>رقم الجوال:</Text>
                  <TextInput style={styles.input} placeholder="+966 5..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>رقم الهوية / الإقامة:</Text>
                  <TextInput style={styles.input} placeholder="10..." value={nationalId} onChangeText={setNationalId} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.threeCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>الراتب الأساسي:</Text>
                  <TextInput style={styles.input} placeholder="5000" keyboardType="numeric" value={basicSalary} onChangeText={setBasicSalary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>البدلات:</Text>
                  <TextInput style={styles.input} placeholder="1000" keyboardType="numeric" value={allowances} onChangeText={setAllowances} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>الخصومات:</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={deductions} onChangeText={setDeductions} />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddEmpModal(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveEmpBtn} onPress={handleCreateEmployee}>
                <Ionicons name="save" size={16} color="#FFFFFF" />
                <Text style={styles.saveEmpBtnText}>حفظ الموظف</Text>
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
  sumItem: {
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
  addEmpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addEmpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  empCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  empCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  empRole: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  empPhone: {
    fontSize: 10,
    color: '#94A3B8',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  salLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  salVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  netSalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
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
    maxWidth: 500,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalBody: {
    padding: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 4,
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
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  threeCol: {
    flexDirection: 'row',
    gap: 6,
  },
  modalFooter: {
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
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  saveEmpBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  saveEmpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
