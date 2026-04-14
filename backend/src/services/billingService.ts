import { IShipment } from '../models/Shipment';
import RateSheet from '../models/RateSheet';
import { Branch } from '../models/Branch';
import { logger } from '../utils/logger';

interface ChargeBreakdown {
    freight: number;
    fuel_surcharge: number;
    docket_charge: number;
    total: number;
    rate_applied: number;
    weight_charged: number;
}

export const billingService = {
    // Calculate charges for a shipment
    async calculateCharges(shipment: IShipment): Promise<ChargeBreakdown> {
        try {
            // 1. Determine Chargeable Weight
            // Standard Volumetric Divisor: 5000 (Air), 3000 (Sea/Surface)
            const divisor = shipment.service_type === 'air' ? 5000 : 3000;
            const volWeight = shipment.total_weight_cbm ? (shipment.total_weight_cbm * 1000000) / divisor : 0;
            const chargeableWeight = Math.max(shipment.total_weight, volWeight);

            // 2. Determine Destination Zone
            // Lookup Zone from the branch located in the destination city
            let destinationZone = 'A'; // Default
            const destBranch = await Branch.findOne({ 
                city: { $regex: new RegExp(`^${shipment.destination_city}$`, 'i') },
                status: 'active'
            }).lean();

            if (destBranch && destBranch.zone) {
                destinationZone = destBranch.zone;
            } else {
                logger.info(`No specific zone found for city: ${shipment.destination_city}, using default Zone A`);
            }

            // 3. Find Applicable Rate Sheet
            // Priority: Client Specific > General
            let rateSheet = await RateSheet.findOne({
                client_id: shipment.shipper_id,
                service_type: shipment.service_type,
                status: 'active'
            }).sort({ created_at: -1 });

            if (!rateSheet) {
                rateSheet = await RateSheet.findOne({
                    type: 'general',
                    service_type: shipment.service_type,
                    status: 'active'
                }).sort({ created_at: -1 });
            }

            if (!rateSheet) {
                throw new Error(`Critical: No active rate sheet found for service: ${shipment.service_type}`);
            }

            // 4. Lookup Rate in Sheet
            // Logic: Find row where MinWeight <= ChargeableWeight <= MaxWeight AND Zone matches
            const rateRow = rateSheet.rows.find(r =>
                chargeableWeight >= r.min_weight &&
                chargeableWeight <= r.max_weight &&
                r.zone.toUpperCase() === destinationZone.toUpperCase()
            );

            if (!rateRow) {
                logger.error(`Biling Engine: No matching rate slab for weight ${chargeableWeight} in Zone ${destinationZone}`);
                throw new Error(`Rate slab not defined for weight ${chargeableWeight}kg in Zone ${destinationZone}`);
            }

            const rate = rateRow.rate;

            // 5. Calculate Charges
            const freight = chargeableWeight * rate;

            // Surcharges (Configurable ideally, using standard defaults for now)
            const fuelSurchargePercent = 10; // 10%
            const fuelSurcharge = (freight * fuelSurchargePercent) / 100;
            const docketCharge = 150; // Standard docket fee

            const total = freight + fuelSurcharge + docketCharge;

            return {
                freight: parseFloat(freight.toFixed(2)),
                fuel_surcharge: parseFloat(fuelSurcharge.toFixed(2)),
                docket_charge: parseFloat(docketCharge.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                rate_applied: rate,
                weight_charged: parseFloat(chargeableWeight.toFixed(2))
            };

        } catch (error: any) {
            logger.error('Billing Failure:', { hawb: shipment.hawb, error: error.message });
            throw error;
        }
    }
};
