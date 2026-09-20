/**
 * ===================================================================
 * WEEK APPROVALS
 * ===================================================================
 * Records that a director has reviewed and approved a specific
 * person's specific over-cap week (see MAX_WEEKLY_HOURS_HEADER and
 * buildDirectorWeeklyResult in DirectorView.gs, which flags a week as
 * needing approval when it exceeds that person's own cap). Approvals
 * live in their own sheet tab (WEEK_APPROVALS_SHEET_NAME, Config.gs),
 * created automatically on first approval, with one row per
 * (Name, Week Start) pair.
 */

/**
 * "Week Start" values are written as "M/d/yyyy" strings, but if that
 * column's cells aren't explicitly formatted as plain text, Sheets
 * silently auto-converts a date-looking string into a real Date value
 * on write (the same trap the Personal Code column guards against
 * with setNumberFormat('@') — see PersonalCodes.gs). Reading a Date
 * cell back as a plain string would never match the "M/d/yyyy" string
 * the frontend sends, so every comparison needs to go through this
 * first — including against rows written before the format fix below
 * existed.
 */
function normalizeWeekStartValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'M/d/yyyy');
  }

  return String(value).trim();
}

/**
 * Returns { "<lowercased name>|<week start, M/d/yyyy>": { approvedBy,
 * approvedAt } } for every recorded approval, or {} if the tab doesn't
 * exist yet (nothing has ever been approved).
 */
function getWeekApprovals() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(WEEK_APPROVALS_SHEET_NAME);

  const approvals = {};

  if (!sheet) {
    return approvals;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return approvals;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

  values.forEach((row) => {
    const name = String(row[0]).trim();
    const weekStart = normalizeWeekStartValue(row[1]);

    if (!name || !weekStart) {
      return;
    }

    // Later rows win if duplicates exist (e.g. from this exact bug
    // before it was fixed) — this is always the most recent one, since
    // rows are read top-to-bottom in the order they were written.
    approvals[`${name.toLowerCase()}|${weekStart}`] = {
      approvedBy: String(row[2]).trim(),
      approvedAt: String(row[3]).trim(),
    };
  });

  return approvals;
}

/**
 * Returns every sheet row number (2-based, descending so callers can
 * delete them in a loop without invalidating later indexes) matching
 * (targetName, weekStart) in the Week Approvals sheet.
 */
function findWeekApprovalRows(sheet, targetName, weekStart) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const matches = [];

  for (let i = 0; i < values.length; i++) {
    const rowName = String(values[i][0]).trim();
    const rowWeekStart = normalizeWeekStartValue(values[i][1]);

    if (rowName.toLowerCase() === targetName.toLowerCase() && rowWeekStart === weekStart) {
      matches.push(i + 2);
    }
  }

  return matches.reverse();
}

/**
 * Records (or re-records, if already approved) that submittedName
 * approved targetName's week starting weekStart ("M/d/yyyy", matching
 * buildDirectorWeeklyResult's weekStart). Director-only.
 */
function approveWeek(submittedName, submittedPersonalCode, targetName, weekStart) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!targetName || !weekStart) {
    return { success: false, error: 'A name and week are required.' };
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(WEEK_APPROVALS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(WEEK_APPROVALS_SHEET_NAME);
    sheet.appendRow(['Name', 'Week Start', 'Approved By', 'Approved At']);
  }

  // Plain-text format for the whole column, applied every time (cheap,
  // idempotent) so it self-heals a sheet created before this fix
  // existed too — without it, Sheets silently converts a date-looking
  // "Week Start" string into a real Date value, which then never
  // matches the plain-string comparisons above/below.
  sheet.getRange('B:B').setNumberFormat('@');

  const trimmedTargetName = targetName.trim();
  const existingRows = findWeekApprovalRows(sheet, trimmedTargetName, weekStart);
  const approvedAt = formatDateTime(new Date());
  const rowValues = [trimmedTargetName, weekStart, submittedName, approvedAt];
  const targetRow = existingRows.length > 0 ? existingRows[existingRows.length - 1] : sheet.getLastRow() + 1;

  sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);

  // Clean up any leftover duplicates from before this fix existed, so
  // approving also self-heals old data, not just future writes.
  existingRows.slice(0, -1).forEach((rowNumber) => sheet.deleteRow(rowNumber));

  return {
    success: true,
    message: `Approved ${trimmedTargetName}'s week of ${weekStart}.`,
    approvedBy: submittedName,
    approvedAt: approvedAt,
  };
}

/**
 * Removes a previously recorded approval for targetName's week starting
 * weekStart, if one exists. Director-only. A no-op (still successful)
 * if there was nothing to remove.
 */
function unapproveWeek(submittedName, submittedPersonalCode, targetName, weekStart) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!targetName || !weekStart) {
    return { success: false, error: 'A name and week are required.' };
  }

  const trimmedTargetName = targetName.trim();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(WEEK_APPROVALS_SHEET_NAME);

  if (sheet) {
    // Delete every matching row, not just one — findWeekApprovalRows
    // returns them highest-numbered first, so deleting in that order
    // never shifts the row number of one still waiting to be deleted.
    findWeekApprovalRows(sheet, trimmedTargetName, weekStart).forEach((rowNumber) =>
      sheet.deleteRow(rowNumber)
    );
  }

  return { success: true, message: `Removed approval for ${trimmedTargetName}'s week of ${weekStart}.` };
}
