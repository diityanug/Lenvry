import { describe, expect, it } from 'bun:test';
import { computeRemainingKeyboardOverlap } from '../utils/math';

describe('computeRemainingKeyboardOverlap', () => {
  it('returns 0 when keyboard is closed', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'android',
        keyboardHeight: 0,
        closedOverlayHeight: 800,
        currentOverlayHeight: 800,
        screenHeight: 800,
      })
    ).toBe(0);
  });

  it('returns 0 when Android already resized the modal overlay for the IME', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'android',
        keyboardHeight: 320,
        closedOverlayHeight: 756,
        currentOverlayHeight: 464,
        screenHeight: 800,
      })
    ).toBe(0);
  });

  it('returns full keyboardHeight when Android overlay did not resize', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'android',
        keyboardHeight: 320,
        closedOverlayHeight: 800,
        currentOverlayHeight: 800,
        screenHeight: 800,
      })
    ).toBe(320);
  });

  it('detects already-resized modal when opened with keyboard up before closed height is known', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'android',
        keyboardHeight: 320,
        closedOverlayHeight: 0,
        currentOverlayHeight: 464,
        screenHeight: 800,
      })
    ).toBe(0);
  });

  it('prevents bounce while keyboard is dismissing in an already-resized session', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'android',
        keyboardHeight: 320,
        closedOverlayHeight: 756,
        currentOverlayHeight: 756,
        screenHeight: 800,
        wasResizedInSession: true,
      })
    ).toBe(0);
  });

  it('returns keyboardHeight on iOS', () => {
    expect(
      computeRemainingKeyboardOverlap({
        platformOS: 'ios',
        keyboardHeight: 336,
        closedOverlayHeight: 844,
        currentOverlayHeight: 844,
        screenHeight: 844,
      })
    ).toBe(336);
  });
});
