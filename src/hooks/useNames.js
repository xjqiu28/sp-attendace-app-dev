import { useEffect, useState } from 'react';
import { fetchNames } from '../api/attendanceApi.js';

export default function useNames() {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchNames()
      .then((fetchedNames) => {
        if (isMounted) {
          setNames(fetchedNames);
        }
      })
      .catch(() => {
        if (isMounted) {
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
  }, []);

  return { names, loading, failed };
}
