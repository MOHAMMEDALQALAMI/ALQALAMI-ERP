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
import { NewJournalEntryModal } from '../components/NewJournalEntryModal';
import { NewVoucherModal } from '../components/NewVoucherModal';
import { Account, JournalEntry, Voucher } from '../types/erp';

export const FinanceScreen = () => {
  const { accounts, journalEntries, vouchers, formatCurrency } = useERP();

  const [activeTab, setActiveTab] = useState<'accounts' | 'journal' | 'vouchers' | 'treasury'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('receipt');

  // Filter accounts
  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.includes(searchQuery)
  );

  // Filter journal entries
  const filteredJournal = journalEntries.filter(
    (j) =>
      j.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter vouchers
  const filteredVouchers = vouchers.filter(
    (v) =>
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Treasuries & Banks
  const treasuryAccounts = accounts.filter(
    (a) =>
      a.code === '1101' ||
      a.code === '1102' ||
      a.code === '1103' ||
      a.code === '1104'
  );

  const totalTreasuryBalance = treasuryAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <View style={styles.container}>
      <HeaderBar
        title="الإدارة المالية والحسابات العامة"
        subtitle="شجرة الحسابات، قيود اليومية، وسندات القبض والصرف"
      />

      {/* Tab Selector */}
      <View style={styles.topTabs}>
        {[
          { id: 'accounts', label: 'شجرة الحسابات', icon: 'git-network-outline' },
          { id: 'journal', label: 'قيود اليومية', icon: 'book-outline' },
          { id: 'vouchers', label: 'السندات', icon: 'document-text-outline' },
          { id: 'treasury', label: 'الصناديق والبنوك', icon: 'wallet-outline' },
        ].map((t) => {
          const isSel = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, isSel && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.id as any)}
            >
              <Ionicons
                name={t.icon as any}
                size={14}
                color={isSel ? '#FFFFFF' : '#475569'}
              />
              <Text style={[styles.tabText, isSel && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Header Strip */}
      <View style={styles.actionHeaderStrip}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالحساب، القيد، أو السند..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {activeTab === 'journal' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowJournalModal(true)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>قيد جديد</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'vouchers' && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              onPress={() => {
                setVoucherType('receipt');
                setShowVoucherModal(true);
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>سند قبض</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => {
                setVoucherType('payment');
                setShowVoucherModal(true);
              }}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>سند صرف</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content Rendering */}
      {activeTab === 'accounts' && (
        <FlatList
          data={filteredAccounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isRoot = !item.parentCode;
            const isSub = item.parentCode && item.code.length <= 2;
            const isLeaf = item.code.length > 2;

            return (
              <View
                style={[
                  styles.accountCard,
                  isRoot ? styles.accRoot : isSub ? styles.accSub : styles.accLeaf,
                ]}
              >
                <View style={styles.accLeft}>
                  <View
                    style={[
                      styles.accCodeBadge,
                      isRoot ? styles.codeBadgeRoot : styles.codeBadgeLeaf,
                    ]}
                  >
                    <Text style={styles.accCodeText}>{item.code}</Text>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.accName,
                        isRoot && { fontWeight: 'bold', fontSize: 13 },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.accType}>
                      {item.type === 'asset'
                        ? 'أصول (Assets)'
                        : item.type === 'liability'
                        ? 'خصوم (Liabilities)'
                        : item.type === 'equity'
                        ? 'حقوق ملكية (Equity)'
                        : item.type === 'revenue'
                        ? 'إيرادات (Revenue)'
                        : 'مصروفات (Expenses)'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.accBalance,
                    isRoot && { fontWeight: '800', color: '#1E3A8A' },
                  ]}
                >
                  {formatCurrency(item.balance)}
                </Text>
              </View>
            );
          }}
        />
      )}

      {activeTab === 'journal' && (
        <FlatList
          data={filteredJournal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <View style={styles.jeNumRow}>
                  <Text style={styles.jeNumber}>{item.entryNumber}</Text>
                  <Text style={styles.jeDate}>
                    {new Date(item.date).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
                <Text style={styles.jeTotal}>{formatCurrency(item.totalDebit)}</Text>
              </View>

              <Text style={styles.jeDesc}>{item.description}</Text>

              {/* Journal Lines */}
              <View style={styles.jeLinesBox}>
                {item.lines.map((line, idx) => (
                  <View key={idx} style={styles.jeLineRow}>
                    <Text style={styles.jeLineAcc} numberOfLines={1}>
                      {line.accountCode} - {line.accountName}
                    </Text>
                    <View style={styles.jeLineAmounts}>
                      {line.debit > 0 ? (
                        <Text style={styles.jeDebit}>مدين: {line.debit.toFixed(2)}</Text>
                      ) : (
                        <Text style={styles.jeCredit}>دائن: {line.credit.toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}

      {activeTab === 'vouchers' && (
        <FlatList
          data={filteredVouchers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isReceipt = item.type === 'receipt';
            return (
              <View style={styles.voucherCard}>
                <View style={styles.voucherTop}>
                  <View style={styles.vouchLeft}>
                    <View
                      style={[
                        styles.vouchBadge,
                        isReceipt ? styles.vouchReceipt : styles.vouchPayment,
                      ]}
                    >
                      <Ionicons
                        name={isReceipt ? 'arrow-down' : 'arrow-up'}
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.vouchNum}>{item.voucherNumber}</Text>
                      <Text style={styles.vouchParty}>
                        {isReceipt ? 'مقبوض من: ' : 'مدفوع إلى: '}
                        <Text style={{ fontWeight: 'bold' }}>{item.partyName}</Text>
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.vouchAmount,
                      isReceipt ? { color: '#059669' } : { color: '#DC2626' },
                    ]}
                  >
                    {isReceipt ? '+' : '-'} {formatCurrency(item.amount)}
                  </Text>
                </View>

                <Text style={styles.vouchDesc}>{item.description}</Text>
                <View style={styles.vouchBottom}>
                  <Text style={styles.vouchAcc}>{item.accountName}</Text>
                  <Text style={styles.vouchDate}>
                    {new Date(item.date).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {activeTab === 'treasury' && (
        <ScrollView style={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Total Liquidity Banner */}
          <View style={styles.liquidityBanner}>
            <Text style={styles.liqLabel}>إجمالي السيولة النقدية والبنكية:</Text>
            <Text style={styles.liqVal}>{formatCurrency(totalTreasuryBalance)}</Text>
          </View>

          {/* Accounts Breakdown */}
          {treasuryAccounts.map((acc) => (
            <View key={acc.id} style={styles.treasuryCard}>
              <View style={styles.treasuryIcon}>
                <Ionicons
                  name={acc.code.includes('1103') || acc.code.includes('1104') ? 'business' : 'cash'}
                  size={24}
                  color="#2563EB"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.treasuryName}>{acc.name}</Text>
                <Text style={styles.treasuryCode}>رقم الحساب: {acc.code}</Text>
              </View>

              <Text style={styles.treasuryBalance}>{formatCurrency(acc.balance)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modals */}
      <NewJournalEntryModal
        visible={showJournalModal}
        onClose={() => setShowJournalModal(false)}
      />

      <NewVoucherModal
        visible={showVoucherModal}
        defaultType={voucherType}
        onClose={() => setShowVoucherModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topTabs: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  actionHeaderStrip: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  searchBox: {
    flex: 1,
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accRoot: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  accSub: {
    backgroundColor: '#F8FAFC',
    marginRight: 10,
  },
  accLeaf: {
    marginRight: 20,
  },
  accLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeRoot: {
    backgroundColor: '#2563EB',
  },
  codeBadgeLeaf: {
    backgroundColor: '#E2E8F0',
  },
  accCodeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  accName: {
    fontSize: 12,
    color: '#0F172A',
  },
  accType: {
    fontSize: 9,
    color: '#64748B',
  },
  accBalance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  journalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jeNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jeNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  jeDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  jeTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  jeDesc: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  jeLinesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  jeLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  jeLineAcc: {
    fontSize: 10,
    color: '#334155',
    flex: 1,
  },
  jeLineAmounts: {
    alignItems: 'flex-end',
  },
  jeDebit: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  jeCredit: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voucherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vouchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vouchBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vouchReceipt: {
    backgroundColor: '#059669',
  },
  vouchPayment: {
    backgroundColor: '#DC2626',
  },
  vouchNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  vouchParty: {
    fontSize: 11,
    color: '#475569',
  },
  vouchAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  vouchDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  vouchBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 4,
  },
  vouchAcc: {
    fontSize: 10,
    color: '#2563EB',
  },
  vouchDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  liquidityBanner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  liqLabel: {
    fontSize: 12,
    color: '#BFDBFE',
  },
  liqVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  treasuryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  treasuryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  treasuryName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  treasuryCode: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  treasuryBalance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
});
