import json
import urllib.request
import ssl
import sys

# itch.io file request URL:
file_url = "https://kenney-assets.itch.io/isometric-prototypes-tiles/file/4349092?source=game_download&after_download_lightbox=1&as_props=1"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
    "Referer": "https://kenney-assets.itch.io/isometric-prototypes-tiles/purchase",
    "Origin": "https://kenney-assets.itch.io",
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(file_url, data=b"", headers=headers, method="POST")
try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        body = resp.read().decode('utf-8')
        data = json.loads(body)
        download_url = data.get("url")
        print("Obtained fresh signed URL:", download_url[:80], "...")
        
        # Download ZIP
        out_path = r"scratch\kenney_isometricPrototypeTiles.zip"
        req_dl = urllib.request.Request(download_url, headers={"User-Agent": headers["User-Agent"]})
        with urllib.request.urlopen(req_dl, context=ctx) as dl_resp, open(out_path, "wb") as out_f:
            content = dl_resp.read()
            out_f.write(content)
            print(f"Downloaded {len(content)} bytes to {out_path}")
except Exception as e:
    print("Download error:", e)
