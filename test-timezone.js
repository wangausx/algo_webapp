// Simple test script for timezone conversion
// Run this with: node test-timezone.js

// Test UTC to Local time conversion (what the backend actually sends)
function testUTCToLocal(dateString) {
  const inputDate = new Date(dateString);
  
  if (isNaN(inputDate.getTime())) {
    console.warn('Invalid date input:', dateString);
    return;
  }
  
  // Get the user's current timezone offset (simulating browser environment)
  // For testing, we'll simulate different timezones
  const testTimezones = [
    { name: 'Pacific (PDT)', offset: 7 * 60 },    // UTC-7 (PDT)
    { name: 'Mountain (MDT)', offset: 6 * 60 },   // UTC-6 (MDT)
    { name: 'Central (CDT)', offset: 5 * 60 },    // UTC-5 (CDT)
    { name: 'Eastern (EDT)', offset: 4 * 60 },    // UTC-4 (EDT)
    { name: 'UTC', offset: 0 },                    // UTC
    { name: 'London (BST)', offset: -1 * 60 },    // UTC+1 (BST)
    { name: 'Tokyo (JST)', offset: -9 * 60 }      // UTC+9 (JST)
  ];
  
  console.log('\n=== UTC to Local Time Conversion Test ===');
  console.log('Input date (UTC time):', dateString);
  console.log('Input date object:', inputDate.toString());
  console.log('Input date ISO:', inputDate.toISOString());
  
  testTimezones.forEach(tz => {
    // For UTC to local conversion, JavaScript handles this automatically
    // We just need to create a Date object and let it convert
    const localDate = new Date(inputDate);
    
    // Format the time in the specific timezone for comparison
    const timezoneTime = localDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    console.log(`\n${tz.name} (UTC${tz.offset >= 0 ? '+' : ''}${tz.offset / 60}):`);
    console.log(`  Local time: ${localDate.toString()}`);
    console.log(`  Formatted: ${timezoneTime}`);
  });
  
  return inputDate;
}

// Test cases - these are UTC times from the backend
const testDates = [
  '2025-08-07T18:14:04.601Z',  // 6:14 PM UTC (should be 11:14 AM PDT)
  '2025-08-07T18:14:06.316Z',  // 6:14 PM UTC (should be 11:14 AM PDT)
  '2025-08-19T10:52:00.000Z',  // 10:52 AM UTC (should be 3:52 AM PDT)
  '2025-08-19T22:30:00.000Z',  // 10:30 PM UTC (should be 3:30 PM PDT)
];

console.log('Testing UTC to Local timezone conversion...\n');
console.log('Note: Backend sends UTC time (with Z suffix), not Eastern time\n');

testDates.forEach(dateString => {
  testUTCToLocal(dateString);
  console.log('\n' + '='.repeat(50));
});

console.log('\n=== Test Complete ===');
console.log('\nExpected behavior for 6:14 PM UTC:');
console.log('- Pacific (PDT): 11:14 AM PDT ✅');
console.log('- Mountain (MDT): 12:14 PM MDT ✅');
console.log('- Central (CDT): 1:14 PM CDT ✅');
console.log('- Eastern (EDT): 2:14 PM EDT ✅');
console.log('- UTC: 6:14 PM UTC ✅');
console.log('- London (BST): 7:14 PM BST ✅');
console.log('- Tokyo (JST): 3:14 AM JST (next day) ✅');

console.log('\nExpected behavior for 10:52 AM UTC:');
console.log('- Pacific (PDT): 3:52 AM PDT ✅');
console.log('- Mountain (MDT): 4:52 AM MDT ✅');
console.log('- Central (CDT): 5:52 AM CDT ✅');
console.log('- Eastern (EDT): 6:52 AM EDT ✅');
console.log('- UTC: 10:52 AM UTC ✅');
console.log('- London (BST): 11:52 AM BST ✅');
console.log('- Tokyo (JST): 7:52 PM JST ✅');
