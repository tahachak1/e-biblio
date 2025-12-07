import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { OrderStatus } from '../../pages/OrdersPage';

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: OrderStatus | 'all';
  onStatusChange: (value: OrderStatus | 'all') => void;
  sortBy: 'recent' | 'amount-asc' | 'amount-desc';
  onSortChange: (value: 'recent' | 'amount-asc' | 'amount-desc') => void;
};

export const FilterBar: React.FC<Props> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, customer or title..."
            className="pl-10 h-11 rounded-xl bg-white border border-slate-200 focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as OrderStatus | 'all')}>
          <SelectTrigger className="h-11 rounded-xl bg-white border border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Canceled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => onSortChange(v as 'recent' | 'amount-asc' | 'amount-desc')}>
          <SelectTrigger className="h-11 rounded-xl bg-white border border-slate-200">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
            <SelectItem value="amount-asc">Amount: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
