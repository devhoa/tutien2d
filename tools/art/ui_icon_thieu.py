"""Dựng riêng các icon còn thiếu (ảnh GPT 25/11/2026: icon-a.png nhẫn, Thú Lệnh, điểm QTV, nguyên liệu; icon-b.png kỹ năng; icon-c.png 8 pháp bảo; icon-vu-khi-lang.png 16 vũ khí 26/11/2026; ui_vu_khi.LUOI)
và gộp vào data/art.json, không dựng lại cả kho hình."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import px, ui_vu_khi
n = ui_vu_khi.build_luoi(px.save, {'icon-a.png', 'icon-b.png', 'icon-c.png', 'icon-vu-khi-lang.png'})
p = Path(__file__).resolve().parents[2] / 'data' / 'art.json'
art = json.loads(p.read_text(encoding='utf-8'))
art['sprites'].update(px.MANIFEST)
# không xếp lại: tệp không theo thứ tự chữ cái, xếp lại làm đổi hàng nghìn dòng
p.write_text(json.dumps(art, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('icon còn thiếu:', n)
