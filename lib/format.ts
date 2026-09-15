// Formattazione numerica DETERMINISTICA per i render dei client component.
//
// Non usare Number#toLocaleString nei render SSR+client: Node e i browser hanno
// dati ICU/CLDR diversi. Es. (1234).toLocaleString('it-IT') → "1234" su Node
// (CLDR it: niente separatore sotto 10.000) ma "1.234" in Chromium → il testo
// server ≠ client → hydration mismatch (React #418). Successo davvero su
// /admin/training con i conteggi caratteri dei contesti.
export function formatInt(n: number): string {
  const s = String(Math.trunc(Math.abs(n)))
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return n < 0 ? `-${grouped}` : grouped
}
