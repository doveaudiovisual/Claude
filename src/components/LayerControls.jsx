import { useState } from 'react';
import useMapStore from '../store/useMapStore';

const LAYERS = [
  { key: 'webcams',     label: 'Webcams',        icon: '📷', color: '#00bfff' },
  { key: 'satellites',  label: 'Satellites',      icon: '🛰',  color: '#ff4444' },
  { key: 'radioTowers', label: 'Radio Towers',    icon: '📡', color: '#ffa500' },
  { key: 'traffic',     label: 'Traffic',         icon: '🚗', color: '#ffcc00' },
  { key: 'overpass',    label: 'Surveillance',    icon: '👁', color: '#9b59b6' },
];

export default function LayerControls() {
  const { layers, counts, loading, toggleLayer, tomtomKey, setTomtomKey } = useMapStore();
  const [showTomtomInput, setShowTomtomInput] = useState(false);
  const [tomtomDraft, setTomtomDraft] = useState('');

  const handleTrafficToggle = () => {
    if (!layers.traffic && !tomtomKey) {
      setShowTomtomInput(true);
    } else {
      toggleLayer('traffic');
    }
  };

  const handleTomtomSubmit = (e) => {
    e.preventDefault();
    if (tomtomDraft.trim()) {
      setTomtomKey(tomtomDraft.trim());
      toggleLayer('traffic');
      setShowTomtomInput(false);
      setTomtomDraft('');
    }
  };

  return (
    <div className="layer-controls">
      <div className="layer-controls-header">
        <span className="layer-controls-title">GOD'S EYE</span>
      </div>

      <div className="layer-buttons">
        {LAYERS.map(({ key, label, icon, color }) => {
          const active = layers[key];
          const count = counts[key];
          const spin = loading[key];

          return (
            <button
              key={key}
              className={`layer-btn ${active ? 'active' : ''}`}
              style={{ '--layer-color': color }}
              onClick={key === 'traffic' ? handleTrafficToggle : () => toggleLayer(key)}
              title={label}
            >
              <span className="layer-btn-icon">{icon}</span>
              <span className="layer-btn-label">{label}</span>
              {spin ? (
                <span className="layer-btn-count spinning">⟳</span>
              ) : count > 0 ? (
                <span className="layer-btn-count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {showTomtomInput && (
        <form className="tomtom-form" onSubmit={handleTomtomSubmit}>
          <label htmlFor="tomtom-key">TomTom API Key</label>
          <input
            id="tomtom-key"
            type="password"
            value={tomtomDraft}
            onChange={(e) => setTomtomDraft(e.target.value)}
            placeholder="Paste your TomTom key…"
            autoFocus
          />
          <div className="tomtom-form-actions">
            <button type="submit">Enable Traffic</button>
            <button type="button" onClick={() => setShowTomtomInput(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
