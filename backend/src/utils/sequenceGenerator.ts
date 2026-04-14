import { Sequence } from '../models/Sequence';

/**
 * Generate next sequence number with atomic increment
 * Format: {PREFIX}{YYYY}{6-digit-number}
 * Example: HAW2026000001
 */
export async function getNextSequence(
    sequenceName: string,
    prefix: string
): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Find and update in a single atomic operation
    const sequence = await Sequence.findOneAndUpdate(
        {
            name: sequenceName,
            year: currentYear,
        },
        {
            $inc: { current_value: 1 },
            $setOnInsert: {
                name: sequenceName,
                prefix: prefix,
                year: currentYear,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );

    // Format: PREFIX + YYYY + 6-digit number
    const paddedNumber = sequence.current_value.toString().padStart(6, '0');
    return `${prefix}${currentYear}${paddedNumber}`;
}

/**
 * Get current sequence value without incrementing
 */
export async function getCurrentSequence(
    sequenceName: string
): Promise<number> {
    const currentYear = new Date().getFullYear();

    const sequence = await Sequence.findOne({
        name: sequenceName,
        year: currentYear,
    });

    return sequence?.current_value || 0;
}

/**
 * Reset sequence to a specific value
 * Use with caution - mainly for data migration
 */
export async function resetSequence(
    sequenceName: string,
    value: number
): Promise<void> {
    const currentYear = new Date().getFullYear();

    await Sequence.findOneAndUpdate(
        {
            name: sequenceName,
            year: currentYear,
        },
        {
            $set: { current_value: value },
        },
        {
            upsert: true,
        }
    );
}
