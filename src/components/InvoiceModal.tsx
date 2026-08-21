import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Invoice } from '../types/erp';
import { useERP } from '../context/ERPContext';

interface InvoiceModalProps {
  invoice: Invoice | null;
  visible: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  visible,
  onClose,
}) => {
  const { settings, formatCurrency, branches } = useERP();
  const [viewFormat, setViewFormat] = useState<'thermal' | 'taxA4'>('thermal');
  const [isCopied, setIsCopied] = useState(false);

  if (!invoice) return null;

  const branch = branches.find((b) => b.id === invoice.branchId) || branches[0];

  const handlePrint = () => {
    Alert.alert('تم إرسال أمر الطباعة', `تم إرسال الفاتورة ${invoice.invoiceNumber} بنجاح إلى الطابعة المحددة.`);
  };

  const handleShare = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    Alert.alert('مشاركة الفاتورة', `تم تجهيز رابط الفاتورة الإلكترونية ${invoice.invoiceNumber} للمشاركة عبر واتساب والبريد.`);
  };

  const isSale = invoice.type === 'sale';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Modal Controls */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewFormat === 'thermal' && styles.toggleBtnActive]}
                onPress={() => setViewFormat('thermal')}
              >
                <Ionicons name="receipt-outline" size={14} color={viewFormat === 'thermal' ? '#FFFFFF' : '#475569'} />
                <Text style={[styles.toggleText, viewFormat === 'thermal' && styles.toggleTextActive]}>
                  حراري 80mm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, viewFormat === 'taxA4' && styles.toggleBtnActive]}
                onPress={() => setViewFormat('taxA4')}
              >
                <Ionicons name="document-text-outline" size={14} color={viewFormat === 'taxA4' ? '#FFFFFF' : '#475569'} />
                <Text style={[styles.toggleText, viewFormat === 'taxA4' && styles.toggleTextActive]}>
                  فاتورة ضريبية A4
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Invoice Body Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewFormat === 'thermal' ? (
              /* Thermal Receipt Layout */
              <View style={styles.thermalReceipt}>
                {/* Header / Logo */}
                <View style={styles.receiptHeader}>
                  <View style={styles.thermalLogoBadge}>
                    <Ionicons name="cube" size={24} color="#0F172A" />
                  </View>
                  <Text style={styles.receiptCompanyName}>{settings.name}</Text>
                  <Text style={styles.receiptSubtext}>{branch?.name}</Text>
                  <Text style={styles.receiptTaxNumber}>الرقم الضريبي: {settings.taxNumber}</Text>
                  <Text style={styles.receiptSubtext}>س.ت: {settings.commercialRecord}</Text>
                  <Text style={styles.receiptSubtext}>هاتف: {branch?.phone || settings.phone}</Text>
                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptDocTitle}>
                    {isSale ? 'فاتورة ضريبية مبسطة (POS)' : 'فاتورة مشتريات'}
                  </Text>
                  <View style={styles.receiptDivider} />
                </View>

                {/* Metadata */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>رقم الفاتورة:</Text>
                  <Text style={styles.metaVal}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>التاريخ والوقت:</Text>
                  <Text style={styles.metaVal}>
                    {new Date(invoice.date).toLocaleDateString('ar-SA')} - {new Date(invoice.date).toLocaleTimeString('ar-SA')}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isSale ? 'العميل:' : 'المورد:'}</Text>
                  <Text style={styles.metaVal}>{isSale ? invoice.customerName : invoice.supplierName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>الكاشير:</Text>
                  <Text style={styles.metaVal}>{invoice.cashierName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>طريقة الدفع:</Text>
                  <Text style={styles.metaVal}>
                    {invoice.paymentMethod === 'cash' ? 'نقداً (Cash)' :
                     invoice.paymentMethod === 'card' ? 'شبكة / بطاقة (Card)' :
                     invoice.paymentMethod === 'credit' ? 'آجل / ذمة (Credit)' : 'تحويل بنكي'}
                  </Text>
                </View>

                <View style={styles.dashedLine} />

                {/* Items Table */}
                <View style={styles.tableHeaderThermal}>
                  <Text style={[styles.colThermal, { flex: 3 }]}>الصنف</Text>
                  <Text style={[styles.colThermal, { flex: 1, textAlign: 'center' }]}>الكمية</Text>
                  <Text style={[styles.colThermal, { flex: 1.5, textAlign: 'right' }]}>السعر</Text>
                  <Text style={[styles.colThermal, { flex: 1.5, textAlign: 'right' }]}>المجموع</Text>
                </View>

                {invoice.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRowThermal}>
                    <View style={{ flex: 3 }}>
                      <Text style={styles.itemNameThermal}>{item.productName}</Text>
                      {item.barcode ? <Text style={styles.itemBarcode}>{item.barcode}</Text> : null}
                    </View>
                    <Text style={[styles.itemValThermal, { flex: 1, textAlign: 'center' }]}>
                      {item.quantity} {item.unit}
                    </Text>
                    <Text style={[styles.itemValThermal, { flex: 1.5, textAlign: 'right' }]}>
                      {item.unitPrice.toFixed(2)}
                    </Text>
                    <Text style={[styles.itemValThermal, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>
                      {item.total.toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.dashedLine} />

                {/* Totals */}
                <View style={styles.totalRowThermal}>
                  <Text style={styles.totalLabelThermal}>المجموع قبل الضريبة:</Text>
                  <Text style={styles.totalValThermal}>{formatCurrency(invoice.subtotal)}</Text>
                </View>
                {invoice.discountTotal > 0 && (
                  <View style={styles.totalRowThermal}>
                    <Text style={[styles.totalLabelThermal, { color: '#DC2626' }]}>إجمالي الخصم:</Text>
                    <Text style={[styles.totalValThermal, { color: '#DC2626' }]}>- {formatCurrency(invoice.discountTotal)}</Text>
                  </View>
                )}
                <View style={styles.totalRowThermal}>
                  <Text style={styles.totalLabelThermal}>ضريبة القيمة المضافة ({settings.vatRate}%):</Text>
                  <Text style={styles.totalValThermal}>{formatCurrency(invoice.taxTotal)}</Text>
                </View>
                <View style={[styles.totalRowThermal, styles.grandTotalBox]}>
                  <Text style={styles.grandTotalLabel}>الصافي الإجمالي:</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(invoice.grandTotal)}</Text>
                </View>

                <View style={styles.totalRowThermal}>
                  <Text style={styles.totalLabelThermal}>المدفوع:</Text>
                  <Text style={styles.totalValThermal}>{formatCurrency(invoice.paidAmount)}</Text>
                </View>
                {invoice.remainingAmount > 0 && (
                  <View style={styles.totalRowThermal}>
                    <Text style={[styles.totalLabelThermal, { color: '#DC2626', fontWeight: 'bold' }]}>المتبقي (آجل):</Text>
                    <Text style={[styles.totalValThermal, { color: '#DC2626', fontWeight: 'bold' }]}>
                      {formatCurrency(invoice.remainingAmount)}
                    </Text>
                  </View>
                )}

                {/* Simulated ZATCA QR Code & Barcode */}
                <View style={styles.zatcaContainer}>
                  <View style={styles.qrSimulation}>
                    <Ionicons name="qr-code" size={110} color="#0F172A" />
                  </View>
                  <Text style={styles.zatcaText}>فاتورة ضريبية متوافقة مع هيئة الزكاة والضريبة والجمارك</Text>
                  <Text style={styles.footerNote}>{settings.invoiceFooterNote}</Text>
                </View>
              </View>
            ) : (
              /* A4 Tax Invoice Layout */
              <View style={styles.taxA4Invoice}>
                {/* A4 Header */}
                <View style={styles.a4Header}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.a4CompanyTitle}>{settings.name}</Text>
                    <Text style={styles.a4CompanyEn}>{settings.nameEn}</Text>
                    <Text style={styles.a4MetaLine}>الرقم الضريبي: {settings.taxNumber}</Text>
                    <Text style={styles.a4MetaLine}>السجل التجاري: {settings.commercialRecord}</Text>
                    <Text style={styles.a4MetaLine}>العنوان: {settings.address} - {settings.city}</Text>
                  </View>
                  <View style={styles.a4QrBox}>
                    <Ionicons name="qr-code-outline" size={75} color="#1E3A8A" />
                  </View>
                </View>

                <View style={styles.a4Banner}>
                  <Text style={styles.a4BannerText}>
                    {isSale ? 'فاتورة ضريبية مبيعات (TAX INVOICE)' : 'فاتورة مشتريات وتوريد (PURCHASE INVOICE)'}
                  </Text>
                </View>

                {/* Info Grid */}
                <View style={styles.a4InfoGrid}>
                  <View style={styles.a4InfoCol}>
                    <Text style={styles.a4InfoTitle}>بيانات الفاتورة:</Text>
                    <Text style={styles.a4InfoText}>رقم الفاتورة: <Text style={{ fontWeight: 'bold' }}>{invoice.invoiceNumber}</Text></Text>
                    <Text style={styles.a4InfoText}>تاريخ الإصدار: {new Date(invoice.date).toLocaleDateString('ar-SA')}</Text>
                    <Text style={styles.a4InfoText}>حالة السداد: {invoice.status === 'paid' ? 'مسددة بالكامل' : invoice.status === 'partial' ? 'سداد جزئي' : 'غير مسددة'}</Text>
                  </View>
                  <View style={styles.a4InfoCol}>
                    <Text style={styles.a4InfoTitle}>{isSale ? 'بيانات العميل (الطرف الثاني):' : 'بيانات المورد:'}</Text>
                    <Text style={styles.a4InfoText}>الاسم: <Text style={{ fontWeight: 'bold' }}>{isSale ? invoice.customerName : invoice.supplierName}</Text></Text>
                    <Text style={styles.a4InfoText}>الفرع: {branch?.name}</Text>
                    <Text style={styles.a4InfoText}>المسؤول: {invoice.cashierName}</Text>
                  </View>
                </View>

                {/* A4 Items Table */}
                <View style={styles.a4Table}>
                  <View style={styles.a4TableHeader}>
                    <Text style={[styles.a4ColH, { width: 35 }]}>#</Text>
                    <Text style={[styles.a4ColH, { flex: 3 }]}>الصنف والوصف</Text>
                    <Text style={[styles.a4ColH, { width: 60, textAlign: 'center' }]}>الكمية</Text>
                    <Text style={[styles.a4ColH, { width: 75, textAlign: 'right' }]}>سعر الوحدة</Text>
                    <Text style={[styles.a4ColH, { width: 70, textAlign: 'right' }]}>الضريبة</Text>
                    <Text style={[styles.a4ColH, { width: 85, textAlign: 'right' }]}>المجموع</Text>
                  </View>

                  {invoice.items.map((item, idx) => (
                    <View key={idx} style={[styles.a4TableRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                      <Text style={[styles.a4ColCell, { width: 35 }]}>{idx + 1}</Text>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.a4ItemName}>{item.productName}</Text>
                        <Text style={styles.a4ItemCode}>باركود: {item.barcode} | وحدة: {item.unit}</Text>
                      </View>
                      <Text style={[styles.a4ColCell, { width: 60, textAlign: 'center' }]}>{item.quantity}</Text>
                      <Text style={[styles.a4ColCell, { width: 75, textAlign: 'right' }]}>{item.unitPrice.toFixed(2)}</Text>
                      <Text style={[styles.a4ColCell, { width: 70, textAlign: 'right' }]}>{item.taxAmount.toFixed(2)}</Text>
                      <Text style={[styles.a4ColCell, { width: 85, textAlign: 'right', fontWeight: 'bold' }]}>{item.total.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* A4 Summary Block */}
                <View style={styles.a4SummaryContainer}>
                  <View style={styles.a4Signatures}>
                    <View style={styles.sigBox}>
                      <Text style={styles.sigTitle}>توقيع المستلم / العميل</Text>
                      <View style={styles.sigLine} />
                    </View>
                    <View style={styles.sigBox}>
                      <Text style={styles.sigTitle}>ختم وتوقيع الشركة</Text>
                      <View style={styles.sigLine} />
                    </View>
                  </View>

                  <View style={styles.a4TotalsBox}>
                    <View style={styles.a4TotRow}>
                      <Text style={styles.a4TotLabel}>المجموع الخاضع للضريبة:</Text>
                      <Text style={styles.a4TotVal}>{formatCurrency(invoice.subtotal)}</Text>
                    </View>
                    <View style={styles.a4TotRow}>
                      <Text style={styles.a4TotLabel}>ضريبة القيمة المضافة ({settings.vatRate}%):</Text>
                      <Text style={styles.a4TotVal}>{formatCurrency(invoice.taxTotal)}</Text>
                    </View>
                    <View style={[styles.a4TotRow, styles.a4GrandTotRow]}>
                      <Text style={styles.a4GrandTotLabel}>إجمالي الفاتورة:</Text>
                      <Text style={styles.a4GrandTotVal}>{formatCurrency(invoice.grandTotal)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color="#2563EB" />
              <Text style={styles.actionBtnSecondaryText}>
                {isCopied ? 'تم النسخ!' : 'مشاركة / واتساب'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePrint}>
              <Ionicons name="print" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnPrimaryText}>طباعة الفاتورة</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  /* Thermal Receipt Styles */
  thermalReceipt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  thermalLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptCompanyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  receiptSubtext: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 2,
  },
  receiptTaxNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 3,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    width: '100%',
    marginVertical: 8,
  },
  receiptDocTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  tableHeaderThermal: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  colThermal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  itemRowThermal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemNameThermal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemBarcode: {
    fontSize: 9,
    color: '#94A3B8',
  },
  itemValThermal: {
    fontSize: 11,
    color: '#1E293B',
  },
  totalRowThermal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabelThermal: {
    fontSize: 12,
    color: '#475569',
  },
  totalValThermal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  zatcaContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  qrSimulation: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zatcaText: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  footerNote: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  /* A4 Invoice Styles */
  taxA4Invoice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  a4Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  a4CompanyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  a4CompanyEn: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  a4MetaLine: {
    fontSize: 10,
    color: '#334155',
    marginTop: 1,
  },
  a4QrBox: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
  },
  a4Banner: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 6,
    alignItems: 'center',
    marginVertical: 12,
    borderRadius: 6,
  },
  a4BannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  a4InfoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  a4InfoCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  a4InfoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  a4InfoText: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 2,
  },
  a4Table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  a4TableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  a4ColH: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  a4TableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  a4ColCell: {
    fontSize: 10,
    color: '#334155',
  },
  a4ItemName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
  },
  a4ItemCode: {
    fontSize: 8,
    color: '#64748B',
  },
  a4SummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  a4Signatures: {
    flex: 1,
    justifyContent: 'space-around',
  },
  sigBox: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sigTitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 24,
  },
  sigLine: {
    height: 1,
    width: '80%',
    backgroundColor: '#94A3B8',
  },
  a4TotalsBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  a4TotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  a4TotLabel: {
    fontSize: 10,
    color: '#475569',
  },
  a4TotVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
  },
  a4GrandTotRow: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 6,
    marginTop: 4,
  },
  a4GrandTotLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  a4GrandTotVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnSecondaryText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
