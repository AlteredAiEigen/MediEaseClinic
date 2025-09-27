import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width = 80, height = 80 }) => {
  return (
    <Svg viewBox="0 0 48 48" width={width} height={height} fill="none">
      {/* Medical cross background */}
      <Circle cx="24" cy="24" r="22" fill="#10b981" />
      <Circle cx="24" cy="24" r="18" fill="#059669" />

      {/* Stethoscope design */}
      <Path
        d="M16 18C16 18 18 16 20 16C22 16 24 18 24 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M28 18C28 18 30 16 32 16C34 16 36 18 36 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M20 16V24C20 26 22 28 24 28C26 28 28 26 28 24V16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Medical cross */}
      <Rect x="22" y="30" width="4" height="12" rx="2" fill="white" />
      <Rect x="18" y="34" width="12" height="4" rx="2" fill="white" />

      {/* AI circuit pattern */}
      <Circle cx="16" cy="12" r="1.5" fill="#22d3ee" />
      <Circle cx="32" cy="12" r="1.5" fill="#22d3ee" />
      <Path d="M16 12L18 14M32 12L30 14" stroke="#22d3ee" strokeWidth="1" />

      {/* Pulse line */}
      <Path
        d="M8 24L12 24L14 20L16 28L18 20L20 24L28 24L30 20L32 28L34 20L36 24L40 24"
        stroke="#22d3ee"
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  );
};

export default Logo;
