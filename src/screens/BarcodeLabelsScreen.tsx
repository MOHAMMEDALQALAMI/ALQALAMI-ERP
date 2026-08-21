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
import { Product } from '../types/erp';

export const BarcodeLabelsScreen = () => {
  const { products, settings, formatCurrency } = useERP();

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'p-1');
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handlePrintLabel = () => {
    Alert.alert(
      'طباعة ملصق الباركود',
      `تم إرسال أمر طباعة 50 ملصق رف للصنف (${selectedProduct.name}) إلى طابعة الباركود الحرارية.`
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="طباعة ملصقات الباركود والرفوف"
        subtitle="توليد ملصقات الأسعار والباركود الحرارية لرفوف السوبرماركت"
      />

      {/* Product Selector Carousel */}
      <View style={styles.selectorBar}>
        <Text style={styles.selectorTitle}>اختر الصنف لمعاينة ملصق السعر والباركود:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          {products.map((p) => {
            const isSel = p.id === selectedProductId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.prodChip, isSel && styles.prodChipActive]}
                onPress={() => setSelectedProductId(p.id)}
              >
                <Text style={[styles.prodChipName, isSel && styles.prodChipNameActive]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={[styles.prodChipPrice, isSel && styles.prodChipPriceActive]}>
                  {p.sellingPrice} ر.س
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Shelf Tag Visual Preview 50x30 mm */}
        <View style={styles.tagCard}>
          <Text style={styles.tagPreviewTitle}>معاينة ملصق الرف الحراري (Shelf Price Tag):</Text>

          <View style={styles.shelfTag}>
            <View style={styles.tagHeader}>
              <Text style={styles.tagBrandName}>{settings.name}</Text>
              <Text style={styles.tagTaxInclude}>شامل الضريبة {settings.vatRate}%</Text>
            </View>

            <Text style={styles.tagProdName}>{selectedProduct.name}</Text>
            <Text style={styles.tagProdMeta}>
              وحدة: {selectedProduct.unit} | تصنيف: {selectedProduct.categoryName}
            </Text>

            <View style={styles.tagPriceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.tagCurrency}>SAR</Text>
                <Text style={styles.tagBigPrice}>{selectedProduct.sellingPrice.toFixed(2)}</Text>
                <Text style={styles.tagRsText}>ريال</Text>
              </View>

              <View style={styles.qrTagBox}>
                <Ionicons name="qr-code" size={54} color="#0F172A" />
              </View>
            </View>

            {/* Barcode Lines Simulation */}
            <View style={styles.barcodeLinesBox}>
              <View style={styles.barcodeGraphic}>
                <Ionicons name="barcode" size={55} color="#0F172A" />
              </View>
              <Text style={styles.barcodeNumText}>{selectedProduct.barcode}</Text>
            </View>
          </View>
        </View>

        {/* Print Options */}
        <View style={styles.optionsCard}>
          <Text style={styles.optTitle}>خيارات الطباعة والكمية:</Text>
          <View style={styles.optRow}>
            <TouchableOpacity style={styles.qtyOptionBtn}>
              <Text style={styles.qtyOptionText}>10 ملصقات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qtyOptionBtn, styles.qtyOptionActive]}>
              <Text style={[styles.qtyOptionText, styles.qtyOptionActiveText]}>50 ملصق</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qtyOptionBtn}>
              <Text style={styles.qtyOptionText}>100 ملصق</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.printActionBtn} onPress={handlePrintLabel}>
            <Ionicons name="print" size={18} color="#FFFFFF" />
            <Text style={styles.printActionText}>إرسال أمر الطباعة لطابعة الباركود</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  selectorBar: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  prodChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 130,
  },
  prodChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  prodChipName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  prodChipNameActive: {
    color: '#FFFFFF',
  },
  prodChipPrice: {
    fontSize: 10,
    color: '#2563EB',
    marginTop: 2,
  },
  prodChipPriceActive: {
    color: '#BFDBFE',
  },
  body: {
    padding: 14,
  },
  tagCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  shelfTag: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0F172A',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
    marginBottom: 6,
  },
  tagBrandName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tagTaxInclude: {
    fontSize: 8,
    color: '#059669',
    fontWeight: 'bold',
  },
  tagProdName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tagProdMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  tagPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tagCurrency: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  tagBigPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  tagRsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  qrTagBox: {
    padding: 2,
  },
  barcodeLinesBox: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 4,
  },
  barcodeGraphic: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeNumText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#0F172A',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  optRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  qtyOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qtyOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  qtyOptionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  qtyOptionActiveText: {
    color: '#FFFFFF',
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
  },
  printActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
