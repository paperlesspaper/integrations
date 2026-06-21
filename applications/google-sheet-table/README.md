# Google Sheet Table

Shows matching rows from a public Google Sheet as a compact `Date | Name | Group` table on a paperlesspaper display.

This integration is inspired by `supermem613/MMM-GoogleSheetToTable` for MagicMirror. It fetches a public sheet through Google's CSV export, searches configured columns for configured names, and keeps the useful date-block behavior from that module.

## Settings

- `Google Sheet ID or URL`: paste the sheet ID or the full Google Sheets URL.
- `Sheet gid`: optional worksheet gid. If a full URL contains `gid=...`, it is used automatically unless this field is set.
- `Names to find`: one exact name per line, or comma-separated. Matching is case-insensitive.
- `Display names`: optional aliases in `Full Name=Display Name` form.
- `Column mapping`: one searched column per line, such as `B=K/1 Boys`.
- `Date column`: the column that contains dates or section labels.
- `Show past dates`: include entries before today.
- `Include section labels`: allow non-date labels in the date column to appear as table labels.

## Sheet Format

The first row is treated as a header. Rows below it are scanned in the mapped columns.

Dates can be written as `April 4th`, `Apr 4`, `4.4.2026`, or `2026-04-04`. If dates omit the year, the integration infers the year from the previous dated row and rolls over to the next year when the sheet crosses January.

The sheet must be public: anyone with the link must be able to view it.
