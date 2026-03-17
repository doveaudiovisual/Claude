import { useState, useEffect, useCallback } from 'react';
import useMapStore from '../store/useMapStore';

const WINDY_WEBCAMS_URL = '/api/windy/webcams/api/v3/webcams';

export function useWebcams(bounds) {
  const [webcams, setWebcams] = useState([]);
  const { layers, setCount, setLoading } = useMapStore();

  const fetchWebcams = useCallback(async () => {
    if (!bounds || !layers.webcams) return;

    setLoading('webcams', true);
    try {
      const { _southWest: sw, _northEast: ne } = bounds;
      const params = new URLSearchParams({
        lang: 'en',
        include: 'location,player,images,categories',
        limit: '50',
        offset: '0',
        boundingBox: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
      });

      const res = await fetch(`${WINDY_WEBCAMS_URL}?${params}`);
      if (!res.ok) throw new Error(`Webcam API ${res.status}`);
      const data = await res.json();
      const list = data.webcams ?? [];
      setWebcams(list);
      setCount('webcams', list.length);
    } catch (err) {
      console.error('useWebcams:', err);
      setWebcams([]);
      setCount('webcams', 0);
    } finally {
      setLoading('webcams', false);
    }
  }, [bounds, layers.webcams, setCount, setLoading]);

  useEffect(() => {
    if (layers.webcams) {
      fetchWebcams();
    } else {
      setWebcams([]);
      setCount('webcams', 0);
    }
  }, [layers.webcams, fetchWebcams, setCount]);

  return { webcams, refetch: fetchWebcams };
}
