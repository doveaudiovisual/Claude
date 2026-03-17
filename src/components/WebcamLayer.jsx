import { useMap } from 'react-leaflet';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { useWebcams } from '../hooks/useWebcams';
import useMapStore from '../store/useMapStore';

const webcamIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:24px;height:24px;background:#00bfff;border-radius:50%;
    border:2px solid #fff;display:flex;align-items:center;justify-content:center;
    font-size:12px;cursor:pointer;box-shadow:0 0 6px #00bfff88;
  ">📷</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function WebcamMarkersInner({ bounds }) {
  const { webcams } = useWebcams(bounds);
  const { openDetailPanel } = useMapStore();

  return (
    <>
      {webcams.map((cam) => {
        const lat = cam.location?.latitude;
        const lng = cam.location?.longitude;
        if (!lat || !lng) return null;
        return (
          <Marker
            key={cam.webcamId}
            position={[lat, lng]}
            icon={webcamIcon}
            eventHandlers={{
              click: () => openDetailPanel('webcam', cam),
            }}
          >
            <Popup>
              <strong>{cam.title || 'Webcam'}</strong>
              <br />
              {cam.location?.city}, {cam.location?.country}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function WebcamLayer() {
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
  return <WebcamMarkersInner bounds={bounds} />;
}
