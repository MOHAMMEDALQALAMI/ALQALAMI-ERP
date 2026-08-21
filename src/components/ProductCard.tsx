import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/erp';
import { useERP } from '../context/ERPContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onEdit?: () => void;
  showStockActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onEdit,
  showStockActions = false,
}) => {
  const { formatCurrency, adjustStock } = useERP();
  const isLowStock = product.currentStock <= product.minStockAlert;
  const isOutOfStock = product.currentStock <= 0;

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Top Badges */}
        <View style={styles.topBadgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {product.categoryName}
            </Text>
          </View>

          <View
            style={[
              styles.stockBadge,
              isOutOfStock
                ? styles.stockOut
                : isLowStock
                ? styles.stockLow
                : styles.stockGood,
            ]}
          >
            <Text
              style={[
                styles.stockText,
                isOutOfStock
                  ? styles.stockOutText
                  : isLowStock
                  ? styles.stockLowText
                  : styles.stockGoodText,
              ]}
            >
              {isOutOfStock
                ? 'نفذ المخزون'
                : isLowStock
                ? `منخفض: ${product.currentStock} ${product.unit}`
                : `المتوفر: ${product.currentStock} ${product.unit}`}
            </Text>
          </View>
        </View>

        {/* Product Title & Info */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.barcodeText}>باركود: {product.barcode}</Text>

        {/* Pricing */}
        <View style={styles.pricingRow}>
          <View>
            <Text style={styles.priceLabel}>سعر البيع:</Text>
            <Text style={styles.sellingPrice}>
              {formatCurrency(product.sellingPrice)}
            </Text>
          </View>

          <View style={styles.costBox}>
            <Text style={styles.costLabel}>التكلفة: {product.costPrice} ر.س</Text>
            <Text style={styles.costLabel}>جملة: {product.wholesalePrice} ر.س</Text>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        {onAddToCart && (
          <TouchableOpacity
            style={[styles.addCartBtn, isOutOfStock && styles.addCartBtnDisabled]}
            onPress={onAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart" size={16} color="#FFFFFF" />
            <Text style={styles.addCartText}>إضافة للسلة</Text>
          </TouchableOpacity>
        )}

        {showStockActions && (
          <View style={styles.stockAdjControls}>
            <TouchableOpacity
              style={styles.adjBtn}
              onPress={() => adjustStock(product.id, -1, 'سحب يدوي')}
            >
              <Ionicons name="remove" size={14} color="#DC2626" />
            </TouchableOpacity>
            <Text style={styles.adjStockVal}>{product.currentStock}</Text>
            <TouchableOpacity
              style={styles.adjBtn}
              onPress={() => adjustStock(product.id, 1, 'إضافة يدوية')}
            >
              <Ionicons name="add" size={14} color="#16A34A" />
            </TouchableOpacity>
          </View>
        )}

        {onEdit && (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Ionicons name="pencil-sharp" size={15} color="#475569" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    padding: 12,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 130,
  },
  categoryText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockGood: {
    backgroundColor: '#ECFDF5',
  },
  stockGoodText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockLow: {
    backgroundColor: '#FEF3C7',
  },
  stockLowText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockOut: {
    backgroundColor: '#FEF2F2',
  },
  stockOutText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockText: {
    fontSize: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  costBox: {
    alignItems: 'flex-end',
  },
  costLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCartBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  addCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stockAdjControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  adjBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjStockVal: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
