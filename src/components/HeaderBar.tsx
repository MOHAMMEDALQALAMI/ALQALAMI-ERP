import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { CurrencyCode } from '../types/erp';

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showBranchSelector?: boolean;
  onOpenShiftModal?: () => void;
  onOpenLowStockModal?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title = 'ALQALAMI ERP',
  subtitle,
  showBranchSelector = true,
  onOpenShiftModal,
  onOpenLowStockModal,
}) => {
  const {
    settings,
    branches,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    selectedCurrency,
    setSelectedCurrency,
    currencies,
    currentShift,
    products,
    toggleSidebar,
    setCalculatorVisible,
    canAccessBranch,
    currentUser,
    currentUserRole,
    setActiveScreen,
  } = useERP();

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCurrModal, setShowCurrModal] = useState(false);

  // Filter branches user has access to
  const accessibleBranches = branches.filter((b) => canAccessBranch(b.id));

  // Count low stock items
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  return (
    <View style={styles.container}>
      {/* Top Main Row */}
      <View style={styles.topRow}>
        {/* Left Side: Sidebar Hamburger Toggle + Logo */}
        <View style={styles.brandContainer}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={toggleSidebar}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoBadge}>
            <Ionicons name="cube" size={18} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>{title}</Text>
              <View style={styles.erpBadge}>
                <Text style={styles.erpBadgeText}>RBAC</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {subtitle || settings.name}
            </Text>
          </View>
        </View>

        {/* Right Side: Quick Action Tools */}
        <View style={styles.actionsRow}>
          {/* Quick Permission Tester / User Role Pill */}
          <TouchableOpacity
            style={styles.roleUserPill}
            onPress={() => setActiveScreen('permission_tester')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={13} color="#60A5FA" />
            <Text style={styles.roleUserPillText} numberOfLines={1}>
              {currentUser?.name?.split(' ')[0]}
            </Text>
          </TouchableOpacity>

          {/* Quick Calculator */}
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setCalculatorVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calculator-outline" size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Low stock alert badge */}
          {lowStockCount > 0 && onOpenLowStockModal && (
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={onOpenLowStockModal}
              activeOpacity={0.7}
            >
              <Ionicons name="warning" size={15} color="#DC2626" />
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{lowStockCount}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Currency Switcher */}
          <TouchableOpacity
            style={styles.currencyBtn}
            onPress={() => setShowCurrModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="cash-outline" size={13} color="#60A5FA" />
            <Text style={styles.currencyBtnText}>{selectedCurrency}</Text>
          </TouchableOpacity>

          {/* Shift Status Button */}
          {onOpenShiftModal && (
            <TouchableOpacity
              style={[
                styles.shiftBadge,
                currentShift?.status === 'open' ? styles.shiftOpen : styles.shiftClosed,
              ]}
              onPress={onOpenShiftModal}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shiftDot,
                  {
                    backgroundColor:
                      currentShift?.status === 'open' ? '#10B981' : '#EF4444',
                  },
                ]}
              />
              <Text style={styles.shiftText}>
                {currentShift?.status === 'open' ? 'الوردية' : 'مغلقة'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Branch & Warehouse Indicator */}
      {showBranchSelector && (
        <TouchableOpacity
          style={styles.branchSelectorBar}
          onPress={() => setShowBranchModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.branchInfo}>
            <Ionicons name="business-outline" size={13} color="#60A5FA" />
            <Text style={styles.branchText} numberOfLines={1}>
              {activeBranch?.name} {accessibleBranches.length > 1 ? `(${accessibleBranches.length} فروع متاحة)` : ''}
            </Text>
          </View>
          {accessibleBranches.length > 1 && (
            <View style={styles.switchBranchBtn}>
              <Text style={styles.switchBranchText}>تبديل الفرع</Text>
              <Ionicons name="chevron-down" size={12} color="#60A5FA" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBranchModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>اختر فرع المنشأة النشط</Text>
                <Text style={styles.modalSub}>
                  الفروع المسموح للمستخدم ({currentUser.name}) الوصول إليها
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {accessibleBranches.map((b) => {
                const isSelected = b.id === activeBranchId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.branchItem, isSelected && styles.branchItemSelected]}
                    onPress={() => {
                      setActiveBranchId(b.id);
                      setShowBranchModal(false);
                    }}
                  >
                    <View style={styles.branchItemLeft}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'business-outline'}
                        size={20}
                        color={isSelected ? '#2563EB' : '#64748B'}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.branchItemName,
                            isSelected && styles.branchItemNameSelected,
                          ]}
                        >
                          {b.name}
                        </Text>
                        <Text style={styles.branchItemCity}>
                          المدينة: {b.city} {b.isMain ? '• (الرئيسي)' : ''}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر العملة الحسابية</Text>
              <TouchableOpacity onPress={() => setShowCurrModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {currencies.map((curr) => {
                const isSelected = curr.code === selectedCurrency;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.currItem, isSelected && styles.currItemSelected]}
                    onPress={() => {
                      setSelectedCurrency(curr.code as CurrencyCode);
                      setShowCurrModal(false);
                    }}
                  >
                    <View style={styles.currItemLeft}>
                      <View style={styles.currSymbolBadge}>
                        <Text style={styles.currSymbolText}>{curr.symbol}</Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.currItemName,
                            isSelected && styles.currItemNameSelected,
                          ]}
                        >
                          {curr.name} ({curr.code})
                        </Text>
                        <Text style={styles.currRate}>
                          سعر الصرف: 1 ر.س = {(1 / curr.exchangeRate).toFixed(4)} {curr.code}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  erpBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  erpBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
    maxWidth: 150,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleUserPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E2E8F0',
    maxWidth: 60,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtn: {
    position: 'relative',
    backgroundColor: '#450A0A',
    padding: 6,
    borderRadius: 6,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencyBtnText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },
  shiftOpen: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
  },
  shiftClosed: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  shiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shiftText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
  },
  branchSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  branchText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  switchBranchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  switchBranchText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  branchItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  branchItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  branchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  branchItemNameSelected: {
    color: '#1D4ED8',
  },
  branchItemCity: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  currItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  currItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currSymbolBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currSymbolText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3730A3',
  },
  currItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  currItemNameSelected: {
    color: '#1D4ED8',
  },
  currRate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});
