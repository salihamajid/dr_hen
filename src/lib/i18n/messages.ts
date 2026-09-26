import type { Lang } from "./index";

// The API replies with English error text. When the farmer's language is Urdu, the client
// looks the text up here and shows the Urdu version; anything unknown is shown as-is.

const EXACT: Record<string, string> = {
  "Invalid phone number or password": "فون نمبر یا پاس ورڈ غلط ہے",
  "Too many failed attempts. Please wait a while and try again.": "بہت زیادہ ناکام کوششیں ہو چکی ہیں۔ براہ کرم کچھ دیر انتظار کریں اور دوبارہ کوشش کریں۔",
  "Too many sign-up attempts. Please try again later.": "رجسٹریشن کی بہت زیادہ کوششیں ہو چکی ہیں۔ براہ کرم بعد میں دوبارہ کوشش کریں۔",
  "This phone number is already registered. Please contact your Dr. Hen representative.": "یہ فون نمبر پہلے سے رجسٹر ہے۔ براہ کرم اپنے ڈاکٹر ہین نمائندے سے رابطہ کریں۔",
  "Something went wrong. Please try again.": "کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔",
  "Could not reach the server. Check your connection and try again.": "سرور سے رابطہ نہیں ہو سکا۔ اپنا انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔",
  "Please check the highlighted fields.": "براہ کرم نشان زد خانوں کو چیک کریں۔",
  "Enter a valid phone number, e.g. 0300 1234567 or +92 300 1234567": "درست فون نمبر لکھیں، مثلاً 0300 1234567 یا +92 300 1234567",
  "Use at least 8 characters": "کم از کم 8 حروف استعمال کریں",
  "That password is too long": "پاس ورڈ بہت لمبا ہے",
  "Enter your password": "اپنا پاس ورڈ لکھیں",
  "Enter your name": "اپنا نام لکھیں",
  "Enter your location": "اپنا مقام لکھیں",
  "Enter a breed": "نسل لکھیں",
  "Enter a flock name": "فلاک کا نام لکھیں",
  "Enter a whole number": "پورا عدد لکھیں",
  "Enter a number above 0": "0 سے زیادہ عدد لکھیں",
  "Age can't be negative": "عمر منفی نہیں ہو سکتی",
  "Choose a flock": "فلاک منتخب کریں",
  "Choose a date": "تاریخ منتخب کریں",
  "Choose valid dates.": "درست تاریخیں منتخب کریں۔",
  "Choose a valid date.": "درست تاریخ منتخب کریں۔",
  "The start date must be before the end date.": "شروع کی تاریخ آخری تاریخ سے پہلے ہونی چاہیے۔",
  "Choose a range of up to a year.": "زیادہ سے زیادہ ایک سال کی مدت منتخب کریں۔",
  "Choose a valid date (within the last year, not in the future).": "درست تاریخ منتخب کریں (پچھلے ایک سال کے اندر، آنے والی نہیں)۔",
  "Please attach a JPEG, PNG or WebP photo": "براہ کرم JPEG، PNG یا WebP تصویر لگائیں",
  "Type a message or attach a photo": "پیغام لکھیں یا تصویر لگائیں",
  "That photo is too large": "تصویر بہت بڑی ہے",
  "Request is too large": "درخواست بہت بڑی ہے",
  "Request body is not valid JSON": "درخواست درست نہیں ہے",
  "You're sending messages very fast. Please wait a few minutes and try again.": "آپ بہت تیزی سے پیغامات بھیج رہے ہیں۔ براہ کرم چند منٹ انتظار کریں اور دوبارہ کوشش کریں۔",
  "Too many shares. Please try again in a few minutes.": "بہت زیادہ بار شیئر ہو چکا ہے۔ براہ کرم چند منٹ بعد دوبارہ کوشش کریں۔",
  "Could not send to WhatsApp right now. Please try again, or download the PDF.": "ابھی واٹس ایپ پر بھیجا نہیں جا سکا۔ براہ کرم دوبارہ کوشش کریں یا پی ڈی ایف ڈاؤن لوڈ کریں۔",
  "Not found": "نہیں ملا",
  "Not signed in": "آپ لاگ ان نہیں ہیں",
  Unauthorized: "آپ لاگ ان نہیں ہیں",
  "Mortality: enter a number": "اموات: عدد لکھیں",
  "Mortality: whole birds only": "اموات: صرف پوری مرغیاں لکھیں",
};

const FIELD: Record<string, string> = {
  Feed: "خوراک",
  Water: "پانی",
  Temperature: "درجہ حرارت",
  "Average weight": "اوسط وزن",
  Humidity: "نمی",
  "Light hours": "روشنی کے گھنٹے",
  Mortality: "اموات",
};

const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(.+): enter a number$/, (m) => `${FIELD[m[1]] ?? m[1]}: عدد لکھیں`],
  [/^(.+): at least (-?[\d.]+)$/, (m) => `${FIELD[m[1]] ?? m[1]}: کم از کم ${m[2]}`],
  [/^(.+): at most ([\d.]+)$/, (m) => `${FIELD[m[1]] ?? m[1]}: زیادہ سے زیادہ ${m[2]}`],
  [/^Mortality can't be more than the (.+) birds in this flock\.$/, (m) => `اموات اس فلاک کی ${m[1]} مرغیوں سے زیادہ نہیں ہو سکتیں۔`],
  [/^You can have up to (\d+) flocks\.$/, (m) => `آپ زیادہ سے زیادہ ${m[1]} فلاک رکھ سکتے ہیں۔`],
];

export function translateMessage(lang: Lang | null | undefined, text: string | null | undefined): string {
  if (!text) return "";
  if (lang !== "UR") return text;
  if (EXACT[text]) return EXACT[text];
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re);
    if (m) return fn(m);
  }
  return text;
}
