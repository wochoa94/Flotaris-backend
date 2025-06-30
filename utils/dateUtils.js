import { startOfDay, endOfDay } from 'date-fns';

/**
 * Checks if two date intervals overlap
 * @param {Date} newStart - Start date of the new interval
 * @param {Date} newEnd - End date of the new interval
 * @param {Date} existingStart - Start date of the existing interval
 * @param {Date} existingEnd - End date of the existing interval
 * @returns {boolean} True if intervals overlap, false otherwise
 */
export function checkOverlap(newStart, newEnd, existingStart, existingEnd) {
  // Normalize dates to start/end of day to handle time components
  const newInterval = {
    start: startOfDay(new Date(newStart)),
    end: endOfDay(new Date(newEnd))
  };
  
  const existingInterval = {
    start: startOfDay(new Date(existingStart)),
    end: endOfDay(new Date(existingEnd))
  };

  // Check for interval overlap: (start1 <= end2) && (end1 >= start2)
  return newInterval.start <= existingInterval.end && newInterval.end >= existingInterval.start;
}

/**
 * Validates that start date is before end date
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @throws {Error} If start date is not before end date
 */
export function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
}

/**
 * Validates that dates are not in the past
 * @param {Date} startDate - The start date to validate
 * @throws {Error} If start date is in the past
 */
export function validateFutureDate(startDate) {
  const start = startOfDay(new Date(startDate));
  const today = startOfDay(new Date());
  
  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }
}