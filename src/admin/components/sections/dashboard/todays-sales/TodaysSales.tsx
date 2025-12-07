import { ReactElement } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import salesData, { SaleItem } from 'data/sales-data';
import SaleCard from './SaleCard';

const TodaysSales = ({ sales }: { sales?: SaleItem[] }): ReactElement => {
  const items = sales && sales.length > 0 ? sales : salesData;

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={1.25}>
        Today’s Sales
      </Typography>
      <Typography variant="subtitle2" color="text.disabled" mb={6}>
        Sales Summary
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={{ xs: 4, sm: 6 }}>
        {items.map((saleItem) => (
          <Box key={saleItem.id} gridColumn={{ xs: 'span 12', sm: 'span 6', lg: 'span 3' }}>
            <SaleCard saleItem={saleItem} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TodaysSales;
