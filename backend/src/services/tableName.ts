export function generateTableName(filename: string): string {
  return filename
    .replace(".csv", "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}