# MyCashbook Pro — GitHub Actions Signed APK Setup

## Folder Structure
- `www/index.html` — Fast offline-first Cashbook & Udhar Khata app (PIN + Password login, Signup with PIN, Monthly tabs, Carry-forward, Last 5 compact view, Hindi entries, Popup Edit, Excel export, Portrait print).
- `assets/icon.png` — Place your `1024x1024` app icon image here (the MyCashbook Pro icon).
- `.github/workflows/build-signed-apk.yml` — Automatically injects your icon, enables R8/ProGuard speed optimization (`minifyEnabled true`, `shrinkResources true`), signs the APK, and gives you a downloadable `app-release.apk`.

## Step 1: Generate Your Signing Keystore (One-Time)
Run this command on your PC/Termux to create `release-key.jks`:
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mycashbook
```
Convert `release-key.jks` to Base64 text:
```bash
base64 -w 0 release-key.jks > keystore_base64.txt
```

## Step 2: Add 4 Secrets in Your GitHub Repository
Go to **GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret** and add:
1. `KEYSTORE_BASE64` — Paste the full text from `keystore_base64.txt`
2. `KEYSTORE_PASSWORD` — Password you set for the keystore
3. `KEY_ALIAS` — `mycashbook`
4. `KEY_PASSWORD` — Key password

## Step 3: Upload Files & Download Signed APK
1. Upload `www/index.html`, `package.json`, `capacitor.config.json`, `.github/workflows/build-signed-apk.yml`, and put your icon image at `assets/icon.png`.
2. Go to the **Actions** tab in GitHub -> **Build Signed Release APK** -> Download **MyCashbook-Pro-Signed-Release-APK**.
