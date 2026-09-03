#!/usr/bin/env python3
"""
i18n 原始 key 泄漏审计

扫描 pages/ 与 components/ 下所有 tsx/ts：
  1. usePageTranslation('<ns>') / useTranslation('<ns>') 的解构变量 → 命名空间映射
  2. 经 props 透传的 t（文件内无 hook 但调用 t('...')）→ 按所在目录推断命名空间
  3. tc('...') → common；glossary./pageIntro. 前缀 → common
然后核对 zh-CN 语言包（pages/<ns>.json → <ns>.json → common.json），报告缺失 key。

用法：
  python3 tools/check_i18n_keys.py            # 审计并打印报告（有缺失时 exit 1）
  python3 tools/check_i18n_keys.py --en       # 改审 en 语言包

已知局限（启发式正则，结果需人工复核）：
  - 基于 t/tp 字面量调用，经 props 透传且调用处不含字面量的 key 扫不到
    （这类泄漏靠浏览器截图验收兜底）；
  - 会把 import/普通函数调用误匹配进来，报告里的可疑项需逐条到源文件确认；
  - 可靠用法：定向审计某个命名空间（如本次 taskDetail/agents/mcpInstallation
    的 107 个泄漏就是按 ns 逐个核对发现的），不要把全量报告当精确清单。
"""
import json
import re
import glob
import os
import sys

LOC = 'en' if '--en' in sys.argv else 'zh-CN'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def ns_candidates(ns):
    return [
        os.path.join(ROOT, f'src/i18n/resources/{LOC}/pages/{ns}.json'),
        os.path.join(ROOT, f'src/i18n/resources/{LOC}/{ns}.json'),
        os.path.join(ROOT, f'src/i18n/resources/{LOC}/components/{ns}.json'),
    ]

def load_ns(ns):
    for p in ns_candidates(ns):
        try:
            return json.load(open(p, encoding='utf-8'))
        except FileNotFoundError:
            continue
    return None

def has_key(d, path):
    cur = d
    for part in path.split('.'):
        if isinstance(cur, list):
            try:
                cur = cur[int(part)]
            except (ValueError, IndexError):
                return False
        elif isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return False
    return True

def main():
    files = sorted(
        glob.glob(os.path.join(ROOT, 'src/pages/**/*.tsx', ), recursive=True)
        + glob.glob(os.path.join(ROOT, 'src/components/**/*.tsx'), recursive=True)
        + glob.glob(os.path.join(ROOT, 'src/components/**/*.ts'), recursive=True)
    )
    common = load_ns('common') or {}
    missing = {}

    for f in files:
        rel = os.path.relpath(f, ROOT)
        src = open(f, encoding='utf-8').read()
        var_ns = {}
        for m in re.finditer(r"const\s*\{([^}]+)\}\s*=\s*usePageTranslation\('([^']+)'\)", src):
            ns = m.group(2)
            for var in m.group(1).split(','):
                var = var.strip()
                if var:
                    var_ns[var] = 'common' if var == 'tc' else ns
        for m in re.finditer(r"const\s*\{([^}]+)\}\s*=\s*useTranslation\('([^']+)'\)", src):
            ns = m.group(2)
            for var in m.group(1).split(','):
                var = var.strip()
                if var:
                    var_ns[var] = ns

        # 目录推断命名空间（props 透传 t 的文件，如 pages/projects/*）
        rel_norm = rel.replace(os.sep, '/')
        dir_ns = None
        dm = re.search(r'src/(?:pages|components)/([\w-]+)(?:/|$)', rel_norm)
        if dm:
            guess = dm.group(1)
            if load_ns(guess) is not None:
                dir_ns = guess

        cjk = re.compile(r'[\u4e00-\u9fff]')
        for m in re.finditer(r"\b([a-z]\w*)\('([^']+)'\s*[,)]", src):
            var, key = m.group(1), m.group(2)
            if var not in var_ns:
                if dir_ns is None:
                    continue
                ns = dir_ns
            elif var == 'tc':
                ns = 'common'
            else:
                ns = var_ns[var]
            # 中文即 key（key=value 写法）不算泄漏
            if cjk.search(key):
                continue
            # i18next 跨命名空间前缀 common:xxx → common
            if ':' in key:
                ns, key = key.split(':', 1)
            if key.startswith(('glossary.', 'pageIntro.')):
                ns = 'common'
            d = load_ns(ns)
            if d is None:
                missing.setdefault(f'(ns file missing) {ns}', set()).add(f'{rel} :: {key}')
            elif not has_key(d, key):
                missing.setdefault(ns, set()).add(f'{rel} :: {key}')

    if missing:
        total = 0
        for ns in sorted(missing):
            total += len(missing[ns])
            print(f'### {ns} ({len(missing[ns])})')
            for item in sorted(missing[ns]):
                print('  ', item)
        print(f'TOTAL MISSING: {total}')
        sys.exit(1)
    print(f'i18n audit clean ({LOC}), {len(files)} files scanned')

if __name__ == '__main__':
    main()
