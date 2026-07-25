from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\윤혜정\.cursor\projects\c-Users-Projects-trip-shopping\assets\c__Users_____AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_9-24dc3ac5-6e76-4177-bfd9-f21c02ca68ec.png"
)
out_dir = Path(r"C:\Users\윤혜정\Projects\trip-shopping\public\brand")
app_dir = Path(r"C:\Users\윤혜정\Projects\trip-shopping\app")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
print("source", img.size)

pixels = img.load()
w, h = img.size
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 35 and g < 35 and b < 35:
            pixels[x, y] = (r, g, b, 0)

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

pad_ratio = 0.08
pw = int(img.width * pad_ratio)
ph = int(img.height * pad_ratio)
symbol = Image.new("RGBA", (img.width + pw * 2, img.height + ph * 2), (0, 0, 0, 0))
symbol.paste(img, (pw, ph), img)

side = max(symbol.size)
symbol_sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - symbol.width) // 2
oy = (side - symbol.height) // 2
symbol_sq.paste(symbol, (ox, oy), symbol)

symbol_path = out_dir / "symbol.png"
symbol_sq.save(symbol_path, "PNG")
print("wrote", symbol_path, symbol_sq.size)


def make_app_icon(size=1024, margin=0.16):
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    content = symbol_sq.copy()
    target = int(size * (1 - margin * 2))
    content = content.resize((target, target), Image.Resampling.LANCZOS)
    x = (size - target) // 2
    y = (size - target) // 2
    canvas.paste(content, (x, y), content)
    return canvas.convert("RGB")


app_icon = make_app_icon(1024)
app_icon_path = out_dir / "app-icon.png"
app_icon.save(app_icon_path, "PNG", optimize=True)
print("wrote", app_icon_path)

app_icon.save(app_dir / "icon.png", "PNG", optimize=True)
app_icon.save(app_dir / "apple-icon.png", "PNG", optimize=True)


def make_favicon(size):
    bg = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    content = symbol_sq.copy().resize(
        (int(size * 0.78), int(size * 0.78)), Image.Resampling.LANCZOS
    )
    x = (size - content.width) // 2
    y = (size - content.height) // 2
    bg.paste(content, (x, y), content)
    return bg


fav16 = make_favicon(16)
fav32 = make_favicon(32)
fav48 = make_favicon(48)
fav32.save(out_dir / "favicon-32.png", "PNG")
fav48.save(out_dir / "favicon-48.png", "PNG")
fav32.save(out_dir / "favicon.png", "PNG")
fav16.save(
    out_dir / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("favicon done")
print("done")
