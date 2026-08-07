<#
  Opens the report on this computer, without needing the internet.

  Browsers refuse to run a presentation like this one when you open the file
  straight from a folder, so this starts a tiny web server on your own machine
  and points your browser at it. Nothing is uploaded and nothing leaves this PC.

  Usage — just run it:
      powershell -File tools\preview.ps1

  Then press Ctrl+C in this window when you have finished.
#>
param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed on this computer, so the preview cannot start. Open the report from its web link instead."
}

Write-Host ""
Write-Host "  Serving:  $root"
Write-Host "  Open in your browser:  http://localhost:$Port/"
Write-Host "  Press Ctrl+C here when you have finished."
Write-Host ""

Start-Process "http://localhost:$Port/"

$server = @'
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const root = process.argv[2], port = Number(process.argv[3]);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.png':'image/png', '.woff2':'font/woff2', '.ttf':'font/ttf',
  '.md':'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  // Never serve anything outside this folder, and never the private folder.
  const rel = path.relative(root, file);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep)[0] === 'private') {
    res.writeHead(403); return res.end('Not available');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('Not found: ' + p); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1');
'@

$tmp = Join-Path $env:TEMP 'bugemco-preview-server.js'
$server | Out-File -FilePath $tmp -Encoding utf8
try { & node $tmp $root $Port } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
