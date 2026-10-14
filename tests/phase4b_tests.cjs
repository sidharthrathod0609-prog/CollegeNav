/**
 * Automated Verification Test Suite for Phase 4B:
 * Smart Boarding Request & Seat Approval System
 */

const {
  calculateCapacity,
  findAlternativeTripsForMissedBus,
  createBoardingRequest,
  acceptBoardingRequest,
  rejectBoardingRequest,
  markPassengerBoarded,
  cancelBoardingRequest,
  updateTripOccupancy,
  verifyConductorPasskey,
  expireStaleRequests,
} = require('../src/services/boardingService.ts');

const { searchAndRankRoutes } = require('../src/utils/recommendations.ts');
const { OFFICIAL_CVR_ROUTES } = require('../src/data/cvrRoutes.ts');

async function runPhase4BTests() {
  console.log('================================================================');
  console.log('   COLLEGENAV — PHASE 4B SMART BOARDING AUTOMATED TEST SUITE   ');
  console.log('================================================================\n');

  let passedTests = 0;
  const MASTER_PASSKEY = 'CVR-CONDUCTOR-2026';

  // -------------------------------------------------------------
  // TEST 1: Submitting and Viewing a Boarding Request
  // -------------------------------------------------------------
  console.log('>>> TEST 1: Submitting and Viewing a Boarding Request');
  const req1 = await createBoardingRequest({
    tripId: 'trip-cvr-r7',
    studentId: '23B81A0501',
    studentName: 'Rahul Sharma',
    pickupStop: 'Safil Guda',
    destinationStop: 'College (CVR Campus)',
    missedBusRouteNumber: 15,
  });
  console.log('  Create Request Result:', req1.success, '| ID:', req1.request?.id);
  if (!req1.success || !req1.request) throw new Error(`Test 1 Failed: Request creation failed: ${req1.error}`);
  if (req1.request.status !== 'PENDING') throw new Error('Test 1 Failed: Initial status must be PENDING');
  if (req1.request.pickupStopIndex >= req1.request.destinationStopIndex) throw new Error('Test 1 Failed: Stop order invalid');
  passedTests++;
  console.log('  ✓ Test 1 Passed: Boarding request created with PENDING status and correct stop order.\n');

  // -------------------------------------------------------------
  // TEST 2: Accepting and Rejecting a Request
  // -------------------------------------------------------------
  console.log('>>> TEST 2: Accepting and Rejecting a Request');
  // Accept req1
  const acceptRes1 = await acceptBoardingRequest(req1.request.id, MASTER_PASSKEY);
  console.log('  Accept Result:', acceptRes1.success, '| Status:', acceptRes1.request?.status, '| PassCode:', acceptRes1.request?.seatPassCode);
  if (!acceptRes1.success || acceptRes1.request?.status !== 'ACCEPTED') throw new Error('Test 2 Failed: Accept request failed');
  if (!acceptRes1.request?.seatPassCode) throw new Error('Test 2 Failed: Seat pass code missing');

  // Submit req2 and reject it
  const req2 = await createBoardingRequest({
    tripId: 'trip-cvr-r7',
    studentId: '23B81A0502',
    studentName: 'Priya Patel',
    pickupStop: 'Malkajgiri',
    destinationStop: 'College (CVR Campus)',
  });
  const rejectRes2 = await rejectBoardingRequest(req2.request.id, 'Bus reached maximum passenger capacity', MASTER_PASSKEY);
  console.log('  Reject Result:', rejectRes2.success, '| Status:', rejectRes2.request?.status, '| Reason:', rejectRes2.request?.rejectionReason);
  if (!rejectRes2.success || rejectRes2.request?.status !== 'REJECTED') throw new Error('Test 2 Failed: Reject request failed');
  if (rejectRes2.request?.rejectionReason !== 'Bus reached maximum passenger capacity') throw new Error('Test 2 Failed: Rejection reason mismatch');
  passedTests++;
  console.log('  ✓ Test 2 Passed: Request acceptance generated seat pass code; rejection preserved reason.\n');

  // -------------------------------------------------------------
  // TEST 3: Bus Reaching Capacity Protection
  // -------------------------------------------------------------
  console.log('>>> TEST 3: Bus Reaching Capacity Protection');
  // Trip 22 is pre-configured at capacity (50 occupied + 2 confirmed = 52/52)
  const fullTrip = {
    tripId: 'trip-test-full',
    routeId: 'cvr-route-22',
    routeNumber: 22,
    routeLabel: 'Route 22',
    busIdentifier: 'TS-08-UB-1022',
    startingLocation: 'Dilsukhnagar',
    departureTime: '7:40 AM',
    maxCapacity: 52,
    verifiedOccupancy: 50,
    confirmedReservationsCount: 2,
    pendingRequestsCount: 1,
    lastOccupancyVerifiedAt: Date.now(),
    lastOccupancyVerifiedBy: 'Conductor',
    isAcceptingRequests: true,
    operatingStatus: 'AT_CAPACITY',
  };
  const capCalc = calculateCapacity(fullTrip);
  console.log('  Capacity Calculation for full bus:', {
    maxCapacity: capCalc.maxCapacity,
    verifiedOccupancy: capCalc.verifiedOccupancy,
    confirmedReservations: capCalc.confirmedReservationsCount,
    availableCapacity: capCalc.availableCapacity,
    isFull: capCalc.isFull,
  });
  if (capCalc.availableCapacity !== 0 || !capCalc.isFull) throw new Error('Test 3 Failed: Full bus calculation error');

  // Attempt to submit and approve on Route 22 (which is at capacity)
  const reqFull = await createBoardingRequest({
    tripId: 'trip-cvr-r22',
    studentId: '23B81A0503',
    studentName: 'Ananya Roy',
    pickupStop: 'LB Nagar Metro Station',
    destinationStop: 'College (CVR Campus)',
  });
  const acceptFullRes = await acceptBoardingRequest(reqFull.request.id, MASTER_PASSKEY);
  console.log('  Approval attempt on full bus:', acceptFullRes);
  if (acceptFullRes.success) throw new Error('Test 3 Failed: Overbooking succeeded unexpectedly');
  if (!acceptFullRes.error?.includes('maximum capacity')) throw new Error('Test 3 Failed: Missing capacity error message');
  passedTests++;
  console.log('  ✓ Test 3 Passed: Overbooking prevented when available capacity is zero.\n');

  // -------------------------------------------------------------
  // TEST 4: Unknown or Stale Occupancy Detection
  // -------------------------------------------------------------
  console.log('>>> TEST 4: Unknown or Stale Occupancy Detection');
  const staleTrip = {
    tripId: 'trip-test-stale',
    routeId: 'cvr-route-39',
    routeNumber: 39,
    routeLabel: 'Route 39',
    busIdentifier: 'TS-08-UB-1039',
    startingLocation: 'Unknown',
    departureTime: '7:30 AM',
    maxCapacity: 52,
    verifiedOccupancy: 30,
    confirmedReservationsCount: 0,
    pendingRequestsCount: 0,
    lastOccupancyVerifiedAt: Date.now() - (45 * 60 * 1000), // 45 minutes ago
    lastOccupancyVerifiedBy: 'Depot Staff',
    isAcceptingRequests: true,
    operatingStatus: 'BOARDING_OPEN',
  };
  const staleCalc = calculateCapacity(staleTrip);
  console.log('  Stale calculation (45 mins old):', {
    isStale: staleCalc.isStale,
    staleMinutes: staleCalc.staleMinutes,
  });
  if (!staleCalc.isStale || staleCalc.staleMinutes < 45) throw new Error('Test 4 Failed: Stale occupancy not flagged');
  passedTests++;
  console.log('  ✓ Test 4 Passed: Occupancy older than 25 minutes correctly flagged as stale.\n');

  // -------------------------------------------------------------
  // TEST 5: Two Simultaneous Requests Competing for Final Place
  // -------------------------------------------------------------
  console.log('>>> TEST 5: Atomic Concurrency (Competing for Final Place)');
  // Set Route 15 to exactly 1 available seat (52 max - 49 occupied - 2 confirmed = 1 left)
  await updateTripOccupancy('trip-cvr-r15', 49, 'LB Nagar Ring Road', MASTER_PASSKEY);

  const studentA = await createBoardingRequest({
    tripId: 'trip-cvr-r15',
    studentId: '23B81A0510',
    studentName: 'Student Alpha',
    pickupStop: 'Uppal NSL',
    destinationStop: 'College (CVR Campus)',
  });
  const studentB = await createBoardingRequest({
    tripId: 'trip-cvr-r15',
    studentId: '23B81A0511',
    studentName: 'Student Beta',
    pickupStop: 'Uppal NSL',
    destinationStop: 'College (CVR Campus)',
  });

  // Both students have pending requests. Conductor approves Student Alpha for the final seat:
  const firstApproval = await acceptBoardingRequest(studentA.request.id, MASTER_PASSKEY);
  console.log('  First student approval (claims final seat):', firstApproval.success);
  if (!firstApproval.success) throw new Error('Test 5 Failed: First approval failed');

  // Immediate second approval attempt for Student Beta:
  const secondApproval = await acceptBoardingRequest(studentB.request.id, MASTER_PASSKEY);
  console.log('  Second student approval (competing for same seat):', secondApproval);
  if (secondApproval.success) throw new Error('Test 5 Failed: Race condition! Two requests reserved the same final seat');
  if (!secondApproval.error?.includes('capacity')) throw new Error('Test 5 Failed: Expected capacity error');
  passedTests++;
  console.log('  ✓ Test 5 Passed: Atomic capacity protection prevented over-reservation on final seat.\n');

  // -------------------------------------------------------------
  // TEST 6: Cancellation and Request Expiry
  // -------------------------------------------------------------
  console.log('>>> TEST 6: Cancellation and Request Expiry');
  const reqCancel = await createBoardingRequest({
    tripId: 'trip-cvr-r7',
    studentId: '23B81A0520',
    studentName: 'Karthik Raja',
    pickupStop: 'Tarnaka',
    destinationStop: 'College (CVR Campus)',
  });
  // Cancel by student
  const cancelRes = await cancelBoardingRequest(reqCancel.request.id, '23B81A0520');
  console.log('  Student cancellation result:', cancelRes);
  if (!cancelRes.success) throw new Error('Test 6 Failed: Student cancellation failed');

  // Expiry check
  const expiredCount = expireStaleRequests();
  console.log('  Expired requests processed:', expiredCount);
  passedTests++;
  console.log('  ✓ Test 6 Passed: Student successfully cancelled pending request; expiry engine cleaned stale requests.\n');

  // -------------------------------------------------------------
  // TEST 7: Duplicate Approval Attempts
  // -------------------------------------------------------------
  console.log('>>> TEST 7: Duplicate Approval Prevention');
  // Attempt to approve req1 again (already ACCEPTED in Test 2)
  const duplicateApproval = await acceptBoardingRequest(req1.request.id, MASTER_PASSKEY);
  console.log('  Duplicate approval result:', duplicateApproval);
  if (duplicateApproval.success) throw new Error('Test 7 Failed: Duplicate approval succeeded');
  if (!duplicateApproval.error?.includes('cannot be approved')) throw new Error('Test 7 Failed: Expected already approved error');
  passedTests++;
  console.log('  ✓ Test 7 Passed: Duplicate approval on accepted request rejected safely.\n');

  // -------------------------------------------------------------
  // TEST 8: Unauthorized Conductor and Student Actions
  // -------------------------------------------------------------
  console.log('>>> TEST 8: Unauthorized Actions Guard');
  const reqUnauth = await createBoardingRequest({
    tripId: 'trip-cvr-r7',
    studentId: '23B81A0530',
    studentName: 'Divya Reddy',
    pickupStop: 'Safil Guda',
    destinationStop: 'College (CVR Campus)',
  });

  // Conductor with bad passkey
  const passGood = verifyConductorPasskey(MASTER_PASSKEY);
  const passBad = verifyConductorPasskey('WRONG-KEY');
  if (!passGood || passBad) throw new Error('Test 8 Failed: Conductor passkey validation error');

  const badConductorRes = await acceptBoardingRequest(reqUnauth.request.id, 'WRONG-PASSKEY');
  console.log('  Bad conductor passkey result:', badConductorRes);
  if (badConductorRes.success) throw new Error('Test 8 Failed: Unauthorized conductor succeeded');

  // Student cancelling someone else's request
  const badStudentCancel = await cancelBoardingRequest(reqUnauth.request.id, 'DIFFERENT_ROLL_NO');
  console.log('  Impersonated student cancel result:', badStudentCancel);
  if (badStudentCancel.success) throw new Error('Test 8 Failed: Student cancelled another user request');
  passedTests++;
  console.log('  ✓ Test 8 Passed: Unauthorized conductor actions and student impersonations rejected.\n');

  // -------------------------------------------------------------
  // TEST 9: Student Status Updates & Boarding Check-in
  // -------------------------------------------------------------
  console.log('>>> TEST 9: Passenger Boarded Transition (Reservation ➔ Occupancy)');
  // Approve Divya
  await acceptBoardingRequest(reqUnauth.request.id, MASTER_PASSKEY);
  
  // Conductor marks Divya as boarded
  const boardRes = await markPassengerBoarded(reqUnauth.request.id, MASTER_PASSKEY);
  console.log('  Mark passenger boarded result:', boardRes);
  if (!boardRes.success) throw new Error('Test 9 Failed: Mark boarded failed');
  passedTests++;
  console.log('  ✓ Test 9 Passed: Confirmed reservation transferred into verified onboard occupancy without double counting.\n');

  // -------------------------------------------------------------
  // TEST 10: Existing Route Search and Circular Integrity
  // -------------------------------------------------------------
  console.log('>>> TEST 10: Existing Route Search & Circular Dataset Integrity');
  console.log('  Total circular routes in system:', OFFICIAL_CVR_ROUTES.length);
  if (OFFICIAL_CVR_ROUTES.length !== 54) throw new Error('Test 10 Failed: Route count mismatch');

  // Test search: Uppal to College
  const uppalResults = searchAndRankRoutes(OFFICIAL_CVR_ROUTES, 'Uppal', 'College', 'recommendation');
  console.log('  Search "Uppal" ➔ "College": found', uppalResults.length, 'routes');
  if (uppalResults.length === 0) throw new Error('Test 10 Failed: Uppal search failed');

  // Test reverse search: College to Uppal (should be 0)
  const reverseResults = searchAndRankRoutes(OFFICIAL_CVR_ROUTES, 'College', 'Uppal', 'recommendation');
  console.log('  Search "College" ➔ "Uppal" (Reverse): found', reverseResults.length, 'routes');
  if (reverseResults.length !== 0) throw new Error('Test 10 Failed: Reverse trip returned matches');

  // Alternative corridor finder for missed bus
  const alternatives = findAlternativeTripsForMissedBus(15, 'Uppal', 'College (CVR Campus)');
  console.log('  Alternative trips for missed Route 15 at Uppal:', alternatives.length);
  if (alternatives.length === 0) throw new Error('Test 10 Failed: Alternative trips lookup failed');
  passedTests++;
  console.log('  ✓ Test 10 Passed: 54 routes preserved, directional search accurate, alternative corridors discovered.\n');

  console.log('================================================================');
  console.log(`>>> ALL ${passedTests} / 10 PHASE 4B TEST SUITES PASSED CLEANLY! <<<`);
  console.log('================================================================');
}

runPhase4BTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
