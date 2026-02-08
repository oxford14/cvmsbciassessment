'use client';

import { useState, useCallback } from 'react';
import { submitAssessment } from '@/app/actions/assessment';
import { AddressSelect, type AddressValue } from '@/app/components/AddressSelect';

type ChurchRow = {
  id: number;
  name: string;
  ga2023: boolean;
  ga2024: boolean;
  ga2025: boolean;
  remarks: string;
};

export function AssessmentForm() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState('');
  const [showOtherPosition, setShowOtherPosition] = useState(false);
  const [churches, setChurches] = useState<ChurchRow[]>([
    { id: 1, name: '', ga2023: false, ga2024: false, ga2025: false, remarks: '' },
  ]);
  const [address, setAddress] = useState<AddressValue>({
    regionCode: '',
    regionName: '',
    provinceCode: '',
    provinceName: '',
    municipalityCode: '',
    municipalityName: '',
    barangayCode: '',
    barangayName: '',
  });

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  const addChurch = () => {
    setChurches((prev) => [
      ...prev,
      { id: Date.now(), name: '', ga2023: false, ga2024: false, ga2025: false, remarks: '' },
    ]);
  };

  const removeChurch = (id: number) => {
    if (churches.length <= 1) {
      showAlert('You must have at least one church in the form.', 'error');
      return;
    }
    setChurches((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChurch = (id: number, field: keyof ChurchRow, value: string | boolean) => {
    setChurches((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    const form = e.currentTarget;
    const associationName = (form.querySelector('#associationName') as HTMLInputElement)?.value?.trim();
    const contactPerson = (form.querySelector('#contactPerson') as HTMLInputElement)?.value?.trim();
    const phoneNumber = (form.querySelector('#phoneNumber') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('#email') as HTMLInputElement)?.value?.trim() || '';
    const positionValue = position === 'Other'
      ? (form.querySelector('#otherPosition') as HTMLInputElement)?.value?.trim()
      : position;

    if (!address.regionCode || !address.provinceCode || !address.municipalityCode || !address.barangayCode) {
      showAlert('Please select Region, Province, City/Municipality, and Barangay.', 'error');
      setSubmitting(false);
      return;
    }
    if (!positionValue) {
      showAlert('Please select or specify your position.', 'error');
      setSubmitting(false);
      return;
    }

    const churchList = churches
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name,
        ga2023: c.ga2023,
        ga2024: c.ga2024,
        ga2025: c.ga2025,
        remarks: c.remarks,
      }));

    const result = await submitAssessment({
      associationName: associationName || '',
      regionCode: address.regionCode,
      regionName: address.regionName,
      provinceCode: address.provinceCode,
      provinceName: address.provinceName,
      municipalityCode: address.municipalityCode,
      municipalityName: address.municipalityName,
      barangayCode: address.barangayCode,
      barangayName: address.barangayName,
      contactPerson: contactPerson || '',
      position: positionValue,
      phoneNumber: phoneNumber || '',
      email,
      churches: churchList,
    });

    setSubmitting(false);
    if (result.ok) {
      showAlert('Assessment form submitted successfully! Thank you.', 'success');
      form.reset();
      setPosition('');
      setShowOtherPosition(false);
      setAddress({ regionCode: '', regionName: '', provinceCode: '', provinceName: '', municipalityCode: '', municipalityName: '', barangayCode: '', barangayName: '' });
      setChurches([{ id: Date.now(), name: '', ga2023: false, ga2024: false, ga2025: false, remarks: '' }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showAlert(result.error || 'Something went wrong. Please try again.', 'error');
    }
  }

  return (
    <>
      {alert && (
        <div className={`alert alert-${alert.type}`} role="alert">
          {alert.message}
        </div>
      )}

      <form id="assessmentForm" onSubmit={handleSubmit}>
        <div className="section-title">Association Information</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="associationName">Name of Association<span className="required">*</span></label>
            <input type="text" id="associationName" required />
          </div>
        </div>
        <AddressSelect value={address} onChange={setAddress} required />

        <div className="section-divider" />
        <div className="section-title">Contact Person</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactPerson">Association Contact Person<span className="required">*</span></label>
            <input type="text" id="contactPerson" required placeholder="Full Name" />
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
            <input type="text" id="otherPosition" placeholder="Enter position" required={showOtherPosition} />
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number<span className="required">*</span></label>
            <input type="tel" id="phoneNumber" required placeholder="+63 XXX XXX XXXX" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address<span className="optional">(optional)</span></label>
            <input type="email" id="email" placeholder="email@example.com" />
          </div>
        </div>

        <div className="section-divider" />
        <div className="section-title">Church Messenger Attendance</div>
        <div className="instruction-box">
          <strong>Instruction:</strong> Please place a check mark (✓) in the column if the church listed has sent
          official messenger(s) to the General Assembly in each of the past three (3) years. If the church has not
          sent any messengers during that period, leave it unchecked.
        </div>

        <button type="button" className="add-church-btn" onClick={addChurch}>
          + Add Church
        </button>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Name of Churches</th>
                <th style={{ width: '15%', textAlign: 'center' }}>2023 GA</th>
                <th style={{ width: '15%', textAlign: 'center' }}>2024 GA</th>
                <th style={{ width: '15%', textAlign: 'center' }}>2025 GA</th>
                <th style={{ width: '20%' }}>Remarks</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {churches.map((church) => (
                <tr key={church.id}>
                  <td>
                    <input
                      type="text"
                      placeholder="Enter church name"
                      required
                      value={church.name}
                      onChange={(e) => updateChurch(church.id, 'name', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}
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
                      style={{ width: '100%', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}
                    />
                  </td>
                  <td>
                    <button type="button" className="remove-btn" onClick={() => removeChurch(church.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Assessment Form'}
        </button>
      </form>
    </>
  );
}
