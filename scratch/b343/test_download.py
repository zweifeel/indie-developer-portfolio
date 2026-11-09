import urllib.request
import re
import json

def test_itch_download(page_url, upload_id=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
    req = urllib.request.Request(page_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            cookie = resp.headers.get('Set-Cookie', '')
            
            # Find CSRF token
            csrf = re.search(r'csrf_token["\']?\s*[:=]\s*["\']([^"\']+)["\']', html)
            token = csrf.group(1) if csrf else None
            
            # Find upload IDs
            upload_ids = re.findall(r'data-upload_id=["\'](\d+)["\']', html)
            
            print(f"URL: {page_url}")
            print(f"CSRF Token: {token}")
            print(f"Upload IDs: {upload_ids}")
            
            # Check if there is a direct download link or download_url endpoint
            download_url_endpoint = page_url.rstrip('/') + '/download_url'
            print(f"Testing download endpoint: {download_url_endpoint}")
            
            if upload_ids:
                target_upload_id = upload_id or upload_ids[0]
                post_data = urllib.parse.urlencode({'csrf_token': token or ''}).encode('utf-8')
                post_req = urllib.request.Request(
                    f"{page_url.rstrip('/')}/file/{target_upload_id}",
                    data=post_data,
                    headers={
                        'User-Agent': headers['User-Agent'],
                        'Referer': page_url,
                        'Cookie': cookie,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                )
                try:
                    with urllib.request.urlopen(post_req) as post_resp:
                        print(f"Post response code: {post_resp.status}")
                        print(f"Post response headers: {post_resp.headers}")
                        res_data = post_resp.read()
                        print(f"Post response length: {len(res_data)}")
                        try:
                            j = json.loads(res_data.decode('utf-8'))
                            print(f"JSON response: {j}")
                        except Exception:
                            print(f"Binary or HTML response: {res_data[:200]}")
                except Exception as e:
                    print(f"Post error: {e}")
    except Exception as e:
        print(f"Page error: {e}")

test_itch_download("https://thirdangle.itch.io/office-starter")
