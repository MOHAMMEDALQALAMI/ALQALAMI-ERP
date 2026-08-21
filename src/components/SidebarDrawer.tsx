import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { ActiveScreen, ERPModule } from '../types/erp';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: ActiveScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  module?: ERPModule; // If assigned, will verify permission
  badge?: number | string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activeScreen,
    setActiveScreen,
    settings,
    activeBranch,
    currentShift,
    products,
    cartItemCount,
    setCalculatorVisible,
    canAccessModule,
    currentUser,
    currentUserRole,
  } = useERP();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  const rawSections: MenuSection[] = [
    {
      title: 'العمليات ونقاط البيع اليومية',
      items: [
        { id: 'dashboard', label: 'لوحة القيادة والمؤشرات', icon: 'speedometer' },
        {
          id: 'pos',
          label: 'نقطة البيع والكاشير POS',
          icon: 'cart',
          module: 'sales',
          badge: cartItemCount > 0 ? cartItemCount : undefined,
          badgeColor: '#2563EB',
        },
        { id: 'sales', label: 'المبيعات والعملاء', icon: 'receipt', module: 'sales' },
        { id: 'quotations', label: 'عروض الأسعار والأوامر', icon: 'document-attach', module: 'sales' },
        { id: 'purchases', label: 'المشتريات والموردين', icon: 'bag-handle', module: 'purchases' },
      ],
    },
    {
      title: 'المخزون والمستودعات',
      items: [
        {
          id: 'inventory',
          label: 'دليل الأصناف والمخازن',
          icon: 'cube',
          module: 'inventory',
          badge: lowStockCount > 0 ? `${lowStockCount} ناقص` : undefined,
          badgeColor: '#DC2626',
        },
        { id: 'transfers', label: 'التحويل بين المستودعات', icon: 'swap-horizontal', module: 'inventory' },
        { id: 'barcode_labels', label: 'طباعة الباركود والملصقات', icon: 'barcode', module: 'inventory' },
      ],
    },
    {
      title: 'الحسابات والشجرة المالية',
      items: [
        { id: 'finance', label: 'دليل الحسابات والقيود', icon: 'wallet', module: 'accounting' },
        { id: 'statement_ledger', label: 'كشف حساب تفصيلي', icon: 'book', module: 'accounting' },
        { id: 'cost_centers', label: 'مراكز التكلفة والمشاريع', icon: 'pie-chart', module: 'accounting' },
        { id: 'reports', label: 'القوائم والتقارير المالية', icon: 'bar-chart', module: 'reports' },
      ],
    },
    {
      title: 'الأدوار والصلاحيات والأمان (RBAC)',
      items: [
        { id: 'roles', label: 'الأدوار والصلاحيات الوظيفية', icon: 'shield-checkmark', module: 'accounting' },
        { id: 'users_management', label: 'المستخدمين وصلاحيات الفروع', icon: 'people', module: 'accounting' },
        { id: 'audit_logs', label: 'سجل العمليات والرقابة', icon: 'time', module: 'accounting' },
        { id: 'permission_tester', label: 'مختبر فحص الصلاحيات', icon: 'flask' },
      ],
    },
    {
      title: 'الموارد البشرية والإدارة',
      items: [
        { id: 'hr', label: 'الموارد البشرية والرواتب', icon: 'people', module: 'payroll' },
        { id: 'settings', label: 'إعدادات المنشأة والفروع', icon: 'settings' },
      ],
    },
  ];

  // Requirement #7: المستخدم لا يرى إلا الأقسام والبيانات المسموح له بها
  const visibleSections = rawSections
    .map((sec) => {
      const visibleItems = sec.items.filter((item) => {
        if (!item.module) return true;
        return canAccessModule(item.module);
      });
      return {
        ...sec,
        items: visibleItems,
      };
    })
    .filter((sec) => sec.items.length > 0);

  const handleSelect = (id: ActiveScreen) => {
    setActiveScreen(id);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sidebar}>
          {/* Top Brand Banner */}
          <View style={styles.brandHeader}>
            <View style={styles.brandTopRow}>
              <View style={styles.brandLogo}>
                <Ionicons name="cube" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandName}>ALQALAMI ERP</Text>
                  <View style={styles.proPill}>
                    <Text style={styles.proText}>RBAC</Text>
                  </View>
                </View>
                <Text style={styles.brandSlogan} numberOfLines={1}>
                  {settings.name}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Active Branch Pill */}
            <View style={styles.activeBranchBox}>
              <Ionicons name="business" size={13} color="#60A5FA" />
              <Text style={styles.activeBranchText} numberOfLines={1}>
                {activeBranch?.name}
              </Text>
            </View>
          </View>

          {/* Quick User Role Indicator */}
          <View style={styles.userRoleBanner}>
            <View style={styles.roleDot} />
            <Text style={styles.roleBannerText} numberOfLines={1}>
              المستخدم: <Text style={{ fontWeight: 'bold', color: '#60A5FA' }}>{currentUser.name}</Text> ({currentUserRole.name})
            </Text>
          </View>

          {/* Quick Tools Header Strip */}
          <View style={styles.quickToolsRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => {
                onClose();
                setCalculatorVisible(true);
              }}
            >
              <Ionicons name="calculator-outline" size={15} color="#60A5FA" />
              <Text style={styles.toolBtnText}>الحاسبة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: '#1E3A8A' }]}
              onPress={() => {
                onClose();
                setActiveScreen('permission_tester');
              }}
            >
              <Ionicons name="flask" size={13} color="#93C5FD" />
              <Text style={[styles.toolBtnText, { color: '#FFFFFF' }]}>فحص الأمان</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.shiftStatusPill,
                currentShift?.status === 'open' ? styles.shiftOpen : styles.shiftClosed,
              ]}
            >
              <View
                style={[
                  styles.shiftDot,
                  { backgroundColor: currentShift?.status === 'open' ? '#10B981' : '#EF4444' },
                ]}
              />
              <Text style={styles.shiftStatusText}>
                {currentShift?.status === 'open' ? 'الوردية' : 'مغلقة'}
              </Text>
            </View>
          </View>

          {/* Navigation Sections */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {visibleSections.map((sec, sIdx) => (
              <View key={sIdx} style={styles.sectionContainer}>
                <Text style={styles.sectionHeaderTitle}>{sec.title}</Text>
                {sec.items.map((item) => {
                  const isActive = activeScreen === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleSelect(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemLeft}>
                        <View
                          style={[
                            styles.menuIconContainer,
                            isActive && styles.menuIconContainerActive,
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={18}
                            color={isActive ? '#FFFFFF' : '#94A3B8'}
                          />
                        </View>
                        <Text
                          style={[
                            styles.menuItemText,
                            isActive && styles.menuItemTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>

                      {item.badge && (
                        <View
                          style={[
                            styles.badgeContainer,
                            { backgroundColor: item.badgeColor || '#2563EB' },
                          ]}
                        >
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* User Profile Footer */}
          <TouchableOpacity
            style={styles.sidebarFooter}
            onPress={() => {
              onClose();
              setActiveScreen('permission_tester');
            }}
          >
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser.name}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {currentUserRole.name} {currentUserRole.isSystemAdmin ? '★' : ''}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={16} color="#60A5FA" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    flex: 1,
  },
  sidebar: {
    width: Platform.OS === 'web' ? 320 : Math.min(320, Dimensions.get('window').width * 0.82),
    backgroundColor: '#0F172A',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#1E293B',
  },
  brandHeader: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  proPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  brandSlogan: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  activeBranchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeBranchText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    flex: 1,
  },
  userRoleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A192F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  roleBannerText: {
    fontSize: 10,
    color: '#94A3B8',
    flex: 1,
  },
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toolBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shiftOpen: {
    backgroundColor: '#064E3B',
  },
  shiftClosed: {
    backgroundColor: '#450A0A',
  },
  shiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shiftStatusText: {
    fontSize: 10,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconContainerActive: {
    backgroundColor: '#2563EB',
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#0B132B',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  userRole: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
});
