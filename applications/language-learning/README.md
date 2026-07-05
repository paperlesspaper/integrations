# Language Learning

Shows a deterministic foreign-language word of the day on a paperlesspaper display. It is inspired by the TRMNL Language Learning plugin, but it runs as a self-contained Open Integration with no upstream API dependency.

## Links

- [config.json](./config.json)

## Settings

- `targetLanguage`: language to learn.
- `translationLanguage`: translation and practice copy language (`en` or `de`).
- `showExample`: show or hide the example sentence.
- `showPractice`: show or hide the small practice prompt.
- `seed`: optional text that creates a different daily rotation.

## Data

The integration ships a curated daily vocabulary set for Brazilian Portuguese, Danish, Dutch, English, French, German, Greek, Italian, Japanese, Korean, Spanish, Swedish, and Turkish.

Each word includes:

- pronunciation
- part of speech
- English and German translations
- example sentence
- example translation
- memory hook
- CEFR-style difficulty label

The word is selected deterministically from the current UTC date, selected language, and optional seed.

## Language Support

This integration declares `language: ["en", "de"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.
