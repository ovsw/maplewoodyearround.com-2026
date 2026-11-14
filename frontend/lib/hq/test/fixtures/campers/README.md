Camper files for the "load campers" tests (lib/hq/campers.test.ts). Every
child here is invented. The layout is described in docs/camp-hq/camper-file.md.

- `clean.csv`: four campers in Eagles and Otters, week of 5 July 2027.
- `unknown-group.csv`: the clean file plus a row for a group Camp HQ does not know.
- `malformed-row.csv`: the clean file plus rows that cannot be read.
- `mid-week-group-change.csv`: a camper who moves from Otters to Eagles on Wednesday.
