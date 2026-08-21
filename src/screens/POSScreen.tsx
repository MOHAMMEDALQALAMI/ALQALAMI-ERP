import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { FilterChip } from '../components/FilterChip';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { ShiftModal } from '../components/ShiftModal';
import { PaymentMethod, Product, Invoice } from '../types/erp';

export const POSScreen = () => {
  const {
    products,
    categories,
    cartItems,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTaxTotal,
    cartGrandTotal,
    cartItemCount,
    heldCarts,
    holdCurrentCart,
    restoreHeldCart,
    deleteHeldCart,
    createSaleInvoice,
    formatCurrency,
    customers,
    currentShift,
    settings,
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('c-6');
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedCashInput, setReceivedCashInput] = useState('');
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<Invoice | null>(null);

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[5];

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const handleFastCashCheckout = async (amountGiven: number) => {
    if (cartItems.length === 0) return;
    try {
      const inv = await createSaleInvoice({
        customerId: customer.id,
        customerName: customer.name,
        items: cartItems,
        paymentMethod: 'cash',
        paidAmount: Math.max(cartGrandTotal, amountGiven),
      });
      clearCart();
      setShowCheckoutModal(false);
      setLastCompletedInvoice(inv);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cartItems.length === 0) return;
    const paid = selectedPaymentMethod === 'credit' ? 0 : parseFloat(receivedCashInput) || cartGrandTotal;

    try {
      const inv = await createSaleInvoice({
        customerId: customer.id,
        customerName: customer.name,
        items: cartItems,
        paymentMethod: selectedPaymentMethod,
        paidAmount: paid,
      });
      clearCart();
      setShowCheckoutModal(false);
      setReceivedCashInput('');
      setLastCompletedInvoice(inv);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  const changeDue = Math.max(0, (parseFloat(receivedCashInput) || 0) - cartGrandTotal);

  return (
    <View style={styles.container}>
      {/* Header with Shift Badge */}
      <HeaderBar
        title="كاشير القلمي POS"
        subtitle="نقاط البيع السريعة والسوبرماركت"
        onOpenShiftModal={() => setShowShiftModal(true)}
      />

      <View style={styles.mainLayout}>
        {/* Left / Top Catalog & Search */}
        <View style={styles.catalogSection}>
          {/* Search Bar & Barcode Scanner Trigger */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث بالاسم أو امسح الباركود..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => setShowScanner(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="barcode-outline" size={20} color="#FFFFFF" />
              <Text style={styles.scanBtnText}>ماسح الباركود</Text>
            </TouchableOpacity>

            {/* Held Carts Badge */}
            {heldCarts.length > 0 && (
              <TouchableOpacity
                style={styles.heldBtn}
                onPress={() => setShowHeldModal(true)}
              >
                <Ionicons name="pause" size={16} color="#D97706" />
                <View style={styles.heldBadge}>
                  <Text style={styles.heldBadgeText}>{heldCarts.length}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories Horizontal Tabs */}
          <View style={styles.catTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <FilterChip
                label="الكل (جميع الأقسام)"
                isSelected={selectedCategory === 'all'}
                onPress={() => setSelectedCategory('all')}
                count={products.length}
              />
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                return (
                  <FilterChip
                    key={c.id}
                    label={c.name}
                    isSelected={selectedCategory === c.id}
                    onPress={() => setSelectedCategory(c.id)}
                    count={count}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const inCart = cartItems.find((ci) => ci.productId === item.id);
              const isWholesale = customer?.priceLevel === 'wholesale';
              const price = isWholesale ? item.wholesalePrice : item.sellingPrice;

              return (
                <TouchableOpacity
                  style={[styles.productGridCard, inCart && styles.productInCart]}
                  onPress={() => addToCart(item, 1)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    {inCart && (
                      <View style={styles.cartQtyBadge}>
                        <Text style={styles.cartQtyBadgeText}>{inCart.quantity}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardProductName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardBarcode}>{item.barcode}</Text>

                  <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>{formatCurrency(price)}</Text>
                    <Text style={styles.cardStock}>
                      {item.currentStock > 0 ? `${item.currentStock} ${item.unit}` : 'نفذ'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* POS Cart Drawer Bottom Bar / Floating Bar */}
        <View style={styles.cartSection}>
          {/* Cart Header */}
          <View style={styles.cartHeader}>
            <View style={styles.cartTitleRow}>
              <Ionicons name="cart" size={20} color="#2563EB" />
              <Text style={styles.cartTitle}>
                سلة المبيعات ({cartItemCount} قطعة)
              </Text>
            </View>

            <View style={styles.cartHeaderActions}>
              {cartItems.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.holdActionBtn}
                    onPress={() => holdCurrentCart()}
                  >
                    <Ionicons name="pause" size={14} color="#D97706" />
                    <Text style={styles.holdActionText}>تعليق</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.clearActionBtn}
                    onPress={clearCart}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Cart Items List */}
          <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Ionicons name="basket-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyCartText}>انقر على أي صنف لإضافته للكاشير</Text>
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.productId} style={styles.cartItemRow}>
                  <View style={{ flex: 1.6 }}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      {item.unitPrice.toFixed(2)} ر.س / {item.unit}
                    </Text>
                  </View>

                  <View style={styles.cartQtyControls}>
                    <TouchableOpacity
                      style={styles.cartQtyBtn}
                      onPress={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={12} color="#DC2626" />
                    </TouchableOpacity>
                    <Text style={styles.cartQtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartQtyBtn}
                      onPress={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={12} color="#16A34A" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cartItemTotal}>{formatCurrency(item.total)}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Cart Totals & Checkout Button */}
          <View style={styles.cartFooter}>
            <View style={styles.cartTotalsRow}>
              <View>
                <Text style={styles.cartSubtotalText}>
                  الضريبة ({settings.vatRate}%): {formatCurrency(cartTaxTotal)}
                </Text>
                <Text style={styles.cartGrandTotalVal}>{formatCurrency(cartGrandTotal)}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  cartItems.length === 0 && styles.checkoutBtnDisabled,
                ]}
                onPress={() => setShowCheckoutModal(true)}
                disabled={cartItems.length === 0}
              >
                <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>دفع وحساب ({cartItemCount})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Checkout Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModalCard}>
            <View style={styles.checkoutHeader}>
              <View>
                <Text style={styles.checkoutTitle}>شاشة الدفع وسداد الفاتورة</Text>
                <Text style={styles.checkoutSubtitle}>إجمالي المطلوب: {formatCurrency(cartGrandTotal)}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Customer Selector */}
              <Text style={styles.modalSectionLabel}>العميل:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {customers.map((c) => {
                  const isSel = c.id === selectedCustomerId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.custModalChip, isSel && styles.custModalChipActive]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={[styles.custModalChipText, isSel && styles.custModalChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Payment Methods */}
              <Text style={styles.modalSectionLabel}>طريقة الدفع:</Text>
              <View style={styles.pmGrid}>
                {[
                  { id: 'cash', label: 'كاش نقدي', icon: 'cash' },
                  { id: 'card', label: 'شبكة / مدى', icon: 'card' },
                  { id: 'credit', label: 'آجل / حساب', icon: 'time' },
                  { id: 'bank_transfer', label: 'تحويل بنكي', icon: 'business' },
                ].map((pm) => {
                  const isSel = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[styles.pmModalBtn, isSel && styles.pmModalBtnActive]}
                      onPress={() => setSelectedPaymentMethod(pm.id as any)}
                    >
                      <Ionicons
                        name={pm.icon as any}
                        size={20}
                        color={isSel ? '#FFFFFF' : '#2563EB'}
                      />
                      <Text style={[styles.pmModalText, isSel && styles.pmModalTextActive]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Cash Buttons */}
              {selectedPaymentMethod === 'cash' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.modalSectionLabel}>فئات النقدية السريعة:</Text>
                  <View style={styles.quickCashRow}>
                    {[50, 100, 200, 500].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={styles.quickCashBtn}
                        onPress={() => {
                          setReceivedCashInput(String(amt));
                        }}
                      >
                        <Text style={styles.quickCashText}>{amt} ر.س</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.quickCashBtn, { backgroundColor: '#EFF6FF', borderColor: '#2563EB' }]}
                      onPress={() => setReceivedCashInput(String(cartGrandTotal))}
                    >
                      <Text style={[styles.quickCashText, { color: '#2563EB' }]}>المبلغ بالمضبوط</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.modalSectionLabel, { marginTop: 10 }]}>المبلغ المستلم من العميل:</Text>
                  <TextInput
                    style={styles.cashInput}
                    placeholder={cartGrandTotal.toFixed(2)}
                    keyboardType="numeric"
                    value={receivedCashInput}
                    onChangeText={setReceivedCashInput}
                  />

                  {changeDue > 0 && (
                    <View style={styles.changeDueBox}>
                      <Text style={styles.changeDueLabel}>المتبقي للعميل (الباقي):</Text>
                      <Text style={styles.changeDueVal}>{formatCurrency(changeDue)}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.checkoutFooter}>
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={handleCheckoutSubmit}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.completeBtnText}>
                  إتمام البيع وطباعة الفاتورة ({formatCurrency(cartGrandTotal)})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Held Carts Modal */}
      <Modal visible={showHeldModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.heldModalCard}>
            <View style={styles.heldHeader}>
              <Text style={styles.heldTitle}>الفواتير المعلقة في الوردية</Text>
              <TouchableOpacity onPress={() => setShowHeldModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 14 }}>
              {heldCarts.map((h) => (
                <View key={h.id} style={styles.heldItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heldItemName}>{h.name}</Text>
                    <Text style={styles.heldItemDate}>الوقت: {h.date}</Text>
                    <Text style={styles.heldItemCount}>{h.items.length} أصناف</Text>
                  </View>

                  <View style={styles.heldItemActions}>
                    <TouchableOpacity
                      style={styles.restoreBtn}
                      onPress={() => {
                        restoreHeldCart(h.id);
                        setShowHeldModal(false);
                      }}
                    >
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                      <Text style={styles.restoreBtnText}>استئناف</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteHeldBtn}
                      onPress={() => deleteHeldCart(h.id)}
                    >
                      <Ionicons name="trash" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onProductScanned={(prod) => addToCart(prod, 1)}
      />

      {/* Shift Modal */}
      <ShiftModal
        visible={showShiftModal}
        onClose={() => setShowShiftModal(false)}
      />

      {/* Invoice Details / Thermal Receipt Preview */}
      <InvoiceModal
        invoice={lastCompletedInvoice}
        visible={!!lastCompletedInvoice}
        onClose={() => setLastCompletedInvoice(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainLayout: {
    flex: 1,
  },
  catalogSection: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heldBtn: {
    position: 'relative',
    backgroundColor: '#FEF3C7',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  heldBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D97706',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heldBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  catTabsContainer: {
    marginBottom: 8,
  },
  catScroll: {
    flexDirection: 'row',
  },
  gridContent: {
    paddingBottom: 220,
  },
  productGridCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  productInCart: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F7FF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    maxWidth: 90,
  },
  cartQtyBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardProductName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  cardBarcode: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  cardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 4,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardStock: {
    fontSize: 9,
    color: '#64748B',
  },
  cartSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 250,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  holdActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  clearActionBtn: {
    padding: 4,
  },
  cartItemsScroll: {
    maxHeight: 110,
    paddingHorizontal: 12,
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  emptyCartText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cartItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  cartItemPrice: {
    fontSize: 9,
    color: '#64748B',
  },
  cartQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartQtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyVal: {
    fontSize: 11,
    fontWeight: 'bold',
    minWidth: 16,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
    minWidth: 60,
    textAlign: 'right',
  },
  cartFooter: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cartTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSubtotalText: {
    fontSize: 10,
    color: '#64748B',
  },
  cartGrandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  checkoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  checkoutTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  checkoutSubtitle: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  custModalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  custModalChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  custModalChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  custModalChipTextActive: {
    color: '#FFFFFF',
  },
  pmGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pmModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  pmModalBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pmModalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  pmModalTextActive: {
    color: '#FFFFFF',
  },
  quickCashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickCashBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickCashText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cashInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  changeDueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeDueLabel: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  changeDueVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  checkoutFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heldModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 460,
    maxHeight: '70%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  heldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heldTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  heldItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heldItemName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  heldItemDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  heldItemCount: {
    fontSize: 10,
    color: '#2563EB',
    marginTop: 1,
  },
  heldItemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  restoreBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteHeldBtn: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
  },
});
