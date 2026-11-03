"""
Borsaty Brand Identity System Generator
Generates all 6 institutional SVG variants, favicon.ico, PWA PNG icons, and PDF report logo.
"""

import os
import re
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "C:/Windows/Fonts/segoeuib.ttf"
COLOR_BLACK = "#0A0A0A"
COLOR_WHITE = "#FFFFFF"

# 1. Load font and metrics
font = TTFont(FONT_PATH)
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
h_metrics = font["hmtx"].metrics
units_per_em = font["head"].unitsPerEm

def round_coords(svg_path_str: str, decimals: int = 2) -> str:
    """Rounds floating point coordinates in SVG path strings for optimization."""
    def repl(match):
        val = float(match.group(0))
        if val.is_integer():
            return str(int(val))
        return f"{val:.{decimals}f}".rstrip('0').rstrip('.')
    return re.sub(r"-?\d+\.\d+", repl, svg_path_str)

def get_glyph_path(char: str, scale: float, x_offset: float, baseline: float) -> str:
    pen = SVGPathPen(glyph_set)
    tpen = TransformPen(pen, (scale, 0, 0, -scale, x_offset, baseline))
    glyph = glyph_set[cmap[ord(char)]]
    glyph.draw(tpen)
    return round_coords(pen.getCommands(), 2)

def generate_wordmark_paths(font_cap_height: float, x_start: float, baseline: float, tracking_factor: float = -35.0):
    scale = font_cap_height / 1434.0
    cur_x = x_start
    tracking = tracking_factor * scale
    paths = []
    
    for char in "BORSATY":
        advance, _ = h_metrics[cmap[ord(char)]]
        p = get_glyph_path(char, scale, cur_x, baseline)
        paths.append(p)
        cur_x += advance * scale + tracking
    
    total_w = cur_x - tracking
    return " ".join(paths), total_w

# ----------------------------------------------------------------------
# Geometry computations
# ----------------------------------------------------------------------

# 40x40 Icon
b_scale_40 = 22.0 / 1434.0
b_w_40 = (1241 - 164) * b_scale_40
b_x_40 = (40.0 - b_w_40) / 2.0 - 164 * b_scale_40
icon_b_path_40 = get_glyph_path("B", b_scale_40, b_x_40, 31.0)
icon_box_path_40 = "M8 0h24a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8z"

# 40px wordmark
wordmark_paths_40, wordmark_w_40 = generate_wordmark_paths(20.0, 52.0, 30.0)
full_w_40 = 178

# 24x24 Compact Icon & Wordmark
b_scale_24 = 13.0 / 1434.0
b_w_24 = (1241 - 164) * b_scale_24
b_x_24 = (24.0 - b_w_24) / 2.0 - 164 * b_scale_24
icon_b_path_24 = get_glyph_path("B", b_scale_24, b_x_24, 18.5)
icon_box_path_24 = "M5 0h14a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z"
wordmark_paths_24, wordmark_w_24 = generate_wordmark_paths(12.0, 32.0, 18.0)
full_w_24 = int(wordmark_w_24) + 1  # ~110px

# 512x512 Icon
b_scale_512 = 281.6 / 1434.0
b_w_512 = (1241 - 164) * b_scale_512
b_x_512 = (512.0 - b_w_512) / 2.0 - 164 * b_scale_512
icon_b_path_512 = get_glyph_path("B", b_scale_512, b_x_512, 396.8)
icon_box_path_512 = "M102 0h308a102 102 0 0 1 102 102v308a102 102 0 0 1-102 102H102A102 102 0 0 1 0 412V102A102 102 0 0 1 102 0z"

# ----------------------------------------------------------------------
# SVG Files Generation
# ----------------------------------------------------------------------
os.makedirs("apps/web/public/branding", exist_ok=True)

# 1. logo-primary.svg
svg_primary = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {full_w_40} 40" fill="none">
  <title>Borsaty Logo - Primary</title>
  <path d="{icon_box_path_40}" fill="{COLOR_BLACK}"/>
  <path d="{icon_b_path_40}" fill="{COLOR_WHITE}"/>
  <path d="{wordmark_paths_40}" fill="{COLOR_BLACK}"/>
</svg>"""

# 2. logo-white.svg
svg_white = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {full_w_40} 40" fill="none">
  <title>Borsaty Logo - White</title>
  <path d="{icon_box_path_40}" fill="{COLOR_WHITE}"/>
  <path d="{icon_b_path_40}" fill="{COLOR_BLACK}"/>
  <path d="{wordmark_paths_40}" fill="{COLOR_WHITE}"/>
</svg>"""

# 3. logo-icon-only.svg
svg_icon_only = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <title>Borsaty Icon</title>
  <path d="{icon_box_path_512}" fill="{COLOR_BLACK}"/>
  <path d="{icon_b_path_512}" fill="{COLOR_WHITE}"/>
</svg>"""

# 4. logo-monochrome-black.svg
svg_mono_black = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {full_w_40} 40" fill="none">
  <title>Borsaty Logo - Monochrome Black</title>
  <path fill-rule="evenodd" clip-rule="evenodd" d="{icon_box_path_40} {icon_b_path_40}" fill="{COLOR_BLACK}"/>
  <path d="{wordmark_paths_40}" fill="{COLOR_BLACK}"/>
</svg>"""

# 5. logo-monochrome-white.svg
svg_mono_white = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {full_w_40} 40" fill="none">
  <title>Borsaty Logo - Monochrome White</title>
  <path fill-rule="evenodd" clip-rule="evenodd" d="{icon_box_path_40} {icon_b_path_40}" fill="{COLOR_WHITE}"/>
  <path d="{wordmark_paths_40}" fill="{COLOR_WHITE}"/>
</svg>"""

# 6. logo-horizontal-compact.svg
svg_compact = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {full_w_24} 24" fill="none">
  <title>Borsaty Logo - Compact</title>
  <path d="{icon_box_path_24}" fill="{COLOR_BLACK}"/>
  <path d="{icon_b_path_24}" fill="{COLOR_WHITE}"/>
  <path d="{wordmark_paths_24}" fill="{COLOR_BLACK}"/>
</svg>"""

# Save SVGs
files_map = {
    "apps/web/public/branding/logo-primary.svg": svg_primary,
    "apps/web/public/branding/logo-white.svg": svg_white,
    "apps/web/public/branding/logo-icon-only.svg": svg_icon_only,
    "apps/web/public/branding/logo-monochrome-black.svg": svg_mono_black,
    "apps/web/public/branding/logo-monochrome-white.svg": svg_mono_white,
    "apps/web/public/branding/logo-horizontal-compact.svg": svg_compact,
    "apps/web/public/icon.svg": svg_icon_only,
    "apps/web/public/favicon.svg": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <title>Borsaty Favicon</title>
  <rect width="32" height="32" rx="7" fill="{COLOR_BLACK}"/>
  <path d="{get_glyph_path('B', 17.6 / 1434.0, (32.0 - (1241 - 164) * (17.6 / 1434.0)) / 2.0 - 164 * (17.6 / 1434.0), 24.8)}" fill="{COLOR_WHITE}"/>
</svg>""",
}

for path, content in files_map.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Written: {path} ({len(content)} bytes)")

# ----------------------------------------------------------------------
# Generate High-Resolution Raster Icons (PIL Supersampling 4x)
# ----------------------------------------------------------------------

def generate_raster_icon(size: int, output_path: str):
    ss = size * 4
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(ss * 0.20)
    draw.rounded_rectangle([0, 0, ss, ss], radius=radius, fill=(10, 10, 10, 255))
    
    font_size = int(ss * 0.58)
    pil_font = ImageFont.truetype(FONT_PATH, font_size)
    bbox = pil_font.getbbox("B")
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (ss - w) // 2 - bbox[0]
    y = (ss - h) // 2 - bbox[1]
    draw.text((x, y), "B", font=pil_font, fill=(255, 255, 255, 255))
    
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(output_path, "PNG")
    print(f"Generated PNG: {output_path} ({size}x{size})")

generate_raster_icon(512, "apps/web/public/icon-512.png")
generate_raster_icon(192, "apps/web/public/icon-192.png")
generate_raster_icon(180, "apps/web/public/apple-touch-icon.png")

# Generate favicon.ico with multiple sizes (16, 32, 48)
img_for_ico = Image.open("apps/web/public/icon-512.png")
img_for_ico.save("apps/web/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Generated ICO: apps/web/public/favicon.ico")

# Generate PDF report logo (720x160 PNG with transparent background)
os.makedirs("packages/analysis/assets", exist_ok=True)
ss_pdf_w = 720 * 4
ss_pdf_h = 160 * 4
pdf_img = Image.new("RGBA", (ss_pdf_w, ss_pdf_h), (0, 0, 0, 0))
pdf_draw = ImageDraw.Draw(pdf_img)

# Draw icon box
box_size = int(ss_pdf_h * 0.85)
box_y = (ss_pdf_h - box_size) // 2
box_x = int(box_y)
radius = int(box_size * 0.20)
pdf_draw.rounded_rectangle([box_x, box_y, box_x + box_size, box_y + box_size], radius=radius, fill=(10, 10, 10, 255))

# Draw 'B' in icon
b_font = ImageFont.truetype(FONT_PATH, int(box_size * 0.58))
bbox = b_font.getbbox("B")
w = bbox[2] - bbox[0]
h = bbox[3] - bbox[1]
bx = box_x + (box_size - w) // 2 - bbox[0]
by = box_y + (box_size - h) // 2 - bbox[1]
pdf_draw.text((bx, by), "B", font=b_font, fill=(255, 255, 255, 255))

# Draw 'BORSATY' wordmark
word_font = ImageFont.truetype(FONT_PATH, int(box_size * 0.52))
word_x = box_x + box_size + int(box_size * 0.30)
w_bbox = word_font.getbbox("BORSATY")
word_y = (ss_pdf_h - (w_bbox[3] - w_bbox[1])) // 2 - w_bbox[1]
pdf_draw.text((word_x, word_y), "BORSATY", font=word_font, fill=(10, 10, 10, 255))

final_pdf_logo = pdf_img.resize((720, 160), Image.Resampling.LANCZOS)
final_pdf_logo.save("packages/analysis/assets/logo.png", "PNG")
print("Generated PDF Logo: packages/analysis/assets/logo.png (720x160)")
