import os
import shutil

src_dir = r"scratch\b344\extracted\kenney\Isometric"
dst_dir = r"public\assets\virtual-office\b344\architecture"

patterns = ['door', 'window', 'wall', 'column', 'crate']
copied = []

for f in os.listdir(src_dir):
    if any(p in f.lower() for p in patterns) and f.endswith('.png'):
        src = os.path.join(src_dir, f)
        dst = os.path.join(dst_dir, f)
        if not os.path.exists(dst):
            shutil.copy2(src, dst)
            copied.append(f)

print(f"Copied {len(copied)} Kenney architectural files to {dst_dir}")
