import { create } from 'zustand';
import { useRef, useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface TabBarState {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
  isVisible: true,
  setIsVisible: (visible: boolean) =>
    set((state) => (state.isVisible === visible ? state : { isVisible: visible })),
}));

/**
 * Reusable hook to automatically hide the floating tab bar when scrolling down
 * and reveal it when scrolling up or returning to top.
 */
export const useTabBarScroll = () => {
  const setIsVisible = useTabBarStore((s) => s.setIsVisible);
  const lastScrollY = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      // Always show near the top of the screen
      if (currentY <= 30) {
        setIsVisible(true);
      } else if (diff > 8 && currentY > 60) {
        // Swiping up (content moving up / scrolling down) -> hide bottom tabs
        setIsVisible(false);
      } else if (diff < -8) {
        // Swiping down (content moving down / scrolling up) -> show bottom tabs
        setIsVisible(true);
      }

      lastScrollY.current = currentY;
    },
    [setIsVisible]
  );

  return {
    onScroll,
    scrollEventThrottle: 16,
  };
};

