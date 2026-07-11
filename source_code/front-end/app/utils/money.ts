const vndFormatter = new Intl.NumberFormat("vi-VN");

export const formatVnd = (amount?: number | null): string => {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${vndFormatter.format(amount)} ₫`;
};

export const formatVndInput = (amount: number): string => {
  return vndFormatter.format(amount);
};

export const parseVndInput = (value: string): number => {
  const normalized = value.replace(/[^\d-]/g, "");
  if (normalized === "" || normalized === "-") return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};