import Svg, { Polygon } from 'react-native-svg';

import { colors } from '@/theme';

const POINTS = '50,4 62,37 97,38 69,59 79,94 50,74 21,94 31,59 3,38 38,37';

export function Star({ size, fill = colors.white }: { size: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={POINTS} fill={fill} stroke={colors.ink} strokeWidth={8} strokeLinejoin="round" />
    </Svg>
  );
}
