export const getFlexDirection = (isRTL: boolean) => (isRTL ? 'row-reverse' : 'row');
export const getTextAlign = (isRTL: boolean) => (isRTL ? 'right' : 'left');
export const getAlignment = (isRTL: boolean) => (isRTL ? 'flex-end' : 'flex-start');
export const getChevronIcon = (isRTL: boolean, forwardName = 'chevron-forward', backName = 'chevron-back') =>
  (isRTL ? backName : forwardName);
