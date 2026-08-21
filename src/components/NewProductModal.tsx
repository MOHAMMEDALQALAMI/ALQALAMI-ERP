import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { Product } from '../types/erp';

interface NewProductModalProps {
  visible: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  visible,
  productToEdit,
  onClose,
  onSuccess,
}) => {
  const { categories, addProduct, updateProduct, activeWarehouseId } = useERP();

  const [name, setName] = useState(productToEdit?.name || '');
  const [nameEn, setNameEn] = useState(productToEdit?.nameEn || '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [categoryId, setCategoryId] = useState(productToEdit?.categoryId || categories[0]?.id || 'cat-1');
  const [unit, setUnit] = useState(productToEdit?.unit || 'حبة');
  const [costPrice, setCostPrice] = useState(productToEdit ? String(productToEdit.costPrice) : '');
  const [sellingPrice, setSellingPrice] = useState(productToEdit ? String(productToEdit.sellingPrice) : '');
  const [wholesalePrice, setWholesalePrice] = useState(productToEdit ? String(productToEdit.wholesalePrice) : '');
  const [currentStock, setCurrentStock] = useState(productToEdit ? String(productToEdit.currentStock) : '10');
  const [minStockAlert, setMinStockAlert] = useState(productToEdit ? String(productToEdit.minStockAlert) : '5');

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const random = '628' + Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(random);
    if (!sku) setSku('SKU-' + random.slice(-6));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الصنف / المنتج.');
      return;
    }
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;
    const whole = parseFloat(wholesalePrice) || sell;
    const stock = parseInt(currentStock) || 0;
    const minAlert = parseInt(minStockAlert) || 5;

    const cat = categories.find((c) => c.id === categoryId) || categories[0];

    try {
      if (productToEdit) {
        await updateProduct({
          ...productToEdit,
          name,
          nameEn,
          barcode: barcode || productToEdit.barcode,
          sku: sku || productToEdit.sku,
          categoryId,
          categoryName: cat.name,
          unit,
          costPrice: cost,
          sellingPrice: sell,
          wholesalePrice: whole,
          currentStock: stock,
          minStockAlert: minAlert,
        });
        Alert.alert('تم التعديل', `تم تحديث بيانات الصنف: ${name}`);
      } else {
        await addProduct({
          name,
          nameEn,
          barcode: barcode || '628' + Math.floor(100000000 + Math.random() * 900000000),
          sku: sku || 'SKU-' + Date.now().toString().slice(-6),
          categoryId,
          categoryName: cat.name,
          unit,
          costPrice: cost,
          sellingPrice: sell,
          wholesalePrice: whole,
          taxRate: 15,
          currentStock: stock,
          minStockAlert: minAlert,
          warehouseId: activeWarehouseId,
        });
        Alert.alert('تمت الإضافة', `تم إضافة الصنف الجديد للمخزون بنجاح: ${name}`);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء حفظ الصنف');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {productToEdit ? 'تعديل بيانات الصنف' : 'إضافة صنف / منتج جديد'}
                </Text>
                <Text style={styles.headerSubtitle}>دليل الأصناف والتسعير والمخزون</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Category Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>التصنيف الرئيسي:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((c) => {
                  const isSelected = c.id === categoryId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, isSelected && styles.catChipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Product Names */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>اسم الصنف بالعربي *:</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: أرز بسمتي فاخر 10 كجم..."
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>اسم الصنف بالإنجليزي (اختياري):</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: Basmati Rice 10kg..."
                value={nameEn}
                onChangeText={setNameEn}
              />
            </View>

            {/* Barcode & SKU */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>الباركود الدولي / السريع:</Text>
                <TouchableOpacity onPress={handleGenerateBarcode}>
                  <Text style={styles.genBarcodeText}>+ توليد باركود آلي</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="أدخل الباركود أو امسحه بالماسح..."
                value={barcode}
                onChangeText={setBarcode}
                keyboardType="numeric"
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { marginTop: 8 }]}>رمز الصنف (SKU):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="SKU-001"
                    value={sku}
                    onChangeText={setSku}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { marginTop: 8 }]}>وحدة القياس:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="حبة / كرتون / كيلو"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            </View>

            {/* Pricing Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>أسعار الصنف (بالريال السعودي):</Text>
              <View style={styles.threeColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>سعر التكلفة:</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>سعر البيع (مفرق):</Text>
                  <TextInput
                    style={[styles.priceInput, { borderColor: '#2563EB' }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>سعر الجملة:</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={wholesalePrice}
                    onChangeText={setWholesalePrice}
                  />
                </View>
              </View>
            </View>

            {/* Stock Counts */}
            <View style={styles.sectionCard}>
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>الرصيد الافتتاحي بالمخزون:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    keyboardType="numeric"
                    value={currentStock}
                    onChangeText={setCurrentStock}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>حد التنبيه بالنواقص:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    keyboardType="numeric"
                    value={minStockAlert}
                    onChangeText={setMinStockAlert}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Ionicons name="save" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {productToEdit ? 'حفظ التعديلات' : 'إضافة الصنف للمخزون'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
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
    backgroundColor: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 14,
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  catChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: '#0F172A',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genBarcodeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    height: 38,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
