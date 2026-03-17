import { useMap } from 'react-leaflet';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { useRadioTowers } from '../hooks/useRadioTowers';
import useMapStore from '../store/useMapStore';

const towerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;background:#ffa500;
    clip-path:polygon(50% 0%,100% 100%,0% 100%);
    border:none;cursor:pointer;filter:drop-shadow(0 0 4px #ffa50088);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function TowerMarkersInner({ bounds }) {
  const { towers } = useRadioTowers(bounds);
  const { openDetailPanel } = useMapStore();

  return (
    <>
      {towers.map((tower) => {
        const lat = tower.lat ?? tower.center?.lat;
        const lng = tower.lon ?? tower.center?.lon;
        if (!lat || !lng) return null;

        const tags = tower.tags ?? {};
        const callsign = tags['ref:fcc'] || tags.ref || '';

        return (
          <Marker
            key={tower.id}
            position={[lat, lng]}
            icon={towerIcon}
            eventHandlers={{
              click: () => openDetailPanel('radioTower', { ...tower, lat, lng }),
            }}
          >
            <Popup>
              <strong>{tags.name || 'Radio Tower'}</strong>
              {callsign && <><br />FCC: {callsign}</>}
              <br />
              {tags['tower:type'] || tags['man_made'] || 'Communication tower'}
              <br />
              {tags.height && `Height: ${tags.height}`}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function RadioTowerLayer() {
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
  return <TowerMarkersInner bounds={bounds} />;
}
