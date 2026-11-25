# MyCashbook Pro — Ready GitHub Signed APK Setup

Is ZIP mein sab kuch pehle se set hai:
- `www/index.html`: Sign In / Register (PIN + Password), Cashbook & Udhar Khata, Monthly tabs, Carry-Forward balance, Last 5 entries compact table, Hindi entries, Popup Edit, Excel export, Portrait print.
- `assets/icon.png`: App icon source.
- `.github/workflows/build-signed-apk.yml`: Icon lagata hai, R8 optimization karta hai, aur auto signing key se **Signed Release APK** banata hai.

## Sirf Ye 2 Step Karein:
1. ZIP extract karke saari files apne GitHub repo ke `main` branch mein upload karein.
2. GitHub ke **Actions** tab mein **Auto Build Signed Release APK** chalne dein -> complete hone par **Artifacts** se **`MyCashbook-Pro-Signed-APK`** (`app-release.apk`) download karke install karein.
