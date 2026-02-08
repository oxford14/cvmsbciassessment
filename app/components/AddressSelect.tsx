'use client';

import { useState, useEffect, useMemo } from 'react';
import Select, { type SingleValue } from 'react-select';

const PSGC_BASE = 'https://psgc.cloud/api';

type CityOption = {
  value: string;
  label: string;
  code: string;
  type: string;
  provinceCode: string | null;
  provinceName: string | null;
  regionCode: string;
  regionName: string;
};

type PSGCItem = { code: string; name: string; type?: string };

export type AddressValue = {
  regionCode: string;
  regionName: string;
  provinceCode: string | null;
  provinceName: string | null;
  municipalityCode: string;
  municipalityName: string;
};

type AddressSelectProps = {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  required?: boolean;
};

// Find province for a city/municipality by code prefix (component cities belong to provinces)
function findProvince(cityCode: string, provinces: PSGCItem[]): PSGCItem | null {
  for (const p of provinces) {
    const prefix = p.code.substring(0, 5);
    if (cityCode.startsWith(prefix)) return p;
  }
  return null;
}

export function AddressSelect({ value, onChange, required }: AddressSelectProps) {
  const [options, setOptions] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllCities() {
      setLoading(true);
      try {
        const regionsRes = await fetch(`${PSGC_BASE}/regions`);
        const regions: PSGCItem[] = await regionsRes.json();
        const allProvincesRes = await fetch(`${PSGC_BASE}/provinces`);
        const allProvinces: PSGCItem[] = await allProvincesRes.json();

        const cityOptions: CityOption[] = [];

        for (const region of regions) {
          const [cmRes] = await Promise.all([
            fetch(`${PSGC_BASE}/regions/${region.code}/cities-municipalities`),
          ]);
          const citiesMunis: (PSGCItem & { type?: string })[] = await cmRes.json();

          // Provinces in this region (match by code prefix)
          const regionProvinces = allProvinces.filter((p) =>
            p.code.startsWith(region.code.substring(0, 2))
          );

          for (const cm of citiesMunis) {
            const province = findProvince(cm.code, regionProvinces);
            cityOptions.push({
              value: cm.code,
              label: cm.name.trim(),
              code: cm.code,
              type: cm.type || 'Mun',
              provinceCode: province?.code ?? null,
              provinceName: province ? province.name : null,
              regionCode: region.code,
              regionName: region.name,
            });
          }
        }

        setOptions(cityOptions);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }
    loadAllCities();
  }, []);

  const handleChange = (opt: SingleValue<CityOption>) => {
    if (!opt) return;
    onChange({
      regionCode: opt.regionCode,
      regionName: opt.regionName,
      provinceCode: opt.provinceCode,
      provinceName: opt.provinceName,
      municipalityCode: opt.code,
      municipalityName: opt.label,
    });
  };

  const selectedOption = useMemo(() => {
    if (!value.municipalityCode) return null;
    const found = options.find((o) => o.code === value.municipalityCode);
    if (found) return found;
    return {
      value: value.municipalityCode,
      label: value.municipalityName,
      code: value.municipalityCode,
      type: '',
      provinceCode: value.provinceCode,
      provinceName: value.provinceName,
      regionCode: value.regionCode,
      regionName: value.regionName,
    } as CityOption;
  }, [value, options]);

  const selectStyles = {
    control: (base: object) => ({
      ...base,
      minHeight: '2.5rem',
      border: '1px solid var(--border-color, #ddd)',
      borderRadius: '4px',
    }),
  };

  return (
    <div className="address-select-single">
      <div className="form-group">
        <label>City or Municipality<span className="required">*</span></label>
        <Select<CityOption>
          options={options}
          value={selectedOption}
          onChange={handleChange}
          isSearchable
          isLoading={loading}
          placeholder="Search city or municipality..."
          noOptionsMessage={() =>
            loading ? 'Loading...' : 'Type to search for a city or municipality'
          }
          styles={selectStyles}
          isClearable={false}
          required={required}
          filterOption={(option, input) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          }
        />
        {selectedOption && (
          <div className="address-display">
            {selectedOption.provinceName ? (
              <>
                {selectedOption.label} •{' '}
                <span className="province-badge">{selectedOption.provinceName}</span>
              </>
            ) : (
              <>
                {selectedOption.label} •{' '}
                <span className="independent-badge">Independent City</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
