import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';

interface LowStockModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenNewPurchase?: () => void;
}

export const LowStockModal: React.FC<LowStockModalProps> = ({
  visible,
  onClose,
  onOpenNewPurchase,
}) => {
  const { products, formatCurrency } = useERP();

  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockAlert);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="warning" size={22} color="#FFFFFF" />
              <View>
                <Text style={styles.headerTitle}>نواقص المخزون والتنبيهات الحرجة</Text>
                <Text style={styles.headerSubtitle}>
                  {lowStockItems.length} صنف وصل أو قارب حد إعادة الطلب
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {lowStockItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                <Text style={styles.emptyTitle}>المخزون مكتمل ومستقر</Text>
                <Text style={styles.emptySubtitle}>
                  جميع الأصناف متوفرة بأعلى من حدود الطلب الدنيا.
                </Text>
              </View>
            ) : (
              lowStockItems.map((prod) => (
                <View key={prod.id} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{prod.name}</Text>
                    <Text style={styles.prodMeta}>
                      التصنيف: {prod.categoryName} | باركود: {prod.barcode}
                    </Text>
                    <Text style={styles.prodMeta}>
                      سعر الشراء: {formatCurrency(prod.costPrice)}
                    </Text>
                  </View>

                  <View style={styles.stockCol}>
                    <View style={styles.stockPill}>
                      <Text style={styles.stockPillText}>
                        المتبقي: {prod.currentStock} {prod.unit}
                      </Text>
                    </View>
                    <Text style={styles.minStockText}>حد الأمان: {prod.minStockAlert}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>إغلاق</Text>
            </TouchableOpacity>

            {onOpenNewPurchase && lowStockItems.length > 0 && (
              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => {
                  onClose();
                  onOpenNewPurchase();
                }}
              >
                <Ionicons name="bag-add" size={16} color="#FFFFFF" />
                <Text style={styles.orderBtnText}>إنشاء أمر شراء وتوريد</Text>
              </TouchableOpacity>
            )}
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
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#DC2626',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#FECACA',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 14,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  prodName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  prodMeta: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 2,
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  minStockText: {
    fontSize: 9,
    color: '#7F1D1D',
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  closeActionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  closeActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  orderBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  orderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
