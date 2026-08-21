import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';

export const TransfersScreen = () => {
  const { stockTransfers, createStockTransfer, warehouses, products } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [fromWhId, setFromWhId] = useState(warehouses[0]?.id || 'wh-1');
  const [toWhId, setToWhId] = useState(warehouses[1]?.id || 'wh-2');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'p-1');
  const [transferQty, setTransferQty] = useState('10');
  const [transferNotes, setTransferNotes] = useState('');

  const fromWh = warehouses.find((w) => w.id === fromWhId) || warehouses[0];
  const toWh = warehouses.find((w) => w.id === toWhId) || warehouses[1];
  const prod = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSaveTransfer = async () => {
    if (fromWhId === toWhId) {
      Alert.alert('خطأ', 'لا يمكن التحويل لنفس المستودع.');
      return;
    }
    const qty = parseInt(transferQty) || 0;
    if (qty <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال كمية صحيحة للتحويل.');
      return;
    }

    await createStockTransfer({
      date: new Date().toISOString(),
      fromWarehouseId: fromWhId,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWhId,
      toWarehouseName: toWh.name,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unit: prod.unit,
        },
      ],
      status: 'completed',
      notes: transferNotes || 'تحويل مخزني بين الفروع',
      createdBy: 'أمين المستودعات العام',
    });

    Alert.alert('تم التحويل', 'تم إصدار سند التحويل المخزني وتحديث أرصدة المستودعات بنجاح.');
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="التحويلات بين المستودعات والفروع"
        subtitle="مناقلة البضائع والأصناف بين المخازن وصالات العرض"
      />

      <View style={styles.topActionsRow}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>إجمالي التحويلات: {stockTransfers.length} سند</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>سند تحويل جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stockTransfers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.transferCard}>
            <View style={styles.transferTop}>
              <View style={styles.transferNumBox}>
                <Ionicons name="swap-horizontal" size={18} color="#2563EB" />
                <Text style={styles.transferNum}>{item.transferNumber}</Text>
              </View>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>مكتمل ✓</Text>
              </View>
            </View>

            <View style={styles.locationsRow}>
              <View style={styles.locCol}>
                <Text style={styles.locLabel}>من مستودع:</Text>
                <Text style={styles.locVal}>{item.fromWarehouseName}</Text>
              </View>
              <Ionicons name="arrow-back" size={16} color="#64748B" />
              <View style={styles.locCol}>
                <Text style={styles.locLabel}>إلى مستودع:</Text>
                <Text style={styles.locVal}>{item.toWarehouseName}</Text>
              </View>
            </View>

            <View style={styles.itemsBox}>
              {item.items.map((it, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  • {it.productName} ({it.quantity} {it.unit})
                </Text>
              ))}
            </View>

            <View style={styles.transferBottom}>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('ar-SA')}
              </Text>
              <Text style={styles.userText}>المسؤول: {item.createdBy}</Text>
            </View>
          </View>
        )}
      />

      {/* New Transfer Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>سند مناقلة وتحويل مخزني</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 14 }}>
              <Text style={styles.label}>من مستودع (المصدر):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {warehouses.map((w) => {
                  const isSel = w.id === fromWhId;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.whChip, isSel && styles.whChipActive]}
                      onPress={() => setFromWhId(w.id)}
                    >
                      <Text style={[styles.whChipText, isSel && styles.whChipTextActive]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>إلى مستودع (الوجهة):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {warehouses.map((w) => {
                  const isSel = w.id === toWhId;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.whChip, isSel && styles.whChipActive]}
                      onPress={() => setToWhId(w.id)}
                    >
                      <Text style={[styles.whChipText, isSel && styles.whChipTextActive]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>الصنف المراد تحويله:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {products.map((p) => {
                  const isSel = p.id === selectedProductId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.whChip, isSel && styles.whChipActive]}
                      onPress={() => setSelectedProductId(p.id)}
                    >
                      <Text style={[styles.whChipText, isSel && styles.whChipTextActive]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>الكمية المراد مناقلتها:</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                keyboardType="numeric"
                value={transferQty}
                onChangeText={setTransferQty}
              />

              <Text style={[styles.label, { marginTop: 8 }]}>ملاحظات ورقم الإرسالية:</Text>
              <TextInput
                style={styles.input}
                placeholder="سائق الشاحنة، ملاحظات التسليم..."
                value={transferNotes}
                onChangeText={setTransferNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTransfer}>
                <Text style={styles.saveBtnText}>ترحيل التحويل</Text>
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
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  infoBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  transferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transferTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transferNumBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transferNum: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  locationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  locCol: {
    flex: 1,
  },
  locLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  locVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  itemsBox: {
    marginBottom: 6,
  },
  itemLine: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  transferBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  userText: {
    fontSize: 10,
    color: '#64748B',
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
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  whChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  whChipActive: {
    backgroundColor: '#2563EB',
  },
  whChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  whChipTextActive: {
    color: '#FFFFFF',
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
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
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
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
