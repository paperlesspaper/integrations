#!/usr/bin/env python3
"""Refresh public Show Your Stripes metadata without executing upstream JavaScript."""
import json
import re
from pathlib import Path
from subprocess import check_output

ORIGIN = 'https://showyourstripes.info'
html = check_output(['curl', '-fsSL', '--max-time', '30', ORIGIN]).decode()
bundle = re.search(r'(?:src|href)=["\']?(/js/app\.[a-z0-9]+\.js)', html).group(1)
source = check_output(['curl', '-fsSL', '--max-time', '30', ORIGIN + bundle]).decode()
start = source.index('{globe:{')
# The catalog contains only JSON values with unquoted identifier keys.
tokens = re.compile(r'"(?:\\.|[^"\\])*"|[{}]|[A-Za-z_$][\w$]*(?=:)')
depth = 0
end = None
for token in tokens.finditer(source, start):
    if token.group() == '{': depth += 1
    elif token.group() == '}':
        depth -= 1
        if depth == 0:
            end = token.end()
            break
if end is None: raise ValueError('Catalog boundary missing')
raw = source[start:end]
quoted = re.sub(r'"(?:\\.|[^"\\])*"|([A-Za-z_$][\w$]*)(?=:)', lambda m: json.dumps(m[1]) if m[1] else m[0], raw)
catalog = json.loads(quoted)
rows = []
def walk(nodes, keys=(), names=()):
    for key, value in nodes.items():
        path, labels = keys + (key,), names + (value['name'],)
        if 'url' in value:
            rows.append(dict(id='/'.join(path), region=labels[0], country=labels[1] if len(labels)>1 else '', location=labels[-1], start=value['timeRange']['from'], end=value['timeRange']['to'], urls=value['url']))
        if 'children' in value: walk(value['children'], path, labels)
walk(catalog)
assert len(rows) > 500 and rows[0]['id'] == 'globe'
for row in rows:
    assert all(url.startswith('/stripes/') and url.endswith('.png') for url in row['urls'].values())
path = Path(__file__).resolve().parents[1] / 'applications/climate-stripes/data/locations.json'
path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
print(f'Wrote {len(rows)} locations from {ORIGIN}{bundle}')
