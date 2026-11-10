/*
 * Minimal Excel writer (.xlsx) without libraries: one workbook with simple tables.
 *
 * sheets: [{ name, columns: [{ header, width, money }], rows: [[cell, ...]] }]
 * cell:   string, number, null (empty) or { f: "SUM(D2:D5)", v: 123, bold: true } (formula with its value,
 *         so that viewers without calculation show the number too)
 * The first row of each sheet is the bold header; rows with a cell { bold: true } in column A are bold.
 */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Column name for an index: 0 = A, 25 = Z, 26 = AA. */
export const colName = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// style ids in styles.xml: 0 normal, 1 bold, 2 money, 3 bold money
const cellXml = (ref, cell, money, bold) => {
  const style = (money ? 2 : 0) + (bold ? 1 : 0);
  const s = style ? ` s="${style}"` : "";
  if (cell === null || cell === undefined || cell === "") return style ? `<c r="${ref}"${s}/>` : "";
  if (typeof cell === "object") {
    const v = Number.isFinite(cell.v) ? `<v>${cell.v}</v>` : "";
    return `<c r="${ref}"${s}><f>${esc(cell.f)}</f>${v}</c>`;
  }
  if (typeof cell === "number") return `<c r="${ref}"${s}><v>${cell}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(cell)}</t></is></c>`;
};

const sheetXml = (sheet) => {
  const cols = sheet.columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 14}" customWidth="1"/>`).join("");
  const rows = [sheet.columns.map((c) => c.header), ...sheet.rows].map((row, r) => {
    const bold = r === 0 || !!row.bold;
    const cells = row.map((cell, i) => cellXml(`${colName(i)}${r + 1}`, cell, r > 0 && sheet.columns[i].money, bold)).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  });
  const last = `${colName(sheet.columns.length - 1)}${sheet.rows.length + 1}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:${last}"/></worksheet>`;
};

const files = (sheets, currency) => {
  const fmt = esc(`#,##0.00 "${currency}"`);
  const out = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        "",
      )}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="${fmt}"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
  };
  sheets.forEach((s, i) => (out[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s)));
  return out;
};

/* ---------- ZIP without compression (an .xlsx is a ZIP file) ---------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** A binary record of the ZIP format: fields as [value, bytes] in their order, little endian. */
const record = (fields) => {
  const view = new DataView(new ArrayBuffer(fields.reduce((size, [, bytes]) => size + bytes, 0)));
  let pos = 0;
  for (const [value, bytes] of fields) {
    if (bytes === 4) view.setUint32(pos, value, true);
    else view.setUint16(pos, value, true);
    pos += bytes;
  }
  return view;
};

const ZIP_VERSION = 20; // 2.0: the lowest version that knows folders
const UTF8_NAMES = 0x0800;
const STORED = 0; // no compression

const zip = (entries) => {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const [name, text] of Object.entries(entries)) {
    const data = enc.encode(text);
    const nameBytes = enc.encode(name);
    // shared by the header in front of the file and its entry in the central directory
    const common = [
      [UTF8_NAMES, 2],
      [STORED, 2],
      [time, 2],
      [date, 2],
      [crc32(data), 4],
      [data.length, 4],
      [data.length, 4],
      [nameBytes.length, 2],
      [0, 2],
    ];
    const header = record([[0x04034b50, 4], [ZIP_VERSION, 2], ...common]);
    // after the common part: comment length, disk number, internal and external attributes, position of the header
    const entry = record([[0x02014b50, 4], [ZIP_VERSION, 2], [ZIP_VERSION, 2], ...common, [0, 2], [0, 2], [0, 2], [0, 4], [offset, 4]]);
    parts.push(header, nameBytes, data);
    central.push(entry, nameBytes);
    offset += header.byteLength + nameBytes.length + data.length;
  }
  const count = Object.keys(entries).length;
  const centralSize = central.reduce((size, part) => size + part.byteLength, 0);
  const end = record([
    [0x06054b50, 4],
    [0, 2],
    [0, 2],
    [count, 2],
    [count, 2],
    [centralSize, 4],
    [offset, 4],
    [0, 2],
  ]);
  return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

/** The workbook as a Blob; currency = symbol for the number format, e.g. "€". */
export const buildXlsx = (sheets, currency) => zip(files(sheets, currency));
