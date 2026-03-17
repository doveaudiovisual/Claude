import { useMap } from 'react-leaflet';
import { Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { useTraffic } from '../hooks/useTraffic';
import useMapStore from '../store/useMapStore';

const SEVERITY_COLORS = {
  0: '#999999', // Unknown
  1: '#ffcc00', // Minor
  2: '#ff8800', // Moderate
  3: '#ff3300', // Major
  4: '#cc0000', // Undefined (used as critical)
};

function incidentIcon(delay) {
  const color = delay > 60 ? '#cc0000' : delay > 20 ? '#ff8800' : '#ffcc00';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;background:${color};border-radius:50%;
      border:2px solid #fff;cursor:pointer;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function TrafficMarkersInner({ bounds }) {
  const { incidents } = useTraffic(bounds);
  const { openDetailPanel } = useMapStore();

  return (
    <>
      {incidents.map((incident) => {
        const props = incident.properties ?? {};
        const geo = incident.geometry;
        if (!geo) return null;

        const delay = props.delay ?? 0;
        const coords = geo.type === 'Point'
          ? [[geo.coordinates[1], geo.coordinates[0]]]
          : geo.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [];

        if (coords.length === 0) return null;

        const [lat, lng] = coords[0];
        const color = SEVERITY_COLORS[props.magnitudeOfDelay] ?? SEVERITY_COLORS[0];

        return (
          <div key={props.id || `inc-${lat}-${lng}`}>
            {geo.type === 'LineString' && coords.length > 1 && (
              <Polyline
                positions={coords}
                pathOptions={{ color, weight: 4, opacity: 0.7 }}
              />
            )}
            <Marker
              position={[lat, lng]}
              icon={incidentIcon(delay)}
              eventHandlers={{
                click: () => openDetailPanel('traffic', incident),
              }}
            >
              <Popup>
                <strong>{props.events?.[0]?.description || 'Traffic Incident'}</strong>
                <br />
                {props.from && props.to && `${props.from} → ${props.to}`}
                {delay > 0 && <><br />Delay: {Math.round(delay / 60)} min</>}
              </Popup>
            </Marker>
          </div>
        );
      })}
    </>
  );
}

export default function TrafficLayer() {
  const [bounds, setBounds] = useState(null);
  const map = useMap();
  const { tomtomKey } = useMapStore();

  useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => setBounds(map.getBounds()),
  });

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map]);

  if (!bounds || !tomtomKey) return null;
  return <TrafficMarkersInner bounds={bounds} />;
}
