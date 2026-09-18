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
