// utils/responsive.js
import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scale = width / BASE_WIDTH;
const verticalScale = height / BASE_HEIGHT;

export const isSmallDevice = width < 360;
export const isTablet = width >= 768;

export const rs = size => Math.round(PixelRatio.roundToNearestPixel(size * scale));
export const rvs = size => Math.round(PixelRatio.roundToNearestPixel(size * verticalScale));

export const rf = size => {
  const scaleFactor = Math.min(scale, verticalScale);
  return Math.round(size * scaleFactor);
};

export default {
  width: rs,
  height: rvs,
  font: rf,
  radius: rs,
  padding: rs,
  margin: rs,
};
