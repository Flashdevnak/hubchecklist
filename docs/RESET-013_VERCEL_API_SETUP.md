# RESET-013 Vercel API + Google Sheets Setup

RESET-013 เปลี่ยน backend หลักจาก Apps Script เป็น Vercel API แล้ว โดยให้ Google Sheet ยังเป็นฐานข้อมูลกลาง และ Google Drive ยังเป็นที่เก็บรูป

## โครงสร้างใหม่

```text
Frontend / PWA / APK
→ Vercel API: /api/hub-proof
→ Google Sheets API
→ Google Drive API
```

## Environment Variables ที่ต้องตั้งใน Vercel

ตั้งใน Vercel > Project > Settings > Environment Variables

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=ใส่ ID ของ Google Sheet
GOOGLE_DRIVE_FOLDER_ID=ใส่ ID โฟลเดอร์ Drive สำหรับรูป
APP_SHARED_SECRET=ตั้งค่า secret เอง
VITE_API_BASE_URL=/api/hub-proof
```

สำหรับ APK/Android build ที่ไม่ได้รันบน domain Vercel ให้ใช้ full URL:

```env
VITE_API_BASE_URL=https://<your-vercel-domain>/api/hub-proof
```

## Google Sheet / Drive permission

ต้องแชร์ Google Sheet และ Google Drive folder ให้ service account email เป็น Editor

## หลัง deploy

1. เปิด `https://<your-vercel-domain>/api/hub-proof` ต้องได้ JSON `ok: true`
2. เปิดเว็บแอป
3. เข้า หลังบ้าน > ระบบกลาง
4. กด ตรวจระบบกลาง
5. กด ดึงข้อมูลล่าสุดจากระบบกลาง
6. เพิ่มฮับ/ผู้รับผิดชอบ แล้วตรวจว่าลงชีทจริง
7. ทดสอบสองเครื่อง: เครื่อง A ส่งงาน เครื่อง B กดรีเฟรชข้อมูล ต้องเห็นงานเดียวกัน

## หมายเหตุ

- ไม่ต้อง deploy Apps Script สำหรับ backend หลักแล้ว
- Google Sheet ยังเป็น source of truth
- รูปที่อัปโหลดจะถูกบันทึกใน Google Drive และเขียน IMAGE preview ลงชีท
- ถ้า API ขึ้นว่า `GOOGLE_ENV_MISSING` แปลว่ายังตั้ง Environment Variables ไม่ครบ
