# QA Checklist

## MVP-001 required checks

- [ ] `npm install` passes
- [ ] `npm run build` passes
- [ ] TypeScript has no errors
- [ ] `npm run dev` starts Vite
- [ ] All placeholder routes render
- [ ] Mobile layout has no horizontal overflow
- [ ] Buttons are large enough for mobile
- [ ] Pages clearly show `ยังไม่ได้พัฒนา / Placeholder`
- [ ] No fake completed QR feature
- [ ] No fake completed OCR feature
- [ ] No fake completed Flash WebView feature
- [ ] No fake completed Export 21.6 feature
- [ ] README.md updated
- [ ] TEST_PLAN.md updated

## Mobile layout targets

- [ ] Samsung S23 FE width
- [ ] Galaxy Tab A7 Lite width
- [ ] iPad browser fallback width
- [ ] Desktop browser width

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
