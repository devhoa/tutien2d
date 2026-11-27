-- Lược đồ tối thiểu cho máy chủ thử bộ hãm linh khí (tools/may-chu-thu/lk-that.sh). Chỉ đủ cột, bảng mà các hàm trong lk-truoc.sql và
-- migration 20261126030000_p2d_luu_dau_co_do đụng tới. KHÔNG phải lược đồ thật.
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key, created_at timestamptz not null default now());

create table public.p2d_nhan_vat (
  user_id uuid primary key, data jsonb not null default '{}', canh_gioi smallint not null default 0, tang smallint not null default 1,
  luu_luc timestamptz not null default now(), nghi_van integer not null default 0,
  qi_xo numeric, qi_luc timestamptz, qi_thuong numeric, qi_thuong_luc timestamptz);
create table public.p2d_nghi_van (id bigserial primary key, user_id uuid, ly_do text, chi_tiet jsonb, luc timestamptz not null default now());
create table public.p2d_co_do (user_id uuid primary key, ly_do text, tu_dong boolean, luc timestamptz not null default now());
create table public.p2d_xu_ly (id bigserial primary key, user_id uuid not null, hanh_dong text, du_lieu jsonb, luc timestamptz not null default now());
create table public.p2d_thien_ma (user_id uuid primary key);
create table public.p2d_dan_x2 (user_id uuid primary key, bat_luc timestamptz, het_luc timestamptz);
