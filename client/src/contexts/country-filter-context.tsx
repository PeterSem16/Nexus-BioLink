import { createContext, useContext, useState } from "react";
import { COUNTRIES, type CountryCode } from "@/lib/countries";

interface CountryFilterContextType {
  selectedCountries: CountryCode[];
  setSelectedCountries: (countries: CountryCode[]) => void;
  toggleCountry: (code: CountryCode) => void;
  selectAll: () => void;
  clearAll: () => void;
}

const CountryFilterContext = createContext<CountryFilterContextType | undefined>(undefined);

export function CountryFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(
    COUNTRIES.map(c => c.code)
  );

  const toggleCountry = (code: CountryCode) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const selectAll = () => {
    setSelectedCountries(COUNTRIES.map(c => c.code));
  };

  const clearAll = () => {
    setSelectedCountries([]);
  };

  return (
    <CountryFilterContext.Provider value={{
      selectedCountries,
      setSelectedCountries,
      toggleCountry,
      selectAll,
      clearAll,
    }}>
      {children}
    </CountryFilterContext.Provider>
  );
}

export function useCountryFilter() {
  const context = useContext(CountryFilterContext);
  if (!context) {
    throw new Error("useCountryFilter must be used within a CountryFilterProvider");
  }
  return context;
}
