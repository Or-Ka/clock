export type EventTimeValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly field: "hour" | "minute"; readonly message: string };

export type OffsetValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string };

export function validateEventTime(hour: number, minute: number): EventTimeValidationResult {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { valid: false, field: "hour", message: "השעה חייבת להיות מספר שלם בין 0 ל-23." };
  }

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { valid: false, field: "minute", message: "הדקה חייבת להיות מספר שלם בין 0 ל-59." };
  }

  return { valid: true };
}

export function validateNonNegativeOffset(offsetValue: number): OffsetValidationResult {
  if (!Number.isFinite(offsetValue) || offsetValue < 0) {
    return { valid: false, message: "הכמות חייבת להיות מספר חיובי." };
  }

  return { valid: true };
}
