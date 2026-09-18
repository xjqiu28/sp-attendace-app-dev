/**
 * ===================================================================
 * WEEKLY TOTALS REPORT (Friday auto-report)
 * ===================================================================
 * Sums each person's daily "total hour worked decimal" across a
 * Monday-Friday work week and writes the results to a tab named for
 * that specific week (e.g. "Week of 9-7-2026 to 9-11-2026"), with
 * one row per person: Name | Monday | Tuesday | Wednesday | Thursday
 * | Friday | Total for Week. A new tab is created for each new work
 * week; re-running the report mid-week updates existing rows in that
 * week's tab rather than duplicating them.
 *
 * This is separate from the director dashboard's interactive weekly
 * view (see DirectorView.gs), which covers Monday-Saturday and lets
 * the director pick any past week.
 *
 * ONE-TIME SETUP: run createWeeklyTotalsTrigger() once (select it in
 * the function dropdown at the top of the Apps Script editor, click
 * Run). That installs a trigger that runs generateWeeklyTotalsReport()
 * automatically every Friday night, summarizing that same Monday
 * through Friday.
 *
 * You can also run generateWeeklyTotalsReport() manually any time to
 * generate the report for the current/most recent work week on demand.
 */

function generateWeeklyTotalsReport() {
  const sheet = getAttendanceSheet();
  const columnIndexes = getColumnIndexes(sheet);
  const nameColumnIndex = columnIndexes.Name;

  if (nameColumnIndex === undefined) {
    throw new Error('The sheet must contain a "Name" header.');
  }

  const currentTime = new Date();
  const weekRange = getMostRecentCompletedWeek(currentTime);

  const weekDateStrings = [];
  const cursor = new Date(weekRange.weekStart);

  while (cursor <= weekRange.weekEnd) {
    weekDateStrings.push(Utilities.formatDate(cursor, Session.getScriptTimeZone(), 'M/d/yyyy'));
    cursor.setDate(cursor.getDate() + 1);
  }

  const lastRow = sheet.getLastRow();
  const results = [];

  for (let personRowNumber = 2; personRowNumber <= lastRow; personRowNumber++) {
    const name = String(sheet.getRange(personRowNumber, nameColumnIndex + 1).getValue()).trim();

    if (!name) {
      continue;
    }

    const dailyHours = []; // one entry per weekday, null if no recorded hours that day
    let weekTotal = 0;

    weekDateStrings.forEach((dateString) => {
      const dateColumnIndex = columnIndexes[dateString];
      let hoursForDay = null;

      if (dateColumnIndex !== undefined) {
        const cellValue = sheet.getRange(personRowNumber, dateColumnIndex + 1).getValue();

        if (cellValue !== '' && cellValue !== null) {
          const attendanceData = parseAttendanceData(cellValue, personRowNumber);

          if (attendanceData && typeof attendanceData['total hour worked decimal'] === 'number') {
            hoursForDay = attendanceData['total hour worked decimal'];
          }
        }
      }

      dailyHours.push(hoursForDay);

      if (hoursForDay !== null) {
        weekTotal += hoursForDay;
      }
    });

    results.push({ name: name, dailyHours: dailyHours, weekTotal: weekTotal });
  }

  writeWeeklyTotalsReport(weekRange, results);

  return results;
}

/**
 * Builds a spreadsheet-safe tab name for a given work week, e.g.
 * "Week of 9-7-2026 to 9-11-2026". Slashes aren't allowed in Google
 * Sheets tab names, so dates use dashes here instead of "M/d/yyyy".
 */
function getWeekTabName(weekRange) {
  const startText = Utilities.formatDate(
    weekRange.weekStart,
    Session.getScriptTimeZone(),
    'M-d-yyyy'
  );
  const endText = Utilities.formatDate(weekRange.weekEnd, Session.getScriptTimeZone(), 'M-d-yyyy');

  return `Week of ${startText} to ${endText}`;
}

/**
 * Returns the Monday-Friday range of the current/most recent work
 * week as of referenceDate — the Friday on or before referenceDate,
 * and the Monday four days before that. If referenceDate is itself
 * a Friday, that Friday is treated as the end of the work week.
 */
function getMostRecentCompletedWeek(referenceDate) {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  // Distance backward from referenceDate to the most recent Friday.
  const daysSinceFriday = (dayOfWeek - 5 + 7) % 7;

  const weekEnd = new Date(date);
  weekEnd.setDate(date.getDate() - daysSinceFriday);
  weekEnd.setHours(0, 0, 0, 0);

  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 4); // Monday of that same work week

  return { weekStart: weekStart, weekEnd: weekEnd };
}

/**
 * Writes one row per person to a tab named for this specific work
 * week (e.g. "Week of 9-7-2026 to 9-11-2026"), creating that tab if
 * it doesn't exist yet. Re-running the report for the same week
 * updates existing people's rows in place rather than duplicating
 * them; a new week gets its own separate tab.
 */
function writeWeeklyTotalsReport(weekRange, results) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const tabName = getWeekTabName(weekRange);

  let reportSheet = spreadsheet.getSheetByName(tabName);

  if (!reportSheet) {
    reportSheet = spreadsheet.insertSheet(tabName);
    reportSheet.appendRow(['Name'].concat(WEEKDAY_LABELS, ['Total for Week']));
  }

  const lastRow = reportSheet.getLastRow();
  const existingRowByName = {};

  if (lastRow >= 2) {
    const existingNames = reportSheet.getRange(2, 1, lastRow - 1, 1).getValues();

    existingNames.forEach((row, index) => {
      const existingName = String(row[0]).trim();

      if (existingName) {
        existingRowByName[existingName] = index + 2; // sheet row number
      }
    });
  }

  results.forEach((result) => {
    const dailyValues = result.dailyHours.map((hours) =>
      hours === null ? '' : Number(hours.toFixed(2))
    );

    const roundedWeekTotal = Number(result.weekTotal.toFixed(2));

    const rowValues = [result.name].concat(dailyValues, [roundedWeekTotal]);

    const existingRowNumber = existingRowByName[result.name];

    if (existingRowNumber) {
      reportSheet.getRange(existingRowNumber, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      reportSheet.appendRow(rowValues);
    }
  });
}

/**
 * Run this once to install the automatic weekly trigger. Safe to run
 * again later (removes any duplicate trigger for this function first).
 * Runs Friday nights, since that's the last day of the work week.
 */
function createWeeklyTotalsTrigger() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'generateWeeklyTotalsReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('generateWeeklyTotalsReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(23)
    .create();
}
