import { createError } from '../middleware/errorHandler';
import { DriverAssignment, IDriverAssignment } from '../models';
import { Shipment } from '../models';
import { User } from '../models';
import mongoose from 'mongoose';

export const driverService = {
  async listAssignments(filters: { driver_id?: string; status?: string }) {
    const query: any = {};

    if (filters.driver_id) {
      query.driver_id = new mongoose.Types.ObjectId(filters.driver_id);
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const assignments = await DriverAssignment.find(query)
      .populate('driver_id', 'name email phone vehicle_number')
      .populate('shipment_id', '-__v')
      .sort({ created_at: -1 })
      .lean<IDriverAssignment[]>();

    return assignments as unknown as IDriverAssignment[];
  },

  async getDriverAssignments(driverId: string): Promise<IDriverAssignment[]> {
    const assignments = await DriverAssignment.find({ driver_id: driverId })
      .populate('shipment_id', '-__v')
      .populate('driver_id', 'name email')
      .sort({ created_at: -1 })
      .lean<IDriverAssignment[]>();

    return assignments as unknown as IDriverAssignment[];
  },

  async assignShipment(
    shipmentId: string,
    driverId: string,
    assignedById: string
  ): Promise<IDriverAssignment> {
    // Verify shipment exists
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Verify driver exists and is a driver
    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      throw createError('Driver not found or invalid role', 404);
    }

    // Check if assignment already exists
    const existing = await DriverAssignment.findOne({
      shipment_id: shipmentId,
      status: { $in: ['assigned', 'in_progress'] },
    });

    if (existing) {
      throw createError('Shipment is already assigned to a driver', 400);
    }

    // Create assignment
    const assignment = await DriverAssignment.create({
      driver_id: new mongoose.Types.ObjectId(driverId),
      shipment_id: new mongoose.Types.ObjectId(shipmentId),
      assigned_date: new Date(),
      assigned_by_id: new mongoose.Types.ObjectId(assignedById),
      status: 'assigned',
    });

    return this.getAssignment(assignment._id.toString());
  },

  async getAssignment(id: string): Promise<IDriverAssignment> {
    const assignment = await DriverAssignment.findById(id)
      .populate('driver_id', 'name email phone vehicle_number')
      .populate('shipment_id', '-__v')
      .lean<IDriverAssignment>();

    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    return assignment as unknown as IDriverAssignment;
  },

  async updateStatus(
    id: string,
    status: string,
    location?: string
  ): Promise<IDriverAssignment> {
    const assignment = await DriverAssignment.findById(id);
    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    const updateData: any = {
      status,
    };

    if (location) {
      updateData.current_location = location;
    }

    await DriverAssignment.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    return this.getAssignment(id);
  },

  async completeAssignment(
    id: string,
    completionData: { notes?: string; location?: string }
  ): Promise<IDriverAssignment> {
    const assignment = await DriverAssignment.findById(id);
    if (!assignment) {
      throw createError('Assignment not found', 404);
    }

    await DriverAssignment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'completed',
          completed_date: new Date(),
          current_location: completionData.location || assignment.current_location,
          notes: completionData.notes || assignment.notes,
        },
      },
      { new: true }
    );

    return this.getAssignment(id);
  },
};
