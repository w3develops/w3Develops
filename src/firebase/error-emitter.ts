
// A simple event emitter for global error handling
type Listener = (error: any) => void;

class ErrorEmitter {
  private listeners: { [key: string]: Listener[] } = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, data: any) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

export const errorEmitter = new ErrorEmitter();
