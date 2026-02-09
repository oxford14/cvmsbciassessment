'use client';

import Select, { type SingleValue } from 'react-select';

type Option = { value: string; label: string; code: string };

export type RegionValue = {
  regionCode: string;
  regionName: string;
};

type RegionSelectProps = {
  value: RegionValue;
  onChange: (v: RegionValue) => void;
  required?: boolean;
};

// Static list: I through XII (Roman numerals only, no other words)
const ROMAN_REGIONS: Option[] = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
].map((r) => ({ value: r, label: r, code: r }));

export function RegionSelect({ value, onChange, required }: RegionSelectProps) {

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
      background: 'transparent',
    }),
  };

  return (
    <div className="form-group">
      <label>Region<span className="required">*</span></label>
      <Select<Option>
        options={ROMAN_REGIONS}
        value={
          value.regionCode
            ? ROMAN_REGIONS.find((r) => r.code === value.regionCode) ?? {
                value: value.regionCode,
                label: value.regionName,
                code: value.regionCode,
              }
            : null
        }
        onChange={handleChange}
        isSearchable
        placeholder="Search region..."
        noOptionsMessage={() => 'No region found'}
        styles={selectStyles}
        isClearable={false}
        required={required}
      />
    </div>
  );
}
