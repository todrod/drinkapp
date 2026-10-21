# Magic Orb Animation Production Brief

Create one photorealistic product shot of a clear fortune teller's sphere containing a suspended coupe, amber cocktail and one large ice sphere. Animate only the purple and blue smoke. Use Blender 4.5 LTS with Cycles, render an image sequence, then encode the web animation with Gifski. The delivery target is a 12 second loop at 25 fps, initially 640 × 640 pixels, preferably below 15,000,000 bytes.

This brief specifies the production setup. A rendered GIF, measured file size and visual acceptance results are separate production outputs.

## Rendering path selection

Evaluate the requested paths in this order. The assessments below apply to the proposed pipelines, rather than every possible custom implementation of each engine.

| Path | Assessment for this shot | Decision |
| --- | --- | --- |
| Three.js with environment refraction and particles | Environment lookup does not by itself trace the coupe, liquid, ice and participating smoke through the hollow sphere. MeshPhysicalMaterial provides transmission, IOR and thickness, but a custom renderer would still be needed for this complete optical arrangement. CCapture records frames; it cannot improve their optics. | Escalate because the proposed setup does not establish the required refraction. |
| After Effects with Element 3D and Particular | Useful for smoke design and finishing. A separately composited smoke layer does not automatically refract through both glass walls or illuminate the contents correctly. Element's documented reflection modes are approximations rather than ray-traced reflections. Supplying a physically rendered glass pass moves the central work to a 3D renderer. | Escalate for the main render. |
| Blender Cycles | Trace the actual glass boundaries and volumetric medium in one scene. Explicitly handle liquid and ice interfaces as described below; ordinary overlapping glass meshes are insufficient. Define a periodic smoke field to control the loop exactly. | Selected. |
| GSAP and Canvas 2D | Suitable for a stylized interface illustration, rather than this optical product shot. | Fallback does not meet this brief. |

Technical references: [Three.js physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html), [Element 3D reflection FAQ](https://video-copilot.gitbook.io/element2/faq), and [Cycles rendering](https://www.blender.org/features/rendering/). Cycles is the production choice based on these capabilities and this scene's requirements.

## Composition and geometry

Work in meters with applied object scales. Use Z as up and place the camera toward negative Y.

- Sphere: 240 mm outer diameter, 3.5 mm wall thickness, centered at Z = 120 mm. Model both boundaries of a hollow shell with correctly oriented normals. Use sufficient subdivisions to eliminate silhouette facets at the 4096 pixel master resolution.
- Surface: black polished stone, roughness approximately 0.22. Keep the distant plane and background black; allow only a restrained contact reflection beneath the sphere.
- Coupe: approximately 120 mm tall, with a 96 mm wide bowl about 43 mm deep, a fine stem, a small foot and real 1–1.5 mm glass thickness. Suspend it centrally with clearance from the sphere in every direction. Use a coupe silhouette, with no martini triangle or garnish.
- Cocktail: a separate closed amber liquid region, a still meniscus below the rim and one 40 mm ice sphere. Position the ice without intersecting the bowl and with roughly 90 percent of its volume submerged. Make the ice's exposed cap, curved outline and refracted highlights visible.
- Ice: clear outer ice with restrained internal inclusions and fine fissures. Keep the central body transmissive; a white frosted ball would hide the amber liquid.

Lock all geometry, the camera and light transforms for the entire shot. No bobbing, glass rotation, orbiting sparks, liquid slosh or camera drift. No lettering, numeral 8, labels, logos or visible light fixtures.

## Glass and liquid optics

Use these as material starting settings, with Alpha = 1 and Metallic = 0. Transmission provides the glass transparency; lowering Alpha is not the optical treatment. [Blender Principled BSDF documentation](https://docs.blender.org/manual/id/4.5/render/shader_nodes/shader/principled.html)

| Region | IOR against air | Transmission weight | Roughness | Color treatment |
| --- | --- | --- | --- | --- |
| Sphere and coupe | 1.52 | 1.0 | 0.005–0.015 | Neutral clear glass; nearly white base color |
| Cocktail | 1.36 starting value | 1.0 | 0.01 | Amber through volume absorption, rather than an opaque orange surface |
| Ice | 1.31 starting value | 1.0 | 0.015–0.03 | Mostly neutral, with sparse internal details |

For the liquid, tune absorption so a 40 mm path transmits approximately RGB (0.95, 0.65, 0.25). This is an artistic amber target, rather than a measured cocktail formulation. Warm light must distinguish the drink from the surrounding cool smoke.

Handle every shared dielectric interface once. For stock Cycles, use explicitly modeled interfaces with outward normals and relative IOR `n_inside / n_outside`: liquid-to-glass boundaries owned by the liquid use `1.36 / 1.52 = 0.894737`; submerged ice boundaries owned by the ice use `1.31 / 1.36 = 0.963235`. Exposed liquid and ice surfaces retain their air-relative values. Use white Glass BSDF with Multiscatter GGX for the wet interfaces requiring ratios below one: its IOR input permits those values, while the Principled IOR control has a minimum of one. [Blender Glass BSDF source](https://raw.githubusercontent.com/blender/blender/blender-v4.5-release/source/blender/nodes/shader/nodes/node_shader_bsdf_glass.cc), [Principled input definition](https://raw.githubusercontent.com/blender/blender/blender-v4.5-release/source/blender/nodes/shader/nodes/node_shader_bsdf_principled.cc)

Separate non-overlapping absorption regions from surface interfaces as needed. Avoid duplicate coincident refractive faces, overlapping absorption inside the ice, and artificial air gaps. These are the interface issues described in [SideFX's nested dielectric explanation](https://www.sidefx.com/media/uploads/tutorial/h16_lessons/mantrauserguide/absorptionnesteddielectricsdispersion_h16.pdf).

Validate Snell refraction through the actual shell and wet interfaces before rendering the sequence. If a workflow cannot represent these boundaries correctly, stop and correct the interface setup; environment distortion and bloom do not satisfy this requirement.

## Periodic smoke construction

Use a bounded procedural volume inside the air cavity of the sphere. A free-running fluid bake does not inherently return to its starting state. Construct a periodic density field instead, so both its shape and motion agree at the loop boundary. Blender volume materials support scattering, absorption and emission within a bounded mesh. [Blender volume materials](https://docs.blender.org/manual/id/5.0/render/materials/components/volume.html)

Use the following field in a shader node group. Here `p` is position relative to the sphere center, divided by its inner radius; `Noise` is a deterministic 3D Noise Texture with Normalize enabled, Detail 4, Roughness 0.6 and Lacunarity 2. All coordinates and amplitudes below are dimensionless.

```text
N = 300
phase = ((frame - 1) mod N) / N
theta = 2 * pi * phase
q = rotate_about_Z(p, -theta)

warp = (0.06 * sin(4*q.z + theta),
        0.05 * sin(3*q.x + 2*theta),
        0.04 * cos(4*q.y + theta))
u = q + warp

n = 0.75 * Noise(3.2*u) + 0.25 * Noise(9*u)
r = length(p)
envelope = smoothstep(0.35, 0.58, r)
         * (1 - smoothstep(0.90, 0.98, r))

density = 35 * smoothstep(0.40, 0.68, n)
             * envelope * drink_exclusion(p) * viewing_window(p)
```

Density is a starting extinction scale in inverse meters for this scene size. `drink_exclusion` is a fixed smooth mask, zero inside the glass, liquid and ice, becoming one outside them. `viewing_window` softens the smoke immediately in front of the coupe so the amber and ice remain legible. Set that window during art direction and then lock it. Keep dense smoke lobes around the sides, behind the bowl and below it; do not uniformly thin the smoke to reveal the drink or reduce file size.

Implement the rotation with a Vector Rotate node driven by `theta`; build the warp with Math and Combine XYZ nodes. The envelope and exclusion masks use the original `p`, so their boundaries remain fixed. Map a second deterministic noise sampled at `u` to deep violet `#7226F5`, electric blue `#246BFF` and restrained blue highlights `#70B5FF`. Drive a Principled Volume with density, anisotropy approximately 0.2, and density-masked emission. Start emission strength near 1 and balance it with the scene lights: saturated smoke should remain colored, with only small bright cores approaching white.

Every time-dependent term uses an integer harmonic of `theta`. Therefore the density, color and their time derivatives repeat after 300 frames. No random seed changes, advancing noise W coordinate, particle respawn, framewise exposure adjustment or endpoint crossfade.

## Lighting and camera

Keep World strength at zero. Use off-camera lights to create reflections while the background stays black. Begin with a large soft white strip behind and to the right for the sphere rim; a small warm area at about 2200 K to suggest candlelight on the left; and narrow blue and violet strips behind the glass. Keep all intensities static. Allow the moving emissive smoke to produce the permitted subtle reflected and caustic variation.

Use a 100 mm lens with a 36 mm sensor, approximately 1 m from the sphere. Frame the sphere at roughly 75 percent of image width with black margin around it. Start at f/8 and focus on the apparent refracted image of the ice and coupe rim. Preserve enough depth of field to identify the bowl, ice and stem, with softer foreground reflections. Render depth of field in Cycles.

Use AgX with a restrained contrast look and fixed exposure. Balance luminous colors before they clip to white. Apply only a small compositor Fog Glow contribution, approximately 5–8 percent, with a high threshold. Leave global chromatic aberration off; the glass shape and real transmitted image must establish the refraction.

## Render and sequence settings

These are final-quality starting settings; increase sampling if the delivered-size animation still has grain or temporal instability.

| Setting | Value |
| --- | --- |
| Renderer | Blender 4.5 LTS, Cycles; supported GPU or CPU |
| Master resolution | 4096 × 4096, square pixels |
| Duration | 12 seconds |
| Frame rate and range | 25 fps; delivery frames 1–300 |
| Samples | 2048 fixed samples, adaptive sampling off |
| Seed | Fixed 73; Animated Seed off |
| Light paths | Total 24; transmission 16; glossy 8; diffuse 4; volume 4 |
| Volume stepping | Render step rate 0.25; max steps 2048; confirm fine wisps remain resolved |
| Caustics | Reflective and refractive enabled; do not replace glass shadows with transparency tricks |
| Motion blur | Off; slow smoke remains crisp at web resolution |
| Denoising | Off for the final sequence; oversampling and downsampling preserve fine smoke without denoiser boiling |
| Master files | Scene-linear OpenEXR half-float ZIP, Combined pass |
| Encoding source | Fixed AgX/display transform baked into 16-bit sRGB RGB PNGs, black baked in, no alpha |

Create a diagnostic frame 301 using the same modulo phase and seed. It must match frame 1 on the same renderer and hardware, within numerical precision. Exclude frame 301 from delivery: including a repeated endpoint would add a pause at the seam.

## Encoding and size budget

Use FFmpeg to downsample the display-transformed PNG sequence, then Gifski for cross-frame palette selection and temporal dithering. At 25 fps each GIF frame has an exact 40 ms delay, avoiding the alternating centisecond delays needed for 24 or 30 fps. [Gifski documentation](https://github.com/ImageOptim/gifski)

Run these PowerShell commands from the production project directory after frames exist and FFmpeg and Gifski are installed. They specify the production commands; they have not been run against a rendered sequence.

```powershell
New-Item -ItemType Directory -Force -Path delivery, frames-web | Out-Null

ffmpeg -framerate 25 -start_number 1 -i "frames-srgb/orb_%04d.png" -frames:v 300 -vf "scale=640:640:flags=lanczos,format=rgb24" "frames-web/orb_%04d.png"

$orbFrames = @(Get-ChildItem -LiteralPath frames-web -Filter 'orb_*.png' | Sort-Object Name | ForEach-Object { Join-Path 'frames-web' $_.Name })
if ($orbFrames.Count -ne 300) { throw 'Encoding requires exactly 300 delivery frames.' }
gifski --fps 25 --quality 90 --repeat 0 --output "delivery/orb.gif" @orbFrames

(Get-Item -LiteralPath "delivery/orb.gif").Length
```

Use a fresh `frames-web` directory containing exactly the 300 delivery frames. Keep full-color masters. The 15 MB target gives an average budget of about 50 KB per frame and must be measured after encoding.

Optimize using Gifski quality 90, then 84, then 78 while checking smoke gradients. If needed, regenerate the encoding frames at 560, 512 or 480 pixels square. Preserve the same 300 phases, smoke density, lighting and duration. Do not add a low-color cartoon outline, remove smoke layers, or reduce motion quality until trails smear. Deliver only the best passing GIF, rather than the intermediate encodes.

If GIF quantization produces unacceptable banding, crawling dither or muddy purple, use a full-color alternative from the same source frames. WebM is the preferred bandwidth alternative; APNG preserves RGB pixels losslessly but may exceed the GIF size target. [FFmpeg format documentation](https://www.ffmpeg.org/ffmpeg-formats.html)

```powershell
# WebM candidate; verify color, seam and decoding in the target browsers.
ffmpeg -framerate 25 -start_number 1 -i "frames-web/orb_%04d.png" -frames:v 300 -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -an -c:v libvpx-vp9 -crf 18 -b:v 0 -colorspace bt709 -color_primaries bt709 -color_trc iec61966-2-1 -color_range tv -g 300 "delivery/orb.webm"

# Full-color lossless animation when palette or video chroma artifacts fail.
ffmpeg -framerate 25 -start_number 1 -i "frames-web/orb_%04d.png" -frames:v 300 -vf "format=rgb24" -plays 0 -f apng "delivery/orb.apng"
```

For WebM playback, enable looping in the player; it is not a file-level infinite-loop promise. If saturated blue edges suffer from video chroma subsampling, use APNG or a tested higher-chroma video profile.

## Acceptance and handover

Check the final encoded file at its native size and at the app's displayed size, rather than judging only the 4K master.

1. Play at least five repeats. Inspect frames 298, 299, 300, 1, 2 and 3 in sequence. The seam's motion and exposure change must be comparable to neighboring steps, with no hold or hard cut. Equality of frames 1 and diagnostic 301 alone does not establish smooth playback.
2. Verify the sphere's distorted transmitted scene, inner and outer rim reflections, and wet glass boundaries. The bowl, amber fill and single ice sphere must remain recognizable throughout the full cycle. Inspect the full sequence for any smoke lobe that hides them.
3. Confirm fixed camera and object transforms. Changes to illumination from the moving smoke are allowed; movement of the sphere, coupe, ice or liquid is not.
4. Check the encoded smoke for saturated purple and blue, smooth gradients, preserved density and fine detail. Reject white clipping, muddy colors, crawling quantization and visible render noise.
5. Verify 300 frames, nominal 25 fps, 12 second duration, infinite GIF repetition, square dimensions between 480 and 800 pixels, black background and no text. Record actual file size; prefer at most 15,000,000 bytes. If no acceptable GIF fits, report the tradeoff and supply the selected full-color alternative.

Handover includes the packed `.blend` project with procedural nodes and fixed settings, EXR masters, display-transformed encoding frames, one final animation, a static poster frame for reduced motion, and measured duration, dimensions and byte count. Any later app integration should retain the existing tap and shake actions, use that poster for reduced motion, and pause playback offscreen and in the background.
