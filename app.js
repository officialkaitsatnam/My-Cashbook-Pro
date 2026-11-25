// Replace this URL with your Google Apps Script Web App (/exec) URL
const GAS_WEB_APP_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = GAS_WEB_APP_URL
      ? "Status: Apps Script URL configured"
      : "Status: Ready for your app files & Apps Script URL";
  }
});
