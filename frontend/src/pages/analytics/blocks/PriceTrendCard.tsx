/**
* @file PriceTrendCard.tsx
* @module pages/analytics/blocks/PriceTrendCard
*
* @summary
* Supplier-aware type-ahead + price trend chart (A3).
*
* Enterprise rules
* - **Never** let cross-supplier selections through when a supplier is chosen.
* - Debounced queries; fetch only after explicit item selection for the chart.
* - When supplier-scoped search is unsupported server-side, keep options empty
* (no silent global downgrade) so the UI can message clearly.
*/
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box, TextField, Stack } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPriceTrend, type ItemRef, type PricePoint } from '../../../api/analytics';
import { searchItemsForSupplier, searchItemsGlobal } from '../../../api/analytics/search';
import { useDebounced } from '../hooks/useDebounced';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';


export type PriceTrendCardProps = { from?: string; to?: string; supplierId?: string | null };


type ItemWithSupplier = ItemRef & { supplierId?: string | null };


export default function PriceTrendCard({ from, to, supplierId }: PriceTrendCardProps) {
    const { t } = useTranslation(['analytics']);
    const muiTheme = useMuiTheme();
    
    
    // Search box state
    const [itemQuery, setItemQuery] = React.useState('');
    const debouncedQuery = useDebounced(itemQuery, 250);
    const [selectedItemId, setSelectedItemId] = React.useState('');
    
    
    // Reset selection when supplier changes
    React.useEffect(() => {
        setItemQuery('');
        setSelectedItemId('');
    }, [supplierId]);
    // Search query (global vs supplier-scoped)
    const itemSearchQ = useQuery<ItemRef[]>({
        queryKey: ['analytics', 'itemSearch', supplierId ?? null, debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery) return [];
            if (supplierId) return searchItemsForSupplier(supplierId, debouncedQuery, 50);
            return searchItemsGlobal(debouncedQuery, 50);
        },
        enabled: debouncedQuery.length >= 1,
        staleTime: 30_000,
    });
    
    
    // Final options: enforce supplier match & text match client-side as well
    const options: ItemWithSupplier[] = React.useMemo(() => {
        const base = (itemSearchQ.data ?? []) as ItemWithSupplier[];
        const sid = supplierId ?? '';
        const q = debouncedQuery.trim().toLowerCase();
        const bySupplier = sid ? base.filter((it) => (it.supplierId ?? '') === sid) : base;
        const byQuery = q ? bySupplier.filter((it) => it.name.toLowerCase().includes(q)) : bySupplier;
        return byQuery.slice(0, 50);
    }, [itemSearchQ.data, supplierId, debouncedQuery]);
    // Clear selection if it no longer exists in the options
    React.useEffect(() => {
        if (selectedItemId && !options.some((it) => it.id === selectedItemId)) {
            setSelectedItemId('');
        }
    }, [options, selectedItemId]);
    
    
    // Price trend for the selected item
    const priceQ = useQuery<PricePoint[]>({
        queryKey: ['analytics', 'priceTrend', selectedItemId, from, to],
        queryFn: () => getPriceTrend(selectedItemId, { from, to, supplierId: supplierId ?? undefined }),
        enabled: !!selectedItemId,
    });
    
    
    const priceData = React.useMemo(
        () => [...(priceQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
        [priceQ.data]
    );
    
    return (
        <Card>
        <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">{t('analytics:cards.priceTrend')}</Typography>
        
        
        <Autocomplete<ItemRef, false, false, false>
        sx={{ minWidth: 320 }}
        options={options}
        getOptionLabel={(o) => o.name}
        loading={itemSearchQ.isLoading}
        value={options.find((it) => it.id === selectedItemId) || null}
        onChange={(_e, val) => setSelectedItemId(val?.id ?? '')}
        inputValue={itemQuery}
        onInputChange={(_e, val) => setItemQuery(val)}
        forcePopupIcon={false}
        clearOnBlur={false}
        selectOnFocus
        handleHomeEndKeys
        filterOptions={(x) => x}
        isOptionEqualToValue={(o, v) => o.id === v.id}
        renderInput={(params: AutocompleteRenderInputParams) => {
            const typed = debouncedQuery.trim().length > 0;
            const showNoMatches = !!supplierId && typed && options.length === 0;
            const showTypeHint = !!supplierId && !typed;
            return (
                <TextField
                {...params}
                size="small"
                label={t('analytics:item')}
                placeholder={t('analytics:priceTrend.selectSupplierShort')}
                helperText={
                    showNoMatches
                    ? t('analytics:priceTrend.noItemsForSupplier')
                    : showTypeHint
                    ? t('analytics:priceTrend.typeToSearch', 'Start typing to search…')
                    : ' '
                }
                FormHelperTextProps={{ sx: { minHeight: 20, mt: 0.5 } }}
                />
            );
        }}
        noOptionsText={
            debouncedQuery
            ? t('analytics:priceTrend.noItemsForSupplier')
            : t('analytics:priceTrend.selectSupplierShort')
        }
        />
        </Stack>
        {!selectedItemId || priceQ.isLoading ? (
            <Skeleton variant="rounded" height={220} />)
            : priceData.length === 0 ? (
                <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
                </Box>
            ) : (
                <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line
                type="monotone"
                dataKey="price"
                stroke={muiTheme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
                />
                </LineChart>
                </ResponsiveContainer>
                </Box>
            )}
            </CardContent>
            </Card>
        );
    }