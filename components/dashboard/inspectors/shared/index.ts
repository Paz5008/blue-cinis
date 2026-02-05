/**
 * Shared inspector components index.
 * Re-exports all shared components for convenient importing.
 *
 * @example
 * ```typescript
 * import {
 *   CommonSettings,
 *   CommonStyles,
 *   SharedMarginControl,
 *   SharedBorderControl,
 *   SharedTypographyControl,
 * } from '@/components/dashboard/inspectors/shared';
 * ```
 */

export { CommonSettings } from './CommonSettings';
export { CommonStyles } from './CommonStyles';
export { FilterControls } from './FilterControls';
export { SharedMarginControl } from './SharedMarginControl';
export type { MarginValues, SharedMarginControlProps } from './SharedMarginControl';
export { SharedBorderControl } from './SharedBorderControl';
export type { BorderValues, SharedBorderControlProps } from './SharedBorderControl';
export { SharedTypographyControl } from './SharedTypographyControl';
export type { TypographyValues, SharedTypographyControlProps } from './SharedTypographyControl';
