# Baby

A static HTML/CSS/JavaScript OpenIntegration for pregnancy and development from birth
through age five. No React, build step, account or external API is needed. Dates and
names stay in the render payload; the page fetches only local content and illustrations.
The old `paperlesspaper-apps/src/components/BirthCalendar` supplied the use case,
not the new medical data table or runtime.

## Use

Install `/baby/config.json` on the existing integration host. Set **dueDate** during
pregnancy. After birth, enter **birthDate**, the actual date of birth; it takes
precedence. The due date never implies that birth has happened. With no date the
integration displays setup instructions. A labelled demo is available in settings.

```sh
npx paperless dev applications/baby/config.json
npx paperless check applications/baby/config.json
node --test tests/baby.test.mjs
node scripts/check-baby-layouts.mjs
npx paperless render applications/baby/config.json --settings '{"demo":true}' --color blue-light --viewport 800x480 --output output/baby/demo.png
```

| Setting | Meaning |
| --- | --- |
| `dueDate` | Estimated due date, `YYYY-MM-DD`, corresponding to 40+0. |
| `birthDate` | Confirmed actual birth date; switches to child development. |
| `childName` | Optional name, limited to 40 characters and HTML-escaped. |
| `prematureWeeks` | Optional whole weeks before 40+0 agreed with the care team (0–20). Corrects the developmental reference until the second actual birthday, preserving chronological age. |
| `imageStyle` | `illustrated` (drawn, default) or `classic` (warm sculpted 3D, inspired by the old Baby integration). Applies before and after birth. |
| `dailyContent` | Daily editorial rotation (default on); disable for the weekly/monthly overview. |
| `showIllustration` | Show the image (default on); hiding it reflows the layout. |
| `showMeasurements` | Show the approximate pregnancy size and measurement method (default on). |
| `showAgeDetails` | Extra age / trimester explanation (default off). Corrected-age context remains visible when applicable. |
| `showProgress` | Pregnancy progress bar (default off). |
| `showDate` | Current date (default off). An explicitly selected preview date remains labelled and visible. |
| `showSources` | Compact source links (default off). Full provenance stays in the local data and this README. |
| `showNotes` | Additional pregnancy or developmental guidance (default off). |
| `showTip` | Include everyday activities (default on). Off hides both the extra idea and activity cards from the daily pool. |
| `textSize` | `small`, `middle` or `big`. |
| `color` | Global shared theme; default `blue-light`. |
| `demo` / `demoStage` | Explicit example mode: `pregnancy` (default 24+0), `baby` (6 months), `toddler` (2 years). |
| `demoPregnancyWeek` | Completed pregnancy week (0–41) in the pregnancy demo; ignored for personal dates. |
| `referenceDate` | Optional, visibly labelled preview date. Empty uses today's civil date in Europe/Berlin. |

Language comes from the host (`de`, `en`, including regional variants). All dates
use civil-day arithmetic, and ages use actual calendar anniversaries, including
month-end clamping and leap days. No 30-day months or conception-date estimate.
`SSW 24+0` means 24 completed weeks, the start of the 25th pregnancy week.
The legacy lowercase `birthdate` query setting remains a **due date** alias; it is
not interpreted as a confirmed actual birth.

## Content and evidence

Editorial source check: **2026-09-23**. This is source-backed educational copy,
not a clinical review or an individual developmental assessment.

- **38 weekly pregnancy records (4+0 through 41+6):** each record links to its
  specific [NHS week-by-week page](https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/).
  An additional introductory record covers 0+0 through 3+6 and explains gestational dating without inventing an embryo size.
- **Daily rotation:** 437 bilingual editorial cards: 268 prenatal cards (seven per week
  from week 4 through 41, plus two introductory cards) and 169 child cards (13 per
  reference age). This includes the existing overviews, domain facts and everyday
  ideas, plus **281 additional short contributions**. Each card inherits the exact
  source URL from its parent record. The sequence is editorial: it does **not** claim
  that a skill appears on that day. Gestational days select pregnancy cards;
  days since the current developmental reference anniversary select child cards.
  After 13 days, a child-stage pool repeats until the next reference age. The
  introductory pregnancy pool also repeats. Hiding activities shortens the pool.
  Demo cards rotate with the Berlin civil date while their example age stays fixed.
  There is no randomness, daily interpolation or invented daily growth data.
- **Size:** approximate educational values from those pages, not personalised
  estimates or growth percentiles. From week 20 the measurement changes from
  crown–rump to head–heel, with a visible explanation at that transition. No
  daily interpolation, weight estimates or misleading fruit comparisons.
- **13 child stages:** newborn, 2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48 and 60
  months. Four domains: social interaction, language, learning, movement.
  The newborn card offers care ideas, supported by
  [AAP newborn development](https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-1-Month.aspx)
  and [CDC responsive care activities](https://www.cdc.gov/act-early/milestones/2-months.html).
  Subsequent cards paraphrase the corresponding [CDC milestones](https://www.cdc.gov/act-early/milestones/).
- **Interpretation:** CDC examples describe abilities at least 75% of children
  show **by** that reference age. The card names its reference age separately
  from the child's current age. It uses the most recently reached reference
  age; between 6 and 9 months it remains the 6-month reference. It neither
  predicts a developmental leap nor marks an individual skill as achieved.
  Missing milestones, lost skills or concerns merit a discussion with the
  child's clinician; this note can be enabled with `showNotes`.
- **Prematurity:** the optional adjustment follows
  [AAP corrected age guidance](https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx).
  Before the adjusted due date, the newborn card remains visible with an
  explicit label. Adjustment ends at the second chronological birthday.
- **After the due date:** pregnancy continues until 41+6 unless an actual birth
  date is entered. From 42+0 a date-confirmation card appears. From the sixth
  birthday a coverage-limit card appears, rather than perpetually showing
  outdated five-year milestones.
- **Movement safety:** the old statement that movements can slow down near
  the due date is intentionally removed. With `showNotes` enabled, from week 20 the optional footer explains
  that reduced or changed movements need prompt contact with maternity care,
  consistent with [NHS week 40](https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/3rd-trimester/week-40/).

The compact pregnancy everyday ideas are editorial suggestions, not prescriptions,
and the AI-generated illustrations provide simplified orientation rather than anatomical evidence. Images are not to scale; reference stages are kept in the data rather than printed as captions.
All substantive records have their own source in `data/development.json`.
When editing, check the linked source, both languages and the exact age mapping;
update `reviewedAt` only after a new source review. Do not infer individual
capabilities, fertility dates or birth from a calendar date.

## Images and display

Two complete selectable image styles cover the full calendar. Each now has **12 prenatal
motifs** (the early pregnancy scene plus completed weeks 6, 8, 10, 12, 16, 20, 24,
28, 32, 36 and 40) and **19 child scenes** (birth and months 1, 2, 3, 4, 5, 6, 8,
9, 10, 12, 15, 18, 21, 24, 30, 36, 48 and 60). Before week 6, the parent scene
avoids depicting a developed fetus too early. Images switch at calendar-age
boundaries, using corrected age where applicable. An intermediate image does not
advance the CDC reference age: an eight-month picture still accompanies six-month
reference content. Images are illustrative scenes, not evidence of individual ability.

The latest expansion adds **22 generated assets**: five prenatal and six child
intermediates in each style. Existing assets remain available. All final PNGs are
in `assets/`, generated with the **built-in Imagegen tool**. Exact final prompts
are in `assets/intermediate-prompts.json`; earlier prompt sets remain in
`assets/style-prompts.json`, `assets/image-prompts.json` and `assets/icon-prompt.json`.
Unknown styles fall back to the drawn set; settings never enter asset paths directly.

The default display has no brand heading, image caption, review date, source footer
or general guidance footer. Only demo / preview identification remains when relevant.
A wider image column, open spacing and fewer rules keep the display easy to scan.
Optional header and footer content takes space only when enabled.

Both orientations retain the illustration with `object-fit: contain`. The white
art panel remains white in dark mode, while text, borders and accents follow
`applyColorTheme()`. Warm orange details use error-diffusion dithering for Spectra 6.
The eight manifest screenshots are processed EPD outputs, not raw browser images.
Missing images settle into a readable fallback; a content fetch failure reports an
error through the shared render lifecycle, and a later INIT can retry.

## Validation

`tests/baby.test.mjs` covers invalid dates, DST, calendar months, leap dates,
pregnancy/birth boundaries, every milestone anniversary, corrected age, demos,
source links, localization parity, daily cycles, activity filtering, intermediate images and all asset references.
`check-baby-layouts.mjs` runs all 52 content records in both styles, both languages and both
800×480 / 480×800 orientations, both with and without optional details. It also renders all
437 daily cards in both languages and orientations, and checks every intermediate image.
It then exercises larger frames, long names,
repeated INIT updates, visibility controls (including string booleans), invalid settings, HTML escaping and image failure/recovery.
