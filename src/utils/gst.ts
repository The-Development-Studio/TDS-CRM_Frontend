export type GstSupplyType = 'Intra-state' | 'Inter-state' | 'Export/SEZ';

export interface GstCalculation {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateGst = ({
  taxableAmount,
  discount = 0,
  gstRate,
  supplyType,
  reverseCharge = 'No'
}: {
  taxableAmount: number;
  discount?: number;
  gstRate: number;
  supplyType: GstSupplyType;
  reverseCharge?: 'Yes' | 'No';
}): GstCalculation => {
  const taxableValue = money(Math.max(0, taxableAmount - discount));
  const totalTax = reverseCharge === 'Yes' ? 0 : money(taxableValue * Math.max(0, gstRate) / 100);
  const cgst = supplyType === 'Intra-state' ? money(totalTax / 2) : 0;
  const sgst = supplyType === 'Intra-state' ? money(totalTax - cgst) : 0;
  const igst = supplyType === 'Inter-state' ? totalTax : 0;
  const chargedTax = money(cgst + sgst + igst);
  return { taxableValue, cgst, sgst, igst, totalTax: chargedTax, grandTotal: money(taxableValue + chargedTax) };
};

export const isValidGstin = (value: string) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());
