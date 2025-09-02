import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SearchBar } from './SearchBar';
import { HeaderButtons } from './HeaderButtons';

interface DashboardHeaderProps {
  theme: 'blue' | 'red';
  onSearch?: (query: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  theme,
  onSearch,
}) => {
  const themeColors = {
    blue: {
      text: '#F8FAFC',
    },
    red: {
      text: '#F8FAFC',
    },
  };

  const colors = themeColors[theme];

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Text style={[styles.title, { color: colors.text }]}>
          Tensei Slime
        </Text>
      </View>
      
      <View style={styles.centerSection}>
        <SearchBar
          theme={theme}
          onSearch={onSearch}
          style={styles.searchBar}
        />
      </View>
      
      <View style={styles.rightSection}>
        <HeaderButtons theme={theme} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchBar: {
    width: '100%',
    maxWidth: 650, // Further increased to accommodate even wider search bar
  },
});
