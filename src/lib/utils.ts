import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Shows both Eastern time and local time for debugging purposes
 * @param date - The date to analyze
 * @returns Object with both Eastern and local time representations
 */
export function getTimeComparison(date: Date | string | null | undefined) {
  if (!date) return { eastern: 'Unknown', local: 'Unknown', original: 'Unknown' };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return { eastern: 'Invalid Date', local: 'Invalid Date', original: String(date) };
    }
    
    // Format in Eastern time
    const easternTime = dateObj.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
    
    // Format in local time
    const localTime = dateObj.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
    
    return {
      eastern: easternTime,
      local: localTime,
      original: dateObj.toString(),
      iso: dateObj.toISOString()
    };
  } catch (error) {
    console.warn('Error in getTimeComparison:', error);
    return { eastern: 'Error', local: 'Error', original: String(date) };
  }
}

/**
 * Converts a date from Eastern time (backend) to the user's local time zone
 * @param date - The date string or Date object (backend now sends Eastern time)
 * @returns A Date object in the user's local time zone
 */
export function convertEasternToLocal(date: string | Date): Date {
  if (!date) return new Date();
  
  try {
    const dateString = typeof date === 'string' ? date : date.toString();
    
    // Create a date object from the input
    const inputDate = new Date(dateString);
    
    // Check if the input date is valid
    if (isNaN(inputDate.getTime())) {
      console.warn('Invalid date input:', date);
      return new Date();
    }
    
    // IMPORTANT: The backend now converts UTC to Eastern time before sending
    // So we receive Eastern time and need to convert it to local time
    
    // Get the user's current timezone offset
    const userOffset = new Date().getTimezoneOffset(); // in minutes
    
    // Eastern time offset (EST is UTC-5, EDT is UTC-4)
    // We'll use EDT (UTC-4) as baseline since we're in summer
    const easternOffset = -4 * 60; // -240 minutes for EDT
    
    // Calculate the difference between Eastern time and user's local time
    const offsetDifference = easternOffset - userOffset;
    
    // Apply the offset difference to convert from Eastern to local
    const convertedDate = new Date(inputDate.getTime() + (offsetDifference * 60 * 1000));
    
    return convertedDate;
    
  } catch (error) {
    console.warn('Error in convertEasternToLocal (Eastern conversion):', error);
    return new Date();
  }
}

/**
 * Converts a date from UTC time (backend) to the user's local time zone
 * @param date - The date string or Date object (backend sends UTC time)
 * @returns A Date object in the user's local time zone
 */
export function convertUTCToLocal(date: string | Date): Date {
  if (!date) return new Date();
  
  try {
    const dateString = typeof date === 'string' ? date : date.toString();
    
    // Create a date object from the input
    const inputDate = new Date(dateString);
    
    // Check if the input date is valid
    if (isNaN(inputDate.getTime())) {
      console.warn('Invalid date input:', date);
      return new Date();
    }
    
    // IMPORTANT: The backend is actually sending UTC time (indicated by 'Z' suffix)
    // NOT Eastern time as we initially assumed
    // When we create a Date object from UTC, JavaScript automatically converts it to local time
    // So we don't need to apply any additional offsets
    
    // Return the date as-is since JavaScript handles UTC to local conversion automatically
    return inputDate;
    
  } catch (error) {
    console.warn('Error in convertUTCToLocal (UTC conversion):', error);
    return new Date();
  }
}

/**
 * Smart time conversion that detects whether backend sends UTC or Eastern time
 * @param date - The date string or Date object from backend
 * @returns A Date object in the user's local time zone
 */
export function convertBackendTimeToLocal(date: string | Date): Date {
  if (!date) return new Date();
  
  try {
    const dateString = typeof date === 'string' ? date : date.toString();
    
    // Check if the backend is sending UTC time (has 'Z' suffix)
    if (typeof dateString === 'string' && dateString.includes('Z')) {
      return convertUTCToLocal(date);
    } else {
      return convertEasternToLocal(date);
    }
    
  } catch (error) {
    console.warn('Error in convertBackendTimeToLocal:', error);
    return new Date();
  }
}

/**
 * Formats a date for display in the user's local time zone
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatLocalTime(
  date: Date | string | null | undefined, 
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use default options if none provided
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      ...options
    };
    
    return dateObj.toLocaleString(undefined, defaultOptions);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a date for display with Eastern time zone indication
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string with timezone info
 */
export function formatEasternTime(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use default options if none provided
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
      ...options
    };
    
    return dateObj.toLocaleString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Error formatting Eastern time:', error);
    return 'Invalid Date';
  }
}

/**
 * Debug utility to log time conversion details
 * @param originalDate - The original date from backend
 * @param convertedDate - The converted local date
 * @param label - Label for the log
 */
export function logTimeConversion(
  originalDate: Date | string | null | undefined,
  convertedDate: Date | string | null | undefined,
  label: string = 'Time Conversion'
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`${label} Debug Info`);
    console.log('Original date:', originalDate);
    console.log('Original date type:', typeof originalDate);
    if (originalDate) {
      console.log('Original date ISO:', new Date(originalDate).toISOString());
      console.log('Original date local string:', new Date(originalDate).toString());
    }
    console.log('Converted date:', convertedDate);
    console.log('Converted date type:', typeof convertedDate);
    if (convertedDate) {
      console.log('Converted date ISO:', new Date(convertedDate).toISOString());
      console.log('Converted date local string:', new Date(convertedDate).toString());
    }
    console.log('User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('User timezone offset:', new Date().getTimezoneOffset(), 'minutes');
    console.groupEnd();
  }
}

/**
 * Gets the user's current timezone information
 * @returns Object with timezone details
 */
export function getUserTimezoneInfo() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetString = `${offset >= 0 ? '-' : '+'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  
  return {
    timezone,
    offset,
    offsetString,
    offsetHours,
    offsetMinutes
  };
}

/**
 * Formats a date with custom options and timezone indication
 * @param date - The date to format
 * @param format - Format type: 'short', 'medium', 'long', 'full', or 'custom'
 * @param customOptions - Custom Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateWithOptions(
  date: Date | string | null | undefined,
  format: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'medium',
  customOptions?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        break;
      case 'medium':
        options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        };
        break;
      case 'long':
        options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'long'
        };
        break;
      case 'full':
        options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'long'
        };
        break;
      case 'custom':
        options = customOptions || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        break;
    }
    
    return dateObj.toLocaleString(undefined, options);
  } catch (error) {
    console.warn('Error formatting date with options:', error);
    return 'Invalid Date';
  }
}
