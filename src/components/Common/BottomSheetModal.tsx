import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

const INITIAL_SLIDE_OFFSET_Y = 64;
const ENTER_ANIMATION_DURATION_MS = 220;
const BACKDROP_FADE_DURATION_MS = 180;

interface BottomSheetAnimState {
  backdropOpacity: Animated.Value;
  sheetTranslateY: Animated.Value;
}

const BottomSheetAnimationContext = createContext<BottomSheetAnimState | null>(null);

interface PortalEntry {
  node: React.ReactNode;
  onRequestClose: () => void;
}

interface PortalManager {
  subscribeOrder: (listener: () => void) => () => void;
  getOrderSnapshot: () => string[];
  subscribeSlot: (id: string, listener: () => void) => () => void;
  getEntrySnapshot: (id: string) => PortalEntry | undefined;
  upsert: (id: string, node: React.ReactNode, onRequestClose: () => void) => void;
  remove: (id: string) => void;
  getTopCloseHandler: () => (() => void) | null;
}

function createPortalManager(): PortalManager {
  let order: string[] = [];
  const entries = new Map<string, PortalEntry>();
  const orderListeners = new Set<() => void>();
  const slotListeners = new Map<string, Set<() => void>>();

  const notifyOrder = () => {
    orderListeners.forEach((listener) => listener());
  };

  const notifySlot = (id: string) => {
    slotListeners.get(id)?.forEach((listener) => listener());
  };

  return {
    subscribeOrder(listener) {
      orderListeners.add(listener);
      return () => {
        orderListeners.delete(listener);
      };
    },
    getOrderSnapshot() {
      return order;
    },
    subscribeSlot(id, listener) {
      let set = slotListeners.get(id);
      if (!set) {
        set = new Set();
        slotListeners.set(id, set);
      }
      set.add(listener);
      return () => {
        const current = slotListeners.get(id);
        if (current) {
          current.delete(listener);
          if (current.size === 0) {
            slotListeners.delete(id);
          }
        }
      };
    },
    getEntrySnapshot(id) {
      return entries.get(id);
    },
    upsert(id, node, onRequestClose) {
      entries.set(id, { node, onRequestClose });
      if (!order.includes(id)) {
        order = [...order, id];
        notifyOrder();
      }
      notifySlot(id);
    },
    remove(id) {
      const existed = entries.delete(id);
      if (order.includes(id)) {
        order = order.filter((item) => item !== id);
        notifyOrder();
      }
      if (existed) {
        notifySlot(id);
      }
    },
    getTopCloseHandler() {
      if (order.length === 0) return null;
      const topId = order[order.length - 1];
      return entries.get(topId)?.onRequestClose ?? null;
    },
  };
}

const ModalPortalContext = createContext<PortalManager | null>(null);

/**
 * Provides a root-level overlay stack so sub-modals and popups opened from
 * inside another modal cleanly stack on top without hiding the parent modal.
 */
export function ModalPortalProvider({ children }: { children: React.ReactNode }) {
  const [manager] = useState(() => createPortalManager());
  return (
    <ModalPortalContext.Provider value={manager}>
      {children}
    </ModalPortalContext.Provider>
  );
}

function PortalSlotView({
  id,
  zIndex,
  manager,
}: {
  id: string;
  zIndex: number;
  manager: PortalManager;
}) {
  const subscribe = useCallback(
    (listener: () => void) => manager.subscribeSlot(id, listener),
    [id, manager]
  );
  const getSnapshot = useCallback(() => manager.getEntrySnapshot(id), [id, manager]);
  const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!entry) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex }]} pointerEvents="box-none">
      {entry.node}
    </View>
  );
}

const EMPTY_ORDER: string[] = [];

/**
 * Renders all open stacked modals in chronological open order above app screens
 * and handles Android hardware back presses for the topmost modal only.
 */
export function ModalPortalHost() {
  const manager = useContext(ModalPortalContext);
  const subscribe = useCallback(
    (listener: () => void) => (manager ? manager.subscribeOrder(listener) : () => {}),
    [manager]
  );
  const getSnapshot = useCallback(
    () => (manager ? manager.getOrderSnapshot() : EMPTY_ORDER),
    [manager]
  );
  const order = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!manager) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const closeTop = manager.getTopCloseHandler();
      if (!closeTop) return false;
      closeTop();
      return true;
    });
    return () => subscription.remove();
  }, [manager]);

  if (!manager || order.length === 0) return null;

  return (
    <View style={styles.portalRoot} pointerEvents="box-none">
      {order.map((id, index) => (
        <PortalSlotView key={id} id={id} zIndex={index + 1} manager={manager} />
      ))}
    </View>
  );
}

function BottomSheetSlot({ children }: { children: React.ReactNode }) {
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(INITIAL_SLIDE_OFFSET_Y));
  const [animState] = useState<BottomSheetAnimState>(() => ({
    backdropOpacity,
    sheetTranslateY,
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: BACKDROP_FADE_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: ENTER_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY]);

  return (
    <BottomSheetAnimationContext.Provider value={animState}>
      {children}
    </BottomSheetAnimationContext.Provider>
  );
}

function FadeModalSlot({ children }: { children: React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: BACKDROP_FADE_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      {children}
    </Animated.View>
  );
}

export interface BottomSheetModalHostProps {
  visible: boolean;
  onRequestClose: () => void;
  statusBarTranslucent?: boolean;
  children: React.ReactNode;
}

/**
 * Hosts a bottom-sheet modal in the root `ModalPortalHost` when available so
 * stacked modals layer cleanly without hiding parent sheets or flickering the backdrop.
 */
export function BottomSheetModalHost({
  visible,
  onRequestClose,
  statusBarTranslucent = true,
  children,
}: BottomSheetModalHostProps) {
  const manager = useContext(ModalPortalContext);
  const modalId = useId();

  // Fallback native Modal state used only when rendered outside `ModalPortalProvider`.
  const [backdropOpacity] = useState(() => new Animated.Value(1));
  const [sheetTranslateY] = useState(() => new Animated.Value(INITIAL_SLIDE_OFFSET_Y));
  const [fallbackAnim] = useState<BottomSheetAnimState>(() => ({
    backdropOpacity,
    sheetTranslateY,
  }));

  useLayoutEffect(() => {
    if (!manager) return;
    if (visible) {
      manager.upsert(modalId, <BottomSheetSlot>{children}</BottomSheetSlot>, onRequestClose);
    } else {
      manager.remove(modalId);
    }
  }, [manager, modalId, visible, children, onRequestClose]);

  useLayoutEffect(() => {
    if (!manager) return;
    return () => {
      manager.remove(modalId);
    };
  }, [manager, modalId]);

  useEffect(() => {
    if (manager) return;
    if (visible) {
      sheetTranslateY.setValue(INITIAL_SLIDE_OFFSET_Y);
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: ENTER_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      sheetTranslateY.stopAnimation();
      sheetTranslateY.setValue(INITIAL_SLIDE_OFFSET_Y);
    }
  }, [manager, visible, sheetTranslateY]);

  if (manager) {
    return null;
  }

  return (
    <BottomSheetAnimationContext.Provider value={fallbackAnim}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        statusBarTranslucent={statusBarTranslucent}
        onRequestClose={onRequestClose}
      >
        {children}
      </Modal>
    </BottomSheetAnimationContext.Provider>
  );
}

/**
 * Hosts a centered dialog or popup modal inside the shared z-ordered portal
 * stack so alerts, pickers, and category creators overlay bottom sheets cleanly.
 */
export function FadeModalHost({
  visible,
  onRequestClose,
  statusBarTranslucent = true,
  children,
}: BottomSheetModalHostProps) {
  const manager = useContext(ModalPortalContext);
  const modalId = useId();

  useLayoutEffect(() => {
    if (!manager) return;
    if (visible) {
      manager.upsert(modalId, <FadeModalSlot>{children}</FadeModalSlot>, onRequestClose);
    } else {
      manager.remove(modalId);
    }
  }, [manager, modalId, visible, children, onRequestClose]);

  useLayoutEffect(() => {
    if (!manager) return;
    return () => {
      manager.remove(modalId);
    };
  }, [manager, modalId]);

  if (manager) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
}

export interface BottomSheetSurfaceProps {
  overlayStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  keyboardOverlap?: number;
  onOverlayLayout?: (event: LayoutChangeEvent) => void;
  onBackdropPress?: () => void;
  children: React.ReactNode;
}

/**
 * Renders the stationary fade-in backdrop, tap-to-dismiss barrier above the sheet,
 * and the animated bottom-sheet container driven by `BottomSheetModalHost`.
 */
export function BottomSheetSurface({
  overlayStyle,
  sheetStyle,
  keyboardOverlap = 0,
  onOverlayLayout,
  onBackdropPress,
  children,
}: BottomSheetSurfaceProps) {
  const anim = useContext(BottomSheetAnimationContext);
  const safeInsets = useContext(SafeAreaInsetsContext);
  const keyboardHeight = useKeyboardHeight();

  const flattenedOverlay = StyleSheet.flatten(overlayStyle) as ViewStyle | undefined;
  const backdropColor =
    typeof flattenedOverlay?.backgroundColor === 'string'
      ? flattenedOverlay.backgroundColor
      : COLORS.overlay;

  const flattenedSheet = StyleSheet.flatten(sheetStyle) as ViewStyle | undefined;
  const basePaddingBottom =
    typeof flattenedSheet?.paddingBottom === 'number' ? flattenedSheet.paddingBottom : 28;
  const bottomInset = safeInsets?.bottom ?? 0;
  const safeSheetPaddingBottom =
    keyboardHeight > 0 || keyboardOverlap > 0
      ? basePaddingBottom
      : Math.max(basePaddingBottom, bottomInset + 12);

  return (
    <View
      style={[
        styles.overlay,
        overlayStyle,
        anim ? styles.transparentBackground : null,
        keyboardOverlap > 0 ? { paddingBottom: keyboardOverlap } : null,
      ]}
      onLayout={onOverlayLayout}
    >
      {anim ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backdropColor, opacity: anim.backdropOpacity },
          ]}
        />
      ) : null}

      <Pressable
        style={styles.dismissArea}
        onPress={onBackdropPress}
        accessible={false}
      />

      <Animated.View
        style={[
          sheetStyle,
          safeSheetPaddingBottom !== basePaddingBottom
            ? { paddingBottom: safeSheetPaddingBottom }
            : null,
          anim ? { transform: [{ translateY: anim.sheetTranslateY }] } : null,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export interface BottomSheetModalProps
  extends BottomSheetModalHostProps,
    BottomSheetSurfaceProps {}

/**
 * Convenience wrapper combining `BottomSheetModalHost` and `BottomSheetSurface`
 * for modals whose body mounts alongside the host wrapper.
 */
export function BottomSheetModal({
  visible,
  onRequestClose,
  statusBarTranslucent = true,
  overlayStyle,
  sheetStyle,
  keyboardOverlap = 0,
  onOverlayLayout,
  onBackdropPress,
  children,
}: BottomSheetModalProps) {
  return (
    <BottomSheetModalHost
      visible={visible}
      onRequestClose={onRequestClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <BottomSheetSurface
        overlayStyle={overlayStyle}
        sheetStyle={sheetStyle}
        keyboardOverlap={keyboardOverlap}
        onOverlayLayout={onOverlayLayout}
        onBackdropPress={onBackdropPress}
      >
        {children}
      </BottomSheetSurface>
    </BottomSheetModalHost>
  );
}

const styles = StyleSheet.create({
  portalRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  dismissArea: {
    flex: 1,
  },
});
