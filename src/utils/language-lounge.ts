const languageLoungeRoutes: Record<string, string> = {
  de: 'en-de',
  es: 'en-es',
  fr: 'en-fr',
  it: 'en-it',
  nl: 'en-nl',
  pt: 'en-pt',
  sv: 'en-sv',
};

export function getLanguageLoungeUrl(targetLanguage: string | undefined, base: string): string {
  const route = targetLanguage ? languageLoungeRoutes[targetLanguage] : undefined;
  return route
    ? `${base}/languagelounge/${route}/`
    : `${base}/languagelounge/`;
}
