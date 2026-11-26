# My Cashbook Pro — Install-Ready GitHub APK Setup

Is ZIP mein aapke poore setup (`index.html`, Google Sheets `Code.gs`, Google Login + PIN, Udhaar Khata) ko Android APK ke liye properly structure kar diya gaya hai:

- `www/index.html` & `www/icon.png` — Capacitor Android app ke liye web directory (CDN preconnect + deferred scripts ke saath fast startup).
- `assets/icon.png` & `assets/icon-only.png` — Aapka custom app icon, jisse build ke time Android launcher aur adaptive icons generate hote hain.
- `.github/workflows/build-signed-apk.yml` — Sahi GitHub Actions path par rakha gaya hai taaki push karte hi **Auto Build Signed Release APK** run ho aur R8 optimization ke saath `app-release.apk` bane.
- `Code.gs`, `GOOGLE-LOGIN-SETUP.md`, `SETUP-GUIDE.md` — Aapki poori Google Apps Script backend aur setup files surakshit hain.
