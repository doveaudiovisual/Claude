import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useMapStore from '../store/useMapStore';
import WebcamLayer from './WebcamLayer';
import SatelliteLayer from './SatelliteLayer';
import RadioTowerLayer from './RadioTowerLayer';
import TrafficLayer from './TrafficLayer';
import OverpassLayer from './OverpassLayer';

// Fix Leaflet default marker icon paths broken by Vite bundling
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export default function GodMap() {
  const { mapCenter, mapZoom, layers, setMapCenter, setMapZoom } = useMapStore();

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      preferCanvas
      onMoveEnd={(e) => {
        const c = e.target.getCenter();
        setMapCenter([c.lat, c.lng]);
      }}
      onZoomEnd={(e) => {
        setMapZoom(e.target.getZoom());
      }}
    >
      <ZoomControl position="bottomright" />

      {/* Base tile layer — dark CartoDB theme */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />

      {/* Conditional overlay layers */}
      {layers.webcams && <WebcamLayer />}
      {layers.satellites && <SatelliteLayer />}
      {layers.radioTowers && <RadioTowerLayer />}
      {layers.traffic && <TrafficLayer />}
      {layers.overpass && <OverpassLayer />}
    </MapContainer>
  );
}
