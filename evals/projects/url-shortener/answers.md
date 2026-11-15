# Prepared answers

- **Project name:** Shortly. **Track:** standard. Greenfield. It has a web user interface.
- **Users:** about 15 people in one marketing team; they create links. The public only clicks them.
- **Problem cost:** roughly two hours a week spent on a paid third-party shortener and on
  manual UTM spreadsheets; links on a third-party domain look untrustworthy.
- **Success:** 90 % of campaign links created in the tool within a month; a link is created
  in under 10 seconds; click counts trusted enough to replace the spreadsheet.
- **Volume:** about 200 new links a month, up to 50,000 redirects a day at campaign peaks.
- **Performance:** a redirect should take under 100 ms at the 95th percentile. Availability
  99.9 % for redirects; the admin interface may be down for maintenance.
- **Must have:** create a short link (optional custom alias), redirect, click count per link
  per day, list and search my links, disable a link, sign-in restricted to company accounts.
- **Later, not now:** QR codes, A/B destinations, public API, link expiry rules, team workspaces.
- **Constraints:** one developer, six weeks, must run on the company's existing cloud account,
  budget for hosting under 50 EUR a month. Links must never be reassigned once used.
- **Privacy:** do not store visitor IP addresses; EU visitors.
- **Abuse:** only staff create links, but a redirect service can be abused for phishing if
  an account is compromised — destination must be reviewable and a link can be disabled fast.
- **Stack preference:** none; the developer knows TypeScript and Python.
- **Anything unanswered:** choose the conservative option and record it as an open question.
