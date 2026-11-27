"""Dựng riêng 73 hình câu cá (ảnh GPT 24/11/2026, ui_vu_khi.LUOI) và gộp vào data/art.json, không dựng lại cả kho hình."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import px, ui_vu_khi
n = ui_vu_khi.build_luoi(px.save)
p = Path(__file__).resolve().parents[2] / 'data' / 'art.json'
art = json.loads(p.read_text(encoding='utf-8'))
art['sprites'].update(px.MANIFEST)
# không xếp lại: tệp không theo thứ tự chữ cái, xếp lại làm đổi hàng nghìn dòng
p.write_text(json.dumps(art, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('hình câu cá:', n)
