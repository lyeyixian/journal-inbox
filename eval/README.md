# Sorter eval set

Real raw daily files with hand-labelled routing, scored against the real ThoughtSplitter. This is an eval, not a test: the LLM is not deterministic, so it never blocks a commit. Run it when the splitter prompt changes and watch the score.

```sh
pnpm eval
```

## Case format

One folder per day under `cases/`, named after the day.

```
cases/
  2026-09-22/
    entries.md      the raw daily file, copied as is
    expected.json   what a human said each thought should have become
```

`expected.json` is a list of thoughts. `text` is a short label for a human reading the report, and `destination` is `vault`, `linear` or `journal`.

```json
[
  { "text": "standup went long again", "destination": "vault" },
  { "text": "idea: bot should ask about sleep", "destination": "linear" },
  { "text": "tired, skipped the gym", "destination": "journal" }
]
```

## Scoring

A case passes when the splitter puts the same number of thoughts in each destination as the label does. The score is the share of cases that pass, and every failing case prints what it got per destination. That is coarse. ENG-61 supplies the first cases from hand-checked sort runs, and the scoring gets stricter once there are cases to check it against.
