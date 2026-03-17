import { useState, useEffect, useCallback } from 'react';
import useMapStore from '../store/useMapStore';

// Overpass query for communication towers
function buildOverpassQuery(bounds) {
  const { _southWest: sw, _northEast: ne } = bounds;
  const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;
  return `[out:json][timeout:25];
(
  node["man_made"="tower"]["tower:type"~"communication|radio|television|cell"](${bbox});
  node["man_made"="communications_tower"](${bbox});
  node["tower:type"="radio"](${bbox});
  node["tower:type"="communication"](${bbox});
);
out body;`;
}

export function useRadioTowers(bounds) {
  const [towers, setTowers] = useState([]);
  const { layers, setCount, setLoading } = useMapStore();

  const fetchTowers = useCallback(async () => {
    if (!bounds || !layers.radioTowers) return;

    setLoading('radioTowers', true);
    try {
      const query = buildOverpassQuery(bounds);
      const res = await fetch('/api/overpass/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = await res.json();
      const list = data.elements ?? [];
      setTowers(list);
      setCount('radioTowers', list.length);
    } catch (err) {
      console.error('useRadioTowers:', err);
      setTowers([]);
      setCount('radioTowers', 0);
    } finally {
      setLoading('radioTowers', false);
    }
  }, [bounds, layers.radioTowers, setCount, setLoading]);

  useEffect(() => {
    if (layers.radioTowers) {
      fetchTowers();
    } else {
      setTowers([]);
      setCount('radioTowers', 0);
    }
  }, [layers.radioTowers, fetchTowers, setCount]);

  return { towers, refetch: fetchTowers };
}
