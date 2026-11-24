const RSVP_TAB = 'RSVPs';
const WEBSITE_URL = 'https://kelvin-ngu.github.io/christmas-rsvp/';
const HEADERS = ['Submitted at', 'Name', 'Email', 'Attending', 'Party size', 'Submission ID'];

// Run this once from Extensions > Apps Script in the private response Sheet.
function setupRsvp() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this script from the response spreadsheet.');
  }

  const sheet = spreadsheet.getSheetByName(RSVP_TAB) || spreadsheet.insertSheet(RSVP_TAB);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (HEADERS.some((header, index) => header !== headers[index])) {
    throw new Error('The existing RSVPs tab has different columns. Use an empty spreadsheet or rename that tab.');
  }

  sheet.setFrozenRows(1);
  sheet.hideColumns(HEADERS.length);
  PropertiesService.getScriptProperties().setProperty('RSVP_SPREADSHEET_ID', spreadsheet.getId());
}

function doGet() {
  return responsePage('Christmas Celebration RSVP', 'Use the event page to send your RSVP.');
}

function doPost(event) {
  const rsvp = parseRsvp(event?.parameter ?? {});
  if (!rsvp) {
    return responsePage('Check your RSVP', 'Please return to the event page and check your answers.');
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('RSVP_SPREADSHEET_ID');
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(RSVP_TAB);
    const lastRow = sheet.getLastRow();
    const alreadySaved = lastRow > 1 && sheet.getRange(2, HEADERS.length, lastRow - 1, 1)
      .createTextFinder(rsvp.id).matchEntireCell(true).findNext();

    if (!alreadySaved) {
      sheet.appendRow([
        new Date(),
        safeSheetText(rsvp.name),
        safeSheetText(rsvp.email),
        rsvp.attendance === 'yes' ? 'Yes' : 'No',
        rsvp.partySize,
        rsvp.id
      ]);
      SpreadsheetApp.flush();
    }
  } catch (error) {
    console.error('Could not save RSVP', error);
    return responsePage('RSVP could not be confirmed', 'Use your browser’s Back button to retry your RSVP.');
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }

  return responsePage('Thanks for your RSVP!', 'Your response has been saved.');
}

function parseRsvp(values = {}) {
  const id = values.submissionId || '';
  const name = (values.guestName || '').trim();
  const email = (values.email || '').trim();
  const attendance = values.attendance;
  const partySize = attendance === 'no' ? 0 : Number(values.partySize);

  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) ||
      !name || name.length > 100 ||
      email.length > 254 || (email && !/^[^\s@]+@[^\s@]+$/.test(email)) ||
      (attendance !== 'yes' && attendance !== 'no') ||
      (attendance === 'yes' && (!Number.isSafeInteger(partySize) || partySize < 1))) {
    return null;
  }
  return { id, name, email, attendance, partySize };
}

function safeSheetText(value) {
  return /^[=+@-]/.test(value) ? "'" + value : value;
}

function responsePage(title, message) {
  // These values are fixed strings supplied by this script.
  return HtmlService.createHtmlOutput(`<!doctype html>
    <html lang="en"><head><base target="_top"><style>
      body { margin: 0; background: #0b1c16; color: #fff7e7; font: 1rem/1.6 system-ui, sans-serif; }
      main { max-width: 34rem; margin: 12vh auto; padding: 2rem; }
      h1 { color: #f3ce84; font: 400 clamp(2rem, 7vw, 3.5rem) Georgia, serif; }
      a { color: #f3ce84; }
    </style></head><body><main>
      <h1>${title}</h1><p>${message}</p><a href="${WEBSITE_URL}">Back to the Christmas page</a>
    </main></body></html>`)
    .setTitle(title).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
