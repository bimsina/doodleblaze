"""Packs PNGs into a .ico (PNG-compressed entries). Usage: ico.py out.ico a.png b.png ..."""
import struct
import sys

out, *pngs = sys.argv[1:]
images = [open(p, "rb").read() for p in pngs]
header = struct.pack("<HHH", 0, 1, len(images))
entries, offset = b"", 6 + 16 * len(images)
for data in images:
    width, height = struct.unpack(">II", data[16:24])
    entries += struct.pack("<BBBBHHII", width % 256, height % 256, 0, 0, 1, 32, len(data), offset)
    offset += len(data)
with open(out, "wb") as f:
    f.write(header + entries + b"".join(images))
