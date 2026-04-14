'use client';

import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';

interface DocumentItem {
  _id: string;
  file_name: string;
  document_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
  shipment_id?: { hawb: string };
  uploaded_by_id?: { name: string; email: string };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (typeFilter !== 'all') filters.document_type = typeFilter;

      const response = await apiService.listDocuments(filters);
      setDocuments(response?.data || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'invoice': 'Invoice',
      'pod': 'POD',
      'awb': 'AWB',
      'bill_of_lading': 'Bill of Lading',
      'packing_list': 'Packing List',
      'customs_declaration': 'Customs Declaration',
      'insurance': 'Insurance',
      'other': 'Other',
    };
    return labels[type] || type;
  };

  const getDocTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'invoice': 'bg-blue-100 text-blue-700',
      'pod': 'bg-green-100 text-green-700',
      'awb': 'bg-purple-100 text-purple-700',
      'bill_of_lading': 'bg-amber-100 text-amber-700',
      'packing_list': 'bg-teal-100 text-teal-700',
      'customs_declaration': 'bg-red-100 text-red-700',
      'insurance': 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <MainLayout title="Document Center">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and search all shipment documents</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="all">All Types</option>
            <option value="invoice">Invoices</option>
            <option value="pod">PODs</option>
            <option value="awb">AWBs</option>
            <option value="bill_of_lading">Bills of Lading</option>
            <option value="packing_list">Packing Lists</option>
            <option value="customs_declaration">Customs Declarations</option>
            <option value="insurance">Insurance</option>
            <option value="other">Other</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Documents Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="animate-pulse p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📄</p>
            <h3 className="text-lg font-semibold text-gray-800">No Documents Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Documents will appear here as they are uploaded for shipments.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Document</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">HAWB</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        <span className="font-medium text-gray-800 truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocTypeColor(doc.document_type)}`}>
                        {getDocTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {doc.shipment_id?.hawb || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {doc.uploaded_by_id?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
