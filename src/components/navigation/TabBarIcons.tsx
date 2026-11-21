import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface TabIconProps {
  color: any;
  focused: boolean;
  size?: number;
}

/**
 * Home tab icon:
 * - Inactive: crisp modern outline house with door
 * - Active: solid filled house with doorway cutout
 */
export const HomeTabIcon: React.FC<TabIconProps> = ({ color, focused, size = 21 }) => {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * Activity / Transactions tab icon:
 * - Inactive: crisp outline bidirectional arrows (⇄)
 * - Active: solid filled bidirectional arrows
 */
export const ActivityTabIcon: React.FC<TabIconProps> = ({ color, focused, size = 21 }) => {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Top arrow pointing right: solid filled arrow */}
        <Path
          d="M4 8.5h11V5l6 5-6 5v-3.5H4v-3z"
          fill={color}
        />
        {/* Bottom arrow pointing left: solid filled arrow */}
        <Path
          d="M20 15.5H9V19l-6-5 6-5v3.5h11v3z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4l-4 4 4 4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8h16"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 20l4-4-4-4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 16H4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * Budgets tab icon:
 * - Inactive: 4 outline squares (grid)
 * - Active: 4 solid filled rounded squares
 */
export const BudgetsTabIcon: React.FC<TabIconProps> = ({ color, focused, size = 21 }) => {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="7.5" height="7.5" rx="2" fill={color} />
        <Rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill={color} />
        <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill={color} />
        <Rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill={color} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="7.5"
        height="7.5"
        rx="2"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="13.5"
        y="3"
        width="7.5"
        height="7.5"
        rx="2"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="13.5"
        y="13.5"
        width="7.5"
        height="7.5"
        rx="2"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="3"
        y="13.5"
        width="7.5"
        height="7.5"
        rx="2"
        stroke={color}
        strokeWidth={1.9}
      />
    </Svg>
  );
};

/**
 * Split tab icon:
 * - Inactive: outline group/users icon
 * - Active: solid filled users silhouette
 */
export const SplitTabIcon: React.FC<TabIconProps> = ({ color, focused, size = 21 }) => {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Main person */}
        <Circle cx="9" cy="7" r="4" fill={color} />
        <Path
          d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2z"
          fill={color}
        />
        {/* Secondary person silhouette */}
        <Circle cx="17" cy="7" r="3.2" fill={color} />
        <Path
          d="M17 14.5a3.8 3.8 0 0 1 4 3.5v3h-3.8v-2a3.8 3.8 0 0 0-.2-1.5z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="9"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth={1.9}
      />
      <Path
        d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M16 3.2a4 4 0 0 1 0 7.6"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M21 21v-2a4 4 0 0 0-3-3.8"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * Profile tab icon:
 * - Inactive: outline person icon
 * - Active: solid filled person silhouette
 */
export const ProfileTabIcon: React.FC<TabIconProps> = ({ color, focused, size = 21 }) => {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="4.2" fill={color} />
        <Path
          d="M5 21v-2.2a5.2 5.2 0 0 1 5.2-5.2h3.6a5.2 5.2 0 0 1 5.2 5.2V21z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth={1.9}
      />
      <Path
        d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
};
