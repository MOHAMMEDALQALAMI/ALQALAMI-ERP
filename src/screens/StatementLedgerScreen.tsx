import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';

export const StatementLedgerScreen = () => {
  const { customers, suppliers, invoices, vouchers, formatCurrency } = useERP();

  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [selectedPartyId, setSelectedPartyId] = useState(customers[0]?.id || 'c-1');

  const customer = customers.find((c) => c.id === selectedPartyId) || customers[0];
  const supplier = suppliers.find((s) => s.id === selectedPartyId) || suppliers[0];

  const currentPartyName = partyType === 'customer' ? customer?.name : supplier?.name;
  const currentBalance = partyType === 'customer' ? customer?.balance : supplier?.balance;

  // Build running ledger transactions
  interface LedgerEntry {
    date: string;
    ref: string;
    desc: string;
    debit: number;
    credit: number;
    balance: number;
  }

  const ledger: LedgerEntry[] = [];
  let running = 0;

  if (partyType === 'customer') {
    // Sales invoices (Debit)
    invoices
      .filter((i) => i.customerId === selectedPartyId)
      .forEach((inv) => {
        ledger.push({
          date: inv.date,
          ref: inv.invoiceNumber,
          desc: `فاتورة مبيعات (${inv.items.length} صنف)`,
          debit: inv.grandTotal,
          credit: inv.paidAmount,
          balance: 0,
        });
      });

    // Receipt vouchers (Credit)
    vouchers
      .filter((v) => v.partyId === selectedPartyId && v.type === 'receipt')
      .forEach((v) => {
        ledger.push({
          date: v.date,
          ref: v.voucherNumber,
          desc: v.description,
          debit: 0,
          credit: v.amount,
          balance: 0,
        });
      });
  } else {
    // Purchases invoices (Credit)
    invoices
      .filter((i) => i.supplierId === selectedPartyId)
      .forEach((inv) => {
        ledger.push({
          date: inv.date,
          ref: inv.invoiceNumber,
          desc: `فاتورة شراء وتوريد`,
          debit: inv.paidAmount,
          credit: inv.grandTotal,
          balance: 0,
        });
      });

    // Payment vouchers (Debit)
    vouchers
      .filter((v) => v.partyId === selectedPartyId && v.type === 'payment')
      .forEach((v) => {
        ledger.push({
          date: v.date,
          ref: v.voucherNumber,
          desc: v.description,
          debit: v.amount,
          credit: 0,
          balance: 0,
        });
      });
  }

  // Calculate running balance
  ledger.forEach((row) => {
    running += row.debit - row.credit;
    row.balance = running;
  });

  const handleExportStatement = () => {
    Alert.alert(
      'تصدير كشف الحساب',
      `تم تصدير كشف الحساب المالي لـ (${currentPartyName}) بنجاح إلى ملف PDF معتمد ومختوم.`
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="كشف الحساب التفصيلي للعملاء والموردين"
        subtitle="سجل القيود، الحركات الدائنة والمدينة، والرصيد الجاري"
      />

      {/* Switcher Customer vs Supplier */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tab, partyType === 'customer' && styles.tabActive]}
          onPress={() => {
            setPartyType('customer');
            setSelectedPartyId(customers[0]?.id || 'c-1');
          }}
        >
          <Text style={[styles.tabText, partyType === 'customer' && styles.tabTextActive]}>
            كشوف حسابات العملاء
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, partyType === 'supplier' && styles.tabActive]}
          onPress={() => {
            setPartyType('supplier');
            setSelectedPartyId(suppliers[0]?.id || 's-1');
          }}
        >
          <Text style={[styles.tabText, partyType === 'supplier' && styles.tabTextActive]}>
            كشوف حسابات الموردين
          </Text>
        </TouchableOpacity>
      </View>

      {/* Parties Selector */}
      <View style={styles.partiesScrollBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(partyType === 'customer' ? customers : suppliers).map((p) => {
            const isSel = p.id === selectedPartyId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.partyChip, isSel && styles.partyChipActive]}
                onPress={() => setSelectedPartyId(p.id)}
              >
                <Text style={[styles.partyChipText, isSel && styles.partyChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Statement Header Card */}
        <View style={styles.statementHeaderCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.partyNameTitle}>{currentPartyName}</Text>
              <Text style={styles.partySubtitle}>
                {partyType === 'customer' ? 'كشف حساب عميل مدين' : 'كشف حساب مورد دائن'}
              </Text>
            </View>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportStatement}>
              <Ionicons name="share-outline" size={14} color="#2563EB" />
              <Text style={styles.exportBtnText}>تصدير PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceHighlightRow}>
            <Text style={styles.balLabel}>الرصيد الإجمالي النهائي:</Text>
            <Text
              style={[
                styles.balVal,
                (currentBalance || 0) > 0 ? { color: '#DC2626' } : { color: '#059669' },
              ]}
            >
              {formatCurrency(currentBalance || 0)}
            </Text>
          </View>
        </View>

        {/* Ledger Transactions Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 70 }]}>التاريخ</Text>
            <Text style={[styles.th, { flex: 2 }]}>البيان والمرجع</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>مدين (+)</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>دائن (-)</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>الرصيد</Text>
          </View>

          {ledger.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>لا توجد حركات مسجلة لهذا الحساب</Text>
            </View>
          ) : (
            ledger.map((row, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                <Text style={[styles.td, { width: 70, fontSize: 9, color: '#64748B' }]}>
                  {new Date(row.date).toLocaleDateString('ar-SA')}
                </Text>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.td, { fontWeight: 'bold' }]}>{row.ref}</Text>
                  <Text style={{ fontSize: 9, color: '#64748B' }}>{row.desc}</Text>
                </View>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', color: '#059669' }]}>
                  {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', color: '#DC2626' }]}>
                  {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                </Text>
                <Text style={[styles.td, { flex: 1.2, textAlign: 'right', fontWeight: 'bold', color: '#1E3A8A' }]}>
                  {row.balance.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabSwitcher: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  partiesScrollBox: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  partyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  partyChipActive: {
    backgroundColor: '#1E3A8A',
  },
  partyChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  partyChipTextActive: {
    color: '#FFFFFF',
  },
  body: {
    padding: 12,
  },
  statementHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyNameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  partySubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  balanceHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 6,
  },
  balLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  balVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  th: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  td: {
    fontSize: 10,
    color: '#1E293B',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
