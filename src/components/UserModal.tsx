import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ERPUser } from '../types/erp';
import { useERP } from '../context/ERPContext';

interface UserModalProps {
  visible: boolean;
  userToEdit?: ERPUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  visible,
  userToEdit,
  onClose,
  onSuccess,
}) => {
  const { roles, branches, createERPUser, updateERPUser } = useERP();

  const [name, setName] = useState(userToEdit?.name || '');
  const [username, setUsername] = useState(userToEdit?.username || '');
  const [email, setEmail] = useState(userToEdit?.email || '');
  const [phone, setPhone] = useState(userToEdit?.phone || '');
  const [selectedRoleId, setSelectedRoleId] = useState(userToEdit?.roleId || roles[0]?.id || 'role-admin');
  const [isActive, setIsActive] = useState(userToEdit ? userToEdit.isActive : true);
  const [allowedBranches, setAllowedBranches] = useState<string[]>(
    userToEdit?.allowedBranchIds || ['*']
  );

  React.useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setSelectedRoleId(userToEdit.roleId);
      setIsActive(userToEdit.isActive);
      setAllowedBranches(userToEdit.allowedBranchIds);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setSelectedRoleId(roles[1]?.id || roles[0]?.id);
      setIsActive(true);
      setAllowedBranches(['*']);
    }
  }, [userToEdit, visible]);

  const handleToggleAllBranches = () => {
    if (allowedBranches.includes('*')) {
      setAllowedBranches([branches[0].id]);
    } else {
      setAllowedBranches(['*']);
    }
  };

  const handleToggleBranch = (branchId: string) => {
    if (allowedBranches.includes('*')) {
      // Switch from all to specific
      const remaining = branches.map((b) => b.id).filter((id) => id !== branchId);
      setAllowedBranches(remaining.length > 0 ? remaining : [branches[0].id]);
    } else {
      if (allowedBranches.includes(branchId)) {
        if (allowedBranches.length === 1) {
          Alert.alert('تنبيه', 'يجب تحديد فرع واحد على الأقل للمستخدم.');
          return;
        }
        setAllowedBranches(allowedBranches.filter((id) => id !== branchId));
      } else {
        const next = [...allowedBranches, branchId];
        if (next.length === branches.length) {
          setAllowedBranches(['*']);
        } else {
          setAllowedBranches(next);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم واسم الحساب.');
      return;
    }

    const selectedRole = roles.find((r) => r.id === selectedRoleId);

    try {
      if (userToEdit) {
        await updateERPUser({
          ...userToEdit,
          name,
          username,
          email,
          phone,
          roleId: selectedRoleId,
          roleName: selectedRole?.name || userToEdit.roleName,
          isActive,
          allowedBranchIds: allowedBranches,
        });
        Alert.alert('تم التعديل', `تم تحديث بيانات وصلاحيات المستخدم "${name}".`);
      } else {
        await createERPUser({
          name,
          username,
          email,
          phone,
          roleId: selectedRoleId,
          roleName: selectedRole?.name || 'مستخدم عام',
          isActive,
          allowedBranchIds: allowedBranches,
          companyAccess: ['*'],
        });
        Alert.alert('تمت الإضافة', `تم إنشاء حساب المستخدم "${name}" بنجاح.`);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء حفظ المستخدم.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {userToEdit ? 'تعديل بيانات المستخدم وصلاحيات الفروع' : 'إضافة مستخدم جديد وتعيين الدور والفروع'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  ربط المستخدم بالدور الوظيفي وتحديد الفروع المسموح له الوصول إليها
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* User Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.label}>الاسم الكامل للمستخدم *:</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: أحمد محمد القلمي..."
                value={name}
                onChangeText={setName}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { marginTop: 8 }]}>اسم المستخدم (Username) *:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="admin_pos"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { marginTop: 8 }]}>رقم الهاتف:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+966 5..."
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 8 }]}>البريد الإلكتروني:</Text>
              <TextInput
                style={styles.input}
                placeholder="user@alqalami-erp.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.activeRow}>
                <Text style={styles.activeLabel}>تنشيط الحساب (Active):</Text>
                <Switch value={isActive} onValueChange={setIsActive} />
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.sectionCard}>
              <Text style={styles.label}>تعيين الدور الوظيفي (Role Assignment):</Text>
              <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                {roles.map((r) => {
                  const isSel = r.id === selectedRoleId;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleOption, isSel && styles.roleOptionActive]}
                      onPress={() => setSelectedRoleId(r.id)}
                    >
                      <View style={styles.roleOptionLeft}>
                        <Ionicons
                          name={isSel ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSel ? '#2563EB' : '#94A3B8'}
                        />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={[styles.roleOptionName, isSel && styles.roleOptionNameActive]}>
                            {r.name} {r.isSystemAdmin ? '★ (مدير عام)' : ''}
                          </Text>
                          <Text style={styles.roleOptionDesc} numberOfLines={1}>
                            {r.description}
                          </Text>
                        </View>
                      </View>
                      {!r.isActive && (
                        <View style={styles.disabledRolePill}>
                          <Text style={styles.disabledRoleText}>معطل</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Branch Scope Restrictions (Requirement #6) */}
            <View style={styles.sectionCard}>
              <View style={styles.branchHeaderRow}>
                <Text style={styles.label}>صلاحيات الوصول للفروع (Branch Access Scope):</Text>
                <TouchableOpacity onPress={handleToggleAllBranches}>
                  <Text style={styles.toggleAllBranchesText}>
                    {allowedBranches.includes('*') ? 'تخصيص فروع محددة' : 'السماح لجميع الفروع'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.allBranchesCard,
                  allowedBranches.includes('*') && styles.allBranchesCardActive,
                ]}
                onPress={handleToggleAllBranches}
              >
                <Ionicons
                  name={allowedBranches.includes('*') ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={allowedBranches.includes('*') ? '#2563EB' : '#94A3B8'}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.allBranchesTitle}>وصول شامل لجميع الفروع والمستودعات</Text>
                  <Text style={styles.allBranchesSub}>يمكن للمستخدم استعراض وإجراء العمليات على أي فرع</Text>
                </View>
              </TouchableOpacity>

              {/* Individual Branches List */}
              <View style={styles.branchesList}>
                {branches.map((b) => {
                  const isChecked = allowedBranches.includes('*') || allowedBranches.includes(b.id);
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.branchCheckItem, isChecked && styles.branchCheckItemActive]}
                      onPress={() => handleToggleBranch(b.id)}
                    >
                      <Ionicons
                        name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={isChecked ? '#059669' : '#94A3B8'}
                      />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={[styles.branchCheckName, isChecked && styles.branchCheckNameActive]}>
                          {b.name}
                        </Text>
                        <Text style={styles.branchCheckCity}>المدينة: {b.city}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {userToEdit ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    overflow: 'hidden',
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
    padding: 16,
    backgroundColor: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: '#0F172A',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  roleOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleOptionName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  roleOptionNameActive: {
    color: '#1D4ED8',
  },
  roleOptionDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  disabledRolePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disabledRoleText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  branchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleAllBranchesText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  allBranchesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  allBranchesCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  allBranchesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  allBranchesSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  branchesList: {
    gap: 4,
  },
  branchCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  branchCheckItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  branchCheckName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  branchCheckNameActive: {
    color: '#065F46',
    fontWeight: 'bold',
  },
  branchCheckCity: {
    fontSize: 9,
    color: '#64748B',
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
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
