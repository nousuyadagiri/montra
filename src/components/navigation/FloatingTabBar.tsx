import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useTabBarStore } from '../../store/tabBarStore';

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation?: any;
  emitter?: any;
  navigateToTab?: any;
  insets?: any;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
  emitter,
  navigateToTab,
}) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isVisible = useTabBarStore((s) => s.isVisible);
  const [translateY] = useState(() => new Animated.Value(0));

  // Compute container and tab dimensions for smooth active pill slide animation
  const [containerWidth, setContainerWidth] = useState(() => {
    const windowWidth = Dimensions.get('window').width;
    return windowWidth > 0 ? windowWidth - 70 : 320;
  });

  const numTabs = state?.routes?.length || 5;
  const innerWidth = Math.max(0, containerWidth - 12);
  const tabWidth = innerWidth / numTabs;
  const pillWidth = Math.max(48, Math.min(tabWidth - 4, 60));
  const pillHeight = 50;
  const targetX = 5 + state.index * tabWidth + (tabWidth - pillWidth) / 2;

  const [animatedX] = useState(() => new Animated.Value(targetX));
  const prevIndexRef = useRef(state.index);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isVisible ? 0 : 130,
      useNativeDriver: Platform.OS !== 'web',
      tension: 65,
      friction: 11,
    }).start();
  }, [isVisible, translateY]);

  useEffect(() => {
    if (prevIndexRef.current === state.index) {
      animatedX.setValue(targetX);
    } else {
      prevIndexRef.current = state.index;
      Animated.spring(animatedX, {
        toValue: targetX,
        useNativeDriver: Platform.OS !== 'web',
        tension: 68,
        friction: 10,
      }).start();
    }
  }, [state.index, targetX, animatedX]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 0.5) {
      setContainerWidth(width);
    }
  };

  // Floating bottom elevation close to navigation bar without excessive gap
  const bottomInset = insets.bottom;
  const bottomPosition = bottomInset > 0 ? bottomInset + 2 : 8;

  // Active theme-reactive pill background
  const activePillBg = colors.primaryMuted;
  const activeTintColor = colors.primary;
  const inactiveTintColor = isDark ? '#9CA3AF' : '#8E8E93';

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      onLayout={handleContainerLayout}
      style={[
        styles.floatingContainer,
        {
          bottom: bottomPosition,
          backgroundColor: isDark
            ? 'rgba(24, 24, 28, 0.96)'
            : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.08)',
          transform: [{ translateY }],
        },
        isDark ? styles.darkShadow : styles.lightShadow,
      ]}
    >
      {/* Smooth animated sliding active indicator pill */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slidingPill,
          {
            backgroundColor: activePillBg,
            width: pillWidth,
            height: pillHeight,
            transform: [{ translateX: animatedX }],
          },
        ]}
      />

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = emitter
            ? emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
            : navigation?.emit?.({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

          if (!isFocused && !event?.defaultPrevented) {
            if (navigateToTab) {
              navigateToTab(route.key);
            } else if (navigation) {
              navigation.navigate(route.name, route.params);
            }
          }
        };

        const onLongPress = () => {
          if (emitter) {
            emitter.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          } else if (navigation?.emit) {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ||
              (typeof label === 'string' ? label : route.name)
            }
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <View style={styles.tabPill}>
              {options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? activeTintColor : inactiveTintColor,
                    size: 20,
                  })
                : null}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeTintColor : inactiveTintColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 35,
    right: 35,
    height: 62,
    borderRadius: 30, // 50% border radius of 60px container height
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    zIndex: 999,
  },
  slidingPill: {
    position: 'absolute',
    top: 5,
    left: 0,
    borderRadius: 26,
    zIndex: 0,
  },
  lightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 1,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
    marginTop: 1,
  },
});
