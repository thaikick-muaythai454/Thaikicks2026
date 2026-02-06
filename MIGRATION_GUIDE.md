# คู่มือการย้ายบัญชี Supabase (Migration Guide)

ไฟล์นี้สรุปขั้นตอนทั้งหมดสำหรับการย้ายโปรเจกต์ Thaikick ไปยังบัญชี Supabase ใหม่

## 1. การเตรียมการในโปรเจกต์ใหม่
1. สร้างโปรเจกต์ใหม่ใน Supabase Dashboard
2. ไปที่ **Project Settings -> API** และคัดลอก `Project URL` และ `anon key` ใหม่
3. อัปเดตไฟล์ `.env` ในโปรเจกต์ของคุณ (ถ้ามี)

## 2. การสร้างฐานข้อมูล (Database Schema & Data)
1. ไปที่ **SQL Editor** ใน Supabase Dashboard ของโปรเจกต์ใหม่
2. เปิดไฟล์ `SUPABASE_FULL_BACKUP.sql` ที่เพิ่งสร้างขึ้น
3. คัดลอกเนื้อหาทั้งหมดไปวางใน SQL Editor และกด **Run**
   - *หมายเหตุ: ส่วนของ Trigger `on_auth_user_created` ถูกคอมเมนต์ไว้ เพื่อป้องกันปัญหาหากคุณนำเข้า Users เดิมก่อน*

## 3. การย้ายผู้ใช้งาน (Auth Users)
1. ข้อมูลในตาราง `auth.users` ไม่สามารถย้ายผ่าน SQL ได้โดยตรงเนื่องจากมีการเข้ารหัสรหัสผ่าน
2. ในโปรเจกต์เดิม: ไปที่ **Authentication -> Users** และหาปุ่ม **Export Users** (ถ้ามี) หรือต้องใช้วิธีเชิญผู้ใช้ใหม่
3. เมื่อย้าย Users เข้ามาแล้ว ให้ไปที่ SQL Editor และรันคำสั่งเปิดใช้งาน Trigger:
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
   ```

## 4. การย้าย Edge Functions
เนื่องจากคุณมีฟังก์ชันในโฟลเดอร์ `supabase/functions/`:
1. ติดตั้ง Supabase CLI: `npm install supabase --save-dev`
2. Login: `npx supabase login`
3. Link โปรเจกต์ใหม่: `npx supabase link --project-ref <PROJECT_ID_ใหม่>`
4. Deploy ฟังก์ชัน:
   - `npx supabase functions deploy stripe-checkout`
   - `npx supabase functions deploy stripe-webhook`
   - `npx supabase functions deploy create-charge`

## 5. การตั้งค่า Environment Variables
อย่าลืมตั้งค่า Secrets ในโปรเจกต์ใหม่สำหรับ Edge Functions:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 6. ไฟล์ที่เกี่ยวข้อง
- `SUPABASE_FULL_BACKUP.sql`: สคริปต์สร้างตาราง, ฟังก์ชัน, และข้อมูลเบื้องต้น
- `supabase/functions/`: โค้ดสำหรับ Edge Functions
