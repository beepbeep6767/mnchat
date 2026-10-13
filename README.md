# MNChat

เว็บสำหรับนักเรียนโรงเรียนมหรรณพาราม ใช้ Next.js App Router, TypeScript strict, Tailwind CSS และ Supabase พร้อมนำขึ้น GitHub/Vercel

## สิ่งที่มีในชุดนี้

- สมัคร/เข้าสู่ระบบด้วยอีเมล `@mh.ac.th` พร้อมยืนยันอีเมล ลืมรหัสผ่าน และเปลี่ยนรหัสผ่าน
- Feed โพสต์ข้อความ ลบโพสต์ของตัวเอง และส่งคำขอบคุณ
- ห้องแชทสาธารณะภายในโรงเรียน 3 ห้อง โหลดครั้งละ 30 ข้อความด้วย cursor pagination และรับข้อความใหม่ผ่าน Realtime
- อันดับ 50 คนแรก คำนวณคะแนนจากคำขอบคุณในฐานข้อมูล ไม่รับคะแนนจาก client
- loading/empty/error, ปุ่มลองใหม่, cleanup subscription, จำกัดข้อความและอัตราส่งทั้ง client/DB
- ธีมชมพู–ฟ้าใน `tailwind.config.js` และเมนูสำหรับมือถือ

ใช้ภาพต้นฉบับประกอบใหม่ใน `public/school.svg` เพื่อให้ไฟล์รันได้ด้วยตัวเอง หน้าตาอิงสีและองค์ประกอบในภาพอ้างอิง แต่ไม่ได้รวมภาพการ์ตูนต้นฉบับจากภาพแนบ

ยังไม่รวม Google OAuth, รูปโปรไฟล์/ไฟล์แนบ, ห้องส่วนตัว, สถานะออนไลน์, แจ้งเตือน, ระบบเพื่อน, การแก้โพสต์ผ่าน UI และระบบผู้ดูแล เพื่อไม่แสดงปุ่มที่ยังใช้งานไม่ได้

## 1. ติดตั้งและตั้งค่า

ติดตั้ง Node.js 22.14 ขึ้นไป (แนะนำ Node.js 22 LTS) แล้วแตกไฟล์ ZIP เปิด terminal ที่โฟลเดอร์ `mnchat`:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

แก้ `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

นำค่าจาก Supabase > Project > Connect หรือ Settings > API Keys ใช้เฉพาะ **Publishable key** ห้ามใช้ service_role หรือ Secret key

## 2. สร้างฐานข้อมูล

ใน Supabase ของโปรเจกต์ใหม่ ไปที่ **SQL Editor > New query** แล้วรันไฟล์ต่อไปนี้ทีละไฟล์ตามลำดับ:

1. `supabase/01-schema.sql` — ตาราง, index, เปิด RLS และห้องเริ่มต้น
2. `supabase/02-access.sql` — สิทธิ์, RLS และ view อันดับ
3. `supabase/03-functions.sql` — บังคับอีเมลโรงเรียน, สร้าง profile, กัน spam, คำขอบคุณ และ Realtime
4. `supabase/04-verify.sql` — ตรวจ RLS และสิทธิ์

ไฟล์ 01–03 มี transaction หากผิดพลาดให้ตรวจข้อความแก้ไขก่อนรันไฟล์นั้นใหม่ ไฟล์เหล่านี้ออกแบบให้รันครั้งเดียวใน **โปรเจกต์ว่าง** ห้ามนำไปรันทับฐานข้อมูลเดิมที่มีตารางชื่อเดียวกัน

ตรวจ Settings > Data API ให้เปิดใช้และ expose เฉพาะ `public` อย่าเพิ่ม `private` เข้า exposed schemas

ทุกห้องในรุ่นนี้เปิดให้นักเรียนที่ยืนยันอีเมลแล้วอ่านและส่งได้ ไม่ใช่ห้องส่วนตัว ข้อมูล profile และคำขอบคุณอ่านได้เฉพาะนักเรียนที่ยืนยันอีเมล

## 3. ตั้งค่า Auth

Supabase > Authentication:

- Sign In / Providers: เปิด Email และเปิด **Confirm email** ตั้ง minimum password length เป็น 8
- ปิด Anonymous Sign-ins ไม่ต้องเปิด Google ในรุ่นนี้
- URL Configuration > Site URL: `http://localhost:3000` ตอนทดสอบ แล้วเปลี่ยนเป็น URL จริงหลัง deploy
- เพิ่ม Redirect URLs แบบระบุชัดเจน:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/callback?next=/update-password`
  - เพิ่มสองรายการแบบเดียวกันสำหรับโดเมน Vercel/โดเมนจริงด้วย
- ตรวจ Email Templates ว่า Confirm signup และ Reset password ใช้ลิงก์ `{{ .ConfirmationURL }}` ตามค่าเริ่มต้นของ Supabase
- ตั้ง Custom SMTP สำหรับใช้งานจริงและทดสอบส่งอีเมล `@mh.ac.th` ให้ได้ก่อนเปิดรับสมาชิก บริการส่งอีเมลเริ่มต้นของ Supabase อาจจำกัดผู้รับและอัตราส่ง

สมัครด้วยชื่อผู้ใช้ภาษาอังกฤษ ตัวเลข หรือ `_` จำนวน 4–24 ตัวอักษร และระดับชั้น ม.1–6 ระบบตรวจและสร้าง profile ใน DB trigger การแก้ user_metadata ภายหลังไม่เปลี่ยนสิทธิ์การเข้าถึง

## 4. รันและ build

```powershell
npm.cmd run dev
```

เปิด `http://localhost:3000` จากนั้นตรวจ production build:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

ต้องหยุด dev server ก่อน start หากใช้พอร์ต 3000 เหมือนกัน ใช้ `Ctrl+C` เพื่อหยุด คำสั่งบน macOS/Linux ใช้ `npm` แทน `npm.cmd`

ตั้ง build directory เป็น `.build` ใน `next.config.js` เพื่อแยกจาก cache `.next` ปกติ ใช้ `npm run build` / `npm start` ได้ตามเดิม ไม่ต้องอัปโหลด `.build` หรือ `node_modules`

สคริปต์ใช้ Webpack ซึ่งมากับ Next.js และ render หน้าตามคำขอ เพื่อหลีกเลี่ยงปัญหา Turbopack/การสร้าง static segment บน Windows ที่พบระหว่างตรวจงาน ไม่ต้องติดตั้ง library เพิ่ม

## 5. GitHub และ Vercel

สร้าง GitHub repository ใหม่ชื่อ `mnchat` แล้วอัปโหลด source ในโฟลเดอร์นี้ รวม `package-lock.json` แต่ไม่รวม `.env.local`, `node_modules`, `.next`, `.build` หรือ `*.tsbuildinfo`

Vercel > Add New > Project > Import Git Repository:

- Framework Preset: Next.js
- Root Directory: โฟลเดอร์ที่มี `package.json` (ถ้าเก็บไฟล์ไว้ใน `mnchat/` ให้เลือก `mnchat`)
- Build Command: `npm run build`
- Output Directory: ใช้ค่าจาก Framework ไม่ต้องกำหนดเอง
- Node.js Version: 22.x
- Settings > Environment Variables: เพิ่ม `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` สำหรับ Production, Preview และ Development ที่ต้องการใช้
- Redeploy หลังเปลี่ยน env และเพิ่ม URL จริงใน Supabase Auth ตามข้อ 3

## วิธีทดสอบ

1. ลองสมัครด้วยอีเมลอื่น เช่น `@gmail.com` ต้องถูกปฏิเสธทั้งหน้าเว็บและ DB จากนั้นสมัครสองบัญชี `@mh.ac.th` ชื่อไม่ซ้ำ ยืนยันอีเมล แล้วเข้าสู่ระบบได้
2. เปิดสองเบราว์เซอร์/สองบัญชีในห้องเดียวกัน ส่งข้อความ ต้องขึ้นอีกฝั่งครั้งเดียว สลับห้องหลายครั้งแล้วกลับมาทดสอบอีก ส่ง 31 ข้อความโดยเว้นอย่างน้อย 1 วินาทีให้ครบภายใน 1 นาที ต้องเจอข้อจำกัด ลบข้อความก่อนหน้าต้องไม่ช่วยเลี่ยง rate limit
3. เมื่อมีข้อความเกิน 30 รายการ ใช้ “โหลดข้อความก่อนหน้า” ต้องได้ข้อความเก่าโดยไม่ซ้ำ ลองข้อความว่าง เกิน 2,000 ตัวอักษร และข้อความ `<script>alert(1)</script>` ต้องไม่มี script ทำงาน
4. บัญชี A โพสต์ จากนั้น B กด “ขอบคุณเพื่อน” A ต้องเพิ่ม 10 คะแนน ให้ซ้ำคนเดิมในวันเดียวกันไม่ได้ และให้ได้สูงสุด 5 คนต่อวัน ตรวจว่า B ลบ/แก้โพสต์หรือข้อความของ A ผ่าน Data API ไม่ได้
5. ปิดอินเทอร์เน็ต/ตั้ง key ผิด ต้องแสดง error ที่อ่านเข้าใจและลองใหม่ได้ ทดลองลืมรหัสผ่าน เปลี่ยนรหัสผ่าน และเปิดบนมือถือ 375px ว่าฟอร์ม/แชทไม่ล้นหน้าจอ

## ข้อควรรู้ด้านฐานข้อมูล

- ตาราง `profiles`, `rooms`, `messages`, `posts`, `kudos` เปิด RLS ทั้งหมด ตารางกัน spam อยู่ใน `private` เปิด RLS และไม่มีสิทธิ์อ่าน/เขียนจาก client
- การเพิ่ม/แก้ข้อความและโพสต์รวมกันจำกัด 1 ครั้ง/วินาที และ 30 ครั้ง/นาที บันทึก rate event แยกจากข้อความ และล็อกคำขอพร้อมกันฝั่ง DB
- client เพิ่ม/แก้/ลบ `kudos` โดยตรงไม่ได้ เรียกได้เฉพาะ `give_kudos` ที่ตรวจผู้ใช้ ข้อจำกัดรายวัน และห้ามให้คะแนนตัวเอง
- วันของคำขอบคุณเริ่มเที่ยงคืนเขต `Asia/Bangkok` อันดับคำนวณด้วย view `security_invoker` คะแนนสะสมจากคำขอบคุณ ไม่ได้ให้จากจำนวนข้อความ
- UI แสดงข้อความด้วย React text เท่านั้น ไม่ใช้ `dangerouslySetInnerHTML`
- หน้าแอปตรวจผู้ใช้ผ่าน `getUser`; การป้องกันข้อมูลจริงอยู่ที่ RLS ไม่อาศัยการซ่อนหน้าเว็บ
- ผู้ดูแลควรตรวจ Supabase Security Advisor หลังติดตั้ง และกำหนดกติกาดูแลเนื้อหาก่อนใช้กับนักเรียนจริง

## สถานะการส่งมอบ

ชุดนี้เป็น source สำหรับคุณติดตั้งเอง ไม่มี secret และไม่ได้ผูกกับโปรเจกต์ cloud เดิม **ไม่มีการลบ GitHub/Vercel/Supabase เดิม และไม่มีการ deploy จากชุดไฟล์นี้**

ดูผลตรวจ build และข้อจำกัดที่ยังต้องทดสอบใน `VALIDATION.md`
