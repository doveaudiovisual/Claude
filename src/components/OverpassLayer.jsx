import { useMap } from 'react-leaflet';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { useOverpass } from '../hooks/useOverpass';
import useMapStore from '../store/useMapStore';

const surveillanceIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;background:#9b59b6;border-radius:2px;
    border:2px solid #fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;box-shadow:0 0 6px #9b59b688;
  ">👁</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function OverpassMarkersInner({ bounds }) {
  const { features } = useOverpass(bounds);
  const { openDetailPanel } = useMapStore();

  return (
    <>
      {features.map((feat) => {
        const lat = feat.lat ?? feat.center?.lat;
        const lng = feat.lon ?? feat.center?.lon;
        if (!lat || !lng) return null;

        const tags = feat.tags ?? {};

        return (
          <Marker
            key={feat.id}
            position={[lat, lng]}
            icon={surveillanceIcon}
            eventHandlers={{
              click: () => openDetailPanel('overpass', { ...feat, lat, lng }),
            }}
          >
            <Popup>
              <strong>{tags.name || tags.surveillance || 'Surveillance'}</strong>
              <br />
              {tags['surveillance:type'] && `Type: ${tags['surveillance:type']}`}
              <br />
              {tags.operator && `Operator: ${tags.operator}`}
              <br />
              {tags.camera_type && `Camera: ${tags.camera_type}`}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function OverpassLayer() {
  const [bounds, setBounds] = useState(null);
  const map = useMap();

  useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => setBounds(map.getBounds()),
  });

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map]);

  if (!bounds) return null;
  return <OverpassMarkersInner bounds={bounds} />;
}
