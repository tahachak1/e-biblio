import { ReactElement } from 'react';
import {
  Paper,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';
import { ProductItem, productTableRows } from 'data/product-data';
import ProductItemRow from './ProductItemRow';
import SimpleBar from 'simplebar-react';

const TopProducts = ({ products }: { products?: ProductItem[] }): ReactElement => {
  const rows = products && products.length > 0 ? products : productTableRows;

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={6}>
        Top Products
      </Typography>
      <TableContainer component={SimpleBar}>
        <Table sx={{ minWidth: 440 }}>
          <TableHead>
            <TableRow>
              <TableCell align="left">#</TableCell>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">Popularity</TableCell>
              <TableCell align="center">Sales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((product) => (
              <ProductItemRow key={product.id} productItem={product} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopProducts;
