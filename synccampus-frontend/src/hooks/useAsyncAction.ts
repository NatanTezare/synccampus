import { useCallback, useState } from 'react';

interface ApiError {
  status?: number;
  message: string;
}

interface AsyncActionState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

/**
 * Wraps any async service call (booking, reviewing, cancelling, etc.)
 * with consistent loading / error / success state.
 *
 * Every screen uses this the same way, so the HCI requirement of
 * "immediate feedback" (spinners, success toasts, clear errors) is
 * satisfied identically everywhere instead of being re-implemented
 * per screen with subtly different behavior.
 *
 * Usage:
 *   const { run, loading, error, successMessage, clearMessages } = useAsyncAction();
 *   const handleBook = () => run(() => shuttleService.createBooking(payload), 'Seat booked!');
 */
export function useAsyncAction() {
  const [state, setState] = useState<AsyncActionState>({
    loading: false,
    error: null,
    successMessage: null,
  });

  const run = useCallback(async <T,>(
    action: () => Promise<T>,
    successMessageOverride?: string
  ): Promise<T | null> => {
    setState({ loading: true, error: null, successMessage: null });
    try {
      const result = await action();
      setState({
        loading: false,
        error: null,
        successMessage: successMessageOverride ?? null,
      });
      return result;
    } catch (err) {
      const apiErr = err as ApiError;
      setState({
        loading: false,
        error: apiErr.message || 'Something went wrong. Please try again.',
        successMessage: null,
      });
      return null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, successMessage: null }));
  }, []);

  return { ...state, run, clearMessages };
}
