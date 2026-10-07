# Build VRCNook.exe (single file) into dist\
$ErrorActionPreference = "Stop"
python -m PyInstaller --onefile --windowed --name VRCNook --icon app.ico --version-file version_info.txt `
  --hidden-import pystray._win32 `
  --add-data "vrclog_ui.html;." --add-data "vrclog_icons.json;." --add-data "vrclog_more.js;." `
  --add-data "kb_float.html;." --add-data "kb_layouts.js;." --add-data "i18n_extra.js;." `
  --clean --noconfirm vrclog_mac.py
Get-FileHash dist\VRCNook.exe -Algorithm SHA256
