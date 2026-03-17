import { Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useSatellites } from '../hooks/useSatellites';
import useMapStore from '../store/useMapStore';

const satIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;background:#ff4444;border-radius:3px;
    border:2px solid #fff;display:flex;align-items:center;justify-content:center;
    font-size:10px;cursor:pointer;box-shadow:0 0 8px #ff444488;
    transform:rotate(45deg);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function SatelliteLayer() {
  const { satellites, groundTracks, footprints } = useSatellites();
  const { openDetailPanel } = useMapStore();

  return (
    <>
      {satellites.map((sat) => {
        const track = groundTracks[sat.name];
        const fp = footprints[sat.name];

        return (
          <div key={sat.name}>
            {/* Ground track polyline segments */}
            {track?.segments?.map((seg, idx) => (
              <Polyline
                key={`track-${sat.name}-${idx}`}
                positions={seg}
                pathOptions={{ color: '#ff4444', weight: 1, opacity: 0.5, dashArray: '4 4' }}
              />
            ))}

            {/* Footprint polygon */}
            {fp && fp.length > 0 && (
              <Polygon
                positions={fp}
                pathOptions={{ color: '#ff4444', weight: 1, opacity: 0.3, fillOpacity: 0.05 }}
              />
            )}

            {/* Satellite marker */}
            <Marker
              position={[sat.lat, sat.lng]}
              icon={satIcon}
              eventHandlers={{
                click: () => openDetailPanel('satellite', sat),
              }}
            >
              <Popup>
                <strong>{sat.name}</strong>
                <br />
                Alt: {sat.alt?.toFixed(1)} km
                <br />
                Vel: {sat.velocity?.toFixed(2)} km/s
                <br />
                {sat.lat?.toFixed(3)}°, {sat.lng?.toFixed(3)}°
              </Popup>
            </Marker>
          </div>
        );
      })}
    </>
  );
}
