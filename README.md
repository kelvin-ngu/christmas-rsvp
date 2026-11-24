# Christmas RSVP

The invitation is a static GitHub Pages site. Its built-in RSVP form sends submissions to a Google Apps Script web app, which writes each successful response to a private Google Sheet.

## Set up the response Sheet

1. Create a blank, private Google Sheet named **Christmas RSVP responses**.
2. Open **Extensions → Apps Script**, replace the contents of `Code.gs` with [the RSVP script](google-sheets/Code.gs), and save.
3. Select `setupRsvp` in the function dropdown and click **Run**. Approve the requested spreadsheet access. This prepares the **RSVPs** tab and associates the script with the spreadsheet.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone** so guests can submit without signing into Google. Leave the Sheet itself private.
5. If you replace the current deployment, copy the web app URL ending in `/exec` and update the form’s `action` in `index.html`.
6. After the site updates, submit a test RSVP in a signed-out browser. Check that the confirmation appears and that the row is in the **RSVPs** tab.

## Enable GitHub Pages

In the repository, open **Settings → Pages**. Choose **Deploy from a branch**, select **main** and **/(root)**, and save.
