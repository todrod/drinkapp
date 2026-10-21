# Magic Orb Rendering and App Integration

The home artwork is an original Blender Cycles render of a hollow crystal sphere containing a suspended coupe, amber cocktail and one large ice sphere. Only the dense purple and electric blue smoke animates. The running app plays a bundled GIF through `expo-image`; it needs no Blender installation, network service or AI model.

## Delivery and source files

The delivery profile is 640 × 640 at 25 fps for 12 seconds, with 300 distinct phases and infinite repetition. A matching PNG represents phase zero for reduced motion and paused playback. The GIF budget is 15,000,000 bytes. The exact encoded size, timing, source hashes and seam measurements belong in [the verification receipt](MAGIC_ORB_VERIFICATION.json).

Keep rendered frames, the `.blend` project and the optional 4096 pixel still in the workspace's `orb-render` directory outside the repository. The app includes only `assets/magic-orb.gif` and `assets/magic-orb-poster.png`. Render source is [scripts/render-orb.py](../scripts/render-orb.py).

The web loop uses 640 pixel Cycles renders with 64 fixed samples, Open Image Denoise, fixed seed 73, volume step rate 1.0 and persistent scene data. These are the practical delivery settings, replacing the initial planning baseline of an entire 4K sequence at 2048 samples. A 4K still preserves source detail without adding a 4K animation to the app. Higher-resolution sequences remain available through the renderer's CLI options.

## Rendering path

The requested paths were assessed in order for this particular optical arrangement.

| Path | Fit for this shot |
| --- | --- |
| Three.js with environment refraction and particles | Environment lookup does not itself trace the coupe, liquid, ice and participating smoke through the sphere. The full shot would need a custom renderer beyond the proposed setup. [Physical material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) |
| After Effects with Element 3D and Particular | Useful for finishing, but separately composited smoke does not automatically refract or illuminate the interior. Element's documented reflection modes are approximations rather than ray-traced reflections. A physically rendered glass pass would move the core work to a 3D renderer. [Element FAQ](https://video-copilot.gitbook.io/element2/faq) |
| Blender Cycles | Selected: actual geometric interfaces and a bounded volumetric material share a ray-traced scene. [Cycles capabilities](https://www.blender.org/features/rendering/) |
| GSAP and Canvas 2D | Appropriate for a stylized illustration rather than this refractive product shot. |

## Optical scene

The sphere has a 240 mm outer diameter and a 3.5 mm glass wall. Both shell surfaces have IOR 1.52, with opposite normals at the inner surface. The coupe includes a real curved bowl, dry rim, stem and foot. A closed liquid mesh follows the wet bowl wall and has an actual spherical cavity around the submerged ice. Its computed fluid volume is about 120 ml; the renderer rejects an open liquid boundary.

Each physical interface is represented once. White Glass BSDF supplies reflection and transmission, with these relative indices and outward normals for the owning region:

| Interface | IOR supplied to the shader |
| --- | --- |
| Crystal or coupe against air | 1.52 |
| Liquid boundary against glass | 1.36 / 1.52 = 0.894737 |
| Liquid free surface against air | 1.36 |
| Liquid cavity against ice | 1.36 / 1.31 = 1.038168 |
| Exposed ice cap against air | 1.31 |

Using a reciprocal ratio with reversed ownership gives the equivalent physical interface. There are no duplicated coincident refractive faces or artificial air gaps. Glass BSDF permits ratios below one, whereas the Principled IOR input control starts at one. [Glass implementation](https://raw.githubusercontent.com/blender/blender/blender-v4.5-release/source/blender/nodes/shader/nodes/node_shader_bsdf_glass.cc), [Principled input definition](https://raw.githubusercontent.com/blender/blender/blender-v4.5-release/source/blender/nodes/shader/nodes/node_shader_bsdf_principled.cc), [nested dielectric explanation](https://www.sidefx.com/media/uploads/tutorial/h16_lessons/mantrauserguide/absorptionnesteddielectricsdispersion_h16.pdf)

Amber absorption, restrained fluid scattering, clear ice with sparse air inclusions and a soft internal fill keep the drink and ice legible. Static candle and neon lighting creates the outer reflections. A 95 mm perspective lens at f/8 gives a product-photography composition on a black surface with a black world. AgX and a small Fog Glow contribution handle highlights. No text, numeral, logos or labels are rendered.

## Smoke and loop

The only animated parameter is `theta = 2*pi*((frame-1)%300)/300`. It rotates the sampling coordinates of deterministic fractal noise. Integer-harmonic sine and cosine warps curl the volume; its density and color repeat with the same phase and velocity. There is no advancing random seed, particle reset, simulated-fluid endpoint cut or crossfade.

The smoke remains dense around the sides and behind the coupe. Fixed spatial masks exclude the drink and provide a soft viewing window in front of it. Density and these masks remain unchanged during size optimization. Every frame asserts that all object transforms remain identical. Diagnostic frame 301 must reproduce frame 1; it is never included in the GIF, which would create a duplicate-frame hold.

## Install and render

On Windows, install the verified official portable tools with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-orb-tools.ps1
```

The installer uses `%USERPROFILE%\Tools\DrinkShaker`, records vendor URLs and archive hashes in `installed-tools.json`, and adds the executable directories to the user's PATH. Versions used are Blender 4.5.14 LTS, FFmpeg 9.0.2 and Gifski 1.34.0. An isolated authoring Python environment uses Blender's bundled interpreter, Pillow 12.3.0 and NumPy 2.3.5. This directory avoids the AppData redirection that can break private DLL loading when launching Blender from a packaged desktop app.

Render the animation and its diagnostic phase:

```powershell
$orbBlender = Join-Path $env:USERPROFILE 'Tools\DrinkShaker\blender-4.5.14-windows-x64\blender.exe'
& $orbBlender --background --factory-startup --python scripts/render-orb.py -- --output '..\orb-render\frames' --resolution 640 --samples 64 --denoise --start 1 --end 301
```

`--device ONEAPI` is the default for the Intel Arc GPU used here; use `--device CPU` on unsupported hardware. Use a fresh output directory when changing scene settings. Existing frame filenames are skipped to resume the same render. A separate 4K still uses the same scene:

```powershell
& $orbBlender --background --factory-startup --python scripts/render-orb.py -- --output '..\orb-render\master4k' --resolution 4096 --samples 64 --denoise --start 1 --end 1
```

## Encode and verify

Encode all 300 delivery phases with one shared palette and cyclic color quantization. The delivered GIF is 640 × 640 and about 12.2 MB; the verification receipt contains exact measurements.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/encode-orb.ps1 -Frames '..\orb-render\frames' -Width 640
$orbPython = Join-Path $env:USERPROFILE 'Tools\DrinkShaker\authoring-python\Scripts\python.exe'
& $orbPython scripts/verify-orb.py --frames '..\orb-render\frames' --gif assets/magic-orb.gif --encoding-report '..\orb-render\encoding\encoded.json' --report docs/MAGIC_ORB_VERIFICATION.json
```

The verifier and encoder need Pillow and NumPy in the authoring environment, not in the app. Encoding fails on an incomplete sequence, wrong duration or an oversized GIF. At 25 fps every phase has an exact 40 ms delay. FFmpeg generates a shared 256-entry palette over the complete sequence and uses ordered Bayer dithering at scale 3. [FFmpeg palette filters](https://ffmpeg.org/ffmpeg-filters.html#palettegen)

`quantize-orb.py` reserves one palette entry for unchanged-pixel compression, leaving 255 opaque colors. It holds a pixel's previous palette color only while the per-channel change is at most 8/255. It solves this color history around the entire cycle before writing frame one, removing any special reset at the seam. Rare pixels that cycle between history states use their original per-phase palette colors instead. Pixels that are pure black in the source PNG remain exactly black rather than acquiring dither noise. The GIF's transparent delta pixels retain the preceding frame's opaque pixels; they never reduce smoke opacity or density. The renderer's smoke field and all 300 motion phases are preserved. The first displayed frame is fully opaque.

Gifski remains available with `-Encoder gifski -Quality 90`, with motion and lossy quality fixed at 100. Its cross-frame palettes looked good within the sequence but failed the stricter seam comparison for this shot, so the default uses the cyclic method. [Gifski documentation](https://github.com/ImageOptim/gifski)

For future renders that exceed 15 MB, reduce output to 560, 512 or 480 pixels and verify again. Preserve the smoke field, density, 300 phases and 12 second duration. Deliver only the best passing encode.

If palette quantization produces muddy colors or crawling gradients, use WebM for bandwidth or lossless RGB APNG for full color. APNG may exceed 15 MB. These would require a deliberate playback-component change rather than relabeling another format as GIF. [FFmpeg format documentation](https://www.ffmpeg.org/ffmpeg-formats.html)

Automatic checks cover all delays, frame count, infinite repetition, black background, file size, duplicate phases, frame 301 versus 1, seam-step magnitude and smoke palette error. Visual acceptance also requires viewing several repeats, checking frames 298–300 followed by 1–3, confirming real glass refraction, and inspecting the drink and ice throughout the cycle. A low error score alone cannot establish photorealism.

## Playback and actions

`CrystalBall.tsx` is decorative media inside the existing accessible button. The image has no pointer handling. The button, keyword finder and accelerometer still call the same guarded `onSpin` function. Haptics, inventory matching, exclusions and drink generation remain independent of image decoding.

Reduced motion, manual pause, offscreen state and inactive AppState swap the animation to its matching PNG. This works on web, where an HTML image cannot pause GIF playback, and on native. The poster is also the loading placeholder and decoding-error fallback. Tab changes cancel the short selection interval so a delayed callback cannot show a stale drink. Both image assets use local `require()` references and work offline.
