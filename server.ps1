# BM Database - HTTP server with shared data storage
#
# Env vars (all optional -- unset behaves exactly like local/LAN usage always
# has):
#   BM_PORT            listener port                  default: 8080
#   BM_BIND_HOST        listener bind host             default: + (all interfaces, for LAN sharing)
#   BM_DATA_DIR         directory holding bm-data.enc  default: next to this script
#   BM_ALLOWED_ORIGIN   CORS Access-Control-Allow-Origin value  default: * (open, matches today)
$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$port          = if ($env:BM_PORT)           { $env:BM_PORT }           else { 8080 }
$bindHost      = if ($env:BM_BIND_HOST)      { $env:BM_BIND_HOST }      else { "+" }
$dataDir       = if ($env:BM_DATA_DIR)       { $env:BM_DATA_DIR }       else { $root }
$allowedOrigin = if ($env:BM_ALLOWED_ORIGIN) { $env:BM_ALLOWED_ORIGIN } else { "*" }

if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
$dataFile = Join-Path $dataDir "bm-data.enc"

# Get local IP address
try {
    $ip = ([System.Net.Dns]::GetHostAddresses(
                [System.Net.Dns]::GetHostName()
           ) | Where-Object {
               $_.AddressFamily -eq 'InterNetwork' -and
               $_.ToString() -notmatch '^127\.'
           } | Select-Object -First 1
          ).ToString()
} catch { $ip = $null }

if (-not $ip) {
    $ipcfg = ipconfig | Select-String "IPv4"
    if ($ipcfg) {
        $ip = ($ipcfg -replace '.*:\s*', '').Trim() -split "`n" | Select-Object -First 1
    } else {
        $ip = "127.0.0.1"
    }
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json"
    ".enc"  = "application/octet-stream"
    ".ico"  = "image/x-icon"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://${bindHost}:${port}/")

try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "  ERROR: failed to start server" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Run the .bat file as Administrator." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    BM Database - server started!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This PC (browser):" -ForegroundColor Gray
Write-Host "  http://localhost:$port" -ForegroundColor White
Write-Host ""
Write-Host "  Other devices (same Wi-Fi):" -ForegroundColor Gray
Write-Host "  http://${ip}:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "  All devices share the same database!" -ForegroundColor Green
Write-Host "  Just open the link and enter the password." -ForegroundColor Gray
Write-Host ""
Write-Host "  To stop: close this window (Ctrl+C)" -ForegroundColor DarkGray
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

try { Start-Process "http://localhost:$port" } catch { }  # no browser on a headless server -- non-fatal

while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response
        $method   = $request.HttpMethod
        $localPath = $request.Url.LocalPath.TrimStart('/')

        # ── CORS preflight ────────────────────────────────────────────────
        if ($method -eq 'OPTIONS') {
            $response.Headers.Add("Access-Control-Allow-Origin", $allowedOrigin)
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        # ── API: GET /api/data ─────────────────────────────────────────────
        if ($method -eq 'GET' -and $localPath -eq 'api/data') {
            if (Test-Path $dataFile) {
                $bytes = [System.IO.File]::ReadAllBytes($dataFile)
            } else {
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"isSetup":false}')
            }
            $response.Headers.Add("Access-Control-Allow-Origin", $allowedOrigin)
            $response.ContentType     = 'application/json; charset=utf-8'
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
            continue
        }

        # ── API: POST /api/data ────────────────────────────────────────────
        if ($method -eq 'POST' -and $localPath -eq 'api/data') {
            $reader  = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body    = $reader.ReadToEnd()
            $reader.Close()
            [System.IO.File]::WriteAllText($dataFile, $body, [System.Text.Encoding]::UTF8)
            $ok = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
            $response.Headers.Add("Access-Control-Allow-Origin", $allowedOrigin)
            $response.ContentType     = 'application/json'
            $response.ContentLength64 = $ok.Length
            $response.OutputStream.Write($ok, 0, $ok.Length)
            $response.OutputStream.Close()
            continue
        }

        # ── Static files ───────────────────────────────────────────────────
        if ($localPath -eq '' -or $localPath -eq '/') { $localPath = 'index.html' }

        $filePath = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine($root, $localPath)
        )

        if (-not $filePath.StartsWith($root)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType     = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - file not found")
            $response.ContentType     = "text/plain; charset=utf-8"
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }

        $response.OutputStream.Close()

    } catch [System.Net.HttpListenerException] {
        break
    } catch {
        try { $context.Response.Abort() } catch {}
    }
}

$listener.Stop()
Write-Host "  Server stopped." -ForegroundColor Gray
