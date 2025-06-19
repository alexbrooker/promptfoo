import React, { useMemo, useEffect, useState, useRef, forwardRef } from 'react';
import { callAuthenticatedApi } from '@app/utils/api';
import { Box, Typography, Paper, CircularProgress, useTheme, Link, Chip } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
  type GridRowSelectionModel,
  type GridRenderCellParams,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  type GridToolbarQuickFilterProps,
} from '@mui/x-data-grid';

type RedteamEval = {
  createdAt: number;
  datasetId: string;
  description: string | null;
  evalId: string;
  isRedteam: number;
  label: string;
  numTests: number;
  passRate: number;
};

// augment the props for the toolbar slot
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    showUtilityButtons: boolean;
    focusQuickFilterOnMount: boolean;
  }
}

const GridToolbarExport = () => (
  <GridToolbarExportContainer>
    <GridCsvExportMenuItem />
  </GridToolbarExportContainer>
);

const QuickFilter = forwardRef<HTMLInputElement, GridToolbarQuickFilterProps>((props, ref) => {
  const theme = useTheme();
  return (
    <GridToolbarQuickFilter
      {...props}
      inputRef={ref}
      placeholder="Search red team reports..."
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    />
  );
});

QuickFilter.displayName = 'QuickFilter';

function CustomToolbar({
  showUtilityButtons,
  focusQuickFilterOnMount,
}: {
  showUtilityButtons: boolean;
  focusQuickFilterOnMount: boolean;
}) {
  const theme = useTheme();
  const quickFilterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusQuickFilterOnMount && quickFilterRef.current) {
      quickFilterRef.current.focus();
    }
  }, [focusQuickFilterOnMount]);

  return (
    <GridToolbarContainer sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
      {showUtilityButtons && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />
          <GridToolbarExport />
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <QuickFilter ref={quickFilterRef} />
    </GridToolbarContainer>
  );
}

export default function RedteamReportsDataGrid({
  onReportSelected,
  showUtilityButtons = false,
  focusQuickFilterOnMount = false,
}: {
  onReportSelected: (evalId: string) => void;
  showUtilityButtons?: boolean;
  focusQuickFilterOnMount?: boolean;
}) {
  const [evals, setEvals] = useState<RedteamEval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  /**
   * Fetch red team evals from the API.
   */
  useEffect(() => {
    const fetchRedteamEvals = async () => {
      try {
        const response = await callAuthenticatedApi('/results', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch evaluations');
        }
        const body = (await response.json()) as { data: RedteamEval[] };
        // Filter for only red team evaluations
        const redteamEvals = body.data.filter((eval_) => eval_.isRedteam);
        setEvals(redteamEvals);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRedteamEvals();
  }, []);

  const handleCellClick = (params: any) => onReportSelected(params.row.evalId);

  const columns: GridColDef<RedteamEval>[] = useMemo(
    () => [
      {
        field: 'evalId',
        headerName: 'Report ID',
        flex: 1,
        renderCell: (params: GridRenderCellParams<RedteamEval>) => (
          <Link
            href={`/report?evalId=${params.row.evalId}`}
            onClick={(e) => {
              e.preventDefault();
              onReportSelected(params.row.evalId);
              return false;
            }}
            sx={{ fontFamily: 'monospace' }}
          >
            {params.row.evalId}
          </Link>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        renderCell: (params: GridRenderCellParams<RedteamEval>) => (
          <Typography variant="body2">
            {params.row.description || 'Untitled Red Team Evaluation'}
          </Typography>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        flex: 1,
        type: 'dateTime',
        valueGetter: (params) => new Date(params * 1000),
        renderCell: (params: GridRenderCellParams<RedteamEval>) => (
          <Typography variant="body2">
            {new Date(params.row.createdAt * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        ),
      },
      {
        field: 'numTests',
        headerName: 'Tests',
        width: 100,
        type: 'number',
        renderCell: (params: GridRenderCellParams<RedteamEval>) => (
          <Typography variant="body2">
            {params.row.numTests.toLocaleString()}
          </Typography>
        ),
      },
      {
        field: 'passRate',
        headerName: 'Pass Rate',
        width: 120,
        type: 'number',
        renderCell: (params: GridRenderCellParams<RedteamEval>) => {
          const passRate = params.row.passRate;
          const color = passRate >= 0.8 ? 'success' : passRate >= 0.6 ? 'warning' : 'error';
          return (
            <Chip
              label={`${(passRate * 100).toFixed(1)}%`}
              color={color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'label',
        headerName: 'Type',
        width: 150,
        renderCell: (params: GridRenderCellParams<RedteamEval>) => (
          <Chip
            label={params.row.label || 'Red Team'}
            color="secondary"
            size="small"
            variant="filled"
          />
        ),
      },
    ],
    [onReportSelected],
  );

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          Error loading red team reports
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {error.message}
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading red team reports...
        </Typography>
      </Paper>
    );
  }

  if (evals.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Red Team Reports Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Run a red team evaluation to see reports here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Red Team Security Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {evals.length} report{evals.length !== 1 ? 's' : ''} found
      </Typography>
      
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={evals}
          columns={columns}
          getRowId={(row) => row.evalId}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          onCellClick={handleCellClick}
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomToolbar,
          }}
          slotProps={{
            toolbar: {
              showUtilityButtons,
              focusQuickFilterOnMount,
            },
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'createdAt', sort: 'desc' }],
            },
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>
    </Box>
  );
}