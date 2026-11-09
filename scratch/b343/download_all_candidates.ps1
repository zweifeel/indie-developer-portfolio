$ErrorActionPreference = "Continue"

function Download-ItchAsset {
    param(
        [string]$Name,
        [string]$PageUrl,
        [string]$OutputFile
    )
    
    Write-Output "`n=========================================="
    Write-Output "Processing: $Name ($PageUrl)"
    
    try {
        $sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $page = Invoke-WebRequest -Uri $PageUrl -WebSession $sess -UseBasicParsing -TimeoutSec 15
        
        # Look for init_ViewGame
        if ($page.Content -match 'init_ViewGame\([^,]+,\s*(\{.*?\})\)') {
            $vgData = $matches[1] | ConvertFrom-Json
            $dlEndpoint = $vgData.generate_download_url
            Write-Output "  Download endpoint: $dlEndpoint"
            
            # Find upload_ids
            $uploadIds = [regex]::Matches($page.Content, 'data-upload_id="(\d+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
            Write-Output "  Found upload IDs: $($uploadIds -join ', ')"
            
            if ($uploadIds.Count -gt 0) {
                $targetId = $uploadIds[0]
                Write-Output "  Requesting download URL for upload_id $targetId..."
                $postRes = Invoke-WebRequest -Uri $dlEndpoint -Method Post -Body @{ upload_id = $targetId } -WebSession $sess -Headers @{ "X-Requested-With" = "XMLHttpRequest" } -UseBasicParsing
                
                $dlJson = $postRes.Content | ConvertFrom-Json
                $finalUrl = $dlJson.url
                Write-Output "  Got final URL: $finalUrl"
                
                if ($finalUrl) {
                    Invoke-WebRequest -Uri $finalUrl -OutFile $OutputFile -WebSession $sess -UseBasicParsing -TimeoutSec 30
                    $item = Get-Item $OutputFile
                    Write-Output "  SUCCESS: Downloaded $($item.Length) bytes to $OutputFile"
                    return $true
                }
            } else {
                Write-Output "  No upload IDs found on page."
            }
        } else {
            Write-Output "  No init_ViewGame found on page."
        }
    } catch {
        Write-Output "  ERROR: $($_.Exception.Message)"
    }
    return $false
}

# 1. Candidate A1: ThirdAngle Isometric Office Starter
Download-ItchAsset -Name "Candidate A1 (ThirdAngle Office Starter)" -PageUrl "https://thirdangle.itch.io/office-starter" -OutputFile "scratch\b343\thirdangle-office-starter.zip"

# 2. Candidate A2: Antahonist Free Office Desk
Download-ItchAsset -Name "Candidate A2 (Antahonist Free Office Desk)" -PageUrl "https://antahonist.itch.io/free-office-desk-3d-pixel-art-kit" -OutputFile "scratch\b343\antahonist-office-desk.zip"

# 3. Candidate A3: Gedar Interiors & Furniture
Download-ItchAsset -Name "Candidate A3 (Gedar Interiors)" -PageUrl "https://gedargames.itch.io/interiors-and-furniture" -OutputFile "scratch\b343\gedar-interiors.zip"

# 4. Candidate A4: Riekahq Isometric Interiors Lite
Download-ItchAsset -Name "Candidate A4 (Riekahq Interiors Lite)" -PageUrl "https://riekahq.itch.io/isometric-interiors-lite" -OutputFile "scratch\b343\riekahq-interiors-lite.zip"

# 5. Candidate B1: RigelRiv Isometric Modern Character
Download-ItchAsset -Name "Candidate B1 (RigelRiv Character)" -PageUrl "https://gelgel.itch.io/isometric-modern-character" -OutputFile "scratch\b343\rigelriv-characters.zip"

# 6. Candidate B3: HappyHustle Modern Rooms & People
Download-ItchAsset -Name "Candidate B3 (HappyHustle Modern Rooms)" -PageUrl "https://happyhustle.itch.io/modern-rooms-people" -OutputFile "scratch\b343\happyhustle-rooms.zip"
