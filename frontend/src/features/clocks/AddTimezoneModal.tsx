import React, { useState, useMemo } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { CITY_PRESETS } from './timezoneData';
import { CityPreset, RegionCategory, WorldClockItem } from './types';
import { getTimeInTimezone } from './timezoneUtils';
import { generateId, cn } from '../../utils';

interface AddTimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClock: (clock: WorldClockItem) => void;
  existingClocks: WorldClockItem[];
}

const REGIONS: RegionCategory[] = [
  'All',
  'Asia',
  'Americas',
  'Europe',
  'Pacific',
  'Middle East',
  'Africa',
  'UTC',
];

export const AddTimezoneModal: React.FC<AddTimezoneModalProps> = ({
  isOpen,
  onClose,
  onAddClock,
  existingClocks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionCategory>('All');
  const [selectedPreset, setSelectedPreset] = useState<CityPreset | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom manual timezone entry state
  const [customCity, setCustomCity] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [customTz, setCustomTz] = useState('');
  const [customAbbr, setCustomAbbr] = useState('');
  const [customFlag, setCustomFlag] = useState('📍');

  const existingTzSet = useMemo(() => {
    return new Set(existingClocks.map((c) => c.timezone.toLowerCase()));
  }, [existingClocks]);

  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CITY_PRESETS.filter((preset) => {
      const matchesRegion = selectedRegion === 'All' || preset.region === selectedRegion;
      const matchesQuery =
        !query ||
        preset.cityName.toLowerCase().includes(query) ||
        preset.country.toLowerCase().includes(query) ||
        preset.abbreviation.toLowerCase().includes(query) ||
        preset.timezone.toLowerCase().includes(query);
      return matchesRegion && matchesQuery;
    });
  }, [searchQuery, selectedRegion]);

  const handleSelectPreset = (preset: CityPreset) => {
    setSelectedPreset(preset);
    setCustomLabel(preset.cityName);
    setShowCustomForm(false);
  };

  const handleAddPreset = () => {
    if (!selectedPreset) return;

    const newClock: WorldClockItem = {
      id: generateId('clock'),
      cityName: selectedPreset.cityName,
      country: selectedPreset.country,
      timezone: selectedPreset.timezone,
      abbreviation: selectedPreset.abbreviation,
      flag: selectedPreset.flag,
      customLabel: customLabel.trim() !== selectedPreset.cityName ? customLabel.trim() : undefined,
      pinned: false,
    };

    onAddClock(newClock);
    handleClose();
  };

  const handleAddManualCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCity.trim() || !customTz.trim()) return;

    const newClock: WorldClockItem = {
      id: generateId('clock'),
      cityName: customCity.trim(),
      country: customCountry.trim() || 'Custom',
      timezone: customTz.trim(),
      abbreviation: customAbbr.trim() || 'TZ',
      flag: customFlag || '📍',
      customLabel: customLabel.trim() || undefined,
      pinned: false,
    };

    onAddClock(newClock);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedRegion('All');
    setSelectedPreset(null);
    setCustomLabel('');
    setShowCustomForm(false);
    setCustomCity('');
    setCustomCountry('');
    setCustomTz('');
    setCustomAbbr('');
    onClose();
  };

  // Preview time for currently selected preset
  const selectedTimePreview = selectedPreset ? getTimeInTimezone(selectedPreset.timezone) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add World Clock"
      size="lg"
      id="add-clock-modal"
      footer={
        <div className="pcc-add-clock-modal__footer">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {showCustomForm ? (
            <Button
              variant="primary"
              onClick={handleAddManualCustom}
              disabled={!customCity.trim() || !customTz.trim()}
            >
              Add Custom Clock
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleAddPreset}
              disabled={!selectedPreset}
            >
              Add {selectedPreset ? selectedPreset.cityName : 'Clock'}
            </Button>
          )}
        </div>
      }
    >
      <div className="pcc-add-clock-modal__content">
        {/* Toggle Mode Tab */}
        <div className="pcc-add-clock-modal__mode-toggle">
          <button
            type="button"
            className={cn(
              'pcc-add-clock-modal__mode-btn',
              !showCustomForm && 'pcc-add-clock-modal__mode-btn--active'
            )}
            onClick={() => setShowCustomForm(false)}
          >
            Search Cities & Timezones
          </button>
          <button
            type="button"
            className={cn(
              'pcc-add-clock-modal__mode-btn',
              showCustomForm && 'pcc-add-clock-modal__mode-btn--active'
            )}
            onClick={() => setShowCustomForm(true)}
          >
            Custom / Manual Entry
          </button>
        </div>

        {!showCustomForm ? (
          <>
            {/* Search Bar */}
            <div className="pcc-add-clock-modal__search-bar">
              <Input
                placeholder="Search by city, country, or code (e.g., Tokyo, London, EST, IST)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
                autoFocus
              />
            </div>

            {/* Region Filter Chips */}
            <div className="pcc-add-clock-modal__region-chips">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={cn(
                    'pcc-region-chip',
                    selectedRegion === region && 'pcc-region-chip--active'
                  )}
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="pcc-add-clock-modal__presets-list">
              {filteredPresets.length === 0 ? (
                <div className="pcc-add-clock-modal__empty">
                  <p>No cities found matching "{searchQuery}"</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRegion('All');
                    }}
                  >
                    Clear Search Filters
                  </Button>
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const isSelected = selectedPreset?.timezone === preset.timezone && selectedPreset?.cityName === preset.cityName;
                  const isAlreadyAdded = existingTzSet.has(preset.timezone.toLowerCase());
                  const presetTime = getTimeInTimezone(preset.timezone);

                  return (
                    <div
                      key={`${preset.cityName}-${preset.timezone}`}
                      className={cn(
                        'pcc-preset-row',
                        isSelected && 'pcc-preset-row--selected',
                        isAlreadyAdded && 'pcc-preset-row--already-added'
                      )}
                      onClick={() => handleSelectPreset(preset)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="pcc-preset-row__left">
                        <span className="pcc-preset-row__flag">{preset.flag}</span>
                        <div className="pcc-preset-row__info">
                          <div className="pcc-preset-row__title">
                            <span className="pcc-preset-row__city">{preset.cityName}</span>
                            {isAlreadyAdded && (
                              <span className="pcc-preset-row__badge-added">Already Added</span>
                            )}
                          </div>
                          <div className="pcc-preset-row__country">
                            {preset.country} • {preset.abbreviation} ({presetTime.utcOffsetStr})
                          </div>
                        </div>
                      </div>

                      <div className="pcc-preset-row__right">
                        <div className="pcc-preset-row__time">{presetTime.formattedTime12}</div>
                        <div className="pcc-preset-row__diff">{presetTime.relativeDiffStr}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Custom Label Customizer for Selected Preset */}
            {selectedPreset && selectedTimePreview && (
              <div className="pcc-add-clock-modal__preview-box">
                <div className="pcc-add-clock-modal__preview-header">
                  <span className="pcc-add-clock-modal__preview-flag">{selectedPreset.flag}</span>
                  <div>
                    <strong>{selectedPreset.cityName}</strong> ({selectedPreset.abbreviation}) — Current: {selectedTimePreview.formattedTime12} ({selectedTimePreview.relativeDiffStr})
                  </div>
                </div>
                <div className="pcc-add-clock-modal__custom-label-input">
                  <label htmlFor="custom-label-input" className="pcc-add-clock-label">
                    Custom Label / Nickname (Optional):
                  </label>
                  <Input
                    id="custom-label-input"
                    placeholder={`e.g. HQ, ${selectedPreset.cityName} Office, Team Europe`}
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Custom Timezone Form */
          <form className="pcc-custom-tz-form" onSubmit={handleAddManualCustom}>
            <div className="pcc-custom-tz-form__grid">
              <div className="pcc-form-field">
                <label className="pcc-form-label">City / Display Name *</label>
                <Input
                  placeholder="e.g. Reykjavik, Honolulu, Kathmandu"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  required
                />
              </div>

              <div className="pcc-form-field">
                <label className="pcc-form-label">Country</label>
                <Input
                  placeholder="e.g. Iceland, United States, Nepal"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                />
              </div>

              <div className="pcc-form-field">
                <label className="pcc-form-label">IANA Timezone *</label>
                <Input
                  placeholder="e.g. Atlantic/Reykjavik, Asia/Kathmandu, UTC"
                  value={customTz}
                  onChange={(e) => setCustomTz(e.target.value)}
                  required
                />
                <span className="pcc-form-hint">
                  Standard format: Region/City (e.g. Europe/Zurich, America/Denver)
                </span>
              </div>

              <div className="pcc-form-field">
                <label className="pcc-form-label">Abbreviation Code</label>
                <Input
                  placeholder="e.g. GMT, NPT, HST"
                  value={customAbbr}
                  onChange={(e) => setCustomAbbr(e.target.value)}
                />
              </div>

              <div className="pcc-form-field">
                <label className="pcc-form-label">Flag / Emoji Icon</label>
                <Input
                  placeholder="e.g. 🇮🇸, 📍, 🌍"
                  value={customFlag}
                  onChange={(e) => setCustomFlag(e.target.value)}
                />
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
