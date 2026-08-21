import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { Customer, Supplier } from '../types/erp';

interface CustomerSupplierModalProps {
  visible: boolean;
  type: 'customer' | 'supplier';
  editItem?: Customer | Supplier | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CustomerSupplierModal: React.FC<CustomerSupplierModalProps> = ({
  visible,
  type,
  editItem,
  onClose,
  onSuccess,
}) => {
  const { addCustomer, updateCustomer, addSupplier, updateSupplier } = useERP();

  const isCustomer = type === 'customer';

  const [name, setName] = useState(editItem?.name || '');
  const [phone, setPhone] = useState(editItem?.phone || '');
  const [email, setEmail] = useState(editItem?.email || '');
  const [taxNumber, setTaxNumber] = useState(editItem?.taxNumber || '');
  const [address, setAddress] = useState(editItem?.address || '');
  const [creditLimit, setCreditLimit] = useState(
    isCustomer && (editItem as Customer)?.creditLimit
      ? String((editItem as Customer).creditLimit)
      : '20000'
  );
  const [priceLevel, setPriceLevel] = useState<'retail' | 'wholesale'>(
    isCustomer && (editItem as Customer)?.priceLevel
      ? (editItem as Customer).priceLevel
      : 'wholesale'
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', `يرجى إدخال اسم ${isCustomer ? 'العميل' : 'المورد'}.`);
      return;
    }

    try {
      if (isCustomer) {
        if (editItem) {
          await updateCustomer({
            ...(editItem as Customer),
            name,
            phone,
            email,
            taxNumber,
            address,
            creditLimit: parseFloat(creditLimit) || 0,
            priceLevel,
          });
        } else {
          await addCustomer({
            name,
            phone,
            email,
            taxNumber,
            address,
            creditLimit: parseFloat(creditLimit) || 0,
            priceLevel,
          });
        }
      } else {
        if (editItem) {
          await updateSupplier({
            ...(editItem as Supplier),
            name,
            phone,
            email,
            taxNumber,
            address,
          });
        } else {
          await addSupplier({
            name,
            phone,
            email,
            taxNumber,
            address,
          });
        }
      }

      Alert.alert('نجاح', `تم حفظ بيانات ${isCustomer ? 'العميل' : 'المورد'} بنجاح.`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={[styles.header, isCustomer ? styles.headerCust : styles.headerSupp]}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name={isCustomer ? 'person-add' : 'business'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.headerTitle}>
                {editItem
                  ? `تعديل بيانات ${isCustomer ? 'العميل' : 'المورد'}`
                  : `إضافة ${isCustomer ? 'عميل جديد (Customer)' : 'مورد جديد (Supplier)'}`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>الاسم التجاري / اسم الشخص *:</Text>
            <TextInput
              style={styles.input}
              placeholder={`أدخل اسم ${isCustomer ? 'العميل أو الشركة' : 'المورد أو المصنع'}...`}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>رقم الجوال / الهاتف:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+966 50 ..."
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>الرقم الضريبي (15 رقم):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="300..."
                  value={taxNumber}
                  onChangeText={setTaxNumber}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>العنوان والمدينة:</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: الرياض - حي الملز - شارع الستين"
              value={address}
              onChangeText={setAddress}
            />

            {isCustomer && (
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>الحد الائتماني (ر.س):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20000"
                    keyboardType="numeric"
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>مستوى التسعير:</Text>
                  <View style={styles.priceTierRow}>
                    <TouchableOpacity
                      style={[styles.tierBtn, priceLevel === 'wholesale' && styles.tierBtnActive]}
                      onPress={() => setPriceLevel('wholesale')}
                    >
                      <Text style={[styles.tierText, priceLevel === 'wholesale' && styles.tierTextActive]}>
                        جملة
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tierBtn, priceLevel === 'retail' && styles.tierBtnActive]}
                      onPress={() => setPriceLevel('retail')}
                    >
                      <Text style={[styles.tierText, priceLevel === 'retail' && styles.tierTextActive]}>
                        تجزئة
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Ionicons name="save" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>حفظ البيانات</Text>
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
    maxWidth: 500,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerCust: {
    backgroundColor: '#2563EB',
  },
  headerSupp: {
    backgroundColor: '#059669',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: '#0F172A',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  priceTierRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tierBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  tierTextActive: {
    color: '#FFFFFF',
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
