import { useState, useEffect, useRef, useCallback } from 'react';
import useMapStore from '../store/useMapStore';
import { getSatellitePosition, getGroundTrack, getSatelliteFootprint } from '../utils/satellite';

// CelesTrak active satellites TLE feed (proxied)
const TLE_URL = '/api/keeptrack/TLE/active.txt';
const UPDATE_INTERVAL_MS = 10_000;
const MAX_SATS = 200;

export function useSatellites() {
  const [satellites, setSatellites] = useState([]);
  const [groundTracks, setGroundTracks] = useState({});
  const [footprints, setFootprints] = useState({});
  const tleDataRef = useRef([]);
  const intervalRef = useRef(null);
  const { layers, setCount, setLoading } = useMapStore();

  const parseTLEs = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const entries = [];
    for (let i = 0; i + 2 < lines.length; i += 3) {
      entries.push({
        name: lines[i],
        tle1: lines[i + 1],
        tle2: lines[i + 2],
      });
    }
    return entries.slice(0, MAX_SATS);
  };

  const propagateAll = useCallback(() => {
    const now = new Date();
    const updated = tleDataRef.current
      .map((entry) => {
        const pos = getSatellitePosition(entry.tle1, entry.tle2, now);
        if (!pos) return null;
        return { ...entry, ...pos };
      })
      .filter(Boolean);

    setSatellites(updated);
    setCount('satellites', updated.length);

    // Compute footprints for visible sats
    const fp = {};
    updated.forEach((sat) => {
      fp[sat.name] = getSatelliteFootprint(sat.lat, sat.lng, sat.alt);
    });
    setFootprints(fp);
  }, [setCount]);

  const fetchTLEs = useCallback(async () => {
    setLoading('satellites', true);
    try {
      const res = await fetch(TLE_URL);
      if (!res.ok) throw new Error(`TLE fetch ${res.status}`);
      const text = await res.text();
      tleDataRef.current = parseTLEs(text);

      // Pre-compute ground tracks once (expensive)
      const tracks = {};
      tleDataRef.current.forEach((entry) => {
        tracks[entry.name] = getGroundTrack(entry.tle1, entry.tle2, 50, 30);
      });
      setGroundTracks(tracks);

      propagateAll();
    } catch (err) {
      console.error('useSatellites TLE fetch:', err);
    } finally {
      setLoading('satellites', false);
    }
  }, [propagateAll, setLoading]);

  useEffect(() => {
    if (layers.satellites) {
      fetchTLEs();
      intervalRef.current = setInterval(propagateAll, UPDATE_INTERVAL_MS);
    } else {
      clearInterval(intervalRef.current);
      setSatellites([]);
      setGroundTracks({});
      setFootprints({});
      setCount('satellites', 0);
    }

    return () => clearInterval(intervalRef.current);
  }, [layers.satellites, fetchTLEs, propagateAll, setCount]);

  return { satellites, groundTracks, footprints };
}
