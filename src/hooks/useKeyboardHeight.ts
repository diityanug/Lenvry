import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  ScaledSize,
  useWindowDimensions,
} from 'react-native';

import {
  computeRemainingKeyboardOverlap,
  type RemainingKeyboardOverlapInput,
} from '../utils/math';

export { computeRemainingKeyboardOverlap, type RemainingKeyboardOverlapInput };

/**
 * Reusable hook to track keyboard height across iOS and Android.
 * Automatically cleans up keyboard listeners.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

/**
 * Computes remaining bottom scroll padding for modals or centered overlays that do
 * not measure their own `onLayout`. Avoids adding full keyboard height on top of an
 * Android window that already resized via `softwareKeyboardLayoutMode: "resize"`.
 */
export function useKeyboardBottomPadding(basePadding = 28): number {
  const { height: windowHeight } = useWindowDimensions();
  const [state, setState] = useState(() => ({
    keyboardHeight: 0,
    closedWindowHeight: Dimensions.get('window').height,
    wasResizedInSession: false,
  }));
  const latestWindowHeightRef = useRef(Dimensions.get('window').height);

  useEffect(() => {
    latestWindowHeightRef.current = windowHeight;
  }, [windowHeight]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const dimSub = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      latestWindowHeightRef.current = window.height;
      setState((prev) => {
        if (prev.keyboardHeight <= 0) {
          return { ...prev, closedWindowHeight: window.height, wasResizedInSession: false };
        }
        const shrunk = Math.max(0, prev.closedWindowHeight - window.height);
        const resized = shrunk >= prev.keyboardHeight * 0.45;
        if (resized && !prev.wasResizedInSession) {
          return { ...prev, wasResizedInSession: true };
        }
        return prev;
      });
    });

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e.endCoordinates.height;
      setState((prev) => {
        const winH = latestWindowHeightRef.current;
        const closedWin = prev.closedWindowHeight > 0 ? prev.closedWindowHeight : winH;
        const shrunk = Math.max(0, closedWin - winH);
        const resized = shrunk >= kbHeight * 0.45;
        return {
          keyboardHeight: kbHeight,
          closedWindowHeight: closedWin,
          wasResizedInSession: prev.wasResizedInSession || resized,
        };
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setState({
        keyboardHeight: 0,
        closedWindowHeight: latestWindowHeightRef.current,
        wasResizedInSession: false,
      });
    });

    return () => {
      dimSub.remove();
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return basePadding;
  }

  const remaining = computeRemainingKeyboardOverlap({
    platformOS: Platform.OS,
    keyboardHeight: state.keyboardHeight,
    closedOverlayHeight: state.closedWindowHeight,
    currentOverlayHeight: windowHeight,
    screenHeight: Dimensions.get('screen').height,
    wasResizedInSession: state.wasResizedInSession,
  });

  return Math.max(basePadding, remaining + basePadding);
}

export interface KeyboardAwareSheetLayout {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  /** Padding to lift the modal overlay bottom above the IME (0 when Android resized the Modal). */
  keyboardOverlap: number;
  /** Clean inner bottom padding for ScrollView/FlatList without leaving a huge empty void below buttons. */
  scrollBottomPadding: number;
  /** Attach to the modal's outer `.overlay` / `.scrollOverlayCenter` View to detect Android resize vs overlap. */
  onOverlayLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Reusable modal keyboard hook for bottom sheets and scrollable forms.
 * Keeps the sheet itself cleanly lifted above any unresized keyboard while keeping
 * ScrollView `paddingBottom` compact (`basePadding`), so scrolling all the way down
 * stops cleanly at the action button rather than scrolling past it into empty space.
 */
export function useKeyboardAwareSheet(basePadding = 28): KeyboardAwareSheetLayout {
  const { height: screenHeight } = Dimensions.get('screen');
  const [state, setState] = useState({
    keyboardHeight: 0,
    closedOverlayHeight: 0,
    currentOverlayHeight: 0,
    wasResizedInSession: false,
  });
  const keyboardHeightRef = useRef(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e.endCoordinates.height;
      keyboardHeightRef.current = kbHeight;
      setState((prev) => {
        const shrunk =
          prev.closedOverlayHeight > 0 && prev.currentOverlayHeight > 0
            ? Math.max(0, prev.closedOverlayHeight - prev.currentOverlayHeight)
            : 0;
        const resized = shrunk >= kbHeight * 0.45;
        return {
          ...prev,
          keyboardHeight: kbHeight,
          wasResizedInSession: prev.wasResizedInSession || resized,
        };
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setState((prev) => ({
        ...prev,
        keyboardHeight: 0,
        closedOverlayHeight:
          prev.currentOverlayHeight > prev.closedOverlayHeight
            ? prev.currentOverlayHeight
            : prev.closedOverlayHeight,
        wasResizedInSession: false,
      }));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    const h = Math.round(event.nativeEvent.layout.height);
    if (h <= 0) return;

    setState((prev) => {
      const kbHeight = keyboardHeightRef.current;
      if (kbHeight <= 0) {
        if (prev.closedOverlayHeight === h && prev.currentOverlayHeight === h && !prev.wasResizedInSession) {
          return prev;
        }
        return {
          ...prev,
          closedOverlayHeight: h,
          currentOverlayHeight: h,
          wasResizedInSession: false,
        };
      }

      const shrunk = prev.closedOverlayHeight > 0 ? Math.max(0, prev.closedOverlayHeight - h) : 0;
      const resizedNow = shrunk >= kbHeight * 0.45;
      const nextResized = prev.wasResizedInSession || resizedNow;

      if (prev.currentOverlayHeight === h && prev.wasResizedInSession === nextResized) {
        return prev;
      }
      return {
        ...prev,
        currentOverlayHeight: h,
        wasResizedInSession: nextResized,
      };
    });
  }, []);

  const keyboardOverlap = computeRemainingKeyboardOverlap({
    platformOS: Platform.OS,
    keyboardHeight: state.keyboardHeight,
    closedOverlayHeight: state.closedOverlayHeight,
    currentOverlayHeight: state.currentOverlayHeight,
    screenHeight,
    wasResizedInSession: state.wasResizedInSession,
  });

  return {
    keyboardHeight: state.keyboardHeight,
    isKeyboardVisible: state.keyboardHeight > 0,
    keyboardOverlap,
    scrollBottomPadding: basePadding,
    onOverlayLayout,
  };
}

/**
 * Shared ScrollView / FlatList props for forms and searchable modals so scrolling
 * keeps the keyboard open and tapping buttons registers on the first press.
 */
export const KEEP_KEYBOARD_SCROLL_PROPS = {
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'none' as const,
  automaticallyAdjustKeyboardInsets: true,
  nestedScrollEnabled: true,
};
