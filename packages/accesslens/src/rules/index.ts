import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';
import { checkAltText } from './altText.js';
import { checkHeadingOrder } from './headingOrder.js';
import { checkContrast } from './contrast.js';

/** Run all custom rules and return concatenated findings. */
export function runCustomRules(snapshot: DomSnapshot): Finding[] {
  return [
    ...checkAltText(snapshot),
    ...checkHeadingOrder(snapshot),
    ...checkContrast(snapshot),
  ];
}
