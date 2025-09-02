import React, { useRef, useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ScrollView } from 'react-native';

interface CustomScrollbarProps {
  children: React.ReactNode;
  contentHeight: number;
  containerHeight: number;
  onScroll?: (scrollY: number) => void;
  theme?: 'blue' | 'red';
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  contentHeight,
  containerHeight,
  onScroll,
  theme = 'blue',
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollbarY = useRef(new Animated.Value(0)).current;

  const themeColors = {
    blue: {
      track: 'rgba(59, 130, 246, 0.1)',
      thumb: '#3B82F6',
      thumbHover: '#2563EB',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    red: {
      track: 'rgba(239, 68, 68, 0.1)',
      thumb: '#EF4444',
      thumbHover: '#DC2626',
      glow: 'rgba(239, 68, 68, 0.3)',
    },
  };

  const currentTheme = themeColors[theme];

  const maxScroll = Math.max(0, contentHeight - containerHeight);
  const scrollbarHeight = Math.max(20, (containerHeight / contentHeight) * containerHeight);
  const scrollbarMaxY = containerHeight - scrollbarHeight;

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const scrollRatio = maxScroll > 0 ? value / maxScroll : 0;
      const newScrollbarY = scrollRatio * scrollbarMaxY;
      scrollbarY.setValue(newScrollbarY);
      onScroll?.(value);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [maxScroll, scrollbarMaxY, onScroll]);

  return (
    <View style={styles.container}>
      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { height: contentHeight }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      {/* Custom scrollbar */}
      <View style={styles.scrollbarContainer}>
        {/* Track */}
        <View style={[styles.track, { backgroundColor: currentTheme.track }]} />
        
        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: currentTheme.thumb,
              height: scrollbarHeight,
              opacity: 0.7,
              transform: [
                { translateY: scrollbarY },
              ],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.thumbGlow,
              {
                backgroundColor: currentTheme.glow,
                opacity: 0.3,
              },
            ]}
          />
          
          {/* Thumb content - decorative elements */}
          <View style={styles.thumbContent}>
            <View style={[styles.thumbDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.thumbDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.thumbDot, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingRight: 8,
  },
  scrollbarContainer: {
    width: 12,
    position: 'relative',
    marginLeft: 4,
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 6,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 8,
    zIndex: -1,
  },
  thumbContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  thumbDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
});
