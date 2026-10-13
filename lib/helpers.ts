export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
  if (message.includes('Invalid login')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (message.includes('Email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  if (message.includes('rate') || message.includes('spam')) return 'ส่งเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่';
  if (message.includes('school_email')) return 'ต้องใช้อีเมล @mh.ac.th ที่ยืนยันแล้วเท่านั้น';
  if (message.includes('already_registered') || message.includes('already been registered')) return 'อีเมลนี้มีบัญชีอยู่แล้ว';
  if (message.includes('duplicate') || message.includes('username_taken')) return 'ชื่อผู้ใช้นี้ถูกใช้แล้ว';
  if (message.includes('daily_kudos_limit')) return 'วันนี้คุณให้เกียรติยศครบ 5 คนแล้ว กลับมาใหม่วันพรุ่งนี้';
  if (message.includes('daily_kudos')) return 'วันนี้คุณให้เกียรติยศเพื่อนคนนี้แล้ว';
  if (message.includes('username_invalid')) return 'ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ จำนวน 4–24 ตัวอักษร';
  if (message.includes('Database error saving new user')) return 'สมัครไม่สำเร็จ ชื่อผู้ใช้อาจซ้ำหรือข้อมูลไม่ถูกต้อง ลองเปลี่ยนชื่อหรือติดต่อผู้ดูแล';
  if (message.includes('Supabase') || message.includes('.env.local')) return message;
  if (message.includes('fetch') || message.includes('network')) return 'เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่';
  return 'ทำรายการไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อผู้ดูแล';
}
export const schoolEmail = (email: string) => /^[^\s@]+@mh\.ac\.th$/i.test(email.trim());
export const displayTime = (value: string) => new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(value));
export const displayDate = (value: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date(value));
