import * as React from 'react';
import { useLocation } from 'react-router-dom';

function isRoutingDebugEnabled() {
  try {
    return localStorage.getItem('debugRouting') === '1';
  } catch {
    return false;
  }
}

function dumpHistoryStateOneLine(): string {
  try {
    const s = window.history.state as unknown;
    if (s == null) return 'null';
    if (typeof s !== 'object') return String(s);

    // Keep it one-line and reasonably small.
    return JSON.stringify(s);
  } catch (e) {
    try {
      return `<<unserializable:${String(e)}>>`;
    } catch {
      return '<<unserializable>>';
    }
  }
}

/**
 * Logs React Router's location whenever it changes.
 *
 * Enable via: localStorage.setItem('debugRouting','1'); location.reload();
 */
export default function RouterDebug() {
  const location = useLocation();

  const latestLocationRef = React.useRef({
    pathname: location.pathname,
    search: location.search,
  });

  React.useEffect(() => {
    latestLocationRef.current = {
      pathname: location.pathname,
      search: location.search,
    };
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (!isRoutingDebugEnabled()) return;

    const onPopState = () => {
      const latest = latestLocationRef.current;
      console.debug(
        '[router] popstate',
        '| router',
        latest.pathname + latest.search,
        '| window',
        window.location.pathname + window.location.search,
        '| history.state',
        dumpHistoryStateOneLine()
      );

      if (
        latest.pathname !== window.location.pathname ||
        latest.search !== window.location.search
      ) {
        console.debug('[router] MISMATCH on popstate (router vs window)');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  React.useEffect(() => {
    if (!isRoutingDebugEnabled()) return;

    console.debug(
      '[router] location',
      location.pathname + location.search,
      '| window',
      window.location.pathname + window.location.search,
      '| history.state',
      dumpHistoryStateOneLine()
    );

    if (location.pathname !== window.location.pathname || location.search !== window.location.search) {
      console.debug('[router] MISMATCH (router vs window)');
    }
  }, [location.pathname, location.search]);

  return null;
}
