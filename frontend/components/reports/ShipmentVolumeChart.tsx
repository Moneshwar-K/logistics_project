'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

interface ShipmentVolumeChartProps {
    data: any[];
}

export const ShipmentVolumeChart = ({ data }: ShipmentVolumeChartProps) => {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Shipment Volume</h3>
                <p className="text-sm text-muted-foreground">Number of shipments over time</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                            dataKey="date"
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor' }}
                        />
                        <YAxis
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Shipments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
