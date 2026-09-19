import { useEffect, useState } from 'react';
import { fetchNames } from '../api/attendanceApi.js';

const CACHE_KEY = 'sp-attendance-names-cache';

function readCachedNames() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(cached) ? cached : null;
  } catch {
    return null;
  }
}

function writeCachedNames(names) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(names));
  } catch {
    // Storage unavailable (private browsing, quota, etc) — safe to ignore,
    // the app just falls back to fetching every time.
  }
}

// Names rarely change day to day, so a cached copy from localStorage is
// shown immediately (no "Loading names..." on repeat visits) while a
// fresh copy is fetched in the background and silently swapped in.
export default function useNames() {
  const [names, setNames] = useState(() => readCachedNames() || []);
  const [loading, setLoading] = useState(() => readCachedNames() === null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchNames()
      .then((fetchedNames) => {
        if (isMounted) {
          setNames(fetchedNames);
          writeCachedNames(fetchedNames);
        }
      })
      .catch(() => {
        if (isMounted && names.length === 0) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { names, loading, failed };
}
