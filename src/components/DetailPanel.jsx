import { useEffect, useState } from 'react';
import useMapStore from '../store/useMapStore';
import { formatCountdown, secondsToNextPass } from '../utils/satellite';

// ── Webcam sub-panel ──────────────────────────────────────────────────────────
function WebcamDetail({ data }) {
  const previewUrl = data.images?.current?.preview;
  const playerUrl = data.player?.live?.available
    ? data.player.live.link
    : data.player?.day?.link;

  return (
    <div>
      <h3 className="detail-title">{data.title || 'Webcam'}</h3>
      {previewUrl && (
        <img
          src={previewUrl}
          alt="cam preview"
          className="detail-preview-img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <table className="detail-table">
        <tbody>
          <tr><td>City</td><td>{data.location?.city || '—'}</td></tr>
          <tr><td>Country</td><td>{data.location?.country || '—'}</td></tr>
          <tr><td>Status</td><td>{data.status || '—'}</td></tr>
          <tr>
            <td>Categories</td>
            <td>{data.categories?.map((c) => c.name).join(', ') || '—'}</td>
          </tr>
        </tbody>
      </table>
      {playerUrl && (
        <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
          Open Live Player ↗
        </a>
      )}
    </div>
  );
}

// ── Satellite sub-panel ───────────────────────────────────────────────────────
function SatelliteDetail({ data }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!data.tle1 || !data.tle2) return;
    // Default to Washington DC as observer point
    const secs = secondsToNextPass(data.tle1, data.tle2, 38.9, -77.0);
    setCountdown(secs);

    const id = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(id);
  }, [data.tle1, data.tle2]);

  return (
    <div>
      <h3 className="detail-title">{data.name}</h3>
      <table className="detail-table">
        <tbody>
          <tr><td>Latitude</td><td>{data.lat?.toFixed(4)}°</td></tr>
          <tr><td>Longitude</td><td>{data.lng?.toFixed(4)}°</td></tr>
          <tr><td>Altitude</td><td>{data.alt?.toFixed(1)} km</td></tr>
          <tr><td>Velocity</td><td>{data.velocity?.toFixed(2)} km/s</td></tr>
          <tr>
            <td>Next pass</td>
            <td className="detail-countdown">{formatCountdown(countdown)}</td>
          </tr>
        </tbody>
      </table>
      {data.tle1 && (
        <details className="detail-tle">
          <summary>TLE Data</summary>
          <pre>{data.tle1}{'\n'}{data.tle2}</pre>
        </details>
      )}
    </div>
  );
}

// ── Radio Tower sub-panel ─────────────────────────────────────────────────────
function RadioTowerDetail({ data }) {
  const tags = data.tags ?? {};
  const fccRef = tags['ref:fcc'] || tags.ref;
  const fccUrl = fccRef
    ? `https://www.fcc.gov/cgi-bin/browse.pl?action=getFacility&facid=${fccRef}`
    : null;

  return (
    <div>
      <h3 className="detail-title">{tags.name || 'Radio Tower'}</h3>
      <table className="detail-table">
        <tbody>
          <tr><td>Type</td><td>{tags['tower:type'] || tags.man_made || '—'}</td></tr>
          <tr><td>Height</td><td>{tags.height || '—'}</td></tr>
          <tr><td>Operator</td><td>{tags.operator || '—'}</td></tr>
          <tr><td>FCC ID</td><td>{fccRef || '—'}</td></tr>
          <tr><td>Frequency</td><td>{tags.frequency || '—'}</td></tr>
          <tr><td>OSM ID</td><td>{data.id}</td></tr>
        </tbody>
      </table>
      {fccUrl && (
        <a href={fccUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
          FCC Facility Record ↗
        </a>
      )}
    </div>
  );
}

// ── Traffic sub-panel ─────────────────────────────────────────────────────────
function TrafficDetail({ data }) {
  const props = data.properties ?? {};
  const delayMin = props.delay ? Math.round(props.delay / 60) : 0;

  return (
    <div>
      <h3 className="detail-title">Traffic Incident</h3>
      <table className="detail-table">
        <tbody>
          <tr><td>Description</td><td>{props.events?.[0]?.description || '—'}</td></tr>
          <tr><td>From</td><td>{props.from || '—'}</td></tr>
          <tr><td>To</td><td>{props.to || '—'}</td></tr>
          <tr><td>Delay</td><td>{delayMin > 0 ? `${delayMin} min` : '—'}</td></tr>
          <tr><td>Road</td><td>{props.roadNumbers?.join(', ') || '—'}</td></tr>
          <tr>
            <td>Start</td>
            <td>{props.startTime ? new Date(props.startTime).toLocaleString() : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Overpass/Surveillance sub-panel ───────────────────────────────────────────
function OverpassDetail({ data }) {
  const tags = data.tags ?? {};

  return (
    <div>
      <h3 className="detail-title">{tags.name || tags.surveillance || 'Surveillance Node'}</h3>

      {/* ALPR ethics disclaimer */}
      {(tags['surveillance:type'] === 'ALPR' || tags.camera_type === 'ALPR') && (
        <div className="detail-disclaimer">
          ⚠️ <strong>ALPR Notice:</strong> Automated License Plate Recognition cameras collect
          vehicle data. Use of this information is subject to local privacy laws. This data is
          sourced from public OpenStreetMap contributions.
        </div>
      )}

      <table className="detail-table">
        <tbody>
          <tr><td>Surveillance type</td><td>{tags['surveillance:type'] || '—'}</td></tr>
          <tr><td>Camera type</td><td>{tags.camera_type || '—'}</td></tr>
          <tr><td>Operator</td><td>{tags.operator || '—'}</td></tr>
          <tr><td>Direction</td><td>{tags.direction || '—'}</td></tr>
          <tr><td>Mount</td><td>{tags['surveillance:mount'] || '—'}</td></tr>
          <tr><td>OSM ID</td><td>{data.id}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function DetailPanel() {
  const { detailPanel, closeDetailPanel } = useMapStore();

  if (!detailPanel) return null;

  const { type, data } = detailPanel;

  const renderContent = () => {
    switch (type) {
      case 'webcam': return <WebcamDetail data={data} />;
      case 'satellite': return <SatelliteDetail data={data} />;
      case 'radioTower': return <RadioTowerDetail data={data} />;
      case 'traffic': return <TrafficDetail data={data} />;
      case 'overpass': return <OverpassDetail data={data} />;
      default: return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={closeDetailPanel} aria-label="Close">✕</button>
      {renderContent()}
    </div>
  );
}
