#!/bin/bash
# Máy chủ thử cho bộ hãm linh khí (migration 20261126030000_p2d_luu_dau_co_do): dựng một PostgreSQL tạm trong máy làm việc, KHÔNG đụng
# máy chủ thật. Nạp lược đồ tối thiểu + định nghĩa đang chạy trước migration (lk-truoc.sql), chạy bài thử ở pha "truoc" (phải thấy đúng
# lỗi 27000 ở cờ thứ 5 và lần lưu đầu còn hở), áp migration hai lần (áp lại không được đổi gì), chạy pha "sau", rồi cho 400 lần lưu ngẫu
# nhiên của người chơi thật (tools/lk-that.mjs --thu, công thức máy khách) đi qua: máy chủ phải nhận nguyên từng lần.
#   bash tools/may-chu-thu/lk-that.sh [tệp migration]
# Cần PostgreSQL 16 (initdb, pg_ctl, psql; PGBIN=<thư mục bin>). Đang là root thì script tự chạy các lệnh bằng người dùng postgres.
set -eo pipefail
HERE=$(cd "$(dirname "$0")/../.." && pwd)
MIG=${1:-$HERE/supabase/migrations/20261126030000_p2d_luu_dau_co_do.sql}
BIN=${PGBIN:-/usr/lib/postgresql/16/bin}; PORT=${PGPORT_THU:-54332}
RUN=""; BASE=${TMPDIR:-/tmp}
if [ "$(id -u)" = 0 ]; then RUN="runuser -u postgres --"; BASE=/var/lib/postgresql; fi
DIR=$(mktemp -d "$BASE/pgthu-XXXXXX"); [ -n "$RUN" ] && chown postgres:postgres "$DIR"
WORK=$(mktemp -d); cp "$HERE"/tools/may-chu-thu/luoc-do-lk.sql "$HERE"/tools/may-chu-thu/lk-truoc.sql "$HERE"/tools/may-chu-thu/thu-lk.sql "$WORK"/
cp "$MIG" "$WORK"/mig.sql; node "$HERE"/tools/lk-that.mjs --thu 400 > "$WORK"/that.sql; chmod -R a+rX "$WORK"
trap '$RUN "$BIN"/pg_ctl -D "$DIR/data" -m immediate stop >/dev/null 2>&1; rm -rf "$DIR" "$WORK"' EXIT
$RUN "$BIN"/initdb -D "$DIR/data" -A trust -U postgres >/dev/null
$RUN "$BIN"/pg_ctl -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -w start >/dev/null
Q="$RUN $BIN/psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$Q -f "$WORK/luoc-do-lk.sql" >/dev/null
$Q -f "$WORK/lk-truoc.sql" >/dev/null
$Q -c "create trigger p2d_kiem_linh_khi before update on public.p2d_nhan_vat for each row execute function public.p2d_kiem_linh_khi();
       create trigger p2d_zz_co_do before insert or update on public.p2d_nhan_vat for each row execute function public.p2d_co_do_giu();
       create trigger p2d_co_do_xet after insert on public.p2d_nghi_van for each row execute function public.p2d_co_do_xet();"
# Định nghĩa nạp vào phải đúng từng chữ bản đang chạy trên máy chủ thật (md5 của pg_get_functiondef đọc ở máy chủ thật 26/11/2026)
$Q -At -c "select string_agg(p.proname || ' ' || md5(pg_get_functiondef(p.oid)), ' ' order by p.proname) from pg_proc p where p.proname in ('p2d_kiem_linh_khi', 'p2d_co_do_xet', 'p2d_lk_can_that', 'p2d_tong_lk_that', 'p2d_lk_tien_that')" > "$WORK/md5"
MONG="p2d_co_do_xet d19f324dae8212d2798a1e02704b4bc4 p2d_kiem_linh_khi 39cfcda2f18d1540f8e280512b91fcfb p2d_lk_can_that a6852697235f2b2239c7b1700eca3ac5 p2d_lk_tien_that 49717a4499e0e1c66cf46538bf827f49 p2d_tong_lk_that 21ab7b5ebc6c7d137fc7580a4dca660b"
[ "$(cat "$WORK/md5")" = "$MONG" ] || { echo "lk-truoc.sql không khớp bản máy chủ thật: $(cat "$WORK/md5")"; exit 1; }
echo "định nghĩa trước migration khớp máy chủ thật (md5 5 hàm)"
$Q -v pha=truoc -f "$WORK/thu-lk.sql" 2>&1 | grep -E "đạt|TRƯỢT|ERROR"
$Q -f "$WORK/mig.sql" >/dev/null
M1=$($Q -At -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.proname)) from pg_proc p where p.proname like 'p2d\_%'")
$Q -f "$WORK/mig.sql" >/dev/null   # áp lại lần hai không được đổi gì
M2=$($Q -At -c "select md5(string_agg(pg_get_functiondef(p.oid), '' order by p.proname)) from pg_proc p where p.proname like 'p2d\_%'")
[ "$M1" = "$M2" ] || { echo "áp lại lần hai làm đổi định nghĩa hàm"; exit 1; }
echo "áp migration hai lần: tự kiểm tra đạt, lần hai không đổi gì"
$Q -v pha=sau -f "$WORK/thu-lk.sql" 2>&1 | grep -E "đạt|TRƯỢT|ERROR"
$Q -f "$WORK/that.sql" >/dev/null && echo "400 lần lưu ngẫu nhiên của người chơi thật (công thức máy khách): máy chủ nhận nguyên cả 400"
$Q -At -c "select 'mã băm sau khi áp: ' || string_agg(p.proname || ' ' || md5(pg_get_functiondef(p.oid)), ' · ' order by p.proname) from pg_proc p where p.proname in ('p2d_kiem_linh_khi', 'p2d_co_do_xet', 'p2d_lk_dau')"
