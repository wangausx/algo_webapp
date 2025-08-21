# Timezone Conversion Implementation

## Overview

This application handles timezone conversion from UTC time (backend) to the user's local timezone (frontend). The backend sends all time data in UTC (indicated by the 'Z' suffix), and the frontend converts it to display in the user's local timezone.

## How It Works

### 1. Backend Time Data
- All timestamps from the backend are in UTC time (not Eastern time as initially assumed)
- This is indicated by the 'Z' suffix in the ISO string (e.g., "2025-08-07T18:14:04.601Z")
- UTC is the universal time standard and doesn't change with daylight saving time

### 2. Frontend Conversion
- When time data is received from the backend, it's converted using the `convertEasternToLocal()` function
- Since the backend sends UTC time, JavaScript automatically handles the conversion to local time
- No manual offset calculations are needed

### 3. Key Functions

#### `convertEasternToLocal(date: string | Date): Date`
- Converts a date from UTC time (backend) to local time
- JavaScript Date objects automatically handle UTC to local conversion
- Returns a Date object in the user's local timezone

#### `convertEasternToLocalProper(date: string | Date): Date`
- Alternative conversion function for cases where Eastern time conversion is needed
- Calculates the difference between Eastern time and user's local time
- Applies the correct offset adjustment

#### `formatLocalTime(date, options?)`
- Formats a date for display in the user's local timezone
- Uses the browser's default locale settings
- Includes timezone abbreviation

#### `formatDateWithOptions(date, format, customOptions?)`
- Provides multiple formatting options: 'short', 'medium', 'long', 'full', 'custom'
- Allows custom formatting with Intl.DateTimeFormatOptions
- Automatically uses local timezone

#### `getUserTimezoneInfo()`
- Returns information about the user's current timezone
- Includes timezone name, offset, and formatted offset string

#### `getTimeComparison(date)`
- Shows both Eastern and local time for debugging purposes
- Useful for troubleshooting timezone conversion issues

## Implementation Details

### Data Flow
1. Backend sends time data in UTC (e.g., "2025-08-07T18:14:04.601Z")
2. Frontend receives the data in hooks (`useOrders`, `usePositions`)
3. Time conversion happens using `convertEasternToLocal()`
4. JavaScript automatically converts UTC to local time
5. UI displays dates using `formatDateWithOptions()` or `formatLocalTime()`

### Debug Logging
- In development mode, time conversions are logged to the console
- Shows original UTC time, converted local time, and timezone information
- Debug display shows both Eastern and local time in the UI

## Example Usage

```typescript
import { convertEasternToLocal, formatDateWithOptions } from '../lib/utils';

// Convert backend UTC time to local time
const localDate = convertEasternToLocal('2025-08-07T18:14:04.601Z');

// Format for display
const displayTime = formatDateWithOptions(localDate, 'medium');
// Output: "Aug 7, 2025, 11:14 AM PDT" (for Pacific timezone)
```

## Timezone Display

The Dashboard shows the user's current timezone information in the "Today's P/L" card:
- Timezone name (e.g., "America/Los_Angeles")
- UTC offset (e.g., "-07:00" for PDT)

## Troubleshooting

### Common Issues

#### 1. **AM/PM Display Issues**
**Problem**: Times showing PM instead of AM (e.g., 10:52 PM instead of 7:52 AM)

**Cause**: This usually happens when:
- The backend sends time in UTC but the frontend applies incorrect timezone offsets
- Manual timezone conversion is applied when JavaScript handles it automatically
- The time is being treated as Eastern time instead of UTC

**Solution**: 
- Check the browser console for time conversion debug logs
- Verify the backend is sending UTC time (look for 'Z' suffix)
- Use the debug display in the UI to compare times
- Ensure no manual offset calculations are applied to UTC times

#### 2. **Times appear wrong**: Check if the backend is actually sending UTC time
#### 3. **Daylight Saving Time**: JavaScript handles DST automatically for UTC conversion
#### 4. **Browser timezone**: Ensure the browser's timezone is set correctly

### Debug Steps
1. Check browser console for time conversion logs
2. Verify backend timezone format (should have 'Z' suffix for UTC)
3. Test with known UTC time values
4. Check user's browser timezone settings
5. Use the debug display in the UI to see both Eastern and Local time
6. Compare the times with what you expect from the backend

### Debug Display
In development mode, the Orders table shows:
- **Main time**: Converted local time
- **Eastern**: How the time appears in Eastern timezone
- **Local**: How the time appears in your local timezone

This helps identify where the conversion is going wrong.

## Expected Behavior

For a backend time of `2025-08-07T18:14:04.601Z` (6:14 PM UTC):
- **Pacific (PDT)**: 11:14 AM PDT ✅
- **Mountain (MDT)**: 12:14 PM MDT ✅
- **Central (CDT)**: 1:14 PM CDT ✅
- **Eastern (EDT)**: 2:14 PM EDT ✅

## Future Improvements

- Add timezone selection option for users
- Support for more timezone formats
- Better handling of ambiguous times during DST transitions
- Timezone-aware sorting and filtering
- Automatic detection of backend timezone format
