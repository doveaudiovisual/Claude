import { useState, useEffect, useCallback } from 'react';
import useMapStore from '../store/useMapStore';

// Generic Overpass query for surveillance/infrastructure features
function buildSurveillanceQuery(bounds) {
  const { _southWest: sw, _northEast: ne } = bounds;
  const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;
  return `[out:json][timeout:30];
(
  node["man_made"="surveillance"](${bbox});
  node["surveillance"](${bbox});
  node["surveillance:type"](${bbox});
  node["man_made"="monitoring_station"](${bbox});
  way["man_made"="surveillance"](${bbox});
);
out center body;`;
}

export function useOverpass(bounds) {
  const [features, setFeatures] = useState([]);
  const { layers, setCount, setLoading } = useMapStore();

  const fetchFeatures = useCallback(async () => {
    if (!bounds || !layers.overpass) return;

    setLoading('overpass', true);
    try {
      const query = buildSurveillanceQuery(bounds);
      const res = await fetch('/api/overpass/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = await res.json();
      const list = data.elements ?? [];
      setFeatures(list);
      setCount('overpass', list.length);
    } catch (err) {
      console.error('useOverpass:', err);
      setFeatures([]);
      setCount('overpass', 0);
    } finally {
      setLoading('overpass', false);
    }
  }, [bounds, layers.overpass, setCount, setLoading]);

  useEffect(() => {
    if (layers.overpass) {
      fetchFeatures();
    } else {
      setFeatures([]);
      setCount('overpass', 0);
    }
  }, [layers.overpass, fetchFeatures, setCount]);

  return { features, refetch: fetchFeatures };
}
