import type { FirestorePermissionError } from '@/firebase/errors';

// A simple event emitter for global error handling. Each event name maps to
// the kind of value its listeners receive.
interface ErrorEvents {
  'permission-error': FirestorePermissionError;
}

type EventName = keyof ErrorEvents;
type Listener<E extends EventName> = (data: ErrorEvents[E]) => void;
type AnyListener = Listener<EventName>;

class ErrorEmitter {
  private listeners: Partial<Record<EventName, AnyListener[]>> = {};

  on<E extends EventName>(event: E, listener: Listener<E>) {
    const current: AnyListener[] = this.listeners[event] ?? [];
    this.listeners[event] = [...current, listener as AnyListener];
  }

  off<E extends EventName>(event: E, listener: Listener<E>) {
    this.listeners[event] = this.listeners[event]?.filter(l => l !== listener);
  }

  emit<E extends EventName>(event: E, data: ErrorEvents[E]) {
    this.listeners[event]?.forEach(listener => listener(data));
  }
}

export const errorEmitter = new ErrorEmitter();
