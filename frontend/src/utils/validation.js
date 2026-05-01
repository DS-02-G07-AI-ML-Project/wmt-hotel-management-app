export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const phonePattern = /^[+()\d\s-]{7,20}$/;
export const mongoIdPattern = /^[a-f\d]{24}$/i;

export const isBlank = (value) => !String(value || '').trim();

export const isValidEmail = (value) => emailPattern.test(String(value || '').trim());

export const isValidPhone = (value) => {
  const trimmed = String(value || '').trim();
  return !trimmed || phonePattern.test(trimmed);
};

export const isPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

export const isNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
};

export const isWholeNumberAtLeast = (value, min = 1) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min;
};

export const isValidMongoId = (value) => mongoIdPattern.test(String(value || '').trim());

export const parseDateInput = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const normalized = trimmed.length === 10 ? `${trimmed}T00:00:00` : trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatValidationMessage = (errors) => Object.values(errors).filter(Boolean).join('\n');
