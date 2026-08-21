import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useERP } from '../context/ERPContext';
import { HeaderBar } from '../components/HeaderBar';
import { ProductCard } from '../components/ProductCard';
import { FilterChip } from '../components/FilterChip';
import { NewProductModal } from '../components/NewProductModal';
import { LowStockModal } from '../components/LowStockModal';
import { Product } from '../types/erp';

export const InventoryScreen = () => {
  const { products, categories, formatCurrency, warehouses, activeWarehouseId, setActiveWarehouseId } = useERP();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? p.currentStock <= p.minStockAlert && p.currentStock > 0
        : p.currentStock <= 0;

    return matchCat && matchSearch && matchStock;
  });

  // Inventory valuation: sum of (costPrice * currentStock)
  const totalStockValuationCost = products.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
  const totalStockValuationRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.currentStock, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  return (
    <View style={styles.container}>
      <HeaderBar
        title="إدارة المخزون والمستودعات"
        subtitle="جرد البضائع، تقييم المخزون، وتنبيهات إعادة الطلب"
      />

      {/* Inventory Valuation Header Strip */}
      <View style={styles.valuationCard}>
        <View style={styles.valItem}>
          <Text style={styles.valLabel}>قيمة المخزون بالتكلفة:</Text>
          <Text style={styles.valAmount}>{formatCurrency(totalStockValuationCost)}</Text>
        </View>
        <View style={styles.valDivider} />
        <View style={styles.valItem}>
          <Text style={styles.valLabel}>قيمة البيع المتوقعة:</Text>
          <Text style={[styles.valAmount, { color: '#059669' }]}>
            {formatCurrency(totalStockValuationRetail)}
          </Text>
        </View>
        <View style={styles.valDivider} />
        <View style={styles.valItem}>
          <Text style={styles.valLabel}>إجمالي الأصناف:</Text>
          <Text style={styles.valAmount}>{products.length} صنف</Text>
        </View>
      </View>

      {/* Warehouses Selector */}
      <View style={styles.warehouseSelectorRow}>
        <Ionicons name="home-outline" size={16} color="#475569" />
        <Text style={styles.whLabel}>المستودع:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 6 }}>
          {warehouses.map((wh) => {
            const isSel = wh.id === activeWarehouseId;
            return (
              <TouchableOpacity
                key={wh.id}
                style={[styles.whChip, isSel && styles.whChipActive]}
                onPress={() => setActiveWarehouseId(wh.id)}
              >
                <Text style={[styles.whChipText, isSel && styles.whChipTextActive]}>
                  {wh.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم، الباركود، أو رمز الصنف..."
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
          style={styles.addProductBtn}
          onPress={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addProductBtnText}>صنف جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs (Stock Level & Category) */}
      <View style={styles.filterSection}>
        {/* Stock status pills */}
        <View style={styles.stockStatusRow}>
          <TouchableOpacity
            style={[styles.stockStatusBtn, stockFilter === 'all' && styles.stockStatusBtnActive]}
            onPress={() => setStockFilter('all')}
          >
            <Text style={[styles.stockStatusText, stockFilter === 'all' && styles.stockStatusTextActive]}>
              الكل ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stockStatusBtn, stockFilter === 'low' && styles.stockStatusBtnActive]}
            onPress={() => setStockFilter('low')}
          >
            <Ionicons name="warning-outline" size={12} color={stockFilter === 'low' ? '#FFFFFF' : '#D97706'} />
            <Text style={[styles.stockStatusText, stockFilter === 'low' && styles.stockStatusTextActive]}>
              نواقص ({lowStockCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stockStatusBtn, stockFilter === 'out' && styles.stockStatusBtnActive]}
            onPress={() => setStockFilter('out')}
          >
            <Text style={[styles.stockStatusText, stockFilter === 'out' && styles.stockStatusTextActive]}>
              نفذ ({products.filter((p) => p.currentStock <= 0).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <FilterChip
            label="جميع الأقسام"
            isSelected={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              isSelected={selectedCategory === c.id}
              onPress={() => setSelectedCategory(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Products Inventory List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>لم يتم العثور على أصناف تطابق البحث</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            showStockActions={true}
            onEdit={() => {
              setEditingProduct(item);
              setShowProductModal(true);
            }}
          />
        )}
      />

      {/* Modals */}
      <NewProductModal
        visible={showProductModal}
        productToEdit={editingProduct}
        onClose={() => setShowProductModal(false)}
      />

      <LowStockModal
        visible={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  valuationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  valItem: {
    flex: 1,
    alignItems: 'center',
  },
  valDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  valLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  valAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  warehouseSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 8,
  },
  whLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
  },
  whChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stockStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  stockStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stockStatusBtnActive: {
    backgroundColor: '#1E293B',
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stockStatusTextActive: {
    color: '#FFFFFF',
  },
  catScroll: {
    flexDirection: 'row',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
});
