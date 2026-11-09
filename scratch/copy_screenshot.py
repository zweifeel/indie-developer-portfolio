import sys
import shutil
import os

src = sys.argv[1]
dst1 = sys.argv[2]
dst2 = sys.argv[3]

os.makedirs(os.path.dirname(dst1), exist_ok=True)
os.makedirs(os.path.dirname(dst2), exist_ok=True)

shutil.copyfile(src, dst1)
shutil.copyfile(src, dst2)
print(f"Copied {src} to {dst1} and {dst2}")
