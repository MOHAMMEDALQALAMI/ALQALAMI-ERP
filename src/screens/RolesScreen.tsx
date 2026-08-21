import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { RoleModal } from '../components/RoleModal';
import { Role } from '../types/erp';
import { ERP_MODULES, PERMISSION_ACTIONS } from '../data/rbacInitialData';

export const RolesScreen = () => {
  const { roles, toggleRoleStatus, deleteRole, currentUserRole, setActiveScreen } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystemAdmin) {
      Alert.alert('حماية أمنية', 'لا يمكن حذف دور مدير النظام الرئيسي.');
      return;
    }

    Alert.alert(
      'تأكيد حذف الدور الوظيفي',
      `هل أنت متأكد من رغبتك في حذف الدور (${role.name}) نهائياً من النظام؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRole(role.id);
              Alert.alert('تم الحذف', 'تم حذف الدور الوظيفي بنجاح.');
            } catch (e: any) {
              Alert.alert('خطأ', e.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = (role: Role) => {
    if (role.isSystemAdmin) {
      Alert.alert('تنبيه', 'لا يمكن تعطيل دور مدير النظام العام.');
      return;
    }
    toggleRoleStatus(role.id);
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="الأدوار والصلاحيات الوظيفية (RBAC)"
        subtitle="إنشاء وتعديل وتعطيل مصفوفة الصلاحيات لجميع الأقسام"
      />

      {/* Quick Navigation Switcher Strip */}
      <View style={styles.navStrip}>
        <TouchableOpacity style={[styles.navTab, styles.navTabActive]}>
          <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
          <Text style={styles.navTabTextActive}>الأدوار الوظيفية ({roles.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveScreen('users_management')}
        >
          <Ionicons name="people" size={15} color="#475569" />
          <Text style={styles.navTabText}>المستخدمين والفروع</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveScreen('audit_logs')}
        >
          <Ionicons name="time" size={15} color="#475569" />
          <Text style={styles.navTabText}>سجل العمليات</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث باسم الدور أو المهام الوظيفية..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addRoleBtn} onPress={handleCreateNew}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addRoleBtnText}>دور وظيفي جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Roles List */}
      <FlatList
        data={filteredRoles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          // Count total permissions granted across all 9 modules
          let totalGranted = 0;
          if (item.isSystemAdmin) {
            totalGranted = 72; // 9 * 8
          } else {
            Object.values(item.permissions || {}).forEach((modPerms: any) => {
              totalGranted += Object.values(modPerms || {}).filter(Boolean).length;
            });
          }

          return (
            <View style={[styles.roleCard, !item.isActive && styles.roleCardInactive]}>
              <View style={styles.roleCardHeader}>
                <View style={styles.roleTitleCol}>
                  <View style={styles.roleNameRow}>
                    <Text style={styles.roleName}>{item.name}</Text>
                    {item.isSystemAdmin && (
                      <View style={styles.adminBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                        <Text style={styles.adminBadgeText}>مدير النظام (كامل)</Text>
                      </View>
                    )}
                    {!item.isActive && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>معطل وموقوف</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.roleDesc}>{item.description}</Text>
                </View>

                {/* Status Toggle Switch */}
                {!item.isSystemAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      item.isActive ? styles.statusActiveBtn : styles.statusInactiveBtn,
                    ]}
                    onPress={() => handleToggleActive(item)}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        item.isActive ? styles.statusActiveText : styles.statusInactiveText,
                      ]}
                    >
                      {item.isActive ? 'مفعل نشط' : 'معطل'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Permissions Matrix Mini Overview */}
              <View style={styles.matrixMiniRow}>
                <View style={styles.permCountBox}>
                  <Text style={styles.permCountLabel}>الصلاحيات المفعلة:</Text>
                  <Text style={styles.permCountVal}>{totalGranted} / 72 صلاحية</Text>
                </View>

                {/* Active Module Badges */}
                <View style={styles.moduleBadgesWrap}>
                  {ERP_MODULES.map((mod) => {
                    const hasAny = item.isSystemAdmin || Object.values(item.permissions?.[mod.id] || {}).some(Boolean);
                    if (!hasAny) return null;
                    return (
                      <View key={mod.id} style={styles.miniModPill}>
                        <Text style={styles.miniModPillText}>{mod.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.roleCardFooter}>
                <Text style={styles.roleDate}>
                  تاريخ الإنشاء: {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </Text>

                <View style={styles.roleFooterActions}>
                  <TouchableOpacity
                    style={styles.editRoleBtn}
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="create-outline" size={15} color="#2563EB" />
                    <Text style={styles.editRoleBtnText}>تعديل الصلاحيات</Text>
                  </TouchableOpacity>

                  {!item.isSystemAdmin && (
                    <TouchableOpacity
                      style={styles.deleteRoleBtn}
                      onPress={() => handleDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Role Creation / Edit Modal */}
      <RoleModal
        visible={showModal}
        roleToEdit={editingRole}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navStrip: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navTabActive: {
    backgroundColor: '#2563EB',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  navTabTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBarRow: {
    flexDirection: 'row',
    padding: 12,
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
  addRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addRoleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  roleCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.75,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleTitleCol: {
    flex: 1,
  },
  roleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  roleDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statusToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActiveBtn: {
    backgroundColor: '#ECFDF5',
  },
  statusInactiveBtn: {
    backgroundColor: '#FEE2E2',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  matrixMiniRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  permCountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  permCountLabel: {
    fontSize: 10,
    color: '#475569',
  },
  permCountVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  moduleBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  miniModPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniModPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  roleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  roleDate: {
    fontSize: 9,
    color: '#94A3B8',
  },
  roleFooterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editRoleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  deleteRoleBtn: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
  },
});
