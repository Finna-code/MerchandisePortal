// Global type augmentations for browser APIs used across the app
// - Adds a custom `navstart` event to the WindowEventMap
// - Adds a `__navTimer` field to `window` for coordinating navigation overlay timing

export {};

declare global {
  interface Window {
    __setTheme(theme: 'light' | 'dark'): void;
    __navTimer?: ReturnType<typeof setTimeout>;
    __navHideFallback?: ReturnType<typeof setTimeout>;
  }

  interface WindowEventMap {
    navstart: Event;
  }
}
