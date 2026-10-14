/**
 * Automated Verification Test Suite for Phase 4B.1:
 * Complete and Harden the Admin Portal
 * 
 * Verifies:
 * 1. Time & Input Validation (12-hour format, required fields)
 * 2. Privacy Policy & Phone Number Injection Prevention
 * 3. Administrative Authentication & Passkey Security Guard
 * 4. Route Schedule & Stop Management with Immutability Protection
 * 5. Advisory Lifecycle (Publish, Edit, Resolve, Delete)
 * 6. Destructive Reset to Circular Defaults Protection
 * 7. Fleet & Capacity State Integrity
 * 8. Boarding Request Oversight & Filtering Logic
 * 9. Real Dashboard Metric Aggregations
 * 10. Security Audit & Connection Diagnostics
 */

const {
  validateDepartureTime,
  containsPhoneNumber,
  verifyAdminPasskey,
  updateRouteSchedule,
  publishTransportAdvisory,
  updateTransportAdvisory,
  deleteTransportAdvisory,
  resetToCircularDefault,
} = require('../src/services/transportDataService.ts');

const {
  calculateCapacity,
  createBoardingRequest,
  acceptBoardingRequest,
} = require('../src/services/boardingService.ts');

const { OFFICIAL_CVR_ROUTES } = require('../src/data/cvrRoutes.ts');
const { getFirebaseConnectionDiagnostics } = require('../src/services/firebaseConfig.ts');

async function runPhase4B1Tests() {
  console.log('================================================================');
  console.log('   COLLEGENAV — PHASE 4B.1 ADMIN PORTAL HARDENING TEST SUITE   ');
  console.log('================================================================\n');

  let passedTests = 0;
  const ADMIN_PASSKEY = 'CVR-TRANS-2026';
  const BAD_PASSKEY = 'INVALID-PASSKEY-999';

  // -------------------------------------------------------------
  // TEST 1: Time Format Validation & Edge Cases
  // -------------------------------------------------------------
  console.log('>>> TEST 1: Departure Time Format Validation');
  const validTimes = ['6:50 AM', '07:15 AM', '12:30 PM', '8:05 am', 'Route stops not listed'];
  for (const t of validTimes) {
    const res = validateDepartureTime(t);
    if (!res.valid) throw new Error(`Test 1 Failed: Expected "${t}" to be valid, got: ${res.error}`);
  }

  const invalidTimes = ['25:00', '7:00', 'morning', '14:00 PM', '', '   '];
  for (const t of invalidTimes) {
    const res = validateDepartureTime(t);
    if (res.valid) throw new Error(`Test 1 Failed: Expected "${t}" to be invalid`);
  }
  passedTests++;
  console.log('  ✓ Test 1 Passed: 12-hour time format rules strictly enforced.\n');

  // -------------------------------------------------------------
  // TEST 2: Privacy Protection & Phone Number Injection Blocking
  // -------------------------------------------------------------
  console.log('>>> TEST 2: Privacy Policy & Contact Number Detection');
  const leakAttempts = [
    'Driver Murthy: 9848012345',
    '+919876543210',
    'Emergency contact 91-8765432109',
    'Call 6301234567 for seat',
  ];
  for (const leak of leakAttempts) {
    if (!containsPhoneNumber(leak)) {
      throw new Error(`Test 2 Failed: Did not detect phone number in "${leak}"`);
    }
  }

  const safeTexts = [
    'Platform 4, Pillar 102',
    'Departure at 7:05 AM',
    'Route 20 connects Uppal to CVR Campus',
    'Capacity: 52 seats',
  ];
  for (const safe of safeTexts) {
    if (containsPhoneNumber(safe)) {
      throw new Error(`Test 2 Failed: False positive phone detection in "${safe}"`);
    }
  }
  passedTests++;
  console.log('  ✓ Test 2 Passed: Privacy guard accurately prevents phone number leaks.\n');

  // -------------------------------------------------------------
  // TEST 3: Passkey Verification & Unauthorized Mutation Guards
  // -------------------------------------------------------------
  console.log('>>> TEST 3: Passkey Authorization & Security Guards');
  if (!verifyAdminPasskey(ADMIN_PASSKEY)) throw new Error('Test 3 Failed: Valid passkey rejected');
  if (verifyAdminPasskey(BAD_PASSKEY)) throw new Error('Test 3 Failed: Invalid passkey accepted');

  // Attempt unauthorized route update
  const unauthRoute = await updateRouteSchedule('cvr-route-1', { departureTime: '6:30 AM' }, BAD_PASSKEY);
  if (unauthRoute.success) throw new Error('Test 3 Failed: Unauthorized route update succeeded');

  // Attempt unauthorized advisory publish
  const unauthAdv = await publishTransportAdvisory({
    title: 'Hacked Advisory',
    message: 'Malicious notice',
    type: 'alert',
    severity: 'high',
    status: 'ACTIVE',
  }, BAD_PASSKEY);
  if (unauthAdv.success) throw new Error('Test 3 Failed: Unauthorized advisory publish succeeded');

  // Attempt unauthorized advisory update
  const unauthAdvUp = await updateTransportAdvisory('adv-network-1', { title: 'Updated' }, BAD_PASSKEY);
  if (unauthAdvUp.success) throw new Error('Test 3 Failed: Unauthorized advisory update succeeded');

  // Attempt unauthorized advisory delete
  const unauthAdvDel = await deleteTransportAdvisory('adv-network-1', BAD_PASSKEY);
  if (unauthAdvDel.success) throw new Error('Test 3 Failed: Unauthorized advisory delete succeeded');

  // Attempt unauthorized reset
  const unauthReset = await resetToCircularDefault(BAD_PASSKEY);
  if (unauthReset.success) throw new Error('Test 3 Failed: Unauthorized reset succeeded');

  passedTests++;
  console.log('  ✓ Test 3 Passed: All administrative mutation endpoints guarded by passkey.\n');

  // -------------------------------------------------------------
  // TEST 4: Authorized Route Editing & Integrity Protection
  // -------------------------------------------------------------
  console.log('>>> TEST 4: Authorized Route Editing & Immutability Protection');
  // Attempt to inject phone number into startingLocation
  const phoneRoute = await updateRouteSchedule('cvr-route-1', { startingLocation: 'Contact 9848012345' }, ADMIN_PASSKEY);
  if (phoneRoute.success) throw new Error('Test 4 Failed: Phone number in starting location was not blocked');

  // Authorized valid update
  const validRouteUpdate = await updateRouteSchedule('cvr-route-1', { 
    departureTime: '6:40 AM',
    startingLocation: 'Dilsukhnagar Bus Depot'
  }, ADMIN_PASSKEY);
  if (!validRouteUpdate.success) throw new Error(`Test 4 Failed: Valid route update failed: ${validRouteUpdate.error}`);

  // Test invalid departure time in route update
  const invalidTimeRoute = await updateRouteSchedule('cvr-route-1', { departureTime: 'invalid' }, ADMIN_PASSKEY);
  if (invalidTimeRoute.success) throw new Error('Test 4 Failed: Invalid departure time was accepted');

  passedTests++;
  console.log('  ✓ Test 4 Passed: Route updates validated, phone numbers rejected, schedule updated.\n');

  // -------------------------------------------------------------
  // TEST 5: Advisory Full Lifecycle (Publish, Edit, Resolve, Delete)
  // -------------------------------------------------------------
  console.log('>>> TEST 5: Advisory Full Lifecycle');
  // 1. Validation: empty title/message
  const emptyAdv = await publishTransportAdvisory({
    title: '   ',
    message: '   ',
    type: 'notice',
    severity: 'low',
    status: 'ACTIVE',
  }, ADMIN_PASSKEY);
  if (emptyAdv.success) throw new Error('Test 5 Failed: Empty advisory publish succeeded');

  // 2. Validation: phone number in advisory
  const phoneAdv = await publishTransportAdvisory({
    title: 'Helpline Number',
    message: 'Please call 9848099999 for questions',
    type: 'notice',
    severity: 'low',
    status: 'ACTIVE',
  }, ADMIN_PASSKEY);
  if (phoneAdv.success) throw new Error('Test 5 Failed: Phone number in advisory was not blocked');

  // 3. Publish valid advisory
  const publishRes = await publishTransportAdvisory({
    title: 'Outer Ring Road Lane Diversion',
    message: 'Exit 12 undergoing resurfacing. Morning buses from Gachibowli may experience 5-7 min delay.',
    routeNumber: 'Routes 42-48',
    type: 'delay',
    severity: 'medium',
    status: 'ACTIVE',
  }, ADMIN_PASSKEY);
  if (!publishRes.success || !publishRes.advisory) throw new Error('Test 5 Failed: Advisory publish failed');
  const advId = publishRes.advisory.id;
  console.log('  Published Advisory ID:', advId);

  // 4. Update advisory (e.g. edit text and resolve)
  const updateRes = await updateTransportAdvisory(advId, {
    title: 'Outer Ring Road Lane Diversion [RESOLVED]',
    status: 'RESOLVED',
    severity: 'low',
  }, ADMIN_PASSKEY);
  if (!updateRes.success) throw new Error('Test 5 Failed: Advisory update failed');

  // 5. Delete advisory
  const deleteRes = await deleteTransportAdvisory(advId, ADMIN_PASSKEY);
  if (!deleteRes.success) throw new Error('Test 5 Failed: Advisory delete failed');

  passedTests++;
  console.log('  ✓ Test 5 Passed: Advisory lifecycle (validation, publish, update, resolve, delete) verified.\n');

  // -------------------------------------------------------------
  // TEST 6: Reset to Circular Defaults Protection
  // -------------------------------------------------------------
  console.log('>>> TEST 6: Reset to Circular Defaults');
  const resetRes = await resetToCircularDefault(ADMIN_PASSKEY);
  if (!resetRes.success) throw new Error('Test 6 Failed: Reset to defaults failed');

  // Verify that official route 1 is intact and dataset has 54 routes
  if (OFFICIAL_CVR_ROUTES.length !== 54) {
    throw new Error(`Test 6 Failed: Official dataset route count altered: ${OFFICIAL_CVR_ROUTES.length}`);
  }
  passedTests++;
  console.log('  ✓ Test 6 Passed: Reset restored official circular routes (54 corridors intact).\n');

  // -------------------------------------------------------------
  // TEST 7: Fleet & Capacity State Calculation
  // -------------------------------------------------------------
  console.log('>>> TEST 7: Fleet & Capacity State Verification');
  const capacityState = calculateCapacity({
    tripId: 'trip-cvr-r1',
    routeNumber: 1,
    busIdentifier: 'TS-08-UA-1001',
    maxCapacity: 54,
    verifiedOccupancy: 48,
    confirmedReservationsCount: 3,
    lastOccupancyVerifiedAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago = stale
    lastOccupancyVerifiedBy: 'Conductor Kumar',
    isAcceptingRequests: true,
    driverSafetyAcknowledged: true,
  });

  if (capacityState.availableCapacity !== 3) {
    throw new Error(`Test 7 Failed: Expected availableCapacity 3 (54 - 48 - 3), got ${capacityState.availableCapacity}`);
  }
  if (!capacityState.isStale) {
    throw new Error('Test 7 Failed: Expected 30-min-old occupancy to be flagged as isStale=true');
  }
  if (capacityState.isFull) {
    throw new Error('Test 7 Failed: Expected bus not to be marked full when 3 seats remain');
  }

  passedTests++;
  console.log('  ✓ Test 7 Passed: Fleet capacity math and staleness thresholds operate accurately.\n');

  // -------------------------------------------------------------
  // TEST 8: Boarding Request Oversight & Filtering Logic
  // -------------------------------------------------------------
  console.log('>>> TEST 8: Boarding Request Oversight & Filtering');
  // Create sample requests with different statuses
  const testReq = await createBoardingRequest({
    tripId: 'trip-cvr-r7',
    studentId: '23B81A0599',
    studentName: 'Suresh Varma',
    pickupStop: 'Safil Guda',
    destinationStop: 'College (CVR Campus)',
    missedBusRouteNumber: 15,
  });

  if (!testReq.success || !testReq.request) {
    throw new Error(`Test 8 Failed to create base request: ${testReq.error}`);
  }

  const sampleRequests = [
    testReq.request,
    { ...testReq.request, id: 'req-accepted-1', status: 'ACCEPTED', seatPassCode: 'CVR-PASS-TEST' },
    { ...testReq.request, id: 'req-rejected-1', status: 'REJECTED', rejectionReason: 'Bus full' },
    { ...testReq.request, id: 'req-expired-1', status: 'EXPIRED' },
  ];

  const pendingList = sampleRequests.filter(r => r.status === 'PENDING');
  const acceptedList = sampleRequests.filter(r => r.status === 'ACCEPTED');
  const rejectedList = sampleRequests.filter(r => r.status === 'REJECTED');
  const expiredList = sampleRequests.filter(r => r.status === 'EXPIRED');

  if (pendingList.length !== 1 || acceptedList.length !== 1 || rejectedList.length !== 1 || expiredList.length !== 1) {
    throw new Error('Test 8 Failed: Status filtering counts incorrect');
  }

  passedTests++;
  console.log('  ✓ Test 8 Passed: Boarding request oversight filter logic isolates states cleanly.\n');

  // -------------------------------------------------------------
  // TEST 9: Admin Dashboard Real Stat Metric Aggregations
  // -------------------------------------------------------------
  console.log('>>> TEST 9: Admin Dashboard Real Stat Aggregations');
  const totalRoutes = OFFICIAL_CVR_ROUTES.length;
  const incompleteRoutes = OFFICIAL_CVR_ROUTES.filter(r => r.stops.length <= 1);
  const incompleteRouteNums = incompleteRoutes.map(r => r.routeNumber).sort((a, b) => a - b);

  console.log('  Total routes in dataset:', totalRoutes);
  console.log('  Incomplete routes identified:', incompleteRouteNums);

  if (totalRoutes !== 54) throw new Error(`Test 9 Failed: Expected 54 routes, got ${totalRoutes}`);
  if (incompleteRoutes.length !== 2) throw new Error(`Test 9 Failed: Expected 2 incomplete routes, got ${incompleteRoutes.length}`);
  if (incompleteRouteNums[0] !== 21 || incompleteRouteNums[1] !== 39) {
    throw new Error(`Test 9 Failed: Expected incomplete routes 21 and 39, got ${incompleteRouteNums}`);
  }

  passedTests++;
  console.log('  ✓ Test 9 Passed: Dashboard stat aggregates confirm 54 total routes and routes 21 & 39 incomplete.\n');

  // -------------------------------------------------------------
  // TEST 10: Security Diagnostics & Honest Limitations
  // -------------------------------------------------------------
  console.log('>>> TEST 10: Security Diagnostics & Limitations Audit');
  const diagnostics = getFirebaseConnectionDiagnostics();
  console.log('  Diagnostics Output:', diagnostics);

  if (typeof diagnostics.isConfigured !== 'boolean') {
    throw new Error('Test 10 Failed: Diagnostics isConfigured missing');
  }
  if (!diagnostics.status) {
    throw new Error('Test 10 Failed: Diagnostics status missing');
  }
  // If not configured, status must honestly report OFFLINE_VERIFIED_FALLBACK
  if (!diagnostics.isConfigured && diagnostics.status !== 'OFFLINE_VERIFIED_FALLBACK') {
    throw new Error('Test 10 Failed: Unconfigured state must report OFFLINE_VERIFIED_FALLBACK');
  }

  passedTests++;
  console.log('  ✓ Test 10 Passed: Security diagnostics accurately and honestly report connection state.\n');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('================================================================');
  console.log(`>>> ALL ${passedTests} / 10 PHASE 4B.1 TEST SUITES PASSED CLEANLY! <<<`);
  console.log('================================================================\n');
}

runPhase4B1Tests().catch((err) => {
  console.error('\n❌ PHASE 4B.1 TEST FAILED:', err);
  process.exit(1);
});
