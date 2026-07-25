from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\윤혜정\.cursor\projects\c-Users-Projects-trip-shopping\assets\c__Users_____AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_12-7b87c742-b608-4c17-97b8-59b58b048e36.png"
)
out_dir = Path(r"C:\Users\윤혜정\Projects\trip-shopping\public\brand")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
print("source", img.size, img.mode)

pixels = img.load()
w, h = img.size
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        # white / near-white -> transparent
        if r > 245 and g > 245 and b > 245:
            pixels[x, y] = (r, g, b, 0)
        # soft anti-alias near white: reduce alpha
        elif r > 230 and g > 230 and b > 230 and a > 0:
            brightness = (r + g + b) / 3
            new_a = max(0, int(255 * (255 - brightness) / 25))
            pixels[x, y] = (r, g, b, min(a, new_a))

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# padding
pad = int(max(img.size) * 0.06)
canvas = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
canvas.paste(img, (pad, pad), img)

logo_path = out_dir / "logo.png"
canvas.save(logo_path, "PNG")
print("wrote", logo_path, canvas.size)

# Also square version for consistency if needed
side = max(canvas.size)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(canvas, ((side - canvas.width) // 2, (side - canvas.height) // 2), canvas)
sq.save(out_dir / "logo-square.png", "PNG")
print("wrote logo-square", sq.size)
print("done")
