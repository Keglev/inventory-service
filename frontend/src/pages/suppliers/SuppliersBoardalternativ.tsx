/**
 * TEMPORARY DIAGNOSTIC VERSION OF SUPPLIERS
 * This is a minimal version to isolate the router freeze issue.
 * If this works, the problem is in the DataGrid or one of the complex components.
 */

import * as React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';

const SuppliersBoardTest: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    try {
      if (localStorage.getItem('debugRouting') === '1') {
        console.debug('[suppliers-test] mount', location.pathname);
      }
    } catch {
      // ignore
    }

    return () => {
      try {
        if (localStorage.getItem('debugRouting') === '1') {
          console.debug('[suppliers-test] unmount', location.pathname);
        }
      } catch {
        // ignore
      }
    };
  }, [location.pathname]);

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4">Suppliers Test Page (Minimal)</Typography>
        <Typography>
          This is a minimal version to test if DataGrid/complex components cause the router freeze.
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Current path: {location.pathname}
        </Typography>
      </Paper>
    </Box>
  );
};

export default SuppliersBoardTest;
