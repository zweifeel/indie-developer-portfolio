import os
import shutil

base = r'public\assets\virtual-office\b344'
dirs = [
    'environment', 'architecture', 'floor', 'walls',
    'furniture', 'office-equipment', 'characters',
    'animations', 'licenses'
]

for d in dirs:
    os.makedirs(os.path.join(base, d), exist_ok=True)

# 1. Copy Floors & Walls from ThirdAngle
src_env = r'public\assets\virtual-office\b343\environment'
shutil.copy2(os.path.join(src_env, 'floor_office_carpet_tile.png'), os.path.join(base, 'floor', 'floor_office_carpet_tile.png'))
shutil.copy2(os.path.join(src_env, 'floor_office_carpet_tile.png'), os.path.join(base, 'environment', 'floor_office_carpet_tile.png'))

for f in ['wall_plain_left.png', 'wall_plain_right.png', 'wall_office_window_left.png', 'wall_office_window_right.png', 'wall_end_left.png', 'wall_end_right.png']:
    src_f = os.path.join(src_env, f)
    if os.path.exists(src_f):
        shutil.copy2(src_f, os.path.join(base, 'walls', f))
        shutil.copy2(src_f, os.path.join(base, 'architecture', f))

# Also copy workstations & divider from ThirdAngle
for f in ['cubicle_workstation.png', 'standing_desk.png', 'ergonomic_office_chair.png', 'multifunction_printer.png', 'planter_divider_shelf.png', 'copy_paper_box_stack.png']:
    src_f = os.path.join(src_env, f)
    if os.path.exists(src_f):
        shutil.copy2(src_f, os.path.join(base, 'furniture', f))
        shutil.copy2(src_f, os.path.join(base, 'environment', f))

# 2. Copy Antahonist furniture & office equipment
src_furn = r'public\assets\virtual-office\b343\furniture'
for f in os.listdir(src_furn):
    if f.endswith('.png'):
        shutil.copy2(os.path.join(src_furn, f), os.path.join(base, 'furniture', f))
        if f in ['office_monitor.png', 'office_keyboard.png', 'laser_printer.png', 'document_scanner.png', 'paper_shredder.png', 'projector.png', 'desk_phone.png', 'desk_speakerphone.png', 'desk_calculator.png']:
            shutil.copy2(os.path.join(src_furn, f), os.path.join(base, 'office-equipment', f))

# 3. Copy riekahq lounge sofas, tables, plants
src_riekahq = r'public\assets\virtual-office\b343\environment\riekahq'
if os.path.exists(src_riekahq):
    for f in os.listdir(src_riekahq):
        if f.endswith('.png'):
            shutil.copy2(os.path.join(src_riekahq, f), os.path.join(base, 'furniture', f))

# 4. Copy Characters (Modern Citizens and RigelRiv)
src_mc = r'public\assets\virtual-office\b343\characters\modern-citizens'
dst_mc = os.path.join(base, 'characters', 'modern-citizens')
if os.path.exists(src_mc):
    if os.path.exists(dst_mc):
        shutil.rmtree(dst_mc)
    shutil.copytree(src_mc, dst_mc)

src_rr = r'public\assets\virtual-office\b343\characters\rigelriv'
dst_rr = os.path.join(base, 'characters', 'rigelriv')
if os.path.exists(src_rr):
    if os.path.exists(dst_rr):
        shutil.rmtree(dst_rr)
    shutil.copytree(src_rr, dst_rr)

# 5. Copy Licenses
src_lic = r'public\assets\virtual-office\b343\licenses'
for f in os.listdir(src_lic):
    shutil.copy2(os.path.join(src_lic, f), os.path.join(base, 'licenses', f))

# Copy Kenney License
shutil.copy2(r'scratch\b344\extracted\kenney\License.txt', os.path.join(base, 'licenses', 'Kenney_LICENSE.txt'))

print('All b344 assets successfully organized!')
