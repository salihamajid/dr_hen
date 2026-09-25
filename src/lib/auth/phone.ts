/**
 * Normalises a phone number to the "+<digits>" E.164 form Farmer.whatsappNumber
 * and User.phone are stored in, or null if it can't be made into one.
 *
 * Farmers type numbers many ways — "0300 1234567", "+92 300 1234567",
 * "923001234567" — and the login lookup is an exact match, so every entry point
 * must normalise identically or the same person can't log back in.
 *
 * A bare number with no "+", "00", or leading "0" is only accepted when it
 * starts with Pakistan's "92": otherwise "3001234567" would be silently read as
 * a different country's number.
 */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s\-().]/g, "");

  let digits: string;
  if (cleaned.startsWith("+")) digits = cleaned.slice(1);
  else if (cleaned.startsWith("00")) digits = cleaned.slice(2);
  else if (/^0\d{10}$/.test(cleaned)) digits = `92${cleaned.slice(1)}`;
  else if (/^92\d{10}$/.test(cleaned)) digits = cleaned;
  else return null;

  return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : null;
}
