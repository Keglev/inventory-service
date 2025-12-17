import * as React from 'react';
import { useLocation } from 'react-router-dom';

function isRoutingDebugEnabled() {
  try {
    return localStorage.getItem('debugRouting') === '1';
  } catch {
    return false;
  }
}

/**
 * Logs React Router's location whenever it changes.
 *
 * Enable via: localStorage.setItem('debugRouting','1'); location.reload();
 */
export default function RouterDebug() {
  const location = useLocation();

  React.useEffect(() => {
    if (!isRoutingDebugEnabled()) return;

    
    console.debug(
      '[router] location',
      location.pathname + location.search,
      '| window',
      window.location.pathname + window.location.search
    );

    if (location.pathname !== window.location.pathname || location.search !== window.location.search) {
      
      console.debug('[router] MISMATCH (router vs window)');
    }
  }, [location.pathname, location.search]);

  return null;
}
