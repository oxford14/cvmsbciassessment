'use client';

import { useState, useEffect } from 'react';
import Select, { type SingleValue } from 'react-select';

// Use same-origin proxy to avoid CORS when loading from psgc.cloud
const PSGC_BASE = typeof window !== 'undefined' ? '/api/psgc' : 'https://psgc.cloud/api';

type Option = { value: string; label: string; code: string };

type PSGCItem = { code: string; name: string };

export type RegionValue = {
  regionCode: string;
  regionName: string;
};

type RegionSelectProps = {
  value: RegionValue;
  onChange: (v: RegionValue) => void;
  required?: boolean;
};

function toOption(item: PSGCItem): Option {
  return { value: item.code, label: item.name.trim(), code: item.code };
}

export function RegionSelect({ value, onChange, required }: RegionSelectProps) {
  const [regions, setRegions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PSGC_BASE}/regions`)
      .then((r) => r.json())
      .then((json) => {
        const data: PSGCItem[] = Array.isArray(json) ? json : json.value ?? [];
        setRegions(data.map(toOption));
      })
      .catch(() => setRegions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (opt: SingleValue<Option>) => {
    const code = opt?.code ?? '';
    const name = opt?.label ?? '';
    onChange({ regionCode: code, regionName: name });
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '2.5rem',
      border: state.isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color, #ddd)',
      borderRadius: '4px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(44, 95, 79, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--primary)',
      }
    }),
    input: (base: any) => ({
      ...base,
      color: 'inherit',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'inherit',
      background: 'transparent', // Ensure no background on the text itself
    }),
  };

  return (
    <div className="form-group">
      <label>Region<span className="required">*</span></label>
      <Select<Option>
        options={regions}
        value={
          value.regionCode
            ? regions.find((r) => r.code === value.regionCode) ?? {
                value: value.regionCode,
                label: value.regionName,
                code: value.regionCode,
              }
            : null
        }
        onChange={handleChange}
        isSearchable
        isLoading={loading}
        placeholder="Search region..."
        noOptionsMessage={() => (loading ? 'Loading...' : 'No region found')}
        styles={selectStyles}
        isClearable={false}
        required={required}
      />
    </div>
  );
}
