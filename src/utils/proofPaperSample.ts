export const MVP017_PROOF_PAPER_SAMPLE_TEXT = `
Flash Express Proof Paper
Vehicle Barcode: NAK1RK8Z54
Driver Phone: 0643042911
Company: DOLLARSOUND
Route: LH-BNAK-NE6
Origin: 26BNAK
Destination: 20NE6
Plan depart 22:00
Plan arrive 00:15
Distance 131KM
Duration 2h15min
Print Time 2026-06-21 21:36:02
`;

export const MVP017_EXPECTED_PROOF_PARSE = {
  vehicleBarcode: 'NAK1RK8Z54',
  driverPhone: '0643042911',
  companyName: 'DOLLARSOUND',
  origin: 'BNAK',
  destination: 'NE6',
  distance: '131KM',
  duration: '2h15min',
};
