export function isValidPhilippinePhoneNumber(value: string) {
  const normalized = value.replace(/[ ()-]/g, "");
  return /^\+63[2-9]\d{8,9}$/.test(normalized);
}
