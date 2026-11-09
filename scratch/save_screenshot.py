import sys
import shutil
import os

if len(sys.argv) < 3:
    print("Usage: python save_screenshot.py <src> <dest_rel_name>")
    sys.exit(1)

src = sys.argv[1]
name = sys.argv[2]

brain_dir = r"C:\Users\User\.gemini\antigravity\brain\51b8e4cf-4041-4888-a92a-ef2dedec86f9"
dst_docs = os.path.join(r"E:\Antigravity Project\indie-developer-portfolio\docs\reports\screenshots", name)
dst_brain = os.path.join(brain_dir, name)

os.makedirs(os.path.dirname(dst_docs), exist_ok=True)
shutil.copy2(src, dst_docs)
shutil.copy2(src, dst_brain)

print(f"Saved {name}:")
print(f"  Docs: {dst_docs} ({os.path.getsize(dst_docs)} bytes)")
print(f"  Brain: {dst_brain} ({os.path.getsize(dst_brain)} bytes)")
