# QA Checklist

## MVP-002 required checks

- [ ] `npm install` passes
- [ ] `npm run build` passes
- [ ] TypeScript has no errors
- [ ] `npm run dev` starts Vite
- [ ] All placeholder routes render
- [ ] App renders with missing Supabase env values
- [ ] Missing Supabase env shows `Supabase ยังไม่ได้ตั้งค่า`
- [ ] Supabase migration file exists in `supabase/migrations`
- [ ] Migration includes all MVP-002 tables
- [ ] Migration includes `staff`, `supervisor`, and `admin` roles
- [ ] RLS is enabled for all MVP-002 app tables
- [ ] RLS draft documents staff own-record, supervisor branch, and admin manage-all rules
- [ ] `.env.example` includes Supabase URL and anon key
- [ ] `.env.example` includes service role key as server-only placeholder
- [ ] `.env.example` includes R2 variables as future placeholders only
- [ ] Mobile layout has no horizontal overflow
- [ ] Buttons are large enough for mobile
- [ ] Pages clearly show Placeholder status
- [ ] No fake completed QR feature
- [ ] No fake completed OCR feature
- [ ] No fake completed Flash WebView feature
- [ ] No fake completed R2 upload or photo upload feature
- [ ] No fake completed Export 21.6 feature
- [ ] No fake completed Backup or Cleanup execution feature
- [ ] README.md updated
- [ ] TEST_PLAN.md updated
- [ ] docs/PROJECT_SPEC.md updated

## Mobile layout targets

- [ ] Samsung S23 FE width
- [ ] Galaxy Tab A7 Lite width
- [ ] iPad browser fallback width
- [ ] Desktop browser width

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
