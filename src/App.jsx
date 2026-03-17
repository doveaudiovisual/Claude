import GodMap from './components/GodMap';
import LayerControls from './components/LayerControls';
import DetailPanel from './components/DetailPanel';
import './index.css';

export default function App() {
  return (
    <div className="app-root">
      <LayerControls />
      <div className="map-container">
        <GodMap />
      </div>
      <DetailPanel />
    </div>
  );
}
