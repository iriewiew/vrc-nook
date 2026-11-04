"""Check a built VRCNook.exe: every file packed inside must unpack cleanly (run by build.ps1).
A single corrupted entry makes the exe fail at startup with "Failed to extract ...: decompression resulted in return code -3"."""
import sys

from PyInstaller.archive.readers import CArchiveReader

path = sys.argv[1] if len(sys.argv) > 1 else r"dist\VRCNook.exe"
archive = CArchiveReader(path)
bad = []
for name in archive.toc:
    try:
        archive.extract(name)
    except Exception as e:  # zlib error = the entry was written corrupted
        bad.append(f"{name}: {e}")
if bad:
    print("BROKEN EXE — do not ship:\n  " + "\n  ".join(bad))
    sys.exit(1)
print(f"OK: all {len(archive.toc)} packed files unpack cleanly")
