# Google Sheets Sync Harumi Store

Spreadsheet laporan:

https://docs.google.com/spreadsheets/d/1jK-xkwWBVv-dQF0wJlz5OeaE53v01JamUu8B3_lkVTc/edit?gid=0#gid=0

Google Sheets dipakai sebagai mirror dari sistem Harumi Store. Data utama tetap di app/backend. Setiap sync akan menulis ulang dua tab:

- `finance` untuk laporan penjualan dan profit.
- `product` untuk katalog produk, varian, dan stok terbaru.

## Apps Script Webhook

1. Buka spreadsheet.
2. Pilih **Extensions > Apps Script**.
3. Paste kode ini:

```js
const SHEET_NAMES = {
  finance: 'finance',
  product: 'product',
};

function getOrCreateSheet(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function writeRows(spreadsheet, sheetName, rows) {
  const sheet = getOrCreateSheet(spreadsheet, sheetName);
  sheet.clearContents();

  if (!rows || rows.length === 0) {
    sheet.getRange(1, 1).setValue('Belum ada data');
    return;
  }

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  writeRows(spreadsheet, SHEET_NAMES.finance, payload.sheets && payload.sheets.finance);
  writeRows(spreadsheet, SHEET_NAMES.product, payload.sheets && payload.sheets.product);

  const financeSheet = getOrCreateSheet(spreadsheet, SHEET_NAMES.finance);
  const summaryStartRow = financeSheet.getLastRow() + 3;
  financeSheet.getRange(summaryStartRow, 1, 7, 2).setValues([
    ['Synced At', payload.syncedAt || ''],
    ['Spreadsheet URL', payload.spreadsheetUrl || ''],
    ['Gross Revenue', payload.summary ? payload.summary.grossRevenue : 0],
    ['Total HPP', payload.summary ? payload.summary.totalHpp : 0],
    ['Biaya Lain', payload.summary ? payload.summary.otherCost : 0],
    ['Net Profit', payload.summary ? payload.summary.netProfit : 0],
    ['Qty Terjual', payload.summary ? payload.summary.totalQty : 0],
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, sheets: Object.values(SHEET_NAMES) }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Klik **Deploy > New deployment**.
5. Pilih type **Web app**.
6. Set **Execute as: Me**.
7. Set **Who has access: Anyone**.
8. Copy **Web app URL**.
9. Masukkan ke `.env`:

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/xxxxx/exec
```

10. Restart app:

```bash
./manage.sh start
```

## Perilaku Sync

- Tombol **Sync Sheets** di halaman laporan mengirim ulang tab `finance` dan `product`.
- Tambah/edit produk, arsip/aktifkan produk, hapus produk, input/edit/hapus penjualan akan mencoba sync otomatis.
- Sync otomatis bersifat silent: kalau Google Sheets gagal, data di sistem tetap tersimpan.
- Jangan edit stok langsung di Google Sheets; tab `product` akan ditimpa oleh data terbaru dari sistem saat sync berikutnya.
