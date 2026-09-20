/**
 * ===================================================================
 * APPLICATIONS
 * ===================================================================
 * Reads/writes the separate Applications spreadsheet (APPLICATIONS_
 * SHEET_ID, Config.gs) — one tab per year, e.g. "2026 Applications" —
 * which tracks each applicant/staff member's offer, pay, documents,
 * and their scheduled work hours. Kept in its own spreadsheet file,
 * not a tab of the attendance roster, since it holds SSN/pay/tax-form
 * status and this script also runs a public, unauthenticated web app.
 */

function getApplicationsSpreadsheet() {
  if (!APPLICATIONS_SHEET_ID || APPLICATIONS_SHEET_ID === 'PASTE_YOUR_APPLICATIONS_SHEET_ID_HERE') {
    throw new Error('Set APPLICATIONS_SHEET_ID in Config.gs to the Applications spreadsheet\'s ID first.');
  }

  return SpreadsheetApp.openById(APPLICATIONS_SHEET_ID);
}

/**
 * "<year> Applications", e.g. "2026 Applications" — computed from
 * today's date so a new year's tab is picked up automatically with no
 * config change, as long as it's named following this convention.
 */
function getCurrentApplicationsTabName() {
  return `${new Date().getFullYear()} ${APPLICATIONS_TAB_SUFFIX}`;
}

function getApplicationsSheet() {
  const spreadsheet = getApplicationsSpreadsheet();
  const tabName = getCurrentApplicationsTabName();
  const sheet = spreadsheet.getSheetByName(tabName);

  if (!sheet) {
    throw new Error(`No "${tabName}" tab found in the Applications spreadsheet. Create one for this year first.`);
  }

  return sheet;
}

/**
 * Splits a "Time" range like "8:30am - 3:30pm" into its start/end
 * pieces, validating both sides parse as a time-of-day. Returns null
 * if the text isn't formatted that way. The original substrings are
 * returned as-is (not reformatted) — they're written straight into
 * SCHEDULED_SIGN_IN_HEADER/SCHEDULED_SIGN_OUT_HEADER, which
 * parseTimeOfDay (Utils.gs) reads back later.
 */
function parseTimeRange(text) {
  const parts = String(text)
    .split('-')
    .map((part) => part.trim());

  if (parts.length !== 2) {
    return null;
  }

  const start = parseTimeOfDay(parts[0]);
  const end = parseTimeOfDay(parts[1]);

  if (!start || !end) {
    return null;
  }

  return { startText: parts[0], endText: parts[1] };
}

/**
 * Returns every field for one applicant row, keyed to
 * APPLICATIONS_HEADERS so the frontend never has to know the sheet's
 * actual column order.
 */
function buildApplicationEntry(columnIndexes, row) {
  function cell(header) {
    const index = columnIndexes[header];
    return index !== undefined ? row[index] : '';
  }

  const rateValue = cell(APPLICATIONS_HEADERS.rate);

  return {
    firstName: String(cell(APPLICATIONS_HEADERS.firstName)).trim(),
    lastName: String(cell(APPLICATIONS_HEADERS.lastName)).trim(),
    title: String(cell(APPLICATIONS_HEADERS.title)).trim(),
    dateInformation: String(cell(APPLICATIONS_HEADERS.dateInformation)).trim(),
    time: String(cell(APPLICATIONS_HEADERS.time)).trim(),
    rate: rateValue !== '' && rateValue !== null ? Number(rateValue) : null,
    email: String(cell(APPLICATIONS_HEADERS.email)).trim(),
    sent: String(cell(APPLICATIONS_HEADERS.sent)).trim(),
    paidHours: String(cell(APPLICATIONS_HEADERS.paidHours)).trim(),
    volunteerHours: String(cell(APPLICATIONS_HEADERS.volunteerHours)).trim(),
    missingDocuments: String(cell(APPLICATIONS_HEADERS.missingDocuments)).trim(),
    acceptDecline: String(cell(APPLICATIONS_HEADERS.acceptDecline)).trim(),
    ss: String(cell(APPLICATIONS_HEADERS.ss)).trim(),
    w4Forms: String(cell(APPLICATIONS_HEADERS.w4Forms)).trim(),
    resignationEmailSent: String(cell(APPLICATIONS_HEADERS.resignationEmailSent)).trim(),
    resignationLetters: String(cell(APPLICATIONS_HEADERS.resignationLetters)).trim(),
  };
}

/**
 * Returns every applicant on the current year's Applications tab.
 * Director-only, read-only.
 */
function getApplicationsView(submittedName, submittedPersonalCode) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  let sheet;

  try {
    sheet = getApplicationsSheet();
  } catch (error) {
    return { success: false, error: error.message };
  }

  const columnIndexes = getColumnIndexes(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: true, tabName: sheet.getName(), applications: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const applications = rows
    .map((row) => buildApplicationEntry(columnIndexes, row))
    .filter((entry) => entry.firstName || entry.lastName);

  return { success: true, tabName: sheet.getName(), applications: applications };
}

/**
 * Updates one applicant's editable tracking fields (matched by email,
 * the sheet's own unique key), leaving every other column untouched.
 * updates is an object using the same field names buildApplicationEntry
 * returns — anything not in the editable list below is ignored.
 * Director-only.
 */
function updateApplication(submittedName, submittedPersonalCode, targetEmail, updates) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!targetEmail) {
    return { success: false, error: 'An applicant email is required.' };
  }

  let sheet;

  try {
    sheet = getApplicationsSheet();
  } catch (error) {
    return { success: false, error: error.message };
  }

  const columnIndexes = getColumnIndexes(sheet);
  const emailColumnIndex = columnIndexes[APPLICATIONS_HEADERS.email];

  if (emailColumnIndex === undefined) {
    return { success: false, error: 'The Applications sheet must have an "Email" header.' };
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, error: 'Applicant not found.' };
  }

  const emails = sheet.getRange(2, emailColumnIndex + 1, lastRow - 1, 1).getValues();
  const trimmedTargetEmail = String(targetEmail).trim().toLowerCase();
  let rowNumber = null;

  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === trimmedTargetEmail) {
      rowNumber = i + 2;
      break;
    }
  }

  if (!rowNumber) {
    return { success: false, error: 'Applicant not found.' };
  }

  const editableHeaders = {
    missingDocuments: APPLICATIONS_HEADERS.missingDocuments,
    acceptDecline: APPLICATIONS_HEADERS.acceptDecline,
    ss: APPLICATIONS_HEADERS.ss,
    w4Forms: APPLICATIONS_HEADERS.w4Forms,
    resignationEmailSent: APPLICATIONS_HEADERS.resignationEmailSent,
    resignationLetters: APPLICATIONS_HEADERS.resignationLetters,
  };

  Object.keys(updates || {}).forEach((field) => {
    const header = editableHeaders[field];
    const columnIndex = header !== undefined ? columnIndexes[header] : undefined;

    if (columnIndex !== undefined) {
      sheet.getRange(rowNumber, columnIndex + 1).setValue(updates[field]);
    }
  });

  return { success: true, message: 'Application updated.' };
}

/**
 * Pulls First Name + Last Name + Time from the current year's
 * Applications tab and writes SCHEDULED_SIGN_IN_HEADER/
 * SCHEDULED_SIGN_OUT_HEADER on the attendance roster for whoever
 * matches by full name — those columns are created automatically the
 * first time this runs. Anyone whose Time doesn't parse, or whose name
 * doesn't match an existing attendance roster row, is skipped (and
 * listed) rather than guessed at. Director-only.
 *
 * ONE-TIME SETUP: run createApplicationsScheduleSyncTrigger() once to
 * keep this in sync automatically as new applicants are added
 * (approved) through the season.
 */
function syncScheduledTimes(submittedName, submittedPersonalCode) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    return performScheduledTimesSync(getApplicationsSheet(), auth.sheet);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * The actual sync logic, shared between syncScheduledTimes (director-
 * authenticated, reachable from the web app) and
 * runScheduledApplicationsSync (the unattended trigger below, which
 * has no director to authenticate as).
 */
function performScheduledTimesSync(applicationsSheet, attendanceSheet) {
  const columnIndexes = getColumnIndexes(applicationsSheet);
  const firstNameIndex = columnIndexes[APPLICATIONS_HEADERS.firstName];
  const lastNameIndex = columnIndexes[APPLICATIONS_HEADERS.lastName];
  const timeIndex = columnIndexes[APPLICATIONS_HEADERS.time];

  if (firstNameIndex === undefined || lastNameIndex === undefined || timeIndex === undefined) {
    return {
      success: false,
      error: 'The Applications sheet must have "First Name", "Last Name", and "Time" headers.',
    };
  }

  const lastRow = applicationsSheet.getLastRow();

  if (lastRow < 2) {
    return { success: true, updatedNames: [], skippedNames: [] };
  }

  const rows = applicationsSheet
    .getRange(2, 1, lastRow - 1, applicationsSheet.getLastColumn())
    .getValues();

  const attendanceColumnIndexes = getColumnIndexes(attendanceSheet);
  const attendanceNameIndex = attendanceColumnIndexes.Name;

  const attendanceLastRow = attendanceSheet.getLastRow();
  const attendanceNames =
    attendanceLastRow >= 2
      ? attendanceSheet.getRange(2, attendanceNameIndex + 1, attendanceLastRow - 1, 1).getValues()
      : [];

  const attendanceRowByLowerName = {};

  attendanceNames.forEach((row, index) => {
    const name = String(row[0]).trim();

    if (name) {
      attendanceRowByLowerName[name.toLowerCase()] = index + 2;
    }
  });

  let scheduledSignInIndex = attendanceColumnIndexes[SCHEDULED_SIGN_IN_HEADER];
  let scheduledSignOutIndex = attendanceColumnIndexes[SCHEDULED_SIGN_OUT_HEADER];

  if (scheduledSignInIndex === undefined) {
    attendanceSheet.getRange(1, attendanceSheet.getLastColumn() + 1).setValue(SCHEDULED_SIGN_IN_HEADER);
    scheduledSignInIndex = attendanceSheet.getLastColumn() - 1;
  }

  if (scheduledSignOutIndex === undefined) {
    attendanceSheet.getRange(1, attendanceSheet.getLastColumn() + 1).setValue(SCHEDULED_SIGN_OUT_HEADER);
    scheduledSignOutIndex = attendanceSheet.getLastColumn() - 1;
  }

  const updatedNames = [];
  const skippedNames = [];

  rows.forEach((row) => {
    const firstName = String(row[firstNameIndex]).trim();
    const lastName = String(row[lastNameIndex]).trim();

    if (!firstName && !lastName) {
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const timeRange = parseTimeRange(row[timeIndex]);
    const attendanceRowNumber = attendanceRowByLowerName[fullName.toLowerCase()];

    if (!timeRange || !attendanceRowNumber) {
      skippedNames.push(fullName);
      return;
    }

    attendanceSheet.getRange(attendanceRowNumber, scheduledSignInIndex + 1).setValue(timeRange.startText);
    attendanceSheet.getRange(attendanceRowNumber, scheduledSignOutIndex + 1).setValue(timeRange.endText);
    updatedNames.push(fullName);
  });

  invalidateRosterCache();

  return { success: true, updatedNames: updatedNames, skippedNames: skippedNames };
}

/**
 * Run this once to keep schedules synced automatically through the
 * season as applicants are added. Safe to run again later.
 */
function createApplicationsScheduleSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'runScheduledApplicationsSync') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('runScheduledApplicationsSync').timeBased().everyHours(6).create();
}

/**
 * Trigger-only entry point — syncScheduledTimes() takes director
 * credentials since it's also reachable from the web app, but a
 * time-based trigger has no one to authenticate as. This runs as the
 * script's own deploying identity instead, the same as every other
 * trigger in this project (AutoSignOut.gs, WeeklyReport.gs).
 */
function runScheduledApplicationsSync() {
  performScheduledTimesSync(getApplicationsSheet(), getAttendanceSheet());
}
