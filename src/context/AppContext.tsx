import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Language } from '../i18n/translations';
import { getSettings, saveSettings } from '../db/queries';

interface AppState {
  language: Language;
  defaultCustomerRate: number;
  defaultSupplierRate: number;
  isLoading: boolean;
  hasCompletedSetup: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;
}

type AppAction =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_DEFAULT_CUSTOMER_RATE'; payload: number }
  | { type: 'SET_DEFAULT_SUPPLIER_RATE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SETUP_COMPLETE'; payload: boolean }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' } }
  | { type: 'HIDE_TOAST' }
  | { type: 'LOAD_SETTINGS'; payload: { language: Language; defaultCustomerRate: number; defaultSupplierRate: number } };

const initialState: AppState = {
  language: 'hi',
  defaultCustomerRate: 60,
  defaultSupplierRate: 50,
  isLoading: true,
  hasCompletedSetup: false,
  toast: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_DEFAULT_CUSTOMER_RATE':
      return { ...state, defaultCustomerRate: action.payload };
    case 'SET_DEFAULT_SUPPLIER_RATE':
      return { ...state, defaultSupplierRate: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SETUP_COMPLETE':
      return { ...state, hasCompletedSetup: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'LOAD_SETTINGS':
      return {
        ...state,
        language: action.payload.language,
        defaultCustomerRate: action.payload.defaultCustomerRate,
        defaultSupplierRate: action.payload.defaultSupplierRate,
        hasCompletedSetup: true,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  updateLanguage: (lang: Language) => Promise<void>;
  updateRates: (customerRate: number, supplierRate: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings) {
          dispatch({
            type: 'LOAD_SETTINGS',
            payload: {
              language: settings.language,
              defaultCustomerRate: settings.defaultCustomerRate,
              defaultSupplierRate: settings.defaultSupplierRate,
            },
          });
        } else {
          // First launch — show language select
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    loadSettings();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
  };

  const updateLanguage = async (lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    await saveSettings({
      language: lang,
      defaultCustomerRate: state.defaultCustomerRate,
      defaultSupplierRate: state.defaultSupplierRate,
    });
    dispatch({ type: 'SET_SETUP_COMPLETE', payload: true });
  };

  const updateRates = async (customerRate: number, supplierRate: number) => {
    dispatch({ type: 'SET_DEFAULT_CUSTOMER_RATE', payload: customerRate });
    dispatch({ type: 'SET_DEFAULT_SUPPLIER_RATE', payload: supplierRate });
    await saveSettings({
      language: state.language,
      defaultCustomerRate: customerRate,
      defaultSupplierRate: supplierRate,
    });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, showToast, updateLanguage, updateRates }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
