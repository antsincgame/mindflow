import * as colors from './colors';
import * as typography from './typography';
import * as spacing from './spacing';
import * as shadows from './shadows';
import * as animations from './animations';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  animations,
};

export type Theme = typeof theme;

export default theme;