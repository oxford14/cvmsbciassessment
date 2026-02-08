'use client';

import { useState, useEffect, useCallback } from 'react';
import Select, { type SingleValue } from 'react-select';

const PSGC_BASE = 'https://psgc.cloud/api';

type Option = { value: string; label: string; code: string };

type PSGCItem = { code: string; name: string };

export type AddressValue = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  barangayCode: string;
  barangayName: string;
};

type AddressSelectProps = {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  required?: boolean;
};

function toOption(item: PSGCItem): Option {
  return { value: item.code, label: item.name.trim(), code: item.code };
}

export function AddressSelect({ value, onChange, required }: AddressSelectProps) {
  const [regions, setRegions] = useState<Option[]>([]);
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [municipalities, setMunicipalities] = useState<Option[]>([]);
  const [barangays, setBarangays] = useState<Option[]>([]);

  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  useEffect(() => {
    fetch(`${PSGC_BASE}/regions`)
      .then((r) => r.json())
      .then((data: PSGCItem[]) => setRegions(data.map(toOption)))
      .catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false));
  }, []);

  const fetchProvinces = useCallback(async (regionCode: string) => {
    if (!regionCode) {
      setProvinces([]);
      return;
    }
    setLoadingProvinces(true);
    try {
      const r = await fetch(`${PSGC_BASE}/regions/${regionCode}/provinces`);
      const data: PSGCItem[] = await r.json();
      setProvinces(data.map(toOption));
    } catch {
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const fetchMunicipalities = useCallback(async (provinceCode: string) => {
    if (!provinceCode) {
      setMunicipalities([]);
      return;
    }
    setLoadingMunicipalities(true);
    try {
      const r = await fetch(`${PSGC_BASE}/provinces/${provinceCode}/cities-municipalities`);
      const data: PSGCItem[] = await r.json();
      setMunicipalities(data.map(toOption));
    } catch {
      setMunicipalities([]);
    } finally {
      setLoadingMunicipalities(false);
    }
  }, []);

  const fetchBarangays = useCallback(async (municipalityCode: string) => {
    if (!municipalityCode) {
      setBarangays([]);
      return;
    }
    setLoadingBarangays(true);
    try {
      const r = await fetch(`${PSGC_BASE}/cities-municipalities/${municipalityCode}/barangays`);
      const data: PSGCItem[] = await r.json();
      setBarangays(data.map(toOption));
    } catch {
      setBarangays([]);
    } finally {
      setLoadingBarangays(false);
    }
  }, []);

  const handleRegionChange = (opt: SingleValue<Option>) => {
    const code = opt?.code ?? '';
    const name = opt?.label ?? '';
    setProvinces([]);
    setMunicipalities([]);
    setBarangays([]);
    onChange({
      ...value,
      regionCode: code,
      regionName: name,
      provinceCode: '',
      provinceName: '',
      municipalityCode: '',
      municipalityName: '',
      barangayCode: '',
      barangayName: '',
    });
    fetchProvinces(code);
  };

  const handleProvinceChange = (opt: SingleValue<Option>) => {
    const code = opt?.code ?? '';
    const name = opt?.label ?? '';
    setMunicipalities([]);
    setBarangays([]);
    onChange({
      ...value,
      provinceCode: code,
      provinceName: name,
      municipalityCode: '',
      municipalityName: '',
      barangayCode: '',
      barangayName: '',
    });
    fetchMunicipalities(code);
  };

  const handleMunicipalityChange = (opt: SingleValue<Option>) => {
    const code = opt?.code ?? '';
    const name = opt?.label ?? '';
    setBarangays([]);
    onChange({
      ...value,
      municipalityCode: code,
      municipalityName: name,
      barangayCode: '',
      barangayName: '',
    });
    fetchBarangays(code);
  };

  const handleBarangayChange = (opt: SingleValue<Option>) => {
    const code = opt?.code ?? '';
    const name = opt?.label ?? '';
    onChange({
      ...value,
      barangayCode: code,
      barangayName: name,
    });
  };

  const selectStyles = {
    control: (base: object) => ({
      ...base,
      minHeight: '2.5rem',
      border: '1px solid var(--border-color, #ddd)',
      borderRadius: '4px',
    }),
  };

  return (
    <div className="address-select-grid">
      <div className="form-group">
        <label>Region<span className="required">*</span></label>
        <Select<Option>
          options={regions}
          value={value.regionCode ? regions.find((r) => r.code === value.regionCode) ?? { value: value.regionCode, label: value.regionName, code: value.regionCode } : null}
          onChange={handleRegionChange}
          isSearchable
          isLoading={loadingRegions}
          placeholder="Search region..."
          noOptionsMessage={() => (loadingRegions ? 'Loading...' : 'No region found')}
          styles={selectStyles}
          isClearable={false}
          required={required}
        />
      </div>
      <div className="form-group">
        <label>Province<span className="required">*</span></label>
        <Select<Option>
          options={provinces}
          value={value.provinceCode ? provinces.find((p) => p.code === value.provinceCode) ?? { value: value.provinceCode, label: value.provinceName, code: value.provinceCode } : null}
          onChange={handleProvinceChange}
          isSearchable
          isLoading={loadingProvinces}
          placeholder="Search province..."
          noOptionsMessage={() => (loadingProvinces ? 'Loading...' : value.regionCode ? 'No province found' : 'Select region first')}
          isDisabled={!value.regionCode}
          styles={selectStyles}
          isClearable={false}
          required={required}
        />
      </div>
      <div className="form-group">
        <label>City / Municipality<span className="required">*</span></label>
        <Select<Option>
          options={municipalities}
          value={value.municipalityCode ? municipalities.find((m) => m.code === value.municipalityCode) ?? { value: value.municipalityCode, label: value.municipalityName, code: value.municipalityCode } : null}
          onChange={handleMunicipalityChange}
          isSearchable
          isLoading={loadingMunicipalities}
          placeholder="Search city or municipality..."
          noOptionsMessage={() => (loadingMunicipalities ? 'Loading...' : value.provinceCode ? 'No city/municipality found' : 'Select province first')}
          isDisabled={!value.provinceCode}
          styles={selectStyles}
          isClearable={false}
          required={required}
        />
      </div>
      <div className="form-group">
        <label>Barangay<span className="required">*</span></label>
        <Select<Option>
          options={barangays}
          value={value.barangayCode ? barangays.find((b) => b.code === value.barangayCode) ?? { value: value.barangayCode, label: value.barangayName, code: value.barangayCode } : null}
          onChange={handleBarangayChange}
          isSearchable
          isLoading={loadingBarangays}
          placeholder="Search barangay..."
          noOptionsMessage={() => (loadingBarangays ? 'Loading...' : value.municipalityCode ? 'No barangay found' : 'Select city/municipality first')}
          isDisabled={!value.municipalityCode}
          styles={selectStyles}
          isClearable={false}
          required={required}
        />
      </div>
    </div>
  );
}
