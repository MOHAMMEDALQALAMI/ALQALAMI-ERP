import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { AuditLogEntry } from '../types/erp';

export const AuditLogsScreen = () => {
  const { auditLogs, setActiveScreen } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  return (
    <View style={styles.container}>
      <HeaderBar
        title="سجل العمليات وتغيير الصلاحيات (Audit Trail)"
        subtitle="توثيق زمني غير قابل للتعديل لجميع العمليات الأمنية ومحاولات الوصول"
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

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveScreen('users_management')}
        >
          <Ionicons name="people" size={15} color="#475569" />
          <Text style={styles.navTabText}>المستخدمين والفروع</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navTab, styles.navTabActive]}>
          <Ionicons name="time" size={15} color="#FFFFFF" />
          <Text style={styles.navTabTextActive}>سجل العمليات ({auditLogs.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Severity Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'جميع السجلات' },
            { id: 'info', label: 'عمليات النظام (Info)' },
            { id: 'warning', label: 'تنبيهات (Warning)' },
            { id: 'critical', label: 'محاولات محظورة (Blocked Security)' },
          ].map((f) => {
            const isSel = filterSeverity === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSel && styles.filterChipActive]}
                onPress={() => setFilterSeverity(f.id as any)}
              >
                <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Box */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث باسم المستخدم، الإجراء، أو التفاصيل..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="shield-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>لا توجد سجلات تطابق البحث</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCritical = item.severity === 'critical';
          const isWarning = item.severity === 'warning';

          return (
            <View
              style={[
                styles.logCard,
                isCritical
                  ? styles.logCritical
                  : isWarning
                  ? styles.logWarning
                  : styles.logInfo,
              ]}
            >
              <View style={styles.logTop}>
                <View style={styles.logLeft}>
                  <View
                    style={[
                      styles.logIconBox,
                      isCritical
                        ? { backgroundColor: '#DC2626' }
                        : isWarning
                        ? { backgroundColor: '#D97706' }
                        : { backgroundColor: '#2563EB' },
                    ]}
                  >
                    <Ionicons
                      name={
                        isCritical
                          ? 'lock-closed'
                          : isWarning
                          ? 'warning'
                          : 'checkmark-circle'
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>

                  <View>
                    <Text style={styles.logActionTitle}>{item.actionTitle}</Text>
                    <Text style={styles.logUserMeta}>
                      المستخدم: <Text style={{ fontWeight: 'bold' }}>{item.userName}</Text> • ({item.userRole})
                    </Text>
                  </View>
                </View>

                <Text style={styles.logTime}>
                  {new Date(item.timestamp).toLocaleDateString('ar-SA')} - {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                </Text>
              </View>

              <Text style={styles.logDetails}>{item.details}</Text>

              {item.targetName && (
                <View style={styles.logFooter}>
                  <Text style={styles.targetText}>
                    الهدف: <Text style={{ fontWeight: 'bold' }}>{item.targetName}</Text>
                  </Text>
                  <Text style={styles.auditIdText}>#Ref: {item.id.slice(-8)}</Text>
                </View>
              )}
            </View>
          );
        }}
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
  filterRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchBarRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  logWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  logCritical: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logActionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logUserMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  logTime: {
    fontSize: 9,
    color: '#94A3B8',
  },
  logDetails: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginVertical: 4,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 4,
    marginTop: 4,
  },
  targetText: {
    fontSize: 9,
    color: '#475569',
  },
  auditIdText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});
