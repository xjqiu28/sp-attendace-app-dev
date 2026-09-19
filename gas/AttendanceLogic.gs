/**
 * ===================================================================
 * SIGN-IN / SIGN-OUT LOGIC
 * ===================================================================
 * Everything involved in recording an attendance submission, shared
 * by both myFunction (the legacy Google Form trigger, in Code.gs) and
 * processAttendanceSubmission (the web app entry point).
 */

/**
 * Same matching + attendance logic as myFunction, minus the
 * "temporary form row" handling — nothing is written unless the
 * code is verified.
 */
function processAttendanceSubmission(submittedName, submittedPersonalCode) {
  const sheet = getAttendanceSheet();

  let columnIndexes = getColumnIndexes(sheet);

  const nameColumnIndex = columnIndexes.Name;
  const personalCodeColumnIndex = columnIndexes['Personal Code'];

  if (nameColumnIndex === undefined || personalCodeColumnIndex === undefined) {
    throw new Error('The sheet must contain both "Name" and "Personal Code" headers.');
  }

  const currentTime = new Date();
  const dateToday = Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'M/d/yyyy');

  let todayColumnIndex = columnIndexes[dateToday];

  if (todayColumnIndex === undefined) {
    createDateColumn(sheet, dateToday);
    columnIndexes = getColumnIndexes(sheet);
    todayColumnIndex = columnIndexes[dateToday];
  }

  // Cached name -> row/code lookup instead of bulk-reading every row AND
  // every date column ever created — a name/code mismatch now costs zero
  // sheet reads, and a match only reads the two cells it actually needs.
  const roster = getRoster(sheet, columnIndexes);
  const person = roster.byLowerName[submittedName.toLowerCase()];

  if (!person) {
    return { success: false, error: 'Name not found. Please check spelling or contact the admin.' };
  }

  if (person.personalCode !== submittedPersonalCode) {
    return { success: false, error: 'Incorrect personal code for that name.' };
  }

  const personRowNumber = person.row;

  const yesterdayDate = getPreviousDate(currentTime);
  const yesterdayColumnIndex = columnIndexes[yesterdayDate];

  if (yesterdayColumnIndex !== undefined) {
    const yesterdayAttendanceCell = sheet.getRange(personRowNumber, yesterdayColumnIndex + 1);
    const yesterdayCellValue = yesterdayAttendanceCell.getValue();

    if (yesterdayCellValue !== '' && yesterdayCellValue !== null) {
      const yesterdayAttendanceData = parseAttendanceData(yesterdayCellValue, personRowNumber);

      if (
        yesterdayAttendanceData &&
        yesterdayAttendanceData['sign in time'] &&
        !yesterdayAttendanceData['sign out time']
      ) {
        recordPreviousDaySignOut(
          personRowNumber,
          yesterdayAttendanceCell,
          yesterdayAttendanceData,
          currentTime
        );

        return {
          success: true,
          message: `${person.name}, you were signed out for yesterday (${yesterdayDate}).`,
        };
      }
    }
  }

  const attendanceCell = sheet.getRange(personRowNumber, todayColumnIndex + 1);
  const entryStatus = recordAttendanceEntry(personRowNumber, attendanceCell);

  if (entryStatus === 'signed-in') {
    return { success: true, message: `${person.name}, you have been signed in.` };
  }
  if (entryStatus === 'signed-out') {
    return { success: true, message: `${person.name}, you have been signed out.` };
  }
  return { success: false, error: `${person.name}, you have already signed in and out today.` };
}

/**
 * Records either sign-in or sign-out for today's attendance cell.
 * Returns 'signed-in' | 'signed-out' | 'already-complete'.
 *
 * First entry:
 * - Saves sign-in time.
 * - If after SIGN_IN_CUTOFF_HOUR, colors only the sign-in label and
 *   time red.
 *
 * Second entry:
 * - Saves sign-out time.
 * - Calculates formatted and decimal total hours.
 */
function recordAttendanceEntry(personRowNumber, attendanceCell) {
  const currentTime = new Date();
  const existingCellValue = attendanceCell.getValue();

  if (existingCellValue === '' || existingCellValue === null) {
    const signInTime = formatDateTime(currentTime);

    const attendanceData = {
      'sign in time': signInTime,
    };

    const signInJsonText = JSON.stringify(attendanceData);

    attendanceCell.setValue(signInJsonText);

    if (isLateSignIn(currentTime)) {
      applyLateSignInFormatting(attendanceCell, signInJsonText, signInTime);
    }

    return 'signed-in';
  }

  const attendanceData = parseAttendanceData(existingCellValue, personRowNumber);

  if (!attendanceData) {
    return 'already-complete';
  }

  if (attendanceData['sign out time']) {
    return 'already-complete';
  }

  recordSignOutForAttendanceCell(personRowNumber, attendanceCell, attendanceData, currentTime);

  return 'signed-out';
}

/**
 * Records today's submission as the previous day's sign-out.
 */
function recordPreviousDaySignOut(personRowNumber, attendanceCell, attendanceData, currentTime) {
  const signOutTime = formatDateTime(currentTime);

  const signInDate = parseFormattedDateTime(attendanceData['sign in time']);
  const signOutDate = parseFormattedDateTime(signOutTime);

  const totalHoursWorked = calculateTotalHours(signInDate, signOutDate);

  const reorderedAttendanceData = {
    'total hour worked': totalHoursWorked.formatted,
    'total hour worked decimal': totalHoursWorked.decimal,
    'sign in time': attendanceData['sign in time'],
    'sign out time': signOutTime,
  };

  const reorderedJsonText = JSON.stringify(reorderedAttendanceData);
  const signInWasLate = isLateSignIn(signInDate);

  if (signInWasLate) {
    applyLateSignInFormatting(attendanceCell, reorderedJsonText, attendanceData['sign in time']);
  } else {
    attendanceCell.setValue(reorderedJsonText);
  }
}

/**
 * Records sign-out in an attendance cell that already contains sign-in.
 */
function recordSignOutForAttendanceCell(
  personRowNumber,
  attendanceCell,
  attendanceData,
  currentTime
) {
  const signOutTime = formatDateTime(currentTime);

  const signInDate = parseFormattedDateTime(attendanceData['sign in time']);
  const signOutDate = parseFormattedDateTime(signOutTime);

  const totalHoursWorked = calculateTotalHours(signInDate, signOutDate);

  const reorderedAttendanceData = {
    'total hour worked': totalHoursWorked.formatted,
    'total hour worked decimal': totalHoursWorked.decimal,
    'sign in time': attendanceData['sign in time'],
    'sign out time': signOutTime,
  };

  const reorderedJsonText = JSON.stringify(reorderedAttendanceData);
  const signInWasLate = isLateSignIn(signInDate);

  if (signInWasLate) {
    applyLateSignInFormatting(attendanceCell, reorderedJsonText, attendanceData['sign in time']);
  } else {
    attendanceCell.setValue(reorderedJsonText);
  }
}

/**
 * Applies red font only to the "sign in time" label and its time.
 */
function applyLateSignInFormatting(attendanceCell, jsonText, signInTime) {
  const signInText = `"sign in time":"${signInTime}"`;
  const startIndex = jsonText.indexOf(signInText);

  if (startIndex === -1) {
    attendanceCell.setValue(jsonText);
    return;
  }

  const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(jsonText);
  const redTextStyle = SpreadsheetApp.newTextStyle().setForegroundColor('red').build();

  richTextBuilder.setTextStyle(startIndex, startIndex + signInText.length, redTextStyle);
  attendanceCell.setRichTextValue(richTextBuilder.build());
}

/**
 * Returns every non-blank name from the Name column, alphabetized,
 * for populating the website's dropdown. Personal codes are never
 * included in this response.
 */
function getNamesList() {
  const sheet = getAttendanceSheet();
  const columnIndexes = getColumnIndexes(sheet);

  if (columnIndexes.Name === undefined) {
    return [];
  }

  const roster = getRoster(sheet, columnIndexes);

  const names = Object.keys(roster.byLowerName).map((key) => roster.byLowerName[key].name);
  names.sort((a, b) => a.localeCompare(b));

  return names;
}
