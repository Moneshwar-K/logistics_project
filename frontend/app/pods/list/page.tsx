'use client';

import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';

interface PODItem {
    _id: string;
    shipment_id: {
        hawb: string;
        origin_city: string;
        destination_city: string;
        status: string;
        shipper_id?: { name: string };
        consignee_id?: { name: string };
    };
    receiver_name: string;
    receiver_contact: string;
    delivery_date: string;
    delivery_time: string;
    remarks?: string;
    created_by_id?: { name: string; email: string };
    created_at: string;
}

export default function PODListPage() {
    const [pods, setPods] = useState<PODItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPODs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.listPODs();
            setPods(response?.data || []);
        } catch (err: any) {
            console.error('Failed to load PODs:', err);
            setError(err.message || 'Failed to load PODs');
            setPods([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPODs();
    }, [fetchPODs]);

    return (
        <MainLayout title="Proof of Delivery">
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proof of Delivery</h1>
                    <p className="text-gray-500 text-sm mt-1">View all delivery confirmations</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Total PODs</p>
                        <p className="text-2xl font-bold mt-1">{pods.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Latest Delivery</p>
                        <p className="text-lg font-bold mt-1">
                            {pods.length > 0
                                ? new Date(pods[0].delivery_date).toLocaleDateString()
                                : '—'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* PODs Table */}
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="animate-pulse p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : pods.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <p className="text-4xl mb-3">📸</p>
                        <h3 className="text-lg font-semibold text-gray-800">No PODs Found</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Proof of Delivery records will appear here once deliveries are confirmed.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">HAWB</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Receiver</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Route</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Delivery Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pods.map((pod) => (
                                    <tr key={pod._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-blue-600">
                                            {pod.shipment_id?.hawb || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800">{pod.receiver_name}</p>
                                                <p className="text-xs text-gray-500">{pod.receiver_contact}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {pod.shipment_id?.origin_city} → {pod.shipment_id?.destination_city}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {new Date(pod.delivery_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{pod.delivery_time}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {pod.created_by_id?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[150px]">
                                            {pod.remarks || '—'}
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
