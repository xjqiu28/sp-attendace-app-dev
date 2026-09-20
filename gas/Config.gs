/**
 * ===================================================================
 * SHARED CONSTANTS
 * ===================================================================
 * Every other file in this project reads these instead of hardcoding
 * their own copies.
 */

// The tab that receives form submissions. A Google Form linked to a
// Sheet always names that tab "Form Responses 1" by default — keep
// this in sync with whatever your actual tab is named.
const SHEET_NAME = 'Form Responses 1';

// Used by the Friday auto-report (see WeeklyReport.gs), which only
// summarizes the Monday-Friday work week.
const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Sign-ins recorded after this hour are flagged late (red text on the
// sheet, "Late" badge on the director dashboard, and included in the
// dashboard's "Signed In Late" list).
const SIGN_IN_CUTOFF_HOUR = 9;

// Anyone still signed in (no sign-out yet) at this time gets
// automatically signed out — see AutoSignOut.gs.
const AUTO_SIGN_OUT_HOUR = 18;
const AUTO_SIGN_OUT_MINUTE = 30;

// Optional roster column: a person's own weekly hour cap. Read by
// buildDirectorWeeklyResult (DirectorView.gs) and the Friday auto-report
// (WeeklyReport.gs) to flag weeks that go over it.
const MAX_WEEKLY_HOURS_HEADER = 'Max Weekly Hours';

// Where an over-cap week's approval (director name + timestamp) is
// recorded — see WeekApprovals.gs. The tab is created automatically.
const WEEK_APPROVALS_SHEET_NAME = 'Week Approvals';

// Recipient for the Friday auto-report's emailed timesheet (see
// WeeklyReport.gs). Leave blank ('') to skip emailing and only write
// the report tab.
const TIMESHEET_REPORT_EMAIL = 'wendy@occny.org';

// Optional roster columns: a person's own scheduled shift, synced in
// from the Applications sheet's "Time" column (see Applications.gs)
// and used instead of SIGN_IN_CUTOFF_HOUR/AUTO_SIGN_OUT_HOUR for
// anyone who has one. Stored as plain time-of-day text (e.g.
// "9:00 AM"), not a full date, since the same schedule applies every
// working day.
const SCHEDULED_SIGN_IN_HEADER = 'Scheduled Sign In';
const SCHEDULED_SIGN_OUT_HEADER = 'Scheduled Sign Out';

// ===================================================================
// APPLICATIONS (see Applications.gs)
// ===================================================================
// A separate spreadsheet from the attendance roster — deliberately:
// it holds SSN/pay/tax-form status for applicants and staff, and this
// script also runs a public, unauthenticated web app, so the two are
// kept in different files rather than different tabs of the same one.
//
// One tab per year (a new one created each summer, old ones left
// alone), named "<year> Applications" — e.g. "2026 Applications" —
// so the code always finds the right one with no manual config change
// needed year to year.
//
const APPLICATIONS_SHEET_ID = '1ZwUq2YM-gRl2j__O7lbAC1eIdpD5CXskzh5zbG6JxBA';

const APPLICATIONS_TAB_SUFFIX = 'Applications';

// Column headers on that sheet, exactly as they appear there.
const APPLICATIONS_HEADERS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  dateInformation: 'Date Information',
  time: 'Time',
  rate: 'Rate',
  email: 'Email',
  sent: 'Sent',
  paidHours: 'Paid Hours',
  volunteerHours: 'Volunteer Hours',
  missingDocuments: 'Missing Documents',
  acceptDecline: 'Accept/Decline',
  ss: 'SS',
  w4Forms: 'W-4 Forms',
  resignationEmailSent: 'Resignation Email Sent',
  resignationLetters: 'Resignation Letters',
};
