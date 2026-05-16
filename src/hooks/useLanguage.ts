import { useApp } from '../context/AppContext';
import { translations, TranslationKey } from '../i18n/translations';

export function useLanguage() {
  const { state } = useApp();
  const lang = state.language;

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations['en'][key] ?? key;
  }

  return { t, lang };
}
