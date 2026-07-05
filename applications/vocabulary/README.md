---
slug: vocabulary
name: Vocabulary
version: 0.1.0
description: Expand your vocabulary with a new word daily.
renderPage: ./render.html
icon: ./assets/icon.png
configUrl: /vocabulary/config.json
apiUrl: /vocabulary/api/data
---

# Vocabulary

Vocabulary displays a deterministic daily word with pronunciation, part of speech, definition, example sentence, related words, and a short practice prompt.

## Links

- [Demo](https://integrations.paperlesspaper.de/vocabulary/run)
- [config.json](./config.json)

## Common URLs

- `/vocabulary/`
- `/vocabulary/?selection=daily`
- `/vocabulary/?selection=custom&customWord=serendipity`
- `/vocabulary/?layout=compact&color=dark`
- `/vocabulary/config.json`
- `/vocabulary/api/data`

## Settings

- `selection`: `daily`, `random`, or `custom`
- `customWord`: a lookup word used when `selection` is `custom`
- `offset`: shifts the daily rotation forward or backward
- `seed`: customizes the deterministic rotation
- `layout`: `daily` or `compact`
- `showPronunciation`: show or hide phonetic text
- `showExample`: show or hide the example sentence
- `showRelated`: show or hide related words
- `showPrompt`: show or hide the practice prompt
- `showSource`: show or hide the dictionary source
- `dateFormat`: `long`, `short`, or `none`

## Data source

The daily word is selected from a local curated word bank so it is stable for a given date. Definitions are enriched server-side using public no-key APIs:

```txt
https://api.dictionaryapi.dev/api/v2/entries/en/<word>
https://api.datamuse.com/words?sp=<word>&md=dps&max=1
```

If both public lookups fail or miss a word, the integration falls back to the local word-bank definition.

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The vocabulary word and dictionary content are English.
