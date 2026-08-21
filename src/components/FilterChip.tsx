import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  icon,
  isSelected,
  onPress,
  count,
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? '#FFFFFF' : '#475569'}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text
          style={[
            styles.countBadge,
            isSelected && styles.countBadgeSelected,
          ]}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  countBadge: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    color: '#334155',
  },
  countBadgeSelected: {
    backgroundColor: '#1E40AF',
    color: '#FFFFFF',
  },
});
