// Google Calendar integration — plug in OAuth credentials to activate
// Required env vars (add to .env.local when ready):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID (defaults to 'primary')

export interface CalendarEvent {
  summary: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;
  attendeeEmail: string;
  attendeeName: string;
}

export async function createCalendarEvent(event: CalendarEvent): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null; // not configured yet

  try {
    // Step 1: exchange refresh token for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) return null;

    // Step 2: create the calendar event
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startDateTime, timeZone: "America/Chicago" },
          end:   { dateTime: event.endDateTime,   timeZone: "America/Chicago" },
          attendees: [{ email: event.attendeeEmail, displayName: event.attendeeName }],
          reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }, { method: "popup", minutes: 15 }] },
        }),
      }
    );
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}
