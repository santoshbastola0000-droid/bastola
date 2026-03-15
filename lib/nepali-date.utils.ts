export const NEPALI_MONTHS = [
  { month: 1, name: "बैशाख", english: "Baishakh" },
  { month: 2, name: "जेठ", english: "Jestha" },
  { month: 3, name: "असार", english: "Ashadh" },
  { month: 4, name: "साउन", english: "Shrawan" },
  { month: 5, name: "भदौ", english: "Bhadra" },
  { month: 6, name: "असोज", english: "Ashwin" },
  { month: 7, name: "कार्तिक", english: "Kartik" },
  { month: 8, name: "मंसिर", english: "Mangsir" },
  { month: 9, name: "पुष", english: "Poush" },
  { month: 10, name: "माघ", english: "Magh" },
  { month: 11, name: "फागुन", english: "Falgun" },
  { month: 12, name: "चैत", english: "Chaitra" },
] as const;

// Generate current Nepali year options (last 5 year, current, next 5 year)
export const getNepaliYearOptions = (): number[] => {
  const currentYear = 2075; // You can get this dynamically from a library
  const years: number[] = [];

  for (let i = currentYear - 5; i <= currentYear + 50; i++) {
    years.push(i);
  }

  return years;
};

// Format Nepali date display
export const formatNepaliDate = (
  year: number,
  month: number,
  monthName: string,
): string => {
  return `${year}/${month.toString().padStart(2, "0")} - ${monthName}`;
};

// Calculate approximate English dates for Nepali month
export const calculateEnglishDates = (
  nepaliYear: number,
  nepaliMonth: number,
): { startDate: Date; endDate: Date } => {
  // This is a simplified calculation. In production, use a proper Nepali calendar library
  // Approximate conversion: Add 57 year and subtract 8 months
  const baseYear = nepaliYear + 57;
  const baseMonth = nepaliMonth - 1; // Convert to 0-indexed

  const startDate = new Date(baseYear, baseMonth, 1);
  const endDate = new Date(baseYear, baseMonth + 1, 0); // Last day of month

  return { startDate, endDate };
};
