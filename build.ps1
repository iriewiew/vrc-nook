# Build VRCNook.exe (single file) into dist\
$ErrorActionPreference = "Stop"
python -m PyInstaller --onefile --windowed --name VRCNook --icon app.ico --version-file version_info.txt `
  --hidden-import pystray._win32 `
  --hidden-import winrt.windows.media.control --hidden-import winrt.windows.foundation --hidden-import winrt.windows.foundation.collections `
  --hidden-import winrt.windows.devices.bluetooth --hidden-import winrt.windows.devices.bluetooth.genericattributeprofile --hidden-import winrt.windows.devices.bluetooth.advertisement --hidden-import winrt.windows.devices.enumeration --hidden-import winrt.windows.storage.streams `
  --add-data "vrclog_ui.html;." --add-data "vrclog_icons.json;." --add-data "vrclog_more.js;." `
  --add-data "kb_float.html;." --add-data "kb_layouts.js;." --add-data "i18n_extra.js;." `
  --clean --noconfirm vrclog_mac.py
python verify_exe.py dist\VRCNook.exe  # Every packed file must unpack, or the exe fails at startup
if ($LASTEXITCODE -ne 0) { throw "dist\VRCNook.exe is broken - build again" }
Get-FileHash dist\VRCNook.exe -Algorithm SHA256
