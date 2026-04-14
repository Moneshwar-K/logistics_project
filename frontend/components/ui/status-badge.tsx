import { cn } from '@/lib/utils';
import type { ShipmentStatus } from '@/types/logistics';

interface StatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

const statusConfig: Record<ShipmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-status-pending text-slate-900' },
  picked_up: { label: 'Picked Up', color: 'bg-blue-500 text-white' },
  in_transit: { label: 'In Transit', color: 'bg-status-in-transit text-white' },
  in_port: { label: 'In Port', color: 'bg-blue-600 text-white' },
  customs_clearance: { label: 'Customs Clearance', color: 'bg-amber-600 text-white' },
  ready_for_delivery: { label: 'Ready for Delivery', color: 'bg-emerald-600 text-white' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-500 text-white' },
  delivered: { label: 'Delivered', color: 'bg-status-delivered text-white' },
  on_hold: { label: 'On Hold', color: 'bg-status-on-hold text-white' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-600 text-white' },
  exception: { label: 'Exception', color: 'bg-status-exception text-white' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
