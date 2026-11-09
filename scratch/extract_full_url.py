import re

with open(r'C:\Users\User\.gemini\antigravity\brain\51b8e4cf-4041-4888-a92a-ef2dedec86f9\.system_generated\steps\9996\output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

for line in text.splitlines():
    if 'cloudflarestorage' in line:
        print(line.strip())
