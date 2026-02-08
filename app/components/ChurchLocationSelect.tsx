'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Select, { type SingleValue } from 'react-select';

const MOBILE_BREAKPOINT = 768;

const menuPortalTarget = typeof document !== 'undefined' ? document.body : undefined;

// Use same-origin proxy to avoid CORS when loading from psgc.cloud
const PSGC_BASE = typeof window !== 'undefined' ? '/api/psgc' : 'https://psgc.cloud/api';

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

type BarangayOption = { value: string; label: string; code: string };

type PSGCItem = { code: string; name: string; type?: string };

export type ChurchLocationValue = {
  regionCode: string;
  regionName: string;
  provinceCode: string | null;
  provinceName: string | null;
  municipalityCode: string;
  municipalityName: string;
  barangayCode: string;
  barangayName: string;
};

type ChurchLocationSelectProps = {
  value: ChurchLocationValue;
  onChange: (v: ChurchLocationValue) => void;
  compact?: boolean;
  /** When true, show city + barangay + province on one row (barangay required when city selected) */
  twoRow?: boolean;
};

// Find province for a city/municipality by code prefix
function findProvince(cityCode: string, provinces: PSGCItem[]): PSGCItem | null {
  for (const p of provinces) {
    const prefix = p.code.substring(0, 5);
    if (cityCode.startsWith(prefix)) return p;
  }
  return null;
}

export function ChurchLocationSelect({ value, onChange, compact, twoRow }: ChurchLocationSelectProps) {
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(true);
  const [barangayOptions, setBarangayOptions] = useState<BarangayOption[]>([]);
  const [barangayLoading, setBarangayLoading] = useState(false);

  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [barangayMenuOpen, setBarangayMenuOpen] = useState(false);
  const cityBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barangayBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityJustSelectedRef = useRef(false);
  const barangayJustSelectedRef = useRef(false);

  const isMobile = useCallback(() =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches,
  []);

  const handleCityMenuClose = useCallback(() => {
    if (cityJustSelectedRef.current) {
      cityJustSelectedRef.current = false;
      setCityMenuOpen(false);
      return;
    }
    if (isMobile()) {
      if (cityBlurTimerRef.current) clearTimeout(cityBlurTimerRef.current);
      cityBlurTimerRef.current = setTimeout(() => setCityMenuOpen(false), 400);
    } else {
      setCityMenuOpen(false);
    }
  }, [isMobile]);

  const handleBarangayMenuClose = useCallback(() => {
    if (barangayJustSelectedRef.current) {
      barangayJustSelectedRef.current = false;
      setBarangayMenuOpen(false);
      return;
    }
    if (isMobile()) {
      if (barangayBlurTimerRef.current) clearTimeout(barangayBlurTimerRef.current);
      barangayBlurTimerRef.current = setTimeout(() => setBarangayMenuOpen(false), 400);
    } else {
      setBarangayMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => () => {
    if (cityBlurTimerRef.current) clearTimeout(cityBlurTimerRef.current);
    if (barangayBlurTimerRef.current) clearTimeout(barangayBlurTimerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAllCities() {
      setCityLoading(true);
      try {
        const [regionsRes, allProvincesRes] = await Promise.all([
          fetch(`${PSGC_BASE}/regions`),
          fetch(`${PSGC_BASE}/provinces`),
        ]);
        if (!regionsRes.ok || !allProvincesRes.ok) throw new Error('Failed to load regions or provinces');
        const regionsJson = await regionsRes.json();
        const provincesJson = await allProvincesRes.json();
        const regions: PSGCItem[] = Array.isArray(regionsJson) ? regionsJson : regionsJson?.value ?? [];
        const allProvinces: PSGCItem[] = Array.isArray(provincesJson) ? provincesJson : provincesJson?.value ?? [];

        if (regions.length === 0) {
          setCityOptions([]);
          return;
        }

        const cityPromises = regions.map(async (region) => {
          const code = region.code;
          if (!code) return [];
          const cmRes = await fetch(`${PSGC_BASE}/regions/${code}/cities-municipalities`);
          if (!cmRes.ok) return [];
          const cmJson = await cmRes.json();
          const citiesMunis: (PSGCItem & { type?: string })[] = Array.isArray(cmJson) ? cmJson : cmJson?.value ?? [];
          const regionProvinces = allProvinces.filter((p) => p.code.startsWith(code.substring(0, 2)));

          return citiesMunis.map((cm) => {
            const province = findProvince(cm.code, regionProvinces);
            return {
              value: cm.code,
              label: cm.name.trim(),
              code: cm.code,
              type: cm.type || 'Mun',
              provinceCode: province?.code ?? null,
              provinceName: province ? province.name : null,
              regionCode: region.code,
              regionName: region.name,
            };
          });
        });

        const results = await Promise.all(cityPromises);
        if (cancelled) return;
        const options: CityOption[] = results.flat();
        setCityOptions(options);
      } catch (e) {
        if (!cancelled) setCityOptions([]);
        console.error('ChurchLocationSelect: failed to load cities', e);
      } finally {
        if (!cancelled) setCityLoading(false);
      }
    }
    loadAllCities();
    return () => { cancelled = true; };
  }, []);

  // Load barangays when municipality is selected
  useEffect(() => {
    if (!value.municipalityCode) {
      setBarangayOptions([]);
      return;
    }
    let cancelled = false;
    setBarangayLoading(true);
    setBarangayOptions([]);

    fetch(`${PSGC_BASE}/cities-municipalities/${value.municipalityCode}/barangays`)
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        const list: PSGCItem[] = Array.isArray(json) ? json : json.value ?? [];
        if (cancelled) return;
        setBarangayOptions(
          (list || []).map((b) => ({
            value: b.code,
            label: b.name?.trim() || b.code,
            code: b.code,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setBarangayOptions([]);
      })
      .finally(() => {
        if (!cancelled) setBarangayLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [value.municipalityCode]);

  const handleCityChange = (opt: SingleValue<CityOption>) => {
    if (!opt) return;
    cityJustSelectedRef.current = true;
    onChange({
      ...value,
      regionCode: opt.regionCode,
      regionName: opt.regionName,
      provinceCode: opt.provinceCode,
      provinceName: opt.provinceName?.toUpperCase() || null,
      municipalityCode: opt.code,
      municipalityName: opt.label.toUpperCase(),
      barangayCode: '',
      barangayName: '',
    });
  };

  const handleBarangayChange = (opt: SingleValue<BarangayOption>) => {
    if (!opt) {
      onChange({ ...value, barangayCode: '', barangayName: '' });
      return;
    }
    barangayJustSelectedRef.current = true;
    onChange({ ...value, barangayCode: opt.code, barangayName: opt.label.toUpperCase() });
  };

  const selectedCityOption = useMemo(() => {
    if (!value.municipalityCode) return null;
    const found = cityOptions.find((o) => o.code === value.municipalityCode);
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
  }, [value, cityOptions]);

  const selectedBarangayOption = useMemo((): BarangayOption | null => {
    if (!value.barangayCode) return null;
    const found = barangayOptions.find((o) => o.code === value.barangayCode);
    if (found) return found;
    return { value: value.barangayCode, label: value.barangayName || value.barangayCode, code: value.barangayCode };
  }, [value.barangayCode, value.barangayName, barangayOptions]);

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: compact ? '2rem' : '2.5rem',
      border: state.isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color, #ddd)',
      borderRadius: '4px',
      fontSize: compact ? '0.85rem' : undefined,
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

  const provinceDisplay = value.provinceName || (value.municipalityCode ? 'Independent City' : '—');

  if (twoRow) {
    return (
      <div className="church-location-two-row">
        <div className="church-location-row">
          <Select<CityOption>
            options={cityOptions}
            value={selectedCityOption}
            onChange={handleCityChange}
            isSearchable
            isLoading={cityLoading}
            placeholder="Search city or municipality..."
            noOptionsMessage={() =>
              cityLoading ? 'Loading...' : 'Type to search for a city or municipality'
            }
            styles={selectStyles}
            isClearable={false}
            classNamePrefix="church-loc"
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
            menuPlacement="auto"
            maxMenuHeight={240}
            menuIsOpen={cityMenuOpen}
            onMenuOpen={() => {
              if (cityBlurTimerRef.current) {
                clearTimeout(cityBlurTimerRef.current);
                cityBlurTimerRef.current = null;
              }
              setCityMenuOpen(true);
            }}
            onMenuClose={handleCityMenuClose}
            filterOption={(option, inputValue) => {
              const label = (option.data?.label ?? option.label ?? '') + '';
              const q = (inputValue ?? '').toLowerCase();
              return !q || label.toLowerCase().includes(q);
            }}
          />
          <Select<BarangayOption>
            options={barangayOptions}
            value={selectedBarangayOption}
            onChange={handleBarangayChange}
            isSearchable
            isLoading={barangayLoading}
            isDisabled={!value.municipalityCode}
            placeholder={value.municipalityCode ? 'Select barangay...' : 'Select city first'}
            noOptionsMessage={() =>
              barangayLoading ? 'Loading...' : value.municipalityCode ? 'Select barangay' : 'Select city first'
            }
            styles={selectStyles}
            isClearable
            classNamePrefix="church-loc"
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
            menuPlacement="auto"
            maxMenuHeight={240}
            menuIsOpen={barangayMenuOpen}
            onMenuOpen={() => {
              if (barangayBlurTimerRef.current) {
                clearTimeout(barangayBlurTimerRef.current);
                barangayBlurTimerRef.current = null;
              }
              setBarangayMenuOpen(true);
            }}
            onMenuClose={handleBarangayMenuClose}
            filterOption={(option, inputValue) => {
              const label = (option.data?.label ?? option.label ?? '') + '';
              const q = (inputValue ?? '').toLowerCase();
              return !q || label.toLowerCase().includes(q);
            }}
          />
          <span className="location-province-auto" title="Province (auto)">
            {provinceDisplay}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'church-location-compact' : 'church-location-select'}>
      <Select<CityOption>
        options={cityOptions}
        value={selectedCityOption}
        onChange={handleCityChange}
        isSearchable
        isLoading={cityLoading}
        placeholder="Search city or municipality..."
        noOptionsMessage={() =>
          cityLoading ? 'Loading...' : 'Type to search for a city or municipality'
        }
        styles={selectStyles}
        isClearable={false}
        classNamePrefix="church-loc"
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        menuPlacement="auto"
        maxMenuHeight={240}
        menuIsOpen={cityMenuOpen}
        onMenuOpen={() => {
          if (cityBlurTimerRef.current) {
            clearTimeout(cityBlurTimerRef.current);
            cityBlurTimerRef.current = null;
          }
          setCityMenuOpen(true);
        }}
        onMenuClose={handleCityMenuClose}
        filterOption={(option, inputValue) => {
              const label = (option.data?.label ?? option.label ?? '') + '';
              const q = (inputValue ?? '').toLowerCase();
              return !q || label.toLowerCase().includes(q);
            }}
          />
          {selectedCityOption && compact && (
        <span className="location-badge">
          {selectedCityOption.provinceName || 'Independent City'}
        </span>
      )}
    </div>
  );
}
