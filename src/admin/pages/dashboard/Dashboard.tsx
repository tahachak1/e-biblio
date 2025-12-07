import { ReactElement } from 'react';
import { Box } from '@mui/material';
import { GridRowsProp } from '@mui/x-data-grid';
import { SaleItem } from 'data/sales-data';
import { CustomerFulfillmentProps } from 'data/chart-data/customer-fulfillment';
import { LevelProps } from 'data/chart-data/level';
import { VisitorInsightsProps } from 'data/chart-data/visitor-insights';
import { ProductItem } from 'data/product-data';
import { TrendingItem } from 'data/trending-items';

import CustomerFulfillment from 'components/sections/dashboard/customer-fulfilment/CustomerFulfillment';
import VisitorInsights from 'components/sections/dashboard/visitor-insights/VisitorInsights';
import TodaysSales from 'components/sections/dashboard/todays-sales/TodaysSales';
import TopProducts from 'components/sections/dashboard/top-products/TopProducts';
import TrendingNow from 'components/sections/dashboard/trending-now/TrendingNow';
import Customers from 'components/sections/dashboard/customers/Customers';
import Earnings from 'components/sections/dashboard/earnings/Earnings';
import Level from 'components/sections/dashboard/level/Level';

type EarningsData = {
  totalExpense?: number;
  profitNote?: string;
  gaugeValue?: number;
};

type DashboardProps = {
  sales?: SaleItem[];
  fulfillmentData?: CustomerFulfillmentProps;
  levelData?: LevelProps;
  visitorInsights?: VisitorInsightsProps;
  products?: ProductItem[];
  trendingItems?: TrendingItem[];
  customers?: GridRowsProp;
  earnings?: EarningsData;
  loadingCustomers?: boolean;
};

const Dashboard = ({
  sales,
  fulfillmentData,
  levelData,
  visitorInsights,
  products,
  trendingItems,
  customers,
  earnings,
  loadingCustomers,
}: DashboardProps): ReactElement => {
  return (
    <>
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 8' }} order={{ xs: 0 }}>
          <TodaysSales sales={sales} />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }} order={{ xs: 1, '2xl': 1 }}>
          <Level data={levelData} />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }} order={{ xs: 2, '2xl': 2 }}>
          <TopProducts products={products} />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 3, xl: 3, '2xl': 3 }}
        >
          <CustomerFulfillment data={fulfillmentData} />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 4, xl: 5, '2xl': 4 }}
        >
          <Earnings
            totalExpense={earnings?.totalExpense}
            profitNote={earnings?.profitNote}
            gaugeValue={earnings?.gaugeValue}
          />
        </Box>
        <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }} order={{ xs: 5, xl: 4, '2xl': 5 }}>
          <VisitorInsights data={visitorInsights} />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', xl: 'span 8', '2xl': 'span 6' }}
          order={{ xs: 6, '2xl': 6 }}
        >
          <TrendingNow items={trendingItems} />
        </Box>
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 6' }} order={{ xs: 7 }}>
          <Customers rows={customers} loading={loadingCustomers} />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
