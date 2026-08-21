import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';

export const SettingsScreen = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    branches,
    selectedCurrency,
    setSelectedCurrency,
    currencies,
  } = useERP();

  const [companyName, setCompanyName] = useState(settings.name);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [commercialRecord, setCommercialRecord] = useState(settings.commercialRecord);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [vatRate, setVatRate] = useState(String(settings.vatRate));
  const [enableVat, setEnableVat] = useState(settings.enableVat);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooterNote);

  const handleSaveSettings = async () => {
    await updateSettings({
      name: companyName,
      taxNumber,
      commercialRecord,
      phone,
      address,
      vatRate: parseFloat(vatRate) || 15,
      enableVat,
      invoiceFooterNote: invoiceFooter,
    });
    Alert.alert('تم الحفظ', 'تم تحديث إعدادات وبيانات المنشأة بنجاح.');
  };

  const handleResetDemoData = () => {
    Alert.alert(
      'إعادة تعيين البيانات التجريبية',
      'هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى بيانات العرض التجريبية الشاملة لجميع الفروع والمنتجات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إعادة التعيين',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('تم بنجاح', 'تمت استعادة البيانات التجريبية الافتراضية بالكامل.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="إعدادات النظام والمنشأة"
        subtitle="بيانات الشركة، الرقم الضريبي، العملات، وإدارة البيانات"
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Brand Profile Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>بيانات المنشأة والترخيص</Text>
          </View>

          <Text style={styles.label}>الاسم التجاري للمنشأة:</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>الرقم الضريبي (15 رقم):</Text>
              <TextInput
                style={styles.input}
                value={taxNumber}
                onChangeText={setTaxNumber}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>رقم السجل التجاري:</Text>
              <TextInput
                style={styles.input}
                value={commercialRecord}
                onChangeText={setCommercialRecord}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>رقم الهاتف الرسمي:</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>العنوان والمدينة:</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        </View>

        {/* Tax & Invoice Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={18} color="#059669" />
            <Text style={styles.cardTitle}>إعدادات الضريبة والفواتير (VAT)</Text>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>تفعيل ضريبة القيمة المضافة ZATCA</Text>
              <Text style={styles.switchDesc}>حساب الضريبة تلقائياً على فواتير المبيعات ونقاط البيع</Text>
            </View>
            <Switch value={enableVat} onValueChange={setEnableVat} />
          </View>

          <Text style={styles.label}>نسبة الضريبة الافتراضية (%):</Text>
          <TextInput
            style={styles.input}
            value={vatRate}
            onChangeText={setVatRate}
            keyboardType="numeric"
          />

          <Text style={styles.label}>ملاحظة تذييل الفاتورة المطبوعة:</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={invoiceFooter}
            onChangeText={setInvoiceFooter}
            multiline
          />
        </View>

        {/* Multi-Branch Management */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch" size={18} color="#7C3AED" />
            <Text style={styles.cardTitle}>الفروع المفعلة بالنظام ({branches.length})</Text>
          </View>

          {branches.map((b) => (
            <View key={b.id} style={styles.branchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.branchName}>
                  {b.name} {b.isMain ? '★ (الفرع الرئيسي)' : ''}
                </Text>
                <Text style={styles.branchCity}>المدينة: {b.city} | هاتف: {b.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Currency & Exchange */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={18} color="#D97706" />
            <Text style={styles.cardTitle}>العملة الرئيسية للتقارير</Text>
          </View>

          <View style={styles.currGrid}>
            {currencies.map((c) => {
              const isSel = c.code === selectedCurrency;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currBtn, isSel && styles.currBtnActive]}
                  onPress={() => setSelectedCurrency(c.code as any)}
                >
                  <Text style={[styles.currBtnTitle, isSel && styles.currBtnTitleActive]}>
                    {c.name} ({c.symbol})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Settings Action Button */}
        <TouchableOpacity style={styles.saveMainBtn} onPress={handleSaveSettings}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.saveMainBtnText}>حفظ وتطبيق جميع الإعدادات</Text>
        </TouchableOpacity>

        {/* Data Reset & Demo Data */}
        <View style={[styles.sectionCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="refresh-circle" size={20} color="#DC2626" />
            <Text style={[styles.cardTitle, { color: '#991B1B' }]}>إدارة البيانات والنسخ الاحتياطي</Text>
          </View>
          <Text style={styles.resetDesc}>
            يمكنك إعادة تحميل البيانات التجريبية الضخمة لجميع الفئات والمخازن والقيود في أي وقت.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetDemoData}>
            <Ionicons name="reload" size={16} color="#FFFFFF" />
            <Text style={styles.resetBtnText}>إعادة تعيين البيانات التجريبية (Demo Data)</Text>
          </TouchableOpacity>
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
  body: {
    padding: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  branchRow: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  branchName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  branchCity: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  currGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  currBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  currBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  currBtnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  currBtnTitleActive: {
    color: '#FFFFFF',
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  saveMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resetDesc: {
    fontSize: 11,
    color: '#7F1D1D',
    marginBottom: 10,
    lineHeight: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
