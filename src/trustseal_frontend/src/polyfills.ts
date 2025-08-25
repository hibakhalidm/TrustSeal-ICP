// Polyfill for process global in browser environment
if (typeof window !== 'undefined' && !window.process) {
  (window as any).process = {
    env: {
      NODE_ENV: 'development',
      INTERNET_IDENTITY_CANISTER_ID: ''
    }
  };
}

// Also ensure process is available globally
if (typeof global !== 'undefined' && !global.process) {
  (global as any).process = {
    env: {
      NODE_ENV: 'development',
      INTERNET_IDENTITY_CANISTER_ID: ''
    }
  };
}