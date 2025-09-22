/**
* @file ItemUpdateFrequencyCard.tsx
* @module pages/analytics/blocks/ItemUpdateFrequencyCard
*
* @summary
* Most-updated items for a supplier (top N). If no supplier is selected, shows an empty-state hint.
*/
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { getItemUpdateFrequency, type ItemUpdateFrequencyPoint } from '../../../api/analytics/frequency';

export type ItemUpdateFrequencyCardProps = { supplierId?: string | null };

export default function ItemUpdateFrequencyCard({ supplierId }: ItemUpdateFrequencyCardProps) {
    const { t } = useTranslation(['analytics']);
    
    const enabled = !!supplierId;
    const q = useQuery<ItemUpdateFrequencyPoint[]>({
        queryKey: ['analytics', 'itemUpdateFrequency', supplierId ?? null],
        queryFn: () => getItemUpdateFrequency(supplierId ?? ''),
        enabled,
    });
    if (!enabled) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('analytics:frequency.title', 'Top updated items')}</Typography>
                    <Box sx={{ color: 'text.secondary' }}>{t('analytics:frequency.selectSupplier', 'Select a supplier to view')}</Box>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('analytics:frequency.title', 'Top updated items')}</Typography>
                {q.isLoading ? (
                    <Skeleton variant="rounded" height={220} />
                ) : (
                    <Box sx={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q.data ?? []} layout="vertical" margin={{ left: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={140} />
                                <Tooltip />
                                <Bar dataKey="updates" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
