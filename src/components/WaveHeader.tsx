import React from 'react';
import Svg, { Path, Defs, LinearGradient as SvgLinear, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { colors } from '../theme/colors';

export const WaveHeader: React.FC<{ height?: number }> = ({ height = 220 }) => {
  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height="100%" viewBox="0 0 375 220" preserveAspectRatio="none">
        <Defs>
          <SvgLinear id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandEnd} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.brandStart} stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Path
          d="M0 0H375V124.5C309 162.5 265 166 188 128.5C111 91 49 99.5 0 124.5V0Z"
          fill="url(#grad)"
        />
      </Svg>
    </View>
  );
};


