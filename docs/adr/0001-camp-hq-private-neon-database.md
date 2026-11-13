# Camp operations run in Camp HQ, a staff-only part of the website on a private Neon database

The summer camp operations tools (group schedules, club day signups, camper
attendance) replace Maplewood's Airtable bases. They hold children's names,
attendance and pickup changes, so that data lives in a private Neon Postgres
database, never in the Sanity content dataset that editors publish from. The
tools are Camp HQ: pages of the existing Next.js website at `/hq`, behind Clerk
sign-in, so we keep one codebase and one deployment. Accounts belong to people, not devices:
every Admin and Senior staff member has their own. Junior staff normally have
none, and an Admin can give one as an exception.
Whoever uses a device signs in, then signs out before handing it over. Camp HQ has nothing to do with the marketing content: it
keeps its own records of camp groups and activities, entered separately. The
lists in Sanity are only a reference for what exists today.

## Considered Options

- **Build it in Sanity and the Studio.** Rejected: children's data would sit in
  the content dataset, and the glossary keeps parent forms out of the Studio.
- **A separate app.** Rejected: a second codebase and deployment for the same
  team, with the group and activity lists copied across.
- **One login per iPad or role.** Rejected: Senior staff move between groups
  and activities, and shared logins get messy fast.
- **Read groups and activities from Sanity as the master list.** Rejected:
  marketing content and the administration system stay separate, and settings
  such as capacity, Teams and specialists have no place in website content.
