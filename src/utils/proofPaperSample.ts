export const MVP017_PROOF_PAPER_SAMPLE_TEXT = `
Flash Express Proof Paper
Vehicle Barcode: NAK1RK8Z54
Driver Phone: 0653762402
Company: DOLLARSOUND
Route: LH-6W7.2-BNAK-NE6-22:00-BD-1-RO
Origin: 26BNAK
Destination: 20NE6
Plan depart 22:00
Plan arrive 00:15
Distance 131KM
Duration 2h15min
Print Time 2026-06-21 21:36:02
`;

export const RESET001_PROOF_PAPER_SAMPLE_2_TEXT = `
Flash Express Proof Paper
Vehicle Barcode: NAK1RP4745
Driver Phone: 0981299480
Company: DBEXPRESS
Route: LH-6W7.2-BNAK-NE1-20:00-BD-1-RO
Origin: 26BNAK
Destination: 20NE1
Plan depart 20:00
Plan arrive 20:40
Distance 38KM
Duration 0h40min
Print Time 2026-06-21 19:42:10
`;

export const MVP017_EXPECTED_PROOF_PARSE = {
  vehicleBarcode: 'NAK1RK8Z54',
  driverPhone: '0653762402',
  companyName: 'DOLLARSOUND',
  origin: 'BNAK',
  destination: 'NE6',
  routeSummary: 'LH-6W7.2-BNAK-NE6-22:00-BD-1-RO',
  plannedDepartureTime: '22:00',
  plannedArrivalTime: '00:15',
  distance: '131KM',
  duration: '2h15min',
};

export const RESET001_EXPECTED_PROOF_PARSE_2 = {
  vehicleBarcode: 'NAK1RP4745',
  driverPhone: '0981299480',
  companyName: 'DBEXPRESS',
  origin: 'BNAK',
  destination: 'NE1',
  routeSummary: 'LH-6W7.2-BNAK-NE1-20:00-BD-1-RO',
  plannedDepartureTime: '20:00',
  plannedArrivalTime: '20:40',
  distance: '38KM',
  duration: '0h40min',
};
