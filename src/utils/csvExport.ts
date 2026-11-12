import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Transaction } from '../types/database';
import { toast } from '../store/toastStore';
import { getErrorMessage } from './errors';

export async function exportTransactionsToCSV(transactions: Transaction[]): Promise<void> {
  if (transactions.length === 0) {
    toast.info('There are no transactions available to export.', 'No Transactions');
    return;
  }

  const headers = ['Date', 'Title', 'Type', 'Category', 'Account', 'Amount', 'Payment Method', 'Notes'];
  const rows = transactions.map((t) => [
    `"${t.date}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category?.name || 'Uncategorized'}"`,
    `"${t.account?.name || 'Default'}"`,
    t.amount.toString(),
    `"${t.payment_method || ''}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `montra_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV statement downloaded.', 'Export Complete');
      return;
    }

    const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    const filename = `${docDir}montra_transactions_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(filename, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filename, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Montra Transactions',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      toast.success(`CSV saved to ${filename}`, 'Export Complete');
    }
  } catch (error: unknown) {
    toast.error(getErrorMessage(error, 'Failed to export CSV.'), 'Export Failed');
  }
}
