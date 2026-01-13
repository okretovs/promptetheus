import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  encryptionSalt: string | null;
  encryptionKey: CryptoKey | null;
  setAuth: (token: string, salt: string) => void;
  setEncryptionKey: (key: CryptoKey) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      encryptionSalt: null,
      encryptionKey: null,
      setAuth: (token, encryptionSalt) => set({ token, encryptionSalt }),
      setEncryptionKey: (encryptionKey) => set({ encryptionKey }),
      logout: () => set({ token: null, encryptionSalt: null, encryptionKey: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        encryptionSalt: state.encryptionSalt,
        // encryptionKey is NOT persisted - derived on each login
      }),
    }
  )
);
