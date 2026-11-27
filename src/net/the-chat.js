// Lễ thức tỉnh thể phách (supabase/migrations/20261125060000_p2d_the_chat.sql): máy chủ quay một lượt và giữ kết quả; gọi lại thì trả đúng kết quả
// cũ; chưa tới Kim Đan thì lỗi chua_du_canh_gioi. src/game/le-the.js gọi qua game.quayTheMayChu sau khi đã gửi bản lưu lên; lỗi (mất mạng, máy chủ
// chưa thấy cảnh giới mới) thì lễ hoãn lại rồi thử lại, không quay tạm tại máy. Bản lưu gửi mã khác thì trigger p2d_kiem_the_chat đè lại.
import { supabase } from './client.js';

export async function quayTheChat() {
  const { data, error } = await supabase.rpc('p2d_quay_the_chat');
  if (error) throw new Error((error.message || '').match(/[a-z_]+/)?.[0] || 'net');
  return data;   // { ma }
}
