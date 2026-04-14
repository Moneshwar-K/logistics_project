import { createError } from '../middleware/errorHandler';
import { OperationStatusUpdate, IOperationStatusUpdate } from '../models';
import { Shipment, ShipmentStatus } from '../models';
import { shipmentService } from './shipmentService';
import { trackingService } from './trackingService';
import mongoose from 'mongoose';

// Status transition validation (same as shipmentService)
const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'on_hold', 'manifested'],
  manifested: ['dispatched', 'on_hold'],
  dispatched: ['in_transit', 'received_at_hub', 'on_hold'],
  in_transit: ['in_port', 'received_at_hub', 'received_at_destination', 'ready_for_delivery', 'exception'],
  received_at_hub: ['in_transit', 'received_at_destination', 'on_hold'],
  in_port: ['customs_clearance', 'on_hold'],
  received_at_destination: ['customs_clearance', 'ready_for_delivery', 'on_hold'],
  customs_clearance: ['ready_for_delivery', 'exception'],
  ready_for_delivery: ['out_for_delivery', 'out_for_pickup', 'on_hold'],
  out_for_delivery: ['delivered', 'exception'],
  out_for_pickup: ['delivered', 'exception'],
  delivered: [],
  on_hold: ['in_transit', 'received_at_destination', 'pending', 'exception'],
  exception: ['in_transit', 'on_hold', 'pending'],
  cancelled: [],
};

function isValidStatusTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) || false;
}

export const operationService = {
  async updateStatus(
    data: { hawb: string; new_status: ShipmentStatus; update_date: string; remarks?: string },
    updatedById: string,
    branchId: string
  ): Promise<IOperationStatusUpdate> {
    // Get shipment by HAWB
    const shipment = await Shipment.findOne({ hawb: data.hawb.toUpperCase() });
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    const previousStatus = shipment.status;

    // Validate status transition
    if (!isValidStatusTransition(previousStatus, data.new_status)) {
      throw createError(
        `Invalid status transition from ${previousStatus} to ${data.new_status}`,
        400
      );
    }

    // Don't allow updates to delivered or cancelled shipments
    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      throw createError('Cannot update delivered or cancelled shipments', 400);
    }

    // Update shipment status
    await shipmentService.updateShipment(shipment._id.toString(), {
      status: data.new_status,
    });

    // Create tracking event
    await trackingService.createTrackingEvent(
      shipment._id.toString(),
      {
        status: data.new_status,
        location: shipment.current_location || shipment.destination_city,
        city: shipment.destination_city,
        country: shipment.destination_country,
        remarks: data.remarks,
      },
      updatedById
    );

    // Create operation status update record
    const update = await OperationStatusUpdate.create({
      shipment_id: shipment._id,
      previous_status: previousStatus,
      new_status: data.new_status,
      update_date: new Date(data.update_date),
      remarks: data.remarks || undefined,
      updated_by_id: new mongoose.Types.ObjectId(updatedById),
      branch_id: new mongoose.Types.ObjectId(branchId),
    });

    return update.toObject() as unknown as IOperationStatusUpdate;
  },

  async getHistory(shipmentId: string): Promise<IOperationStatusUpdate[]> {
    const history = await OperationStatusUpdate.find({ shipment_id: shipmentId })
      .sort({ created_at: -1 })
      .populate('updated_by_id', 'name email')
      .lean<IOperationStatusUpdate[]>();
    return history as unknown as IOperationStatusUpdate[];
  },
};
