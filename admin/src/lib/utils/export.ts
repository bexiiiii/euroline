export type CsvRow = Array<string | number | null | undefined | boolean>;

export function downloadCsv(filename: string, rows: CsvRow[], delimiter = ";") {
  if (!rows.length) {
    return;
  }

  const escapeValue = (value: CsvRow[number]) => {
    if (value === null || value === undefined) {
      return "";
    }
    const str = String(value);
    const needsQuoting = str.includes(delimiter) || str.includes("\n") || str.includes('"');
    const escaped = str.replace(/"/g, '""');
    return needsQuoting ? `"${escaped}"` : escaped;
  };

  const csvBody = rows
    .map((row) => row.map(escapeValue).join(delimiter))
    .join("\n");

  const csvWithBom = `\ufeff${csvBody}`;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
