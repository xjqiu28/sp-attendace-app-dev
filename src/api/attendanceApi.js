import { WEB_APP_URL, REQUEST_TIMEOUT_MS } from '../config.js';

// Wraps fetch with a hard timeout so a stalled connection can never
// leave the UI stuck waiting forever — it always eventually resolves
// or throws (with err.name === 'AbortError' on timeout).
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchNames() {
  const response = await fetchWithTimeout(`${WEB_APP_URL}?action=getNames`);
  const result = await response.json();
  return result.names || [];
}

// Returns { success: true, message } or { success: false, error }.
// Throws (with err.name === 'AbortError' on timeout) on network failure.
export async function submitAttendance(name, code) {
  const response = await fetchWithTimeout(WEB_APP_URL, {
    method: 'POST',
    // Content-Type text/plain avoids a CORS preflight request, which
    // Apps Script web apps don't handle. The script still parses the
    // body as JSON on its end.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ name, code }),
  });

  return response.json();
}

// Daily: returns { success: true, date, entries: [{ name, signInTime,
// signOutTime, totalHoursDecimal, totalHoursFormatted, status, isLate,
// lateBy: { hours, minutes, formatted } | null }], totalRoster,
// totalSignedIn, absentNames, lateNames: [{ name, lateBy }].
// Weekly: returns { success: true, weekNumber, weekStart, weekEnd,
// availableWeeks: [{ weekNumber, weekStart, weekEnd, label }], entries:
// [{ name, weekTotalHours, weekTotalFormatted, days }] }. Pass weekNumber
// to view a specific week (from availableWeeks); omitted, it defaults to
// the most recent week. Either way, or { success: false, error } on
// rejection. Read-only — never writes to the sheet. Throws (with
// err.name === 'AbortError' on timeout) on network failure.
export async function getDirectorView(name, code, view = 'daily', weekNumber) {
  const response = await fetchWithTimeout(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'directorView', name, code, view, weekNumber }),
  });

  return response.json();
}

// Fills in a Personal Code (birthday as MMDDYYYY) on the sheet for
// every roster name that doesn't have one yet; existing codes are
// never touched. Returns { success: true, message, generatedNames,
// skippedNames } or { success: false, error }. Throws (with
// err.name === 'AbortError' on timeout) on network failure.
export async function generatePersonalCodes(name, code) {
  const response = await fetchWithTimeout(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'generateCodes', name, code }),
  });

  return response.json();
}
