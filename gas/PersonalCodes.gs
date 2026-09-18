/**
 * ===================================================================
 * PERSONAL CODES
 * ===================================================================
 */

/**
 * Web-triggered birthday-code generation, restricted to authorized
 * directors (see authorizeDirector in DirectorView.gs). Called by the
 * "Generate New Codes" button on the director dashboard.
 */
function generatePersonalCodesFromBirthdays(submittedName, submittedPersonalCode) {
  const auth = authorizeDirector(submittedName, submittedPersonalCode);

  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  return runBirthdayCodeGeneration(auth.sheet, auth.columnIndexes);
}

/**
 * Fills in a Personal Code (birthday as MMDDYYYY — e.g. September 1,
 * 2008 becomes "09012008") for every person who has a Birthday but no
 * Personal Code yet. People who already have a code are left
 * untouched.
 *
 * SETUP REQUIRED: add a "Birthday" column to the sheet with each
 * person's date of birth (a real date, or text like "9/1/2008").
 */
function runBirthdayCodeGeneration(sheet, columnIndexes) {
  const nameColumnIndex = columnIndexes.Name;
  const personalCodeColumnIndex = columnIndexes['Personal Code'];
  const birthdayColumnIndex = columnIndexes.Birthday;

  if (nameColumnIndex === undefined || personalCodeColumnIndex === undefined) {
    return { success: false, error: 'The sheet must contain "Name" and "Personal Code" headers.' };
  }

  if (birthdayColumnIndex === undefined) {
    return {
      success: false,
      error: 'Add a "Birthday" column to the sheet before generating codes.',
    };
  }

  const lastRow = sheet.getLastRow();
  const generatedNames = [];
  const skippedNames = [];

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const name = String(sheet.getRange(rowNumber, nameColumnIndex + 1).getValue()).trim();

    if (!name) {
      continue;
    }

    const personalCodeCell = sheet.getRange(rowNumber, personalCodeColumnIndex + 1);
    const existingCode = String(personalCodeCell.getValue()).trim();

    if (existingCode !== '') {
      continue;
    }

    const birthdayValue = sheet.getRange(rowNumber, birthdayColumnIndex + 1).getValue();
    const birthdayCode = formatBirthdayAsCode(birthdayValue);

    if (!birthdayCode) {
      skippedNames.push(name);
      continue;
    }

    personalCodeCell.setValue(birthdayCode);
    generatedNames.push(name);
  }

  return {
    success: true,
    message:
      generatedNames.length > 0
        ? `Generated ${generatedNames.length} new code(s).`
        : 'No new codes were needed.',
    generatedNames: generatedNames,
    skippedNames: skippedNames,
  };
}

/**
 * Converts a Birthday cell value into an MMDDYYYY personal code.
 * Accepts either a real Date (typed into the sheet as a date) or text
 * like "9/1/2008". Returns null if it can't be parsed.
 */
function formatBirthdayAsCode(birthdayValue) {
  let birthdayDate;

  if (birthdayValue instanceof Date) {
    birthdayDate = birthdayValue;
  } else {
    const text = String(birthdayValue || '').trim();

    if (!text) {
      return null;
    }

    const parts = text.split(/[\/\-]/);

    if (parts.length !== 3) {
      return null;
    }

    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2].length === 2 ? '20' + parts[2] : parts[2]);

    if (!month || !day || !year) {
      return null;
    }

    birthdayDate = new Date(year, month - 1, day);
  }

  if (isNaN(birthdayDate.getTime())) {
    return null;
  }

  const month = String(birthdayDate.getMonth() + 1).padStart(2, '0');
  const day = String(birthdayDate.getDate()).padStart(2, '0');
  const year = String(birthdayDate.getFullYear());

  return `${month}${day}${year}`;
}

/**
 * LEGACY / MANUAL: creates random personal codes (one uppercase
 * letter + five digits, e.g. A12345) for anyone missing one. Superseded
 * by the birthday-based flow above for the website button, but kept
 * here in case you ever want to generate codes by hand from the Apps
 * Script editor instead of using a Birthday column.
 */
function createPersonalCodes() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  const columnIndexes = getColumnIndexes(sheet);

  const nameColumnIndex = columnIndexes.Name;
  const personalCodeColumnIndex = columnIndexes['Personal Code'];
  const timestampColumnIndex = columnIndexes.Timestamp;

  if (nameColumnIndex === undefined || personalCodeColumnIndex === undefined) {
    throw new Error('The sheet must contain "Name" and "Personal Code" headers.');
  }

  const lastRow = sheet.getLastRow();
  const existingCodes = new Set();

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const existingCode = String(
      sheet.getRange(rowNumber, personalCodeColumnIndex + 1).getValue()
    ).trim();

    if (existingCode !== '') {
      existingCodes.add(existingCode);
    }
  }

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const personalCodeCell = sheet.getRange(rowNumber, personalCodeColumnIndex + 1);
    const existingCode = String(personalCodeCell.getValue()).trim();

    if (existingCode !== '') {
      continue;
    }

    let newPersonalCode;

    do {
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      newPersonalCode = `${randomLetter}${randomDigits}`;
    } while (existingCodes.has(newPersonalCode));

    personalCodeCell.setValue(newPersonalCode);
    existingCodes.add(newPersonalCode);

    if (timestampColumnIndex !== undefined) {
      const timestampCell = sheet.getRange(rowNumber, timestampColumnIndex + 1);

      if (timestampCell.getValue() === '') {
        timestampCell.setValue(new Date());
      }
    }
  }
}
