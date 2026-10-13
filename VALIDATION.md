# ผลตรวจส่งมอบ — 13 ตุลาคม 2026

## ตรวจแล้ว

- `npm run typecheck`: ผ่าน TypeScript strict
- `npm run build`: ผ่าน production build ด้วย Next.js 16.4.0 / Webpack
- `npm start -- --port 3101`: server เริ่มได้
- เปิดหน้า `/login` และ `/signup` จาก production server ในเบราว์เซอร์: ฟอร์มแสดงได้
- ทดสอบ `student@gmail.com`: หน้าเว็บปฏิเสธด้วยข้อความให้ใช้ `@mh.ac.th`
- ทดสอบรหัสผ่านยืนยันไม่ตรงกัน: แสดงข้อความผิดพลาดและไม่ส่งคำขอสมัคร
- ทดสอบข้อมูลสมัครถูกต้องแต่ไม่มี env: แสดงข้อความให้ตั้ง Supabase URL/Publishable key ไม่พังเงียบ
- `npm audit --omit=dev`: พบ 0 vulnerabilities ณ เวลาตรวจ
- ตรึงเวอร์ชัน dependency และรวม `package-lock.json` สำหรับ `npm ci`

## ข้อจำกัดที่ยังต้องตรวจหลังติดตั้ง

- ไม่ได้รัน SQL กับฐานข้อมูลจริง ไม่ได้สร้างบัญชีนักเรียน ไม่ได้ส่งอีเมลจริง และไม่ได้ทดสอบ Realtime สองบัญชี/RLS/rate limit กับ Supabase ที่เชื่อมต่อ
- ไม่มีการ deploy Vercel หรือแก้/ลบโปรเจกต์ cloud เดิม
- ยังไม่ได้ทดสอบทุก flow บนมือถือจริง ให้ทำ checklist 5 ข้อใน README หลังตั้งค่า
- ภาพประกอบและโลโก้เป็นงานเรียบง่ายที่มากับ source ไม่ใช่ภาพการ์ตูนจากภาพอ้างอิง

## Dependency audit ฝั่งเครื่องมือพัฒนา

`npm audit` รวม devDependencies ยังรายงาน high 5 รายการในสาย dependency ของ Tailwind 3 (`braces`, `chokidar`, `fast-glob`, `micromatch`, `tailwindcss`) เป็นปัญหาการใช้ pattern ที่ซับซ้อนจนกิน CPU/stack ในเครื่องมือ build ไม่พบรายการเหล่านี้ใน production dependencies เมื่อรัน `npm audit --omit=dev`

อัปเดต PostCSS เป็น 8.5.30 และ override `postcss-selector-parser` เป็น 7.1.6 แล้ว แต่สาย `braces` ยังไม่มี patch ในเวอร์ชันปัจจุบัน ทางแก้ที่ npm เสนอคือ Tailwind 4 ซึ่งต้องเปลี่ยนชุด PostCSS plugin จึงยังไม่เพิ่ม library นอกชุดที่อนุญาตไว้ อย่ารัน `npm audit fix --force` โดยไม่ตรวจผลการเปลี่ยน major version

ก่อนใช้งานจริง ตรวจ audit อีกครั้ง และพิจารณาอนุมัติการย้าย Tailwind 4 เพื่อแก้รายการ dev tooling ที่เหลือ

## เอกสารอ้างอิงการเชื่อมต่อ

ใช้ browser client และ server callback ตามแนวทาง [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs) หน้าแอปชุดนี้โหลดข้อมูลใน client และใช้ RLS เป็นสิทธิ์หลัก ส่วน server client ใช้ใน callback แลก code เป็น session เท่านั้น
