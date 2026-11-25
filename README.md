# Complete GitHub Signed APK Setup (MyCashbook Pro)

Is package mein aapka complete app aur GitHub workflow taiyar hai:
- `www/index.html`: Login/Create Account (with PIN + Password support), Cashbook & Udhar Khata, Monthly tabs, Carry-forward balance, Last 5 entries compact table, Hindi entry support, Popup Edit, Excel export, aur Portrait print.
- `assets/icon.png`: App icon source (apni pasand ka icon PNG yahan replace kar sakte hain).
- `.github/workflows/build-signed-apk.yml`: Icon apply karta hai, R8 speed optimization lagata hai, aur aapke keystore se **Signed APK** banata hai.

## GitHub Secrets (4 Required)
Repository **Settings -> Secrets and variables -> Actions** mein ye 4 secrets add karein:
1. `KEYSTORE_BASE64`
2. `KEYSTORE_PASSWORD`
3. `KEY_ALIAS`
4. `KEY_PASSWORD`
