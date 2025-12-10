import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

type Props = {
  orderId: string;
  className?: string;
};

export const DownloadInvoiceButton: React.FC<Props> = ({ orderId, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const file = await api.orders.downloadInvoice(orderId);
      const blob = file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order_${orderId}_invoice.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée');
    } catch (error) {
      console.error(error);
      toast.error('Impossible de télécharger la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-4 py-2 rounded-md transition-colors ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Préparation...' : 'Télécharger la facture'}
    </button>
  );
};
