/**
 * ===================================================================
 * AUTO SIGN-OUT
 * ===================================================================
 * Runs once a day near AUTO_SIGN_OUT_HOUR:AUTO_SIGN_OUT_MINUTE
 * (Config.gs, default 6:30pm) and fills in a sign-out for anyone who
 * signed in today but never signed out — recomputing total hours and
 * the late-sign-in flag the same way a normal sign-out would, via
 * writeAttendanceCell (AttendanceLogic.gs), shared with the
 * self-service flow and the director's Edit Day tool.
 *
 * ONE-TIME SETUP: run createAutoSignOutTrigger() once (select it in
 * the function dropdown at the top of the Apps Script editor, click
 * Run, and approve the permissions prompt). Apps Script time triggers
 * fire within roughly a 15-minute window of the requested time, not
 * the exact minute.
 */

function autoSignOutStragglers() {
  const sheet = getAttendanceSheet();
  const columnIndexes = getColumnIndexes(sheet);
  const nameColumnIndex = columnIndexes.Name;

  if (nameColumnIndex === undefined) {
    return;
  }

  const currentTime = new Date();
  const dateToday = Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'M/d/yyyy');
  const todayColumnIndex = columnIndexes[dateToday];

  if (todayColumnIndex === undefined) {
    return; // nobody signed in today at all — no column, nothing to do
  }

  const cutoffTime = new Date(currentTime);
  cutoffTime.setHours(AUTO_SIGN_OUT_HOUR, AUTO_SIGN_OUT_MINUTE, 0, 0);
  const cutoffTimeText = formatDateTime(cutoffTime);

  const lastRow = sheet.getLastRow();

  for (let personRowNumber = 2; personRowNumber <= lastRow; personRowNumber++) {
    const name = String(sheet.getRange(personRowNumber, nameColumnIndex + 1).getValue()).trim();

    if (!name) {
      continue;
    }

    const attendanceCell = sheet.getRange(personRowNumber, todayColumnIndex + 1);
    const existingCellValue = attendanceCell.getValue();

    if (existingCellValue === '' || existingCellValue === null) {
      continue;
    }

    const attendanceData = parseAttendanceData(existingCellValue, personRowNumber);

    if (!attendanceData || !attendanceData['sign in time'] || attendanceData['sign out time']) {
      continue; // no sign-in recorded, or already signed out
    }

    const signInDate = parseFormattedDateTime(attendanceData['sign in time']);

    if (signInDate >= cutoffTime) {
      continue; // signed in after the cutoff already passed — leave it alone
    }

    writeAttendanceCell(attendanceCell, attendanceData['sign in time'], cutoffTimeText);
  }
}

/**
 * Run this once to install the automatic daily trigger. Safe to run
 * again later (removes any duplicate trigger for this function first).
 */
function createAutoSignOutTrigger() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'autoSignOutStragglers') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('autoSignOutStragglers')
    .timeBased()
    .everyDays(1)
    .atHour(AUTO_SIGN_OUT_HOUR)
    .nearMinute(AUTO_SIGN_OUT_MINUTE)
    .create();
}
