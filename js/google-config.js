// Google Calendar integration config.
//
// clientId is NOT a secret — OAuth Client IDs are routinely public
// (visible in every redirect URL / browser network tab). Never put a
// client secret here or anywhere else in this app.
//
// To enable Google Calendar sync:
//   1. Create a project at https://console.cloud.google.com/
//   2. Enable the "Google Calendar API" for that project.
//   3. Configure the OAuth consent screen (Testing mode is fine for
//      personal use — add your own Google account as a Test user).
//   4. Create an OAuth Client ID of type "Web application" and add
//      http://localhost:8080 under Authorized JavaScript origins.
//   5. Paste the Client ID below.
const GOOGLE_CALENDAR_CONFIG = {
  clientId: "",
};
