import React from 'react';
import { Badge } from '../ui/badge';
import type { OrderStatus } from '../../pages/OrdersPage';

const tone: Record<string, string> = {
  completed: 'bg-green-500 text-white',
  delivered: 'bg-green-500 text-white',
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-yellow-500 text-white',
  shipped: 'bg-yellow-500 text-white',
  cancelled: 'bg-red-500 text-white',
  canceled: 'bg-red-500 text-white',
};

const label: Record<string, string> = {
  completed: 'Completed',
  delivered: 'Completed',
  pending: 'Pending',
  processing: 'Pending',
  shipped: 'Pending',
  cancelled: 'Canceled',
  canceled: 'Canceled',
};

type Props = {
  status: OrderStatus;
};

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const className = tone[status] || 'bg-slate-100 text-slate-700';
  const text = label[status] || status;

  return (
    <Badge className={`${className} px-3 py-1.5 rounded-full text-[11px] font-semibold border-0`}>
      {text}
    </Badge>
  );
};
