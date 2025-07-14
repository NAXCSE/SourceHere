import React, { useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';

interface Country {
  code: string;
  name: string;
}

interface CountrySelectorProps {
  countries: Country[];
  selectedCountries: string[];
  onChange: (selectedCountries: string[]) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCountries,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCountryToggle = (countryCode: string) => {
    const newSelection = selectedCountries.includes(countryCode)
      ? selectedCountries.filter(code => code !== countryCode)
      : [...selectedCountries, countryCode];
    
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedCountries.length === countries.length) {
      onChange([]);
    } else {
      onChange(countries.map(c => c.code));
    }
  };

  const selectedCountryNames = countries
    .filter(c => selectedCountries.includes(c.code))
    .map(c => c.name);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-48"
      >
        <Globe className="h-4 w-4 text-gray-400" />
        <span className="flex-1 text-left truncate">
          {selectedCountries.length === 0
            ? 'Select countries...'
            : selectedCountries.length === 1
            ? selectedCountryNames[0]
            : `${selectedCountries.length} countries selected`
          }
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSelectAll}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
            >
              {selectedCountries.length === countries.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="p-1">
            {countries.map((country) => {
              const isSelected = selectedCountries.includes(country.code);
              
              return (
                <button
                  key={country.code}
                  onClick={() => handleCountryToggle(country.code)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-8">
                    {country.code}
                  </span>
                  <span className="flex-1 text-left">{country.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};