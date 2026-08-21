import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { Product } from '../types/erp';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onProductScanned,
}) => {
  const { products } = useERP();
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);

  const handleScan = (barcode: string) => {
    const found = products.find((p) => p.barcode === barcode || p.sku === barcode);
    if (found) {
      setLastScannedName(found.name);
      onProductScanned(found);
      setTimeout(() => {
        setLastScannedName(null);
        onClose();
      }, 700);
    } else {
      alert('لم يتم العثور على صنف يطابق هذا الباركود في قاعدة البيانات');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="barcode-outline" size={24} color="#FFFFFF" />
              <Text style={styles.headerTitle}>قارئ الباركود الذكي (Barcode Scanner)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Camera Viewfinder Simulation */}
            <View style={styles.viewfinder}>
              <View style={styles.laserLine} />
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Ionicons name="scan" size={80} color="rgba(255,255,255,0.4)" />
              <Text style={styles.scanHint}>وجّه الكاميرا نحو باركود الصنف للتعرف الفوري</Text>
            </View>

            {lastScannedName && (
              <View style={styles.successScanBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.successScanText}>تم المسح: {lastScannedName}</Text>
              </View>
            )}

            {/* Manual Barcode Input */}
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="أو أدخل رقم الباركود يدوياً..."
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => handleScan(manualBarcode)}
              >
                <Text style={styles.manualBtnText}>بحث</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Demo Barcode Buttons */}
            <Text style={styles.quickTitle}>أصناف سريعة للاختبار بالباركود:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              {products.slice(0, 6).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.demoBarcodeChip}
                  onPress={() => handleScan(p.barcode)}
                >
                  <Text style={styles.demoBarcodeName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.demoBarcodeCode}>{p.barcode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 460,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  viewfinder: {
    height: 180,
    backgroundColor: '#020617',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563EB',
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563EB',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563EB',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563EB',
  },
  scanHint: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 10,
  },
  successScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  successScanText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: '#F8FAFC',
  },
  manualBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  manualBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
  },
  demoBarcodeChip: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 130,
  },
  demoBarcodeName: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  demoBarcodeCode: {
    fontSize: 9,
    color: '#60A5FA',
    marginTop: 2,
  },
});
