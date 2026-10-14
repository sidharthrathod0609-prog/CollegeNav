const { 
  validateDepartureTime, 
  containsPhoneNumber, 
  verifyAdminPasskey, 
  updateRouteSchedule, 
  publishTransportAdvisory, 
  resetToCircularDefault 
} = require('../src/services/transportDataService.ts');

async function runTests() {
  console.log('=== TEST 1: Validation Rules ===');
  const v1 = validateDepartureTime('7:05 AM');
  console.log('Validate "7:05 AM":', v1);
  if (!v1.valid) throw new Error('Valid time failed');

  const v2 = validateDepartureTime('invalid_time');
  console.log('Validate "invalid_time":', v2);
  if (v2.valid) throw new Error('Invalid time passed');

  const p1 = containsPhoneNumber('Contact 9848012345');
  console.log('Contains phone "Contact 9848012345":', p1);
  if (!p1) throw new Error('Phone detection failed');

  const p2 = containsPhoneNumber('Departure at 7:00 AM');
  console.log('Contains phone "Departure at 7:00 AM":', p2);
  if (p2) throw new Error('False phone detection');

  console.log('=== TEST 2: Authorization Guard ===');
  const authGood = verifyAdminPasskey('CVR-TRANS-2026');
  const authBad = verifyAdminPasskey('wrong-password');
  console.log('Passkey check (good):', authGood);
  console.log('Passkey check (bad):', authBad);
  if (!authGood || authBad) throw new Error('Auth passkey check failed');

  const unauthResult = await updateRouteSchedule('cvr-route-1', { departureTime: '6:45 AM' }, 'wrong-pass');
  console.log('Unauthorized update result:', unauthResult);
  if (unauthResult.success) throw new Error('Unauthorized update succeeded unexpectedly');

  console.log('=== TEST 3: Phone Number Injection Block ===');
  const phoneInjectResult = await updateRouteSchedule('cvr-route-1', { startingLocation: 'Murthy 9848012345' }, 'CVR-TRANS-2026');
  console.log('Phone injection block result:', phoneInjectResult);
  if (phoneInjectResult.success) throw new Error('Phone injection was not blocked');

  console.log('=== TEST 4: Authorized Route Schedule Update ===');
  const authResult = await updateRouteSchedule('cvr-route-1', { departureTime: '6:45 AM' }, 'CVR-TRANS-2026');
  console.log('Authorized update result:', authResult);
  if (!authResult.success) throw new Error('Authorized update failed');

  console.log('=== TEST 5: Authorized Advisory Publishing ===');
  const advResult = await publishTransportAdvisory({
    title: 'Highway Weather Notice',
    message: 'Dense morning fog on Sagar Highway corridor. Drivers instructed to proceed at safe speeds.',
    routeNumber: 'All Routes',
    type: 'alert',
    severity: 'medium',
    status: 'ACTIVE'
  }, 'CVR-TRANS-2026');
  console.log('Publish advisory result:', advResult);
  if (!advResult.success || !advResult.advisory) throw new Error('Publish advisory failed');

  console.log('=== TEST 6: Reset Defaults ===');
  const resetResult = await resetToCircularDefault('CVR-TRANS-2026');
  console.log('Reset result:', resetResult);
  if (!resetResult.success) throw new Error('Reset failed');

  console.log('>>> ALL 6 VERIFICATION TEST SUITES PASSED! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
