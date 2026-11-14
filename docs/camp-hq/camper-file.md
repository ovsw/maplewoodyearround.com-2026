# Camper file

Camp HQ loads its camper list from a CSV file that an Admin uploads at
`/hq/campers`. Maplewood has not supplied a real CampMinder export yet, so
this layout is Camp HQ's own. When the real export is known, change the
column mapping in `frontend/lib/hq/camper-csv.ts` (`CAMPER_CSV_COLUMNS`, and
the value rules below it). Nothing else reads the file.

## Layout

One row per camper per camp day. The first row names the columns, in any
order and any letter case:

| Column       | Holds                                                          |
| ------------ | -------------------------------------------------------------- |
| `Camper ID`  | The camper's id in CampMinder, the same on each of their rows. |
| `Name`       | The camper's name as lists show it.                            |
| `Date`       | One camp day, `YYYY-MM-DD`, camp local time.                   |
| `Camp group` | The Camp group that day, spelled as in Camp HQ (any case).     |
| `Expected`   | `yes`, or `no` for a planned absence.                          |

```csv
Camper ID,Name,Date,Camp group,Expected
C-1001,Ava Brookfield,2027-07-05,Eagles,yes
C-1001,Ava Brookfield,2027-07-06,Eagles,no
```

The file is limited to 1 MB.

## What a load does

- The file replaces the whole camper list. Campers missing from it are
  removed; loading the same file twice changes nothing the second time.
- A row naming a Camp group Camp HQ does not know is reported, never guessed.
- A camper with any row that cannot be used (unknown group, bad date, a
  second name, two different rows for one day) is left exactly as before.
- When a row cannot be matched to a camper, nobody is removed and no camper
  loses a day the file leaves out. When no camper could be loaded, nobody is
  removed.
- Every load is recorded with its source, time, counts and the rows that could
  not be read, and the report lists campers added, changed and removed.

The upload is one adapter. The "load campers" operation in
`frontend/lib/hq/campers.ts` takes the normalised camper days, so a later
CampMinder API adapter feeds the same operation.
