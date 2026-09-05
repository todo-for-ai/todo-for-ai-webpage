#!/usr/bin/env python3
"""
皮肤（主题）对比度验证器

对 src/theme/palettes.ts 的全部主题跑 WCAG 2.x 相对亮度对比度检查：
  - 墨色(--mario-black) / 面板(--mario-white)   >= 4.5  （正文可读）
  - 墨色 / 页面底色(--mario-sky)                 >= 4.5
  - 金底文字（暗色主题取 --px-on-gold，否则墨色）/ 金(--mario-gold) >= 4.5
  - 功能色 red/green/blue / 面板                 >= 3.0  （UI 组件/大字）

用法：python3 scripts/validate_palettes.py   （在 webpage/ 目录下）
失败主题逐条打印比值并以非零码退出；新增主题请先跑本脚本再提交。
"""

import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / 'src' / 'theme' / 'palettes.ts'

DEF_RE = re.compile(
    r"def\('(?P<id>[a-z0-9-]+)',\s*'(?P<name>[^']*)',\s*'(?P<group>[^']*)',\s*"
    r"'(?P<swatch>#[0-9a-fA-F]{6})',\s*\[(?P<colors>[^\]]+)\]"
    r"(?:,\s*(?P<extra>darkExtra\('[^']*'\)|\{[^}]*\}))?\)",
)
ON_GOLD_RE = re.compile(r"'--px-on-gold':\s*'(#[0-9a-fA-F]{6})'")


def _chan(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(hex_color: str) -> float:
    h = hex_color.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * _chan(r) + 0.7152 * _chan(g) + 0.0722 * _chan(b)


def ratio(a: str, b: str) -> float:
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    text = SRC.read_text(encoding='utf-8')
    themes = []
    for m in DEF_RE.finditer(text):
        colors = re.findall(r"'(#[0-9a-fA-F]{6})'", m.group('colors'))
        if len(colors) != 8:
            print(f"⚠️  {m.group('id')}: 颜色数量 {len(colors)} != 8，跳过")
            continue
        extra = m.group('extra') or ''
        on_gold_bg = None
        bg_m = re.search(r"darkExtra\('(#[0-9a-fA-F]{6})'\)", extra)
        if bg_m:
            on_gold_bg = bg_m.group(1)
        else:
            og_m = ON_GOLD_RE.search(extra)
            if og_m:
                on_gold_bg = og_m.group(1)
        themes.append((m.group('id'), m.group('name'), colors, on_gold_bg))

    if not themes:
        print('❌ 未解析到任何主题，检查正则与 palettes.ts 格式')
        return 1

    failures = []
    for tid, name, c, on_gold_bg in themes:
        sky, panel, ink, red, gold, _gold_dark, green, blue = c
        checks = [
            ('墨/面板', ratio(ink, panel), 4.5),
            ('墨/页底', ratio(ink, sky), 4.5),
            ('金底文字/金', ratio(on_gold_bg if on_gold_bg else ink, gold), 4.5),
            ('红/面板', ratio(red, panel), 3.0),
            ('绿/面板', ratio(green, panel), 3.0),
            ('蓝/面板', ratio(blue, panel), 3.0),
        ]
        bad = [(label, r, need) for label, r, need in checks if r < need]
        status = '✅' if not bad else '❌'
        print(f"{status} {tid:<22} {name:<24} " + '  '.join(
            f"{label}={r:.2f}" for label, r, _ in checks))
        for label, r, need in bad:
            failures.append((tid, label, r, need))

    print(f"\n共 {len(themes)} 个主题")
    if failures:
        print('\n未达标项：')
        for tid, label, r, need in failures:
            print(f"  ❌ {tid}: {label} = {r:.2f} < {need}")
        return 1
    print('全部主题对比度达标 ✅')
    return 0


if __name__ == '__main__':
    sys.exit(main())
