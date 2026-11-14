# Choices made where the spec was silent

Spec #140 left these points open. Each sub-issue chose the simplest option
that fits the spec and wrote it in its PR or commits; this list gathers them
for the final pull request and for Maplewood's review. Items marked
**provisional** wait for Maplewood's answer (tracked in Basecamp).

## Sign-in and accounts (#142, #143, #144)

- `/hq` has no sign-up page; Clerk's sign-up mode is Restricted. Test users
  are created through Clerk's Backend API.
- Clerk loads only under `/hq`; without the Clerk keys `/hq` says Camp HQ is
  not available and the Website is unchanged.
- A new account starts with the Senior staff role, Juniors included.
- When Clerk refuses direct creation, Camp HQ sends an invitation and keeps
  the email; the account links on the person's first sign-in by a verified
  email. An email already used by a Clerk user links that user. An account
  with several invited emails links to one staff member only.
- Switching an account off bans the Clerk user, and Camp HQ refuses it at
  once. An account that is on must be switched off before the person is
  removed, so the last Admin can never be removed or switched off.

## Lists (#145)

- The seed copies Camp group and Summer activity names and grades from the
  Website once, into a committed seed file.
- **Provisional (sample):** each group's Team comes from its youngest grade
  (Preschool and Kindergarten: Team 1; 1st and 2nd: Team 2; 3rd to 5th:
  Team 3; 6th and up: Team 4).
- An activity with no grades on the Website is allowed for every grade.
- A Lunch activity is added for schedules. Lunch and free swim are Shared
  activities; every other activity starts as Exclusive.
- Removing a group or activity still in use is refused with the list of
  places it is used.

## Group schedules and views (#147, #148)

- Schedule views only read: a weekday an Admin never opened shows nothing
  scheduled instead of eleven empty default slots. The builder starts a day
  with the default slots (30 minutes from 9:30) when an Admin opens it.
- A slot ends at its end minute: back to back is not an overlap, and the
  current slot changes on the minute.
- Schedule and pick screens refetch every 30 seconds while visible, and on
  focus.

## Assignments (#146)

- Replacing a group's leader or an activity's specialist asks the Admin to
  confirm, and replaces only the person they confirmed; if it changed
  meanwhile, Camp HQ asks again.

## Club day (#150, #151)

- **Provisional:** an Exclusive activity cannot be booked during an
  overlapping Club day period in which it is a Club day option, and cannot
  become an option while such a booking exists.
- Signups open at 9:30 and lock at 11:00 camp time until an Admin changes
  them.
- An option's capacity is edited in place; to change its activity, remove the
  option and add another. Two Teams may offer the same activity at the same
  time.
- A group's Club day periods are its Club day slots that weekday, in time
  order. Every group of a Team shares the places of period 1, period 2 and so
  on.
- A pick counts toward capacity only while its option belongs to the camper's
  group's Team that weekday. Removing an option a child has picked is
  refused.

## Campers (#149)

- The camper file layout is Camp HQ's own until Maplewood shares a real
  CampMinder export (`docs/camp-hq/camper-file.md`).
- A load replaces the whole camper list. A camper with any unusable row is
  left as it was; when a row cannot be matched to a camper, or no camper
  could be loaded, nobody is removed.
- Sample campers never replace an uploaded list.
- A file over 1 MB is refused; it cannot be loaded in parts.

## Rosters and front desk (#152)

- A printed roster shows each child's name, Camp group and final week, the
  specialist and the Junior staff, one roster per printed page.
- The front desk lookup says where a child is from their group's slot at the
  current time; in a Club day period, from their pick. A group with no
  schedule that day says so.

## Run-through, dev data and clearing (#153)

- The automated run-through moves time with a test clock file
  (`CAMP_HQ_TEST_CLOCK_FILE`) that the server reads only on the local
  database outside Vercel. Each Playwright run gets a fresh local database.
- The sample data now also sets up a sample day for the first Camp group
  (Angels): the test leader leads it, the Sample Junior helps it and runs
  Archery on Club day, its 11:30 slot is a Club day period every weekday, and
  its Team has three Club day options (Archery and Drama for 8, Ceramics
  for 2) every weekday. Each part is added only while Camp HQ has nothing of
  that kind.
- The shared Neon dev database gets its data from a separate command,
  `hq:db:sample`, run after `hq:db:migrate`. It refuses a production Clerk
  key. Running it in a new week loads that week's invented campers.
- Clearing a past summer takes the first day to keep and the typed word
  `CLEAR`. It also removes the records of loads made before that date,
  because their error lists can name children, but keeps the newest load
  record while any camper remains. The date cannot be later than today.
