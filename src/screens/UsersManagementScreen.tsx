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
import { UserModal } from '../components/UserModal';
import { ERPUser } from '../types/erp';

export const UsersManagementScreen = () => {
  const {
    erpUsers,
    currentUserId,
    switchSimulatedUser,
    toggleERPUserStatus,
    branches,
    setActiveScreen,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ERPUser | null>(null);

  const filteredUsers = erpUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: ERPUser) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = (user: ERPUser) => {
    if (user.id === 'u-1') {
      Alert.alert('تنبيه', 'لا يمكن إيقاف حساب مدير النظام العام.');
      return;
    }
    toggleERPUserStatus(user.id);
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="إدارة المستخدمين وصلاحيات الفروع"
        subtitle="تعيين الأدوار الوظيفية وتحديد فروع العمل المسموحة لكل مستخدم"
      />

      {/* Navigation Switcher Strip */}
      <View style={styles.navStrip}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveScreen('roles')}
        >
          <Ionicons name="shield-checkmark" size={15} color="#475569" />
          <Text style={styles.navTabText}>الأدوار الوظيفية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navTab, styles.navTabActive]}>
          <Ionicons name="people" size={15} color="#FFFFFF" />
          <Text style={styles.navTabTextActive}>المستخدمين والفروع ({erpUsers.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveScreen('audit_logs')}
        >
          <Ionicons name="time" size={15} color="#475569" />
          <Text style={styles.navTabText}>سجل العمليات</Text>
        </TouchableOpacity>
      </View>

      {/* Active User Switcher / Simulation Notice */}
      <View style={styles.activeUserBanner}>
        <View style={styles.activeUserLeft}>
          <View style={styles.userPulse} />
          <Text style={styles.activeUserText}>
            المستخدم النشط حالياً بالتطبيق: <Text style={{ fontWeight: 'bold', color: '#2563EB' }}>
              {erpUsers.find((u) => u.id === currentUserId)?.name} ({erpUsers.find((u) => u.id === currentUserId)?.roleName})
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.testPermsBtn}
          onPress={() => setActiveScreen('permission_tester')}
        >
          <Text style={styles.testPermsText}>اختبار ومحاكاة الأدوار</Text>
          <Ionicons name="flask" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث باسم المستخدم، اسم الحساب، أو الدور..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addUserBtn} onPress={handleCreateNew}>
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addUserBtnText}>مستخدم جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isCurrent = item.id === currentUserId;
          const allowedBranchNames = item.allowedBranchIds.includes('*')
            ? 'جميع الفروع (وصول كامل)'
            : branches
                .filter((b) => item.allowedBranchIds.includes(b.id))
                .map((b) => b.name)
                .join(' • ');

          return (
            <View style={[styles.userCard, isCurrent && styles.userCardCurrent]}>
              <View style={styles.userCardTop}>
                <View style={styles.userAvatarBox}>
                  <Ionicons name="person" size={20} color="#2563EB" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>أنت الآن</Text>
                      </View>
                    )}
                    {!item.isActive && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>موقوف</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.userUsername}>اسم الحساب: @{item.username} | هاتف: {item.phone}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.switchUserBtn,
                    isCurrent && styles.switchUserBtnActive,
                  ]}
                  onPress={() => switchSimulatedUser(item.id)}
                >
                  <Ionicons
                    name={isCurrent ? 'checkmark-circle' : 'log-in-outline'}
                    size={14}
                    color={isCurrent ? '#059669' : '#2563EB'}
                  />
                  <Text style={[styles.switchUserText, isCurrent && styles.switchUserTextActive]}>
                    {isCurrent ? 'الحساب الحالي' : 'تبديل إليه'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Role & Branches Info */}
              <View style={styles.userMetaCard}>
                <View style={styles.metaRowItem}>
                  <Text style={styles.metaLabel}>الدور الوظيفي:</Text>
                  <Text style={styles.metaRoleVal}>{item.roleName}</Text>
                </View>

                <View style={[styles.metaRowItem, { marginTop: 4 }]}>
                  <Text style={styles.metaLabel}>صلاحية الفروع:</Text>
                  <Text style={styles.metaBranchVal} numberOfLines={1}>
                    {allowedBranchNames}
                  </Text>
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.userCardFooter}>
                <Text style={styles.userDate}>
                  تاريخ التسجيل: {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </Text>

                <View style={styles.userActionsRow}>
                  <TouchableOpacity
                    style={styles.editUserBtn}
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="create-outline" size={14} color="#2563EB" />
                    <Text style={styles.editUserText}>تعديل البيانات والفروع</Text>
                  </TouchableOpacity>

                  {item.id !== 'u-1' && (
                    <TouchableOpacity
                      style={[
                        styles.toggleUserBtn,
                        item.isActive ? styles.toggleUserInactive : styles.toggleUserActive,
                      ]}
                      onPress={() => handleToggleStatus(item)}
                    >
                      <Text
                        style={[
                          styles.toggleUserText,
                          item.isActive ? { color: '#DC2626' } : { color: '#059669' },
                        ]}
                      >
                        {item.isActive ? 'إيقاف' : 'تنشيط'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* User Modal */}
      <UserModal
        visible={showModal}
        userToEdit={editingUser}
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
  activeUserBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  activeUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  userPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeUserText: {
    fontSize: 11,
    color: '#1E293B',
  },
  testPermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testPermsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  addUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addUserBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  userCard: {
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
  userCardCurrent: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  userAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  currentBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  userUsername: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  switchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  switchUserBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  switchUserText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  switchUserTextActive: {
    color: '#059669',
  },
  userMetaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  metaRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaRoleVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  metaBranchVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 200,
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  userDate: {
    fontSize: 9,
    color: '#94A3B8',
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editUserText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  toggleUserBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleUserActive: {
    backgroundColor: '#ECFDF5',
  },
  toggleUserInactive: {
    backgroundColor: '#FEE2E2',
  },
  toggleUserText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
