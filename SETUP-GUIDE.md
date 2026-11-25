# My Cashbook Pro — GitHub Pages + Google Apps Script Setup Guide

Live GitHub Pages URL: `https://officialkaitsatnam.github.io/My-Cashbook-Pro/`

## 1. GitHub Repository (`My-Cashbook-Pro`) mein upload karein
- `index.html`
- `manifest.json` (aur `manifest.html` agar aap purana reference rakhna chahein)

## 2. Google Apps Script (`Code.gs`) update karein
1. Apni Google Sheet (`1QoFCw_nVuc7q-8SrChMsfYJ44bmhe8T6kZc81NuRMQM`) se जुड़ा **Apps Script** open karein.
2. `Code.gs` mein is package ki `Code.gs` paste karein (ismein `doGet(e)` aur `doPost(e)` JSONP/JSON bridge add kiya gaya hai).
3. **Deploy > New deployment** (ya existing Web App deployment ko **Manage deployments > Edit > New version**) karein:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
4. Generated **`/exec`** Web App URL copy karein.

## 3. GitHub Pages (`index.html`) ko Web App URL se connect karein
- Aap `https://officialkaitsatnam.github.io/My-Cashbook-Pro/` open karke top bar ke **Link icon** par click karke apni `/exec` URL paste kar sakte hain (browser mein save ho jayegi), **ya** `index.html` mein `var GAS_WEB_APP_URL = "";` ke andar apni `/exec` URL daal kar GitHub par commit kar sakte hain.
