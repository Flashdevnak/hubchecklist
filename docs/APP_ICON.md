# App Icon

RESET-005 adds an original Hub Photo Proof icon. It does not use the Flash Express logo or any copyrighted brand mark.

## Concept

- Yellow rounded-square background
- Dark scan frame
- Barcode/checklist shape
- Green checkmark
- No text

## Source

```text
src/assets/app-icon.svg
public/icons/icon.svg
```

## Generated PWA Assets

```text
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-192.png
public/icons/maskable-512.png
```

## Generated Android Assets

```text
android/app/src/main/res/mipmap-mdpi/ic_launcher.png
android/app/src/main/res/mipmap-hdpi/ic_launcher.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

Android round and foreground PNG assets are generated in the same mipmap density folders.

## Regeneration

Use the bundled Codex Python runtime with Pillow, or any local image tool, to regenerate PNGs from the same SVG geometry. Keep filenames unchanged so `manifest.webmanifest`, `index.html`, and Android launcher resources keep working.

After regenerating:

```powershell
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

Verify the browser favicon, PWA icon, and APK launcher icon.
