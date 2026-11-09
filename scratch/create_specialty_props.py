from PIL import Image, ImageDraw
import os

furniture_dir = r"public\assets\virtual-office\b344\furniture"

# 1. Arcade Cabinet (Retro 2:1 Dimetric Pixel Art 64x64)
arcade = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(arcade)
# Shadow
d.polygon([(16, 52), (32, 60), (48, 52), (32, 44)], fill=(10, 10, 15, 120))
# Cabinet body (deep indigo/purple)
d.polygon([(20, 24), (32, 18), (44, 24), (44, 50), (32, 56), (20, 50)], fill=(30, 27, 75, 255))
# Side face
d.polygon([(20, 24), (32, 18), (32, 56), (20, 50)], fill=(49, 46, 129, 255))
# Front face
d.polygon([(32, 18), (44, 24), (44, 50), (32, 56)], fill=(67, 56, 202, 255))
# Marquee (neon yellow/cyan)
d.polygon([(32, 20), (42, 25), (42, 28), (32, 23)], fill=(250, 204, 21, 255))
# CRT Screen (glowing cyan)
d.polygon([(33, 27), (41, 31), (41, 39), (33, 35)], fill=(6, 182, 212, 255))
d.polygon([(34, 28), (40, 31), (40, 37), (34, 34)], fill=(165, 243, 252, 255))
# Control panel (red joystick & buttons)
d.polygon([(32, 38), (44, 44), (44, 46), (32, 40)], fill=(225, 29, 72, 255))
d.rectangle([36, 40, 37, 41], fill=(255, 255, 255, 255))
arcade.save(os.path.join(furniture_dir, 'arcade_cabinet.png'))

# 2. POS Cashier Terminal Counter (64x64)
pos = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(pos)
# Shadow
d.polygon([(12, 50), (32, 60), (52, 50), (32, 40)], fill=(10, 10, 15, 120))
# Counter base (warm pine/wood)
d.polygon([(16, 32), (32, 24), (48, 32), (48, 52), (32, 60), (16, 52)], fill=(146, 64, 14, 255))
d.polygon([(16, 32), (32, 24), (32, 52), (16, 44)], fill=(180, 83, 9, 255))
d.polygon([(32, 24), (48, 32), (48, 52), (32, 60)], fill=(217, 119, 6, 255))
# Counter top surface
d.polygon([(16, 32), (32, 24), (48, 32), (32, 40)], fill=(251, 191, 36, 255))
# POS Register screen (black frame, green screen)
d.polygon([(26, 22), (34, 18), (38, 20), (30, 24)], fill=(15, 23, 42, 255))
d.polygon([(28, 21), (33, 19), (36, 20), (31, 23)], fill=(16, 185, 129, 255))
# Receipt paper roll
d.rectangle([34, 24, 38, 28], fill=(241, 245, 249, 255))
# Barcode scanner gun
d.rectangle([22, 30, 25, 34], fill=(30, 41, 59, 255))
pos.save(os.path.join(furniture_dir, 'pos_counter.png'))

# 3. Server Rack Cluster (64x64)
server = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(server)
d.polygon([(16, 52), (32, 60), (48, 52), (32, 44)], fill=(10, 10, 15, 140))
# Rack chassis (sleek dark graphite)
d.polygon([(18, 16), (32, 9), (46, 16), (46, 50), (32, 57), (18, 50)], fill=(15, 23, 42, 255))
d.polygon([(18, 16), (32, 9), (32, 50), (18, 43)], fill=(30, 41, 59, 255))
d.polygon([(32, 9), (46, 16), (46, 50), (32, 57)], fill=(51, 65, 85, 255))
# Server blades & blinkenlights
for y_off in range(16, 46, 6):
    d.polygon([(33, y_off - 3), (45, y_off + 3), (45, y_off + 6), (33, y_off)], fill=(15, 23, 42, 255))
    d.rectangle([36, y_off, 38, y_off + 2], fill=(34, 197, 94, 255)) # green LED
    d.rectangle([40, y_off + 2, 42, y_off + 4], fill=(59, 130, 246, 255)) # blue LED
server.save(os.path.join(furniture_dir, 'server_rack.png'))

print("Generated specialty pixel-art props: arcade_cabinet, pos_counter, server_rack")
