"""Stabilize a shared-palette GIF without a special reset at the loop boundary.

Bound tiny color changes, never alpha or density. Solve the color history around
the whole cycle before writing the first frame. The app needs none of these tools.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import GifImagePlugin, Image


def quantize(source_path, destination, threshold, reference_frames):
    GifImagePlugin.LOADING_STRATEGY = GifImagePlugin.LoadingStrategy.RGB_AFTER_DIFFERENT_PALETTE_ONLY
    source = Image.open(source_path)
    if source.n_frames != 300 or not 480 <= source.width == source.height <= 800:
        raise ValueError('Expected all 300 square delivery phases at 480–800 px')
    if source.mode != 'P' or len(source.getpalette()) != 768:
        raise ValueError('Input must use one shared 256-entry palette')

    palette = np.array(source.getpalette(), dtype=np.int16).reshape(256, 3)
    # Reserve one index for unchanged pixels. Never erase smoke: pixels at that
    # index are remapped to their closest opaque color before delta compression.
    distance = np.square(palette[:255].astype(np.int32) - palette[255]).sum(axis=1)
    replacement = int(np.argmin(distance))
    palette_bytes = source.getpalette()
    black = np.flatnonzero(np.all(palette[:255] == 0, axis=1))
    if not len(black):
        raise ValueError('The shared palette must contain pure opaque black')
    black_index = int(black[0])
    phases = []
    black_masks = []
    for index in range(source.n_frames):
        source.seek(index)
        if source.mode != 'P' or source.getpalette() != palette_bytes:
            raise ValueError('Input palettes differ; generate a shared palette first')
        phase = np.asarray(source).copy()
        phase[phase == 255] = replacement
        reference = Image.open(reference_frames / f'orb_{index + 1:04d}.png').convert('RGB')
        reference = reference.resize(source.size, Image.Resampling.LANCZOS)
        black_mask = np.all(np.asarray(reference) == 0, axis=2)
        phase[black_mask] = black_index
        phases.append(phase)
        black_masks.append(black_mask)

    state = phases[-1].copy()
    fallback_pixels = 0
    for cycle in range(8):
        start = state.copy()
        settled = []
        for phase, black_mask in zip(phases, black_masks):
            change = np.max(np.abs(palette[phase] - palette[state]), axis=2) > threshold
            change |= black_mask
            state = np.where(change, phase, state).astype(np.uint8)
            settled.append(state)
        unstable = state != start
        if not np.any(unstable):
            break
    else:
        # Rare pixels can alternate between two equally valid palette choices.
        # Disable history only there, making those pixels exactly periodic too.
        fallback_pixels = int(np.count_nonzero(unstable))
        for index, phase in enumerate(phases):
            settled[index][unstable] = phase[unstable]

    frames = []
    previous = None
    max_error = 0
    for original, phase in zip(phases, settled):
        max_error = max(max_error, int(np.max(np.abs(palette[phase] - palette[original]))))
        delta = phase.copy()
        if previous is not None:
            delta[phase == previous] = 255
        frame = Image.fromarray(delta)
        frame.putpalette(palette.astype(np.uint8).ravel().tolist())
        frames.append(frame)
        previous = phase
    assert max_error <= threshold, 'Color stabilization exceeded its declared bound'
    destination.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(destination, save_all=True, append_images=frames[1:], duration=40,
                   loop=0, disposal=1, transparency=255, optimize=False)
    receipt = {
        'encoder': 'FFmpeg shared palette + cyclic color quantization + Pillow GIF',
        'width': source.width, 'height': source.height, 'frames': len(frames),
        'fps': 25, 'seconds': 12, 'loop': 'infinite',
        'bytes': destination.stat().st_size, 'palette_colors': 255,
        'max_temporal_rgb_error': max_error, 'threshold': threshold,
        'history_passes': cycle + 1, 'pixels_without_history': fallback_pixels,
    }
    destination.with_suffix('.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
    print(json.dumps(receipt, indent=2), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--frames', required=True, help='Original PNGs for exact black-background preservation')
    parser.add_argument('--threshold', type=int, default=8, choices=range(0, 13), metavar='0–12')
    options = parser.parse_args()
    quantize(Path(options.input), Path(options.output), options.threshold, Path(options.frames))
