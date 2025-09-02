import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SearchBarProps {
  theme: 'blue' | 'red';
  placeholder?: string;
  onSearch?: (query: string) => void;
  style?: any;
}

const SearchIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClearIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchButtonIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SearchBar: React.FC<SearchBarProps> = ({
  theme,
  placeholder = 'Navigate in your bottomless world!',
  onSearch,
  style,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation values
  const focusAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  // Theme colors
  const themeColors = {
    blue: {
      primary: '#4F46E5',
      secondary: '#3730A3',
      accent: '#818CF8',
      background: 'rgba(79, 70, 229, 0.15)',
      border: 'rgba(129, 140, 248, 0.2)',
      text: '#F8FAFC',
      textSecondary: '#CBD5E1',
      placeholder: '#94A3B8',
    },
    red: {
      primary: '#DC2626',
      secondary: '#991B1B',
      accent: '#F87171',
      background: 'rgba(220, 38, 38, 0.15)',
      border: 'rgba(248, 113, 113, 0.2)',
      text: '#F8FAFC',
      textSecondary: '#FECACA',
      placeholder: '#FCA5A5',
    },
  };

  const colors = themeColors[theme];

  // Focus animation
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  // Press animation
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  const handleSubmit = () => {
    onSearch?.(query);
  };

  const handleSearchButtonPress = () => {
    onSearch?.(query);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, `${colors.background}80`],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          borderColor,
          backgroundColor,
        },
        style,
      ]}
    >
      
      
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
          },
          Platform.OS === 'web' && { outlineStyle: 'none' as any },
        ]}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      
             <TouchableOpacity
         style={styles.searchButton}
         onPress={handleSearchButtonPress}
         activeOpacity={0.7}
       >
         <SearchButtonIcon color={colors.text} />
       </TouchableOpacity>
       
       {query.length > 0 && (
         <TouchableOpacity
           style={styles.clearButton}
           onPress={handleClear}
           activeOpacity={0.7}
         >
           <ClearIcon color={colors.textSecondary} />
         </TouchableOpacity>
       )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40, // Further reduced from 48
    borderRadius: 20, // Adjusted for new height
    borderWidth: 1,
    paddingHorizontal: 20,
    minWidth: 400, // Further increased from 300
    maxWidth: 600, // Further increased from 450
  },
  
     input: {
     flex: 1,
     fontSize: 14, // Smaller, more professional size
     fontWeight: '400', // Lighter weight for elegance
     paddingVertical: 0,
     textAlign: 'left', // Left align the text horizontally
     fontFamily: Platform.OS === 'web' ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : undefined, // Professional web fonts
   },
  searchButton: {
    marginLeft: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  clearButton: {
    marginLeft: 10, // Increased by 1/4 from 8
    padding: 5, // Increased by 1/4 from 4
    justifyContent: 'center',
    alignItems: 'center',
  },
});
