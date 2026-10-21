"""Reproducible Cycles product shot. Run with Blender --background --python.

Only the smoke's texture coordinates animate. Shared wet dielectric surfaces
are modeled once, with relative IORs; liquid has a real cavity around the ice.
Intermediate renders and the .blend project belong outside the app bundle.
"""
import argparse
import json
import math
import os
from pathlib import Path
import random
import sys
import time

import bpy
import bmesh
from mathutils import Vector

args = argparse.ArgumentParser()
args.add_argument('--output', required=True)
args.add_argument('--resolution', type=int, default=768)
args.add_argument('--samples', type=int, default=128)
args.add_argument('--start', type=int, default=1)
args.add_argument('--end', type=int, default=300)
args.add_argument('--device', choices=['ONEAPI', 'CPU'], default='ONEAPI')
args.add_argument('--denoise', action='store_true')
args.add_argument('--build-only', action='store_true')
args.add_argument('--smoke-density', type=float, default=35.0)
opt = args.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
output = Path(opt.output).resolve()
output.mkdir(parents=True, exist_ok=True)
random.seed(73)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = opt.samples
scene.cycles.use_adaptive_sampling = False
scene.cycles.use_denoising = opt.denoise
scene.cycles.seed = 73
scene.cycles.use_animated_seed = False
scene.cycles.max_bounces = 24
scene.cycles.transmission_bounces = 16
scene.cycles.glossy_bounces = 8
scene.cycles.diffuse_bounces = 4
scene.cycles.volume_bounces = 2
scene.cycles.transparent_max_bounces = 16
scene.cycles.volume_step_rate = 1.0
scene.cycles.volume_max_steps = 1024
scene.cycles.caustics_reflective = True
scene.cycles.caustics_refractive = True
scene.render.resolution_x = scene.render.resolution_y = opt.resolution
scene.render.resolution_percentage = 100
scene.render.fps = 25
scene.frame_start, scene.frame_end = 1, 300
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '16'
scene.render.film_transparent = False
scene.render.use_persistent_data = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 8
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -0.2
world = bpy.data.worlds.new('Absolute black studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
scene.world = world

preferences = bpy.context.preferences.addons['cycles'].preferences
if opt.device == 'ONEAPI':
    preferences.compute_device_type = 'ONEAPI'
    preferences.get_devices()
    devices = [d for d in preferences.devices if d.type == 'ONEAPI']
    if not devices:
        raise RuntimeError('No OneAPI device. Re-run with --device CPU.')
    for device in preferences.devices:
        device.use = device.type == 'ONEAPI'
    scene.cycles.device = 'GPU'
else:
    scene.cycles.device = 'CPU'
print('ORB_RENDER_CONFIG', json.dumps(vars(opt)), flush=True)


def color(hex_value):
    c = [int(hex_value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c) + (1,)


def material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes.clear()
    out = m.node_tree.nodes.new('ShaderNodeOutputMaterial')
    return m, m.node_tree.nodes, m.node_tree.links, out


def glass(name, ior, roughness=.012, absorption=False):
    m, nodes, links, out = material(name)
    bsdf = nodes.new('ShaderNodeBsdfGlass')
    bsdf.distribution = 'MULTI_GGX'
    bsdf.inputs['Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Roughness'].default_value = roughness
    links.new(bsdf.outputs[0], out.inputs['Surface'])
    if absorption:
        volume = nodes.new('ShaderNodeVolumeAbsorption')
        volume.inputs['Color'].default_value = (.98, .88, .04, 1)
        volume.inputs['Density'].default_value = 80
        scatter = nodes.new('ShaderNodeVolumeScatter')
        scatter.inputs['Color'].default_value = (1, .7, .25, 1)
        scatter.inputs['Density'].default_value = 1.5
        add = nodes.new('ShaderNodeAddShader')
        links.new(volume.outputs[0], add.inputs[0])
        links.new(scatter.outputs[0], add.inputs[1])
        links.new(add.outputs[0], out.inputs['Volume'])
    return m


crystal = glass('Clear crystal shell IOR 1.52', 1.52, .008)
coupe_glass = glass('Fine coupe glass IOR 1.52', 1.52, .012)
liquid_wet = glass('Liquid to glass interface', 1.36 / 1.52, .008, True)
liquid_air = glass('Still amber meniscus', 1.36, .008, True)
liquid_ice = glass('Liquid to ice interface', 1.36 / 1.31, .018, True)
ice_air = glass('Ice exposed to air', 1.31, .022)
air_in_ice = glass('Tiny air inclusions in ice', 1 / 1.31, .02)


def mesh_object(name, vertices, faces, mats, face_materials=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    for m in mats:
        mesh.materials.append(m)
    for i, polygon in enumerate(mesh.polygons):
        polygon.use_smooth = True
        if face_materials:
            polygon.material_index = face_materials[i]
    return obj


def lathe(name, profile, mats, bands=None, segments=192):
    vertices, rings, faces, mat_ids = [], [], [], []
    for radius, z in profile:
        if radius == 0:
            rings.append([len(vertices)])
            vertices.append((0, 0, z))
        else:
            rings.append(list(range(len(vertices), len(vertices) + segments)))
            vertices.extend((radius * math.cos(j * 2 * math.pi / segments), radius * math.sin(j * 2 * math.pi / segments), z) for j in range(segments))
    for i, (a, b) in enumerate(zip(rings, rings[1:])):
        for j in range(segments):
            k = (j + 1) % segments
            if len(a) == 1:
                faces.append((a[0], b[k], b[j]))
            elif len(b) == 1:
                faces.append((a[j], a[k], b[0]))
            else:
                faces.append((a[j], a[k], b[k], b[j]))
            mat_ids.append(bands[i] if bands else 0)
    return mesh_object(name, vertices, faces, mats, mat_ids)


def curved_profile(profile, steps=6):
    # Interpolate the meridian without moving its wet/dry boundary endpoints.
    result = []
    for i in range(len(profile) - 1):
        p0, p1, p2, p3 = (profile[max(0, i - 1)], profile[i], profile[i + 1], profile[min(len(profile) - 1, i + 2)])
        for j in range(steps):
            t = j / steps
            result.append(tuple(.5 * ((2*p1[c]) + (-p0[c]+p2[c])*t + (2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t*t + (-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t*t*t) for c in (0, 1)))
    result.append(profile[-1])
    return [(max(0, r), z) for r, z in result]


def sphere(name, radius, position, mat, segments=128, rings=64, invert=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    if invert:
        for polygon in obj.data.polygons:
            polygon.flip()
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


# A hollow shell has separate air/glass interfaces, rather than a solid lens.
outer = sphere('Sphere outer boundary', .120, (0, 0, .120), crystal, 256, 128)
inner = sphere('Sphere inner boundary', .1165, (0, 0, .120), crystal, 256, 128, True)

coupe_profile = [
    (0, .056), (.020, .056), (.023, .057), (.024, .058), (.023, .060),
    (.005, .062), (.0022, .065), (.0022, .125), (.004, .129),
    (.011, .131), (.0235, .1345), (.0335, .1405), (.0415, .1505),
    (.0464, .1605), (.049, .170), (.0477, .170), (.0467, .167),
]
coupe = lathe('Suspended coupe foot stem bowl and dry rim', curved_profile(coupe_profile), [coupe_glass])

fill, ice_z, ice_radius = .167, .155, .020
ice_intersection_radius = math.sqrt(ice_radius ** 2 - (fill - ice_z) ** 2)
liquid_profile = [(0, .1325), (.0115, .1337), (.022, .136), (.032, .142), (.040, .151), (.0449, .160), (.0467, fill)]
liquid_bands = [0] * (len(liquid_profile) - 1)
# An annulus is the real liquid surface around the emerging ice cap.
for i in range(1, 9):
    liquid_profile.append((.0467 + (ice_intersection_radius - .0467) * i / 8, fill))
    liquid_bands.append(1)
angle_at_surface = math.acos((fill - ice_z) / ice_radius)
for i in range(1, 65):
    a = angle_at_surface + (math.pi - angle_at_surface) * i / 64
    liquid_profile.append((ice_radius * math.sin(a) if i < 64 else 0, ice_z + ice_radius * math.cos(a)))
    liquid_bands.append(2)
liquid = lathe('Amber cocktail with actual ice cavity', liquid_profile, [liquid_wet, liquid_air, liquid_ice], liquid_bands)
cap_profile = [(ice_intersection_radius, fill)]
for i in range(1, 49):
    a = angle_at_surface * (1 - i / 48)
    cap_profile.append((ice_radius * math.sin(a) if i < 48 else 0, ice_z + ice_radius * math.cos(a)))
ice_cap = lathe('Single ice sphere exposed cap', cap_profile, [ice_air])

# Sparse, static air pockets give clear ice physical detail without whitening it.
for i in range(18):
    direction = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
    location = Vector((0, 0, ice_z)) + direction * random.uniform(.004, .017)
    bubble = sphere('Ice air inclusion %02d' % i, random.uniform(.00015, .00048), location, air_in_ice, 16, 8)

ice_core_mat, ice_core_nodes, ice_core_links, ice_core_out = material('Sparse ice crystal haze')
ice_scatter = ice_core_nodes.new('ShaderNodeVolumeScatter')
ice_scatter.inputs['Color'].default_value = (.90, .96, 1, 1)
ice_scatter.inputs['Density'].default_value = 10
ice_core_links.new(ice_scatter.outputs[0], ice_core_out.inputs['Volume'])
sphere('Subtle clear ice core', .0178, (0, 0, ice_z), ice_core_mat, 64, 32)
for i, location in enumerate([(-.007, -.010, .161), (.006, -.012, .152), (-.003, -.014, .146), (.009, -.008, .158)]):
    sphere('Visible air pocket in ice %02d' % i, .00075, location, air_in_ice, 24, 12)


def smoke_material():
    m, nodes, links, out = material('Periodic luminous violet and electric blue smoke')
    def put(socket, value):
        if hasattr(value, 'node'):
            links.new(value, socket)
        else:
            socket.default_value = value
    def scalar(operation, a, b=None):
        n = nodes.new('ShaderNodeMath')
        n.operation = operation
        put(n.inputs[0], a)
        if b is not None:
            put(n.inputs[1], b)
        return n.outputs[0]
    def vector(operation, a, b=None):
        n = nodes.new('ShaderNodeVectorMath')
        n.operation = operation
        put(n.inputs[0], a)
        if b is not None:
            put(n.inputs[1], b)
        return n.outputs['Value'] if operation in ('LENGTH', 'DISTANCE', 'DOT_PRODUCT') else n.outputs['Vector']
    def combine(x, y, z):
        n = nodes.new('ShaderNodeCombineXYZ')
        for socket, value in zip(n.inputs, (x, y, z)):
            put(socket, value)
        return n.outputs[0]
    def separate(v):
        n = nodes.new('ShaderNodeSeparateXYZ')
        put(n.inputs[0], v)
        return n.outputs
    def smooth(a, b, value):
        n = nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHERSTEP'
        n.clamp = True
        for key, val in [('Value', value), ('From Min', a), ('From Max', b), ('To Min', 0.0), ('To Max', 1.0)]:
            put(n.inputs[key], val)
        return n.outputs[0]
    def noise(v, scale):
        n = nodes.new('ShaderNodeTexNoise')
        n.noise_dimensions = '3D'
        n.normalize = True
        put(n.inputs['Vector'], v)
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = 4
        n.inputs['Roughness'].default_value = .6
        return n.outputs['Fac']

    geometry = nodes.new('ShaderNodeNewGeometry')
    p = vector('DIVIDE', vector('SUBTRACT', geometry.outputs['Position'], (0, 0, .120)), (.1165, .1165, .1165))
    theta = nodes.new('ShaderNodeValue')
    theta.name = 'Exact periodic phase'
    theta.outputs[0].driver_add('default_value').driver.expression = '6.283185307179586 * ((frame - 1) % 300) / 300'
    t = theta.outputs[0]
    rotation = nodes.new('ShaderNodeVectorRotate')
    rotation.rotation_type = 'AXIS_ANGLE'
    put(rotation.inputs['Vector'], p)
    rotation.inputs['Axis'].default_value = (0, 0, 1)
    put(rotation.inputs['Angle'], scalar('MULTIPLY', t, -1))
    q = rotation.outputs[0]
    x, y, z = separate(q)
    warp = combine(
        scalar('MULTIPLY', scalar('SINE', scalar('ADD', scalar('MULTIPLY', z, 4), t)), .06),
        scalar('MULTIPLY', scalar('SINE', scalar('ADD', scalar('MULTIPLY', x, 3), scalar('MULTIPLY', t, 2))), .05),
        scalar('MULTIPLY', scalar('COSINE', scalar('ADD', scalar('MULTIPLY', y, 4), t)), .04),
    )
    u = vector('ADD', q, warp)
    curl = nodes.new('ShaderNodeVectorRotate')
    curl.rotation_type = 'AXIS_ANGLE'
    put(curl.inputs['Vector'], u)
    curl.inputs['Axis'].default_value = (0, 0, 1)
    put(curl.inputs['Angle'], scalar('MULTIPLY', separate(u)['Z'], 2))
    strands = vector('MULTIPLY', curl.outputs[0], (1, 1, 1.8))
    fractal = scalar('ADD', scalar('MULTIPLY', noise(strands, 3.2), .75), scalar('MULTIPLY', noise(u, 9), .25))
    r = vector('LENGTH', p)
    envelope = scalar('MULTIPLY', smooth(.35, .58, r), scalar('SUBTRACT', 1, smooth(.90, .98, r)))

    # Fixed spatial masks never move with the field and never enter the drink.
    wx, wy, wz = separate(geometry.outputs['Position'])
    radial = vector('LENGTH', combine(wx, wy, 0))
    drink_radius = scalar('ADD', .012, scalar('MULTIPLY', smooth(.12, .147, wz), .043))
    drink_mask = smooth(drink_radius, scalar('ADD', drink_radius, .012), radial)
    height_mask = scalar('MULTIPLY', smooth(.045, .055, wz), scalar('SUBTRACT', 1, smooth(.178, .190, wz)))
    exclusion = scalar('SUBTRACT', 1, scalar('MULTIPLY', height_mask, scalar('SUBTRACT', 1, drink_mask)))
    px, py, pz = separate(p)
    projected_z = scalar('SUBTRACT', scalar('ADD', pz, scalar('MULTIPLY', py, .272)), .10)
    window_ellipse = vector('LENGTH', combine(scalar('DIVIDE', px, .62), scalar('DIVIDE', projected_z, .90), 0))
    front = scalar('SUBTRACT', 1, smooth(-.15, .05, py))
    window = scalar('SUBTRACT', 1, scalar('MULTIPLY', front, scalar('SUBTRACT', 1, smooth(.75, 1.1, window_ellipse))))
    field = scalar('MULTIPLY', scalar('MULTIPLY', scalar('MULTIPLY', smooth(.45, .64, fractal), envelope), exclusion), window)
    density = scalar('MULTIPLY', field, opt.smoke_density)
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .36
    ramp.color_ramp.elements[0].color = color('#B624FF')
    ramp.color_ramp.elements[1].position = .64
    ramp.color_ramp.elements[1].color = color('#1E6DFF')
    ramp.color_ramp.elements.new(.50).color = color('#7A28FF')
    put(ramp.inputs[0], noise(u, 2.3))
    volume = nodes.new('ShaderNodeVolumePrincipled')
    volume.inputs['Color'].default_value = (.06, .06, .06, 1)
    volume.inputs['Anisotropy'].default_value = .2
    put(volume.inputs['Density'], density)
    put(volume.inputs['Emission Color'], ramp.outputs['Color'])
    put(volume.inputs['Emission Strength'], scalar('MULTIPLY', density, .22))
    links.new(volume.outputs[0], out.inputs['Volume'])
    return m


smoke = sphere('Bounded smoke volume', .1155, (0, 0, .120), smoke_material(), 96, 48)
floor_mat, floor_nodes, floor_links, floor_out = material('Black polished stone')
floor_bsdf = floor_nodes.new('ShaderNodeBsdfPrincipled')
floor_bsdf.inputs['Base Color'].default_value = (.0001, .0001, .0001, 1)
floor_bsdf.inputs['Roughness'].default_value = .3
floor_links.new(floor_bsdf.outputs[0], floor_out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.0002))
floor = bpy.context.object
floor.name = 'Black studio surface'
floor.data.materials.append(floor_mat)


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def area(name, location, energy, tint, size_x, size_y, target=(0, 0, .12)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.color = color(tint)[:3]
    data.shape = 'RECTANGLE'
    data.size, data.size_y = size_x, size_y
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    aim(obj, target)
    return obj


area('Long soft cinematic rim', (.26, .18, .32), 4, '#DDE8FF', .020, .30)
area('Warm candle reflection', (-.30, -.20, .24), .5, '#FFB66E', .012, .12)
area('Electric blue neon strip', (.23, .015, .19), 1, '#296EFF', .015, .24)
area('Deep violet neon strip', (-.25, .08, .25), 1, '#8029FF', .018, .28)
area('Amber transmitted key', (.28, .20, .34), 2.0, '#FFCC79', .012, .16)
key_data = bpy.data.lights.new('Warm candle key on the cocktail', 'POINT')
key_data.energy = 5
key_data.color = color('#FFD29A')[:3]
key_data.shadow_soft_size = .003
key = bpy.data.objects.new(key_data.name, key_data)
scene.collection.objects.link(key)
key.location = (.045, -.28, .25)
spot_data = bpy.data.lights.new('Focused warm key through the viewing window', 'SPOT')
spot_data.energy = .45
spot_data.color = color('#FFDCAD')[:3]
spot_data.shadow_soft_size = .002
spot_data.spot_size = math.radians(20)
spot_data.spot_blend = .6
spot = bpy.data.objects.new(spot_data.name, spot_data)
scene.collection.objects.link(spot)
spot.location = (-.035, -.30, .24)
aim(spot, (0, 0, ice_z))
inner_key_data = bpy.data.lights.new('Soft light scattered inside the ice', 'POINT')
inner_key_data.energy = .025
inner_key_data.color = color('#E5F3FF')[:3]
inner_key_data.shadow_soft_size = .0005
inner_key = bpy.data.objects.new(inner_key_data.name, inner_key_data)
scene.collection.objects.link(inner_key)
inner_key.location = (0, .010, .158)

camera_data = bpy.data.cameras.new('Macro product camera')
camera = bpy.data.objects.new('Macro product camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (0, -.82, .34)
aim(camera, (0, 0, .117))
camera_data.lens = 95
camera_data.sensor_width = 36
camera_data.dof.use_dof = True
camera_data.dof.aperture_fstop = 8
focus = bpy.data.objects.new('Focus on ice and coupe rim', None)
scene.collection.objects.link(focus)
focus.location = (0, -.005, .158)
camera_data.dof.focus_object = focus
scene.camera = camera

scene.use_nodes = True
compositor = scene.node_tree
compositor.nodes.clear()
render_layers = compositor.nodes.new('CompositorNodeRLayers')
glare = compositor.nodes.new('CompositorNodeGlare')
glare.glare_type = 'FOG_GLOW'
glare.quality = 'HIGH'
glare.inputs['Threshold'].default_value = 2
glare.inputs['Strength'].default_value = .05
glare.inputs['Size'].default_value = .2
composite = compositor.nodes.new('CompositorNodeComposite')
compositor.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
compositor.links.new(glare.outputs['Image'], composite.inputs['Image'])

scene.frame_set(1)
scene.render.filepath = str(output / 'orb_')
liquid_mesh_check = bmesh.new()
liquid_mesh_check.from_mesh(liquid.data)
open_liquid_edges = sum(not edge.is_manifold for edge in liquid_mesh_check.edges)
liquid_ml = abs(liquid_mesh_check.calc_volume(signed=True)) * 1_000_000
liquid_mesh_check.free()
if open_liquid_edges or not 20 < liquid_ml < 160:
    raise RuntimeError('Liquid optical boundary is not a closed, plausible cocktail volume')
static_transforms = {obj.name: tuple(value for row in obj.matrix_world for value in row) for obj in scene.objects}
bpy.ops.wm.save_as_mainfile(filepath=str(output / 'magic-orb.blend'))
(output / 'render-config.json').write_text(json.dumps({**vars(opt), 'blender': bpy.app.version_string, 'fps': 25, 'period': 300,
    'liquid_volume_ml': round(liquid_ml, 3), 'open_liquid_edges': open_liquid_edges,
    'volume_step_rate': scene.cycles.volume_step_rate, 'seed': scene.cycles.seed,
    'relative_ior': {'glass_air': 1.52, 'liquid_glass': 1.36 / 1.52, 'liquid_ice': 1.36 / 1.31, 'ice_air': 1.31}}, indent=2), encoding='utf-8')
if not opt.build_only:
    for frame in range(opt.start, opt.end + 1):
        destination = output / ('orb_%04d.png' % frame)
        if destination.exists():
            continue
        start = time.monotonic()
        scene.frame_set(frame)
        if any(tuple(value for row in obj.matrix_world for value in row) != static_transforms[obj.name] for obj in scene.objects):
            raise RuntimeError('Only the smoke field is allowed to animate')
        scene.render.filepath = str(destination)
        bpy.ops.render.render(write_still=True)
        print('ORB_FRAME', json.dumps({'frame': frame, 'seconds': round(time.monotonic() - start, 3), 'path': str(destination)}), flush=True)
