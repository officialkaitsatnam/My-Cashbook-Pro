# My Cashbook Pro — Final Working Setup

## Is ZIP mein 3 files hain:
1. `Code.gs` -> Google Apps Script mein paste karna hai
2. `index.html` -> GitHub repository (`My-Cashbook-Pro`) mein upload karna hai
3. `manifest.json` -> GitHub repository (`My-Cashbook-Pro`) mein upload karna hai

---

## Step 1: Google Apps Script (`Code.gs`) update aur re-deploy karein
1. Apni Google Sheet kholein > **Extensions > Apps Script** par jayein.
2. `Code.gs` ka poora purana code hata kar is ZIP ki `Code.gs` file ka poora code paste karein aur **Save (`Ctrl + S`)** karein.
3. Upar right side mein **Deploy > Manage deployments** par click karein.
4. Active deployment ke saamne **Edit (pencil icon)** par click karein:
   - **Version:** `New version` select karein (yeh zaroori hai warna purana code hi chalta rahega).
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
5. **Deploy** par click karein.

---

## Step 2: GitHub (`My-Cashbook-Pro`) par `index.html` aur `manifest.json` upload karein
1. Apne GitHub repository `officialkaitsatnam/My-Cashbook-Pro` mein jayein.
2. **Add file > Upload files** par click karein aur `index.html` tatha `manifest.json` upload karke **Commit changes** karein.
3. 1–2 minute baad `https://officialkaitsatnam.github.io/My-Cashbook-Pro/` open karke hard-refresh (`Ctrl + Shift + R`) karein.
