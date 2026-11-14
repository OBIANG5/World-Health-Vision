#!/usr/bin/env python3
"""Reject recurring visual failures before rendering World-Vision documentaries."""
import argparse
import ast
import json
import re
from pathlib import Path

FORBIDDEN_LABELS=(
    'LE MONDE LOCALISATION',
    'LE MONDE • LOCALISATION',
    'ILLUSTRATION GRAPHIQUE — NON IMAGES DE L’ACCIDENT',
)

def review(config:dict,renderer_source:str='')->dict:
    problems=[]
    if config.get('format')!={'width':1080,'height':1920,'fps':30}:
        problems.append('Video must be authored and rendered natively at 1080x1920/30fps.')
    if config.get('source_canvas')!=[1080,1920]:
        problems.append('Never treat upscaled 720x1280 art as native 1080p.')
    if config.get('format_name')!='real_event_documentary':
        problems.append('News must be documentary-first; do not silently use vector reenactment.')
    if config.get('topbar_enabled') is not False or config.get('footer_enabled') is not False:
        problems.append('Generic headers, date ribbons and footer overlays are prohibited.')
    if config.get('decorative_pills_enabled') is not False:
        problems.append('Pills/labels re-introduce rejected amateur presentation.')
    if config.get('typography',{}).get('max_headline_blocks_per_shot',9)>1:
        problems.append('At most one meaningful headline block per shot.')
    if config.get('brand',{}).get('outro')!='worldvision-original-g0-graphite.mp4':
        problems.append('Keep original approved eye/logo and light outro.')
    if config.get('voice',{}).get('profile')!='worldvision-vivienne-c52-impact-media':
        problems.append('Keep selected C5.2 impact reference unchanged.')
    if config.get('rights',{}).get('all_footage_cleared') is not True:
        problems.append('Authentic collision footage rights must be confirmed before final export.')
    if config.get('review',{}).get('watched_entire_final_video_on_phone') is not True:
        problems.append('A complete phone viewing is mandatory; frame QA alone is not enough.')
    if config.get('delivery',{}).get('permanent_video_url_verified') is not True:
        problems.append('A temporary sandbox link is not a reliable delivered video.')
    if renderer_source:
        try:
            syntax=ast.parse(renderer_source)
        except SyntaxError:
            problems.append('Renderer source code has a syntax error.')
        else:
            defs={n.name for n in ast.walk(syntax) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}
            for name in ('topbar','footer','make_tanker','make_heritage'):
                if name in defs:
                    problems.append(f'Rejected renderer function still present: {name}().')
        if re.search(r'\bW\s*,\s*H\s*=\s*720\s*,\s*1280\b',renderer_source):
            problems.append('Old 720x1280 raster rendering is prohibited.')
        if any(label in renderer_source for label in FORBIDDEN_LABELS):
            problems.append('Banned editorial/footer text still embedded in renderer.')
    return {
        'status':'REJECTED_DO_NOT_PUBLISH' if problems else 'TECHNICAL_PREFLIGHT_ONLY',
        'errors':problems,
        'aesthetic_signoff':False,
        'licensing_certified':False,
        'publishing_authorized':False,
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--rules',required=True,type=Path)
    p.add_argument('--renderer',type=Path)
    p.add_argument('--report',required=True,type=Path)
    p.add_argument('--expect-rejected',action='store_true')
    a=p.parse_args()
    r=review(json.loads(a.rules.read_text(encoding='utf-8')),
             a.renderer.read_text(encoding='utf-8') if a.renderer else '')
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(r,ensure_ascii=False))
    if a.expect_rejected:
        if r['status']!='REJECTED_DO_NOT_PUBLISH':
            raise SystemExit('Expected rejection of failed legacy clip')
    elif r['errors']:
        raise SystemExit(1)

if __name__=='__main__':
    main()
