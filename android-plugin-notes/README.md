# Android Native Plugin Notes

MVP-006 adds `FlashProofWebViewPlugin` in the generated Capacitor Android project.

Plugin location:

```text
android/app/src/main/java/com/flashops/hubchecklist/FlashProofWebViewPlugin.java
```

Registered from:

```text
android/app/src/main/java/com/flashops/hubchecklist/MainActivity.java
```

Responsibilities implemented in MVP-006 foundation:

- Validate Flash proof URL before opening WebView.
- Allow only `https://api.flashexpress.com/gw/nws/web/proof/go/`.
- Reject unknown domains before JavaScript injection.
- Enable JavaScript only inside the controlled Flash WebView.
- Fill driver phone using resilient input lookup.
- Click the search button by Thai/English text or nearby form submit.
- Wait for visible route/status-like content.
- Return structured success/error responses to React.
- Keep browser/PWA mode as manual fallback only.

Still future work:

- Validate against the live Flash DOM on physical Android devices.
- Harden route row extraction after observing real Flash result markup.
- Add screenshot capture if needed for audit.
- Create real vehicle records in MVP-007.
- R2 upload, photo capture, export, backup, and cleanup remain future MVPs.
