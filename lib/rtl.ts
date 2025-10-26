/**
 * RTL (Right-to-Left) layout utilities for Arabic language support
 */

import { Locale } from '@/i18n';

/**
 * Check if a locale uses RTL layout
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get CSS classes for RTL support
 */
export function getRTLClasses(locale: Locale): string {
  const direction = getTextDirection(locale);
  return `dir-${direction} ${direction}`;
}

/**
 * Get flex direction classes for RTL support
 */
export function getFlexDirection(locale: Locale, defaultDirection: 'row' | 'row-reverse' = 'row'): string {
  if (isRTL(locale)) {
    return defaultDirection === 'row' ? 'flex-row-reverse' : 'flex-row';
  }
  return defaultDirection === 'row' ? 'flex-row' : 'flex-row-reverse';
}

/**
 * Get margin/padding classes for RTL support
 */
export function getSpacingClasses(locale: Locale, spacing: {
  left?: string;
  right?: string;
  start?: string;
  end?: string;
}): string {
  const { left, right, start, end } = spacing;
  
  if (isRTL(locale)) {
    // In RTL, start becomes right and end becomes left
    const classes = [];
    if (start) classes.push(start.replace('l-', 'r-').replace('left', 'right'));
    if (end) classes.push(end.replace('r-', 'l-').replace('right', 'left'));
    if (left) classes.push(left);
    if (right) classes.push(right);
    return classes.join(' ');
  } else {
    // In LTR, start becomes left and end becomes right
    const classes = [];
    if (start) classes.push(start);
    if (end) classes.push(end);
    if (left) classes.push(left);
    if (right) classes.push(right);
    return classes.join(' ');
  }
}

/**
 * Get border radius classes for RTL support
 */
export function getBorderRadiusClasses(locale: Locale, radius: {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  topStart?: string;
  topEnd?: string;
  bottomStart?: string;
  bottomEnd?: string;
}): string {
  const { topLeft, topRight, bottomLeft, bottomRight, topStart, topEnd, bottomStart, bottomEnd } = radius;
  
  if (isRTL(locale)) {
    // In RTL, start becomes right and end becomes left
    const classes = [];
    if (topStart) classes.push(topStart.replace('tl-', 'tr-').replace('top-left', 'top-right'));
    if (topEnd) classes.push(topEnd.replace('tr-', 'tl-').replace('top-right', 'top-left'));
    if (bottomStart) classes.push(bottomStart.replace('bl-', 'br-').replace('bottom-left', 'bottom-right'));
    if (bottomEnd) classes.push(bottomEnd.replace('br-', 'bl-').replace('bottom-right', 'bottom-left'));
    if (topLeft) classes.push(topLeft);
    if (topRight) classes.push(topRight);
    if (bottomLeft) classes.push(bottomLeft);
    if (bottomRight) classes.push(bottomRight);
    return classes.join(' ');
  } else {
    // In LTR, start becomes left and end becomes right
    const classes = [];
    if (topStart) classes.push(topStart);
    if (topEnd) classes.push(topEnd);
    if (bottomStart) classes.push(bottomStart);
    if (bottomEnd) classes.push(bottomEnd);
    if (topLeft) classes.push(topLeft);
    if (topRight) classes.push(topRight);
    if (bottomLeft) classes.push(bottomLeft);
    if (bottomRight) classes.push(bottomRight);
    return classes.join(' ');
  }
}