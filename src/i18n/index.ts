import { I18nProvider, useI18n } from './I18nProvider';
export { I18nProvider, useI18n };
export { strings, type StringKey } from './strings';

export function useT() {
  const { t } = useI18n();
  return t;
}
