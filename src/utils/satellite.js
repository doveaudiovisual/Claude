/**
 * SGP4-based satellite utilities using satellite.js library.
 * Computes positions, footprints, ground tracks, and countdown timers.
 */
import * as satellite from 'satellite.js';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;

/**
 * Propagate a TLE to get current ECI position and velocity.
 * @param {string} tle1 - TLE line 1
 * @param {string} tle2 - TLE line 2
 * @param {Date} [date] - date to propagate to (default: now)
 * @returns {{ lat: number, lng: number, alt: number, velocity: number } | null}
 */
export function getSatellitePosition(tle1, tle2, date = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    if (!positionAndVelocity.position) return null;

    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

    const vx = positionAndVelocity.velocity.x;
    const vy = positionAndVelocity.velocity.y;
    const vz = positionAndVelocity.velocity.z;
    const velocityKms = Math.sqrt(vx * vx + vy * vy + vz * vz);

    return {
      lat: satellite.degreesLat(geo.latitude),
      lng: satellite.degreesLong(geo.longitude),
      alt: geo.height, // km
      velocity: velocityKms, // km/s
    };
  } catch {
    return null;
  }
}

/**
 * Compute the ground footprint circle for a satellite at a given altitude.
 * Returns an array of [lat, lng] pairs forming a circle.
 * @param {number} lat - sub-satellite latitude (degrees)
 * @param {number} lng - sub-satellite longitude (degrees)
 * @param {number} altKm - altitude in km
 * @param {number} [steps=64] - number of points in the footprint polygon
 * @returns {[number, number][]}
 */
export function getSatelliteFootprint(lat, lng, altKm, steps = 64) {
  // Earth central angle (lambda) for the footprint horizon
  const lambda = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm));

  const latRad = lat * DEG_TO_RAD;
  const lngRad = lng * DEG_TO_RAD;
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const az = (i / steps) * 2 * Math.PI;
    const sinLat =
      Math.sin(latRad) * Math.cos(lambda) +
      Math.cos(latRad) * Math.sin(lambda) * Math.cos(az);
    const footLat = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    const y = Math.sin(az) * Math.sin(lambda) * Math.cos(latRad);
    const x =
      Math.cos(lambda) - Math.sin(latRad) * Math.sin(footLat);
    const footLng = lngRad + Math.atan2(y, x);
    points.push([footLat * RAD_TO_DEG, ((footLng * RAD_TO_DEG + 540) % 360) - 180]);
  }

  return points;
}

/**
 * Compute a ground track for the next N minutes.
 * @param {string} tle1
 * @param {string} tle2
 * @param {number} [minutes=50] - track duration
 * @param {number} [stepSeconds=30] - resolution
 * @returns {{ positions: [number, number][], segments: [number, number][][] }}
 *   positions: flat array of [lat, lng]
 *   segments: array of continuous polyline segments (split at anti-meridian crossings)
 */
export function getGroundTrack(tle1, tle2, minutes = 50, stepSeconds = 30) {
  const satrec = satellite.twoline2satrec(tle1, tle2);
  const now = Date.now();
  const positions = [];

  for (let s = 0; s <= minutes * 60; s += stepSeconds) {
    const date = new Date(now + s * 1000);
    const pv = satellite.propagate(satrec, date);
    if (!pv.position) continue;
    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    positions.push([
      satellite.degreesLat(geo.latitude),
      satellite.degreesLong(geo.longitude),
    ]);
  }

  // Split track at anti-meridian crossings (>180 deg longitude jump)
  const segments = [];
  let current = [];
  for (let i = 0; i < positions.length; i++) {
    if (i > 0) {
      const dLng = Math.abs(positions[i][1] - positions[i - 1][1]);
      if (dLng > 180) {
        if (current.length > 1) segments.push(current);
        current = [];
      }
    }
    current.push(positions[i]);
  }
  if (current.length > 1) segments.push(current);

  return { positions, segments };
}

/**
 * Compute seconds until the next overhead pass over a ground point (rough estimate).
 * Returns seconds until closest approach within the next orbit (~100 min).
 * @param {string} tle1
 * @param {string} tle2
 * @param {number} obsLat - observer latitude (degrees)
 * @param {number} obsLng - observer longitude (degrees)
 * @param {number} [searchMinutes=100]
 * @returns {number | null} seconds until closest approach, or null
 */
export function secondsToNextPass(tle1, tle2, obsLat, obsLng, searchMinutes = 100) {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const now = Date.now();
    let minDist = Infinity;
    let minTime = null;

    for (let s = 0; s <= searchMinutes * 60; s += 10) {
      const date = new Date(now + s * 1000);
      const pv = satellite.propagate(satrec, date);
      if (!pv.position) continue;
      const gmst = satellite.gstime(date);
      const geo = satellite.eciToGeodetic(pv.position, gmst);
      const satLat = satellite.degreesLat(geo.latitude);
      const satLng = satellite.degreesLong(geo.longitude);

      const dLat = (satLat - obsLat) * DEG_TO_RAD;
      const dLng = (satLng - obsLng) * DEG_TO_RAD;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(obsLat * DEG_TO_RAD) * Math.cos(satLat * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * EARTH_RADIUS_KM;

      if (dist < minDist) {
        minDist = dist;
        minTime = s;
      }
    }

    return minTime;
  } catch {
    return null;
  }
}

/**
 * Format seconds as MM:SS countdown string.
 */
export function formatCountdown(seconds) {
  if (seconds === null || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
