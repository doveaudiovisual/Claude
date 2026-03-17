import { useState, useEffect, useCallback, useRef } from 'react';
import useMapStore from '../store/useMapStore';

// TomTom Traffic Incidents API v5
const TOMTOM_INCIDENTS_URL = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const REFRESH_MS = 60_000;

export function useTraffic(bounds) {
  const [incidents, setIncidents] = useState([]);
  const intervalRef = useRef(null);
  const { layers, tomtomKey, setCount, setLoading } = useMapStore();

  const fetchIncidents = useCallback(async () => {
    if (!bounds || !layers.traffic || !tomtomKey) return;

    setLoading('traffic', true);
    try {
      const { _southWest: sw, _northEast: ne } = bounds;
      const bbox = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;

      const params = new URLSearchParams({
        key: tomtomKey,
        bbox,
        fields: '{incidents{type,geometry,properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,aci{probabilityOfOccurrence,numberOfReports}}}}',
        language: 'en-GB',
        categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11,14',
        timeValidityFilter: 'present',
      });

      const res = await fetch(`${TOMTOM_INCIDENTS_URL}?${params}`);
      if (!res.ok) throw new Error(`TomTom ${res.status}`);
      const data = await res.json();
      const list = data.incidents ?? [];
      setIncidents(list);
      setCount('traffic', list.length);
    } catch (err) {
      console.error('useTraffic:', err);
      setIncidents([]);
      setCount('traffic', 0);
    } finally {
      setLoading('traffic', false);
    }
  }, [bounds, layers.traffic, tomtomKey, setCount, setLoading]);

  useEffect(() => {
    if (layers.traffic && tomtomKey) {
      fetchIncidents();
      intervalRef.current = setInterval(fetchIncidents, REFRESH_MS);
    } else {
      clearInterval(intervalRef.current);
      setIncidents([]);
      setCount('traffic', 0);
    }

    return () => clearInterval(intervalRef.current);
  }, [layers.traffic, tomtomKey, fetchIncidents, setCount]);

  return { incidents, refetch: fetchIncidents };
}
