export function useLocalized() {
  return (value?: { en: string; zh: string } | null) => value?.zh || ''
}
