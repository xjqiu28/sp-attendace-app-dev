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
    const weekStart = String(row[1]).trim();

    if (!name || !weekStart) {
      return;
    }

    approvals[`${name.toLowerCase()}|${weekStart}`] = {
      approvedBy: String(row[2]).trim(),
      approvedAt: String(row[3]).trim(),
    };
  });

  return approvals;
}

/**
 * Returns the sheet row number (2-based) of the (targetName, weekStart)
 * row in the Week Approvals sheet, or null if there isn't one.
 */
function findWeekApprovalRow(sheet, targetName, weekStart) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  for (let i = 0; i < values.length; i++) {
    const rowName = String(values[i][0]).trim();
    const rowWeekStart = String(values[i][1]).trim();

    if (rowName.toLowerCase() === targetName.toLowerCase() && rowWeekStart === weekStart) {
      return i + 2;
    }
  }

  return null;
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

  const trimmedTargetName = targetName.trim();
  const existingRowNumber = findWeekApprovalRow(sheet, trimmedTargetName, weekStart);
  const approvedAt = formatDateTime(new Date());
  const rowValues = [trimmedTargetName, weekStart, submittedName, approvedAt];

  if (existingRowNumber) {
    sheet.getRange(existingRowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

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
    const existingRowNumber = findWeekApprovalRow(sheet, trimmedTargetName, weekStart);

    if (existingRowNumber) {
      sheet.deleteRow(existingRowNumber);
    }
  }

  return { success: true, message: `Removed approval for ${trimmedTargetName}'s week of ${weekStart}.` };
}
