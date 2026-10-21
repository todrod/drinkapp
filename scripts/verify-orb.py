"""Verify the delivered animation, using Pillow and NumPy outside the app.

python scripts/verify-orb.py --frames ../orb-render/frames --gif assets/magic-orb.gif
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--frames', required=True)
parser.add_argument('--gif', required=True)
parser.add_argument('--report', default='../orb-render/verification.json')
parser.add_argument('--encoding-report')
opt = parser.parse_args()
root = Path(opt.frames)
gif_path = Path(opt.gif)
gif = Image.open(gif_path)
assert gif.n_frames == 300, 'An incomplete animation must never be delivered'
assert gif.info.get('loop') == 0, 'GIF must loop forever'
assert 480 <= gif.width == gif.height <= 800, 'Delivery dimensions must be 480–800 square'
assert gif_path.stat().st_size <= 15_000_000, 'GIF exceeds the preferred web budget'
delays, adjacent_mae = [], []
first_encoded = previous = None
corner_max = 0
for i in range(gif.n_frames):
    gif.seek(i)
    delays.append(gif.info['duration'])
    current = np.asarray(gif.convert('RGB'), dtype=np.int16)
    corner_max = max(corner_max, int(current[:30, :30].max()))
    if first_encoded is None:
        first_encoded = current
    if previous is not None:
        adjacent_mae.append(float(np.abs(current - previous).mean()))
    previous = current
assert all(t == 40 for t in delays) and sum(delays) == 12_000, 'Every phase must have a 40 ms delay'

def pixels(frame):
    return np.asarray(Image.open(root / f'orb_{frame:04}.png').convert('RGB'), dtype=np.int16)

first, diagnostic = pixels(1), pixels(301)
diagnostic_mae = float(np.abs(first - diagnostic).mean())
assert diagnostic_mae < .25, 'The rendered phase at 301 must match phase 1'
seam_mae = float(np.abs(previous - first_encoded).mean())
assert min(adjacent_mae) > .01, 'Repeated frames would stutter'
assert seam_mae < float(np.percentile(adjacent_mae, 95)) * 1.5, 'The seam is larger than neighboring motion steps'

# Quantify palette damage on the actual smoke colors, alongside visual review.
reference = Image.open(root / 'orb_0001.png').convert('RGB').resize(gif.size, Image.Resampling.LANCZOS)
reference_array = np.asarray(reference, dtype=np.int16)
smoke = (reference_array[:, :, 2] > reference_array[:, :, 1] * 1.25) & (reference_array[:, :, 2] > 35)
palette_mae = float(np.abs(first_encoded - reference_array)[smoke].mean())
assert palette_mae < 12, 'GIF palette substantially changes the smoke; inspect a full-color alternative'
assert corner_max < 3, 'The background corner must remain black'
poster_path = gif_path.with_name('magic-orb-poster.png')
poster = Image.open(poster_path)
assert poster.size == gif.size and getattr(poster, 'n_frames', 1) == 1, 'The pause image must be a matching static PNG'
poster_mae = float(np.abs(np.asarray(poster.convert('RGB'), dtype=np.int16) - reference_array).mean())
assert poster_mae < 2, 'The poster must represent the same phase zero as the GIF'
report = {
    'frames': gif.n_frames, 'fps': 25, 'seconds': sum(delays) / 1000,
    'width': gif.width, 'height': gif.height, 'bytes': gif_path.stat().st_size,
    'loop': 'infinite', 'diagnostic_301_vs_1_mae': round(diagnostic_mae, 6),
    'encoded_seam_mae': round(seam_mae, 6),
    'minimum_adjacent_step_mae': round(min(adjacent_mae), 6),
    'adjacent_step_mae_p95': round(float(np.percentile(adjacent_mae, 95)), 6),
    'smoke_palette_mae': round(palette_mae, 6),
    'poster_source_mae': round(poster_mae, 6),
    'gif_sha256': hashlib.sha256(gif_path.read_bytes()).hexdigest(),
    'poster_sha256': hashlib.sha256(poster_path.read_bytes()).hexdigest(),
    'render_script_sha256': hashlib.sha256(Path(__file__).with_name('render-orb.py').read_bytes()).hexdigest(),
    'quantizer_script_sha256': hashlib.sha256(Path(__file__).with_name('quantize-orb.py').read_bytes()).hexdigest(),
    'encoder_script_sha256': hashlib.sha256(Path(__file__).with_name('encode-orb.ps1').read_bytes()).hexdigest(),
    'render_config': json.loads((root / 'render-config.json').read_text(encoding='utf-8')),
    'visual_review_required': ['glass refraction', 'amber and ice visibility throughout loop', 'gradient stability', 'five continuous repeats'],
}
if opt.encoding_report:
    report['encoding'] = json.loads(Path(opt.encoding_report).read_text(encoding='utf-8-sig'))
Path(opt.report).write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
