#!/usr/bin/env python3
"""Build compact, full-resolution tool images. Requires the cwebp CLI."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/image-sources/thread-mills'
DEST = ROOT / 'apps/web/assets/thread-mills'


def main():
    version = subprocess.check_output(['cwebp', '-version'], text=True).strip().splitlines()[0]
    entries = []
    for source in sorted(SOURCE.glob('*.png')):
        target = DEST / source.with_suffix('.webp').name
        subprocess.run(['cwebp', '-quiet', '-q', '95', '-m', '6', '-alpha_q', '100',
                        str(source), '-o', str(target)], check=True)
        entries.append({'source': str(source.relative_to(ROOT)),
                        'output': str(target.relative_to(ROOT)),
                        'original_bytes': source.stat().st_size,
                        'optimized_bytes': target.stat().st_size,
                        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                        'output_sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    report = {'encoder': f'libwebp {version}', 'quality': 95, 'method': 6,
              'alpha_quality': 100, 'resized': False, 'images': entries,
              'original_bytes': sum(x['original_bytes'] for x in entries),
              'optimized_bytes': sum(x['optimized_bytes'] for x in entries)}
    (ROOT / 'docs/tool-image-optimization.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"Tool images: {report['original_bytes']:,} → {report['optimized_bytes']:,} bytes")


if __name__ == '__main__':
    main()
