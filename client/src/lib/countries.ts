export const COUNTRIES = [
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "US", name: "USA", flag: "🇺🇸" },
] as const;

export type CountryCode = typeof COUNTRIES[number]["code"];

export function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryName(code: string) {
  return getCountryByCode(code)?.name || code;
}

export function getCountryFlag(code: string) {
  return getCountryByCode(code)?.flag || "";
}
