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
import { ERPModule, PermissionAction, Role, RolePermissions } from '../types/erp';
import { ERP_MODULES, PERMISSION_ACTIONS, createEmptyPermissions, createFullPermissions } from '../data/rbacInitialData';
import { useERP } from '../context/ERPContext';

interface RoleModalProps {
  visible: boolean;
  roleToEdit?: Role | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  visible,
  roleToEdit,
  onClose,
  onSuccess,
}) => {
  const { createRole, updateRole } = useERP();

  const [name, setName] = useState(roleToEdit?.name || '');
  const [description, setDescription] = useState(roleToEdit?.description || '');
  const [isActive, setIsActive] = useState(roleToEdit ? roleToEdit.isActive : true);
  const [isSystemAdmin, setIsSystemAdmin] = useState(roleToEdit ? roleToEdit.isSystemAdmin : false);
  const [permissions, setPermissions] = useState<RolePermissions>(
    roleToEdit ? JSON.parse(JSON.stringify(roleToEdit.permissions)) : createEmptyPermissions()
  );
  const [activeModuleTab, setActiveModuleTab] = useState<ERPModule>('accounting');

  React.useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setDescription(roleToEdit.description);
      setIsActive(roleToEdit.isActive);
      setIsSystemAdmin(roleToEdit.isSystemAdmin);
      setPermissions(JSON.parse(JSON.stringify(roleToEdit.permissions)));
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
      setIsSystemAdmin(false);
      setPermissions(createEmptyPermissions());
    }
  }, [roleToEdit, visible]);

  const handleToggleSinglePermission = (module: ERPModule, action: PermissionAction) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleToggleAllForModule = (module: ERPModule, value: boolean) => {
    setPermissions((prev) => {
      const updatedModule: any = {};
      PERMISSION_ACTIONS.forEach((act) => {
        updatedModule[act.id] = value;
      });
      return {
        ...prev,
        [module]: updatedModule,
      };
    });
  };

  const handleGrantAll = () => {
    setPermissions(createFullPermissions());
  };

  const handleRevokeAll = () => {
    setPermissions(createEmptyPermissions());
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الدور الوظيفي.');
      return;
    }

    try {
      if (roleToEdit) {
        await updateRole({
          ...roleToEdit,
          name,
          description,
          isActive,
          isSystemAdmin,
          permissions: isSystemAdmin ? createFullPermissions() : permissions,
        });
        Alert.alert('تم التعديل', `تم تحديث صلاحيات الدور "${name}" بنجاح.`);
      } else {
        await createRole({
          name,
          description: description || 'دور وظيفي مخصص',
          isActive,
          isSystemAdmin,
          permissions: isSystemAdmin ? createFullPermissions() : permissions,
        });
        Alert.alert('تم الإنشاء', `تم إنشاء الدور الوظيفي "${name}" وتعيين الصلاحيات بنجاح.`);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ في العملية', e.message || 'حدث خطأ أثناء حفظ الدور.');
    }
  };

  const currentModulePerms = permissions[activeModuleTab] || {};
  const currentModuleInfo = ERP_MODULES.find((m) => m.id === activeModuleTab) || ERP_MODULES[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {roleToEdit ? 'تعديل الدور ومصفوفة الصلاحيات' : 'إنشاء دور وظيفي جديد ومصفوفة الصلاحيات'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  التحكم بالصلاحيات الثمان (عرض، إضافة، تعديل، حذف، اعتماد، ترحيل، طباعة، تصدير)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <View style={styles.sectionCard}>
              <Text style={styles.label}>اسم الدور الوظيفي *:</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: محاسب عام، مشرف مبيعات، أمين مستودع..."
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.label, { marginTop: 8 }]}>الوصف والمهام الوظيفية:</Text>
              <TextInput
                style={styles.input}
                placeholder="وصف مختصر لمسؤوليات هذا الدور..."
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.switchesRow}>
                <View style={styles.switchBox}>
                  <Text style={styles.switchLabel}>حالة الدور (مفعل/معطل):</Text>
                  <Switch value={isActive} onValueChange={setIsActive} />
                </View>

                {!roleToEdit?.isSystemAdmin && (
                  <View style={styles.switchBox}>
                    <Text style={styles.switchLabel}>صلاحيات إدارة شاملة (Admin):</Text>
                    <Switch value={isSystemAdmin} onValueChange={setIsSystemAdmin} />
                  </View>
                )}
              </View>
            </View>

            {/* Quick Bulk Actions */}
            {!isSystemAdmin && (
              <View style={styles.bulkRow}>
                <Text style={styles.bulkTitle}>التحكم السريع بالمصفوفة:</Text>
                <View style={styles.bulkButtons}>
                  <TouchableOpacity style={styles.grantAllBtn} onPress={handleGrantAll}>
                    <Ionicons name="checkmark-done" size={14} color="#059669" />
                    <Text style={styles.grantAllText}>تفعيل كل الصلاحيات</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.revokeAllBtn} onPress={handleRevokeAll}>
                    <Ionicons name="close-circle" size={14} color="#DC2626" />
                    <Text style={styles.revokeAllText}>إلغاء الكل</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Permissions Matrix by Modules */}
            {!isSystemAdmin ? (
              <View style={styles.matrixContainer}>
                <Text style={styles.matrixHeaderTitle}>
                  مصفوفة الصلاحيات حسب الأقسام التسعة (9 Modules × 8 Actions):
                </Text>

                {/* Modules Horizontal Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modulesScroll}>
                  {ERP_MODULES.map((mod) => {
                    const isSel = activeModuleTab === mod.id;
                    const activeCount = Object.values(permissions[mod.id] || {}).filter(Boolean).length;
                    return (
                      <TouchableOpacity
                        key={mod.id}
                        style={[styles.modChip, isSel && styles.modChipActive]}
                        onPress={() => setActiveModuleTab(mod.id)}
                      >
                        <Ionicons
                          name={mod.icon as any}
                          size={15}
                          color={isSel ? '#FFFFFF' : '#2563EB'}
                        />
                        <Text style={[styles.modChipText, isSel && styles.modChipTextActive]}>
                          {mod.name}
                        </Text>
                        <View style={[styles.modBadge, isSel && styles.modBadgeActive]}>
                          <Text style={[styles.modBadgeText, isSel && styles.modBadgeTextActive]}>
                            {activeCount}/8
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Active Module Permission Grid */}
                <View style={styles.moduleCardActive}>
                  <View style={styles.moduleCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.curModTitle}>قسم: {currentModuleInfo.name}</Text>
                      <Text style={styles.curModDesc}>{currentModuleInfo.description}</Text>
                    </View>
                    <View style={styles.modQuickActions}>
                      <TouchableOpacity
                        style={styles.modQuickBtn}
                        onPress={() => handleToggleAllForModule(activeModuleTab, true)}
                      >
                        <Text style={styles.modQuickBtnText}>تحديد الكل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modQuickBtn, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => handleToggleAllForModule(activeModuleTab, false)}
                      >
                        <Text style={[styles.modQuickBtnText, { color: '#DC2626' }]}>إلغاء</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 8 Action Items Grid */}
                  <View style={styles.actionsGrid}>
                    {PERMISSION_ACTIONS.map((act) => {
                      const isGranted = Boolean(currentModulePerms[act.id]);
                      return (
                        <TouchableOpacity
                          key={act.id}
                          style={[styles.actionToggleCard, isGranted && styles.actionToggleCardActive]}
                          onPress={() => handleToggleSinglePermission(activeModuleTab, act.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.actionToggleLeft}>
                            <View
                              style={[
                                styles.actionIconBox,
                                { backgroundColor: isGranted ? act.color : '#E2E8F0' },
                              ]}
                            >
                              <Ionicons
                                name={act.icon as any}
                                size={14}
                                color={isGranted ? '#FFFFFF' : '#64748B'}
                              />
                            </View>
                            <View>
                              <Text style={[styles.actionTitle, isGranted && styles.actionTitleActive]}>
                                {act.name}
                              </Text>
                              <Text style={styles.actionSubtext}>
                                {isGranted ? 'مسموح ومفعل' : 'محظور وممنوع'}
                              </Text>
                            </View>
                          </View>

                          <Switch
                            value={isGranted}
                            onValueChange={() => handleToggleSinglePermission(activeModuleTab, act.id)}
                            thumbColor={isGranted ? '#FFFFFF' : '#F1F5F9'}
                            trackColor={{ false: '#CBD5E1', true: act.color }}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.adminNoticeBox}>
                <Ionicons name="shield-checkmark" size={36} color="#059669" />
                <Text style={styles.adminNoticeTitle}>دور مدير النظام (System Admin)</Text>
                <Text style={styles.adminNoticeDesc}>
                  يمتلك مدير النظام صلاحيات مطلقة كاملة (100%) على جميع الأقسام والعمليات والشركات والفروع تلقائياً.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {roleToEdit ? 'حفظ تعديلات الدور' : 'إنشاء وتطبيق الدور'}
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
    maxWidth: 620,
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
  switchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  switchBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bulkTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  grantAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  grantAllText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  revokeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  revokeAllText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  matrixContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matrixHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  modulesScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  modChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  modBadgeActive: {
    backgroundColor: '#1E40AF',
  },
  modBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
  },
  modBadgeTextActive: {
    color: '#FFFFFF',
  },
  moduleCardActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  curModTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  curModDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  modQuickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  modQuickBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modQuickBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  actionsGrid: {
    gap: 6,
  },
  actionToggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionToggleCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  actionTitleActive: {
    color: '#065F46',
  },
  actionSubtext: {
    fontSize: 9,
    color: '#94A3B8',
  },
  adminNoticeBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginVertical: 10,
  },
  adminNoticeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 8,
  },
  adminNoticeDesc: {
    fontSize: 11,
    color: '#047857',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
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
