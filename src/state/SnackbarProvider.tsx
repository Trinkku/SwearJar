import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Snackbar, type SnackbarAction } from '../components/Snackbar';
import { createId } from '../domain/id';
import { space } from '../theme/tokens';

const AUTO_DISMISS_MS = 4000;

interface SnackbarRequest {
  message: string;
  action?: SnackbarAction;
}

interface SnackbarContextValue {
  show: (request: SnackbarRequest) => void;
  dismiss: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

interface ActiveSnackbar extends SnackbarRequest {
  instanceId: string;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + space.md;

  const [active, setActive] = useState<ActiveSnackbar | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setActive(null);
  }, [clearTimer]);

  const show = useCallback(
    (request: SnackbarRequest) => {
      clearTimer();
      setActive({ ...request, instanceId: createId() });
      timer.current = setTimeout(() => setActive(null), AUTO_DISMISS_MS);
    },
    [clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {active ? (
        <Snackbar
          key={active.instanceId}
          instanceId={active.instanceId}
          message={active.message}
          topOffset={topOffset}
          action={
            active.action
              ? {
                  label: active.action.label,
                  onPress: () => {
                    dismiss();
                    active.action?.onPress();
                  },
                }
              : undefined
          }
        />
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (context === null) {
    throw new Error('useSnackbar vaatii SnackbarProviderin');
  }
  return context;
}
