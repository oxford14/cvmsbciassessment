'use client';

import React, { useState, useCallback, Fragment, useEffect } from 'react';
import { submitAssessment, type SubmitAssessmentInput } from '@/app/actions/assessment';
import { ChurchLocationSelect, type ChurchLocationValue } from '@/app/components/ChurchLocationSelect';
import { RegionSelect, type RegionValue } from '@/app/components/RegionSelect';
import { downloadAssessmentPdf } from '@/lib/pdf-assessment';

const emptyLocation: ChurchLocationValue = {
  regionCode: '',
  regionName: '',
  provinceCode: null,
  provinceName: null,
  municipalityCode: '',
  municipalityName: '',
  barangayCode: '',
  barangayName: '',
};

type ChurchRow = {
  id: number;
  name: string;
  pastorName: string;
  contactNumber: string;
  location: ChurchLocationValue;
  ga2023: boolean;
  ga2024: boolean;
  ga2025: boolean;
  remarks: string;
};

export function AssessmentForm() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [churchLocationErrorIds, setChurchLocationErrorIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState('');
  const [region, setRegion] = useState<RegionValue>({ regionCode: '', regionName: '' });
  const [showOtherPosition, setShowOtherPosition] = useState(false);
  const [churches, setChurches] = useState<ChurchRow[]>([
    { id: 1, name: '', pastorName: '', contactNumber: '', location: { ...emptyLocation }, ga2023: false, ga2024: false, ga2025: false, remarks: '' },
  ]);
  const [lastSubmittedData, setLastSubmittedData] = useState<SubmitAssessmentInput | null>(null);

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlert({ type, message });
    if (type === 'error') setTimeout(() => setAlert(null), 5000);
  }, []);

  const addChurch = () => {
    setChurches((prev) => [
      ...prev,
      { id: Date.now(), name: '', pastorName: '', contactNumber: '', location: { ...emptyLocation }, ga2023: false, ga2024: false, ga2025: false, remarks: '' },
    ]);
  };

  const handleUpperCase = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.value = target.value.toUpperCase();
    try {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      target.setSelectionRange(start, end);
    } catch {
      // email/number inputs don't support setSelectionRange
    }
  };

  const handleEmailInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    target.value = target.value.toLowerCase();
  };

  const removeChurch = (id: number) => {
    if (churches.length <= 1) {
      showAlert('You must have at least one church in the form.', 'error');
      return;
    }
    setChurches((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChurch = (id: number, field: keyof ChurchRow, value: string | boolean | ChurchLocationValue) => {
    let newValue = value;
    if (typeof value === 'string' && field !== 'contactNumber') {
      newValue = value.toUpperCase();
    }
    
    setChurches((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: newValue } : c))
    );
    if (field === 'location' && churchLocationErrorIds.has(id)) {
      const loc = value as ChurchLocationValue;
      if (loc?.municipalityCode && loc?.barangayCode) {
        setChurchLocationErrorIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    setFieldErrors({});
    setChurchLocationErrorIds(new Set());

    const form = e.currentTarget;
    const associationName = (form.querySelector('#associationName') as HTMLInputElement)?.value?.trim();
    // Region is now from state
    const regionName = region.regionName; 
    const contactPerson = (form.querySelector('#contactPerson') as HTMLInputElement)?.value?.trim();
    const phoneNumber = (form.querySelector('#phoneNumber') as HTMLInputElement)?.value?.trim();
    const email = ((form.querySelector('#email') as HTMLInputElement)?.value?.trim() || '').toLowerCase();
    const positionValue = position === 'Other'
      ? (form.querySelector('#otherPosition') as HTMLInputElement)?.value?.trim()
      : position;

    if (!associationName || !region.regionCode || !regionName) {
      showAlert('Association name and region are required.', 'error');
      setSubmitting(false);
      return;
    }
    if (!contactPerson || !positionValue || !phoneNumber) {
      showAlert('Contact person, position, and phone number are required.', 'error');
      setSubmitting(false);
      return;
    }

    if (phoneNumber.replace(/\D/g, '').length !== 11) {
      setFieldErrors({ phoneNumber: 'Must be exactly 11 digits — form cannot save until fixed.' });
      (form.querySelector('#phoneNumber') as HTMLInputElement)?.focus();
      (form.querySelector('#phoneNumber') as HTMLInputElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSubmitting(false);
      return;
    }

    const churchList = churches
      .filter((c) => c.name.trim())
      .map((c) => {
        if (!c.location.municipalityCode || !c.location.barangayCode) return null;
        return {
          name: c.name.trim(),
          pastorName: c.pastorName.trim(),
          contactNumber: c.contactNumber.replace(/\D/g, ''),
          regionCode: c.location.regionCode,
          regionName: c.location.regionName,
          provinceCode: c.location.provinceCode,
          provinceName: c.location.provinceName,
          municipalityCode: c.location.municipalityCode,
          municipalityName: c.location.municipalityName,
          barangayCode: c.location.barangayCode,
          barangayName: c.location.barangayName,
          ga2023: c.ga2023,
          ga2024: c.ga2024,
          ga2025: c.ga2025,
          remarks: c.remarks.trim(),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const incompleteLocationIds = churches
      .filter((c) => c.name.trim() && (!c.location.municipalityCode || !c.location.barangayCode))
      .map((c) => c.id);
    if (incompleteLocationIds.length > 0) {
      setChurchLocationErrorIds(new Set(incompleteLocationIds));
      const firstId = incompleteLocationIds[0];
      const el = document.getElementById(`church-row-${firstId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSubmitting(false);
      return;
    }

    if (churchList.length === 0) {
      showAlert('Please add at least one church.', 'error');
      setSubmitting(false);
      return;
    }

    const payload: SubmitAssessmentInput = {
      associationName,
      regionCode: region.regionCode,
      regionName,
      contactPerson,
      position: positionValue,
      phoneNumber,
      email,
      churches: churchList,
    };

    const result = await submitAssessment(payload);

    setSubmitting(false);
    if (result.ok) {
      setLastSubmittedData(payload);
      showAlert('Assessment form submitted successfully! Thank you.', 'success');
      form.reset();
      setPosition('');
      setRegion({ regionCode: '', regionName: '' });
      setShowOtherPosition(false);
      setChurches([{ id: Date.now(), name: '', pastorName: '', contactNumber: '', location: { ...emptyLocation }, ga2023: false, ga2024: false, ga2025: false, remarks: '' }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showAlert(result.error || 'Something went wrong. Please try again.', 'error');
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--border-color)',
    padding: '0.5rem',
    borderRadius: '4px',
  };

  useEffect(() => {
    if (alert?.type !== 'success') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAlert(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [alert?.type]);

  return (
    <>
      {/* Success: dialog; Error: inline banner */}
      {alert?.type === 'success' && (
        <div
          className="success-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-dialog-title"
          onClick={() => { setAlert(null); setLastSubmittedData(null); }}
        >
          <div className="success-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <p id="success-dialog-title" className="success-dialog-message">{alert.message}</p>
            <p className="success-dialog-download-prompt">Do you want to download a copy of the submitted data or churches?</p>
            <div className="success-dialog-actions">
              <button
                type="button"
                className="success-dialog-btn success-dialog-btn-primary"
                onClick={() => {
                  if (lastSubmittedData) downloadAssessmentPdf(lastSubmittedData);
                  setAlert(null);
                  setLastSubmittedData(null);
                }}
              >
                Download copy
              </button>
              <button type="button" className="success-dialog-btn" onClick={() => { setAlert(null); setLastSubmittedData(null); }}>
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}
      {alert?.type === 'error' && (
        <div className={`alert alert-error`} role="alert">
          {alert.message}
        </div>
      )}

      <form id="assessmentForm" onSubmit={handleSubmit}>
        <div className="section-title">Association Information</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="associationName">Name of Association<span className="required">*</span></label>
            <input type="text" id="associationName" required placeholder="Enter association name" style={inputStyle} onInput={handleUpperCase} />
          </div>
          <RegionSelect value={region} onChange={setRegion} required />
        </div>

        <div className="section-divider" />
        <div className="section-title">Contact Person</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactPerson">Association Contact Person<span className="required">*</span></label>
            <input type="text" id="contactPerson" required placeholder="Full Name" style={inputStyle} onInput={handleUpperCase} />
          </div>
          <div className="form-group">
            <label htmlFor="position">Position<span className="required">*</span></label>
            <select
              id="position"
              required
              value={position}
              onChange={(e) => {
                const v = e.target.value;
                setPosition(v);
                setShowOtherPosition(v === 'Other');
              }}
              style={inputStyle}
            >
              <option value="">Select Position</option>
              <option value="Secretary">Secretary</option>
              <option value="Moderator">Moderator</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        {showOtherPosition && (
          <div className="form-group">
            <label htmlFor="otherPosition">Please Specify Position<span className="required">*</span></label>
            <input type="text" id="otherPosition" placeholder="Enter position" required={showOtherPosition} style={inputStyle} onInput={handleUpperCase} />
          </div>
        )}
        <div className="form-row">
          <div className={`form-group ${fieldErrors.phoneNumber ? 'form-group-error' : ''}`}>
            <label htmlFor="phoneNumber">Phone Number<span className="required">*</span></label>
            <input 
              type="tel" 
              id="phoneNumber" 
              required 
              placeholder="09XX XXX XXXX" 
              maxLength={11}
              inputMode="numeric"
              style={fieldErrors.phoneNumber ? { ...inputStyle, borderColor: 'var(--error)', outline: '2px solid var(--error)' } : inputStyle}
              onInput={(e) => {
                const target = e.currentTarget;
                target.value = target.value.replace(/\D/g, '').slice(0, 11);
                if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              aria-invalid={!!fieldErrors.phoneNumber}
              aria-describedby={fieldErrors.phoneNumber ? 'phoneNumber-error' : undefined}
            />
            {fieldErrors.phoneNumber && (
              <span id="phoneNumber-error" className="field-error-message" role="alert">
                {fieldErrors.phoneNumber}
              </span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address<span className="optional">(optional)</span></label>
            <input type="email" id="email" placeholder="email@example.com" style={inputStyle} onInput={handleEmailInput} autoComplete="email" />
          </div>
        </div>

        <div className="section-divider" />
        <div className="section-title">Church Messenger Attendance</div>
        <div className="instruction-box">
          <strong>Instruction:</strong> Please place a check mark (✓) in the column if the church listed has sent
          official messenger(s) to the General Assembly in each of the past three (3) years. If the church has not
          sent any messengers during that period, leave it unchecked. For each church, enter details in the first row;
          on the second row, select <strong>City/Municipality</strong>, then <strong>Barangay</strong> (Province fills automatically).
        </div>

        {/* Desktop: table layout */}
        <div className="table-container desktop-church-table">
          <table className="church-table-two-row">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Name of Churches</th>
                <th style={{ width: '15%' }}>Pastor&apos;s Name</th>
                <th style={{ width: '10%' }}>Contact #</th>
                <th style={{ width: '8%', textAlign: 'center' }}>2023 GA</th>
                <th style={{ width: '8%', textAlign: 'center' }}>2024 GA</th>
                <th style={{ width: '8%', textAlign: 'center' }}>2025 GA</th>
                <th style={{ width: '18%' }}>Remarks</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {churches.map((church, index) => (
                <Fragment key={church.id}>
                  <tr id={`church-row-${church.id}`} className={`church-main-row ${index % 2 === 0 ? 'bg-row-even' : 'bg-row-odd'} ${churchLocationErrorIds.has(church.id) ? 'church-row-location-error' : ''}`}>
                    <td>
                      <input
                        type="text"
                        placeholder="Enter church name"
                        required
                        value={church.name}
                        onChange={(e) => updateChurch(church.id, 'name', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Pastor's name"
                        value={church.pastorName}
                        onChange={(e) => updateChurch(church.id, 'pastorName', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        placeholder="09XX XXX XXXX"
                        maxLength={11}
                        inputMode="numeric"
                        value={church.contactNumber}
                        onChange={(e) => updateChurch(church.id, 'contactNumber', e.target.value.replace(/\D/g, '').slice(0, 11))}
                        style={inputStyle}
                      />
                    </td>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={church.ga2023}
                        onChange={(e) => updateChurch(church.id, 'ga2023', e.target.checked)}
                      />
                    </td>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={church.ga2024}
                        onChange={(e) => updateChurch(church.id, 'ga2024', e.target.checked)}
                      />
                    </td>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={church.ga2025}
                        onChange={(e) => updateChurch(church.id, 'ga2025', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Optional remarks"
                        value={church.remarks}
                        onChange={(e) => updateChurch(church.id, 'remarks', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td rowSpan={2} style={{ verticalAlign: 'middle' }}>
                      <button type="button" className="remove-btn" onClick={() => removeChurch(church.id)}>
                        ×
                      </button>
                    </td>
                  </tr>
                  <tr className={`location-data-row ${index % 2 === 0 ? 'bg-row-even' : 'bg-row-odd'} ${churchLocationErrorIds.has(church.id) ? 'church-row-location-error' : ''}`}>
                    <td colSpan={7}>
                      <div className="location-row-container">
                        <span className="location-row-label">Location:</span>
                        <div className="location-select-wrapper">
                          <ChurchLocationSelect
                            value={church.location}
                            onChange={(v) => updateChurch(church.id, 'location', v)}
                            compact
                            twoRow
                          />
                          {churchLocationErrorIds.has(church.id) && (
                            <div className="field-error-tooltip" role="alert">
                              <span className="field-error-tooltip-icon">!</span>
                              <span>Please select City/Municipality and Barangay.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card layout */}
        <div className="mobile-church-cards">
          {churches.map((church, index) => (
            <div key={church.id} id={`church-row-${church.id}`} className={`mobile-church-card ${churchLocationErrorIds.has(church.id) ? 'church-row-location-error' : ''}`}>
              <div className="mobile-card-header">
                <span className="mobile-card-number">Church #{index + 1}</span>
                <button
                  type="button"
                  className="mobile-card-remove"
                  onClick={() => removeChurch(church.id)}
                >
                  Remove
                </button>
              </div>
              <div className="mobile-card-body">
                <div className="mobile-field">
                  <span className="mobile-field-label">Church Name</span>
                  <input
                    type="text"
                    placeholder="Enter church name"
                    required
                    value={church.name}
                    onChange={(e) => updateChurch(church.id, 'name', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div className="mobile-field">
                  <span className="mobile-field-label">Pastor&apos;s Name</span>
                  <input
                    type="text"
                    placeholder="Pastor's name"
                    value={church.pastorName}
                    onChange={(e) => updateChurch(church.id, 'pastorName', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div className="mobile-field">
                  <span className="mobile-field-label">Contact #</span>
                  <input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    maxLength={11}
                    inputMode="numeric"
                    value={church.contactNumber}
                    onChange={(e) => updateChurch(church.id, 'contactNumber', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    style={inputStyle}
                  />
                </div>
                <div className="mobile-ga-section">
                  <div className="mobile-ga-title">GA Attendance</div>
                  <div className="mobile-ga-chips">
                    <label className={`mobile-ga-chip${church.ga2023 ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={church.ga2023}
                        onChange={(e) => updateChurch(church.id, 'ga2023', e.target.checked)}
                      />
                      2023
                    </label>
                    <label className={`mobile-ga-chip${church.ga2024 ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={church.ga2024}
                        onChange={(e) => updateChurch(church.id, 'ga2024', e.target.checked)}
                      />
                      2024
                    </label>
                    <label className={`mobile-ga-chip${church.ga2025 ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={church.ga2025}
                        onChange={(e) => updateChurch(church.id, 'ga2025', e.target.checked)}
                      />
                      2025
                    </label>
                  </div>
                </div>
                <div className="mobile-location-section">
                  <div className="mobile-location-title">Location</div>
                  <div className="location-select-wrapper">
                    <ChurchLocationSelect
                      value={church.location}
                      onChange={(v) => updateChurch(church.id, 'location', v)}
                      compact
                      twoRow
                    />
                    {churchLocationErrorIds.has(church.id) && (
                      <div className="field-error-tooltip" role="alert">
                        <span className="field-error-tooltip-icon">!</span>
                        <span>Please select City/Municipality and Barangay.</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mobile-field mobile-remarks-field">
                  <span className="mobile-field-label">Remarks</span>
                  <input
                    type="text"
                    placeholder="Optional remarks"
                    value={church.remarks}
                    onChange={(e) => updateChurch(church.id, 'remarks', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="add-church-row">
          <button type="button" className="add-church-btn" onClick={addChurch}>
            + Add Church
          </button>
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Assessment Form'}
        </button>
      </form>
    </>
  );
}
