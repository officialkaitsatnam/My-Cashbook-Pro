var SPREADSHEET_ID = "1QoFCw_nVuc7q-8SrChMsfYJ44bmhe8T6kZc81NuRMQM";
var UDHAAR_SHEET_NAME = "Udhaar_Khata";

var MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getTargetSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {
  ensureNextMonthTabIfDue_();
  var bridged = handleBridgeRequest_(e);
  if (bridged) return bridged;
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("My Cashbook — Smart Money & Udhaar Ledger")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function monthKeyToTabName_(monthKey) {
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  var mk = String(monthKey || Utilities.formatDate(new Date(), tz, "yyyy-MM")).trim();
  var parts = mk.split("-");
  if (parts.length >= 2) {
    var yr = parts[0];
    var mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return MONTH_NAMES_FULL[mIdx] + "-" + yr;
    }
  }
  return mk;
}

function getPreviousMonthKey_(monthKey) {
  var parts = String(monthKey || "").split("-");
  if (parts.length < 2) return "";
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var prevDate = new Date(y, m - 1, 1);
  return prevDate.getFullYear() + "-" + String(prevDate.getMonth() + 1).padStart(2, "0");
}

function getNextMonthKey_(monthKey) {
  var parts = String(monthKey || "").split("-");
  if (parts.length < 2) return "";
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var nextDate = new Date(y, m + 1, 1);
  return nextDate.getFullYear() + "-" + String(nextDate.getMonth() + 1).padStart(2, "0");
}

function parseMoney_(val) {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  var cleaned = String(val || "0").replace(/[^0-9.-]/g, "");
  var num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function findHeaderRow_(sh) {
  var maxScan = Math.min(sh.getLastRow(), 10);
  if (maxScan < 1) return 5;
  var topVals = sh.getRange(1, 1, maxScan, Math.min(sh.getLastColumn(), 8)).getValues();
  for (var r = 0; r < topVals.length; r++) {
    var rowJoined = topVals[r].join(" ").toLowerCase();
    if (rowJoined.indexOf("description") !== -1 && (rowJoined.indexOf("credit") !== -1 || rowJoined.indexOf("debit") !== -1)) {
      return r + 1;
    }
  }
  return 5;
}

/**
 * Finds November-2026 (or any November tab) to use as the exact visual design template
 */
function findNovemberTemplateSheet_(ss) {
  var exactNov = ss.getSheetByName("November-2026");
  if (exactNov) return exactNov;

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name !== UDHAAR_SHEET_NAME && name.toLowerCase().indexOf("nov") !== -1) {
      return sheets[i];
    }
  }
  for (var j = 0; j < sheets.length; j++) {
    var n = sheets[j].getName();
    if (n !== UDHAAR_SHEET_NAME && /^[A-Za-z]+-\d{4}$/.test(n)) {
      return sheets[j];
    }
  }
  return null;
}

function getMonthClosingBalance_(ss, monthKey) {
  var tabName = monthKeyToTabName_(monthKey);
  var sh = ss.getSheetByName(tabName);
  if (!sh) return 0;
  var headerRow = findHeaderRow_(sh);
  var dataStart = headerRow + 1;
  var lastRow = sh.getLastRow();
  if (lastRow < dataStart) return 0;
  var rows = sh.getRange(dataStart, 1, lastRow - dataStart + 1, Math.max(sh.getLastColumn(), 6)).getValues();
  var bal = 0;
  for (var i = 0; i < rows.length; i++) {
    var desc = String(rows[i][2] || "").trim();
    var cr = parseMoney_(rows[i][3]);
    var dr = parseMoney_(rows[i][4]);
    if (!desc && cr === 0 && dr === 0) continue;
    bal += (cr - dr);
  }
  return bal;
}

function getOrCreateMonthSheet_(ss, monthKey) {
  var tabName = monthKeyToTabName_(monthKey);
  var sh = ss.getSheetByName(tabName);
  if (sh) return sh;

  var templateSh = findNovemberTemplateSheet_(ss);
  var headerRow = 5;

  if (templateSh) {
    sh = templateSh.copyTo(ss);
    sh.setName(tabName);
    headerRow = findHeaderRow_(sh);

    // Update top banner title with the new month-year name while keeping exact November-2026 styling
    sh.getRange("A1").setValue("MY CASHBOOK — FINANCIAL LEDGER & PERFORMANCE (" + tabName.toUpperCase() + ")");

    // Clear old entries below header row (row 6 onwards) while preserving formatting
    var maxRows = sh.getMaxRows();
    var maxCols = Math.max(sh.getLastColumn(), 8);
    if (maxRows > headerRow) {
      sh.getRange(headerRow + 1, 1, maxRows - headerRow, maxCols).clearContent();
    }
    if (headerRow === 5) {
      sh.getRange("A3").setValue(0);
      sh.getRange("C3").setValue(0);
      sh.getRange("E3").setValue(0);
      sh.getRange("G3").setValue(0);
    }
  } else {
    sh = ss.insertSheet(tabName);
    sh.getRange("A1:H1").merge().setValue("MY CASHBOOK — FINANCIAL LEDGER & PERFORMANCE (" + tabName.toUpperCase() + ")")
      .setBackground("#062873").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");
    sh.getRange("A2:B2").merge().setValue("TOTAL CREDIT (+)").setHorizontalAlignment("center");
    sh.getRange("C2:D2").merge().setValue("TOTAL DEBIT (-)").setHorizontalAlignment("center");
    sh.getRange("E2:F2").merge().setValue("CASH BALANCE").setHorizontalAlignment("center");
    sh.getRange("G2:H2").merge().setValue("TOTAL ENTRIES").setHorizontalAlignment("center");
    sh.getRange("A2:H3").setBackground("#eef4fc").setFontWeight("bold");
    sh.getRange("A3:B3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setFontColor("#15803d").setFontSize(12);
    sh.getRange("C3:D3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setFontColor("#dc2626").setFontSize(12);
    sh.getRange("E3:F3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setFontColor("#0b49b8").setFontSize(12);
    sh.getRange("G3:H3").merge().setHorizontalAlignment("center").setFontSize(12);

    sh.getRange(5, 1, 1, 8).setValues([[
      "S.NO.", "Date", "Description", "Credit (+)", "Debit (-)", "Cash Balance", "Category", "Type"
    ]]).setBackground("#0b2349").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sh.setFrozenRows(5);
  }

  var prevKey = getPreviousMonthKey_(monthKey);
  var prevTabName = monthKeyToTabName_(prevKey);
  var prevClosing = getMonthClosingBalance_(ss, prevKey);
  if (prevClosing !== 0) {
    var firstDayDate = new Date(monthKey + "-01T00:00:00");
    if (isNaN(firstDayDate.getTime())) firstDayDate = new Date();
    var firstDataRow = headerRow + 1;
    sh.getRange(firstDataRow, 1, 1, 8).setValues([[
      1,
      firstDayDate,
      "Opening Balance (Carried from " + prevTabName + ")",
      prevClosing > 0 ? prevClosing : 0,
      prevClosing < 0 ? Math.abs(prevClosing) : 0,
      prevClosing,
      "Opening Balance",
      "🔄 CARRY FWD"
    ]]);
    recalculateMonthSheet_(sh, headerRow);
  }
  return sh;
}

function ensureNextMonthTabIfDue_() {
  try {
    var ss = getTargetSpreadsheet_();
    var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
    var now = new Date();
    var curMonthKey = Utilities.formatDate(now, tz, "yyyy-MM");
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var isLastDayOfMonth = tomorrow.getMonth() !== now.getMonth();

    getOrCreateMonthSheet_(ss, curMonthKey);
    if (isLastDayOfMonth) {
      getOrCreateMonthSheet_(ss, getNextMonthKey_(curMonthKey));
    }
    ensureUdhaarSheet_(ss);
  } catch (err) {}
}

function parseDateTimeInput_(rawStr) {
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  var fallback = new Date();
  if (!rawStr) {
    return {
      dateObj: fallback,
      displayStr: Utilities.formatDate(fallback, tz, "dd/MM/yyyy hh:mm a"),
      isoLocal: Utilities.formatDate(fallback, tz, "yyyy-MM-dd'T'HH:mm")
    };
  }
  var s = String(rawStr).trim();
  var normalized = s.indexOf("T") !== -1 ? s : s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized += "T" + Utilities.formatDate(fallback, tz, "HH:mm:ss");
  }
  var dt = new Date(normalized);
  if (isNaN(dt.getTime())) dt = fallback;
  return {
    dateObj: dt,
    displayStr: Utilities.formatDate(dt, tz, "dd/MM/yyyy hh:mm a"),
    isoLocal: Utilities.formatDate(dt, tz, "yyyy-MM-dd'T'HH:mm")
  };
}

function ensureUdhaarSheet_(ss) {
  var sh = ss.getSheetByName(UDHAAR_SHEET_NAME);
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  if (!sh) {
    sh = ss.insertSheet(UDHAAR_SHEET_NAME);
  }

  var r5 = sh.getRange(5, 1, 1, 9).getValues()[0];
  var isV2Style = String(r5[4] || "").toLowerCase().indexOf("lena") !== -1 &&
                  String(r5[7] || "").toLowerCase().indexOf("settled") !== -1;

  if (!isV2Style && sh.getLastRow() >= 1) {
    var migrated = [];
    var startScan = 1;
    var r1a = String(sh.getRange(1, 1).getValue() || "").toLowerCase();
    var r5a = String(r5[0] || "").toLowerCase();
    if (r5a.indexOf("s.no") !== -1 || String(r5[2] || "").toLowerCase().indexOf("party") !== -1) {
      startScan = 6;
    } else if (r1a === "id" || r1a.indexOf("s.no") !== -1) {
      startScan = 2;
    }

    if (sh.getLastRow() >= startScan) {
      var raw = sh.getRange(startScan, 1, sh.getLastRow() - startScan + 1, Math.min(sh.getLastColumn(), 9)).getValues();
      for (var i = 0; i < raw.length; i++) {
        var row = raw[i];
        var party = String(row[2] || "").trim();
        var col4Num = parseMoney_(row[4]);
        var col5Num = parseMoney_(row[5]);
        if (!party && col4Num === 0 && col5Num === 0) continue;

        var rawCol0 = String(row[0] || "").trim();
        var rawCol8 = String(row[8] || "").trim();
        var idVal = rawCol0.indexOf("UDH-") === 0 ? rawCol0 : (rawCol8.indexOf("UDH-") === 0 ? rawCol8 : ("UDH-" + (Date.now() + i)));

        var dtParsed = parseDateTimeInput_(row[1]);
        var typeLow = String(row[3] || "").trim().toLowerCase();
        var isDena = false;
        var amtVal = 0;
        var noteVal = "";
        var statusVal = "⏳ PENDING";
        var settledDtVal = "";

        if (String(r5[4] || "").toLowerCase().indexOf("lena") !== -1) {
          noteVal = String(row[3] || "").trim();
          isDena = col5Num > 0 && col4Num === 0;
          amtVal = isDena ? col5Num : col4Num;
          var stLow = String(row[6] || "").trim().toLowerCase();
          if (stLow.indexOf("settled") !== -1) {
            statusVal = "✅ SETTLED";
            settledDtVal = String(row[7] || "");
          }
        } else {
          isDena = (typeLow === "taken" || typeLow === "dena");
          amtVal = col4Num;
          noteVal = String(row[5] || "").trim();
          var sLow = String(row[6] || "").trim().toLowerCase();
          if (row[6] === true || sLow.indexOf("settled") !== -1 || sLow === "true" || sLow === "yes") {
            statusVal = "✅ SETTLED";
            settledDtVal = String(row[7] || "");
          }
        }

        migrated.push([
          migrated.length + 1,
          dtParsed.displayStr,
          party,
          noteVal,
          isDena ? 0 : amtVal,
          isDena ? amtVal : 0,
          statusVal,
          settledDtVal,
          idVal
        ]);
      }
    }
    sh.clear();
    if (migrated.length > 0) {
      sh.getRange(6, 1, migrated.length, 9).setValues(migrated);
    }
  }

  sh.getRange("A1:I1").merge()
    .setValue("MY CASHBOOK — UDHAAR KHATA LEDGER & PERFORMANCE (UDHAAR_KHATA)")
    .setBackground("#062873").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(1, 36);

  sh.getRange("A2:B2").merge().setValue("LENA HAI / GIVEN (+)").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.getRange("C2:D2").merge().setValue("DENA HAI / TAKEN (-)").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.getRange("E2:G2").merge().setValue("NET PENDING UDHAAR").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.getRange("H2:I2").merge().setValue("TOTAL ENTRIES").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.getRange("A2:I2").setBackground("#dbeafe").setFontColor("#0b2349").setFontWeight("bold").setFontSize(10);
  sh.setRowHeight(2, 24);

  sh.getRange("A3:B3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFontColor("#15803d").setFontWeight("bold").setFontSize(13).setBackground("#effdf5");
  sh.getRange("C3:D3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFontColor("#dc2626").setFontWeight("bold").setFontSize(13).setBackground("#fff1f2");
  sh.getRange("E3:G3").merge().setNumberFormat("₹#,##0.00").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFontColor("#0b49b8").setFontWeight("bold").setFontSize(13).setBackground("#eff6ff");
  sh.getRange("H3:I3").merge().setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setFontColor("#0f172a").setFontWeight("bold").setFontSize(13).setBackground("#f1f5f9");
  sh.setRowHeight(3, 32);
  sh.getRange("A2:I3").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  sh.getRange(5, 1, 1, 9).setValues([[
    "S.NO.", "Date & Time", "Party Name", "Note / Description", "Lena Hai (+)", "Dena Hai (-)", "Status", "Settled Date & Time", "Entry ID"
  ]]).setBackground("#0b2349").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10)
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sh.setRowHeight(5, 30);

  sh.setFrozenRows(5);
  sh.setColumnWidth(1, 68);
  sh.setColumnWidth(2, 155);
  sh.setColumnWidth(3, 175);
  sh.setColumnWidth(4, 210);
  sh.setColumnWidth(5, 130);
  sh.setColumnWidth(6, 130);
  sh.setColumnWidth(7, 125);
  sh.setColumnWidth(8, 165);
  sh.setColumnWidth(9, 175);

  formatUdhaarSheetRows_(sh);
  return sh;
}

function formatUdhaarSheetRows_(sh) {
  var lastRow = sh.getLastRow();
  var lenaPending = 0;
  var denaPending = 0;
  var count = 0;

  if (lastRow >= 6) {
    var rows = sh.getRange(6, 1, lastRow - 5, 9).getValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var party = String(r[2] || "").trim();
      var lenaAmt = parseMoney_(r[4]);
      var denaAmt = parseMoney_(r[5]);
      if (!party && lenaAmt === 0 && denaAmt === 0) continue;

      count++;
      var rowNum = 6 + i;
      var statusStr = String(r[6] || "").trim().toLowerCase();
      var isSettled = (statusStr.indexOf("settled") !== -1);

      if (!isSettled) {
        lenaPending += lenaAmt;
        denaPending += denaAmt;
      }

      var rowRange = sh.getRange(rowNum, 1, 1, 9);
      var bg = isSettled ? "#f1f5f9" : ((i % 2 === 0) ? "#ffffff" : "#f8fafc");
      sh.setRowHeight(rowNum, 26);
      rowRange.setBackground(bg).setVerticalAlignment("middle")
        .setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);

      sh.getRange(rowNum, 1).setValue(count).setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#334155");
      sh.getRange(rowNum, 2).setHorizontalAlignment("center").setFontColor("#334155");
      sh.getRange(rowNum, 3).setFontWeight("bold").setFontColor("#0f172a");
      sh.getRange(rowNum, 4).setFontColor("#1e293b");
      sh.getRange(rowNum, 5).setValue(lenaAmt).setNumberFormat("₹#,##0.00").setHorizontalAlignment("right")
        .setFontColor(lenaAmt > 0 ? "#15803d" : "#94a3b8").setFontWeight(lenaAmt > 0 ? "bold" : "normal");
      sh.getRange(rowNum, 6).setValue(denaAmt).setNumberFormat("₹#,##0.00").setHorizontalAlignment("right")
        .setFontColor(denaAmt > 0 ? "#dc2626" : "#94a3b8").setFontWeight(denaAmt > 0 ? "bold" : "normal");
      sh.getRange(rowNum, 7).setValue(isSettled ? "✅ SETTLED" : "⏳ PENDING").setHorizontalAlignment("center")
        .setFontWeight("bold").setFontColor(isSettled ? "#475569" : "#b45309");
      sh.getRange(rowNum, 8).setHorizontalAlignment("center").setFontColor(isSettled ? "#15803d" : "#64748b").setFontWeight(isSettled ? "bold" : "normal");
      sh.getRange(rowNum, 9).setFontColor("#64748b").setFontSize(9);
    }
  }

  sh.getRange("A3").setValue(lenaPending);
  sh.getRange("C3").setValue(denaPending);
  sh.getRange("E3").setValue(lenaPending - denaPending);
  sh.getRange("H3").setValue(count);
}

function syncUdhaarSettlementToCashbook_(ss, udhaarId, party, note, typeCode, amount, isSettled, settledDateObj) {
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  var dtObj = settledDateObj && !isNaN(settledDateObj.getTime()) ? settledDateObj : new Date();
  var monthKey = Utilities.formatDate(dtObj, tz, "yyyy-MM");
  var sh = getOrCreateMonthSheet_(ss, monthKey);
  var headerRow = findHeaderRow_(sh);
  var tagMarker = "[UDH_SETTLE:" + udhaarId + "]";

  var lastRow = sh.getLastRow();
  if (lastRow > headerRow) {
    var rows = sh.getRange(headerRow + 1, 1, lastRow - headerRow, Math.max(sh.getLastColumn(), 8)).getValues();
    for (var i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i][2] || "").indexOf(tagMarker) !== -1) {
        sh.deleteRow(headerRow + 1 + i);
      }
    }
  }

  if (isSettled && amount > 0) {
    var isLena = (typeCode === "LENA");
    var cr = isLena ? amount : 0;
    var dr = isLena ? 0 : amount;
    var desc = "Udhaar Settled (" + (isLena ? "Received from " : "Paid to ") + party + (note ? " - " + note : "") + ") " + tagMarker;
    var typeTag = isLena ? "📈 CREDIT" : "📉 DEBIT";
    var nextRow = Math.max(headerRow + 1, sh.getLastRow() + 1);
    var nextSerial = nextRow - headerRow;
    sh.getRange(nextRow, 1, 1, 8).setValues([[nextSerial, dtObj, desc, cr, dr, 0, "Udhaar Settlement", typeTag]]);
  }

  recalculateMonthSheet_(sh, headerRow);
}

function normalizeRawDate_(val) {
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  if (!val) return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
    return Utilities.formatDate(val, tz, "yyyy-MM-dd");
  }
  var s = String(val).trim();
  var mIso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (mIso) return mIso[1];
  var mDmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mDmy) {
    var dd = mDmy[1].length === 1 ? "0" + mDmy[1] : mDmy[1];
    var mm = mDmy[2].length === 1 ? "0" + mDmy[2] : mDmy[2];
    return mDmy[3] + "-" + mm + "-" + dd;
  }
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, tz, "yyyy-MM-dd");
  }
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
}

function formatDisplayDate_(val) {
  var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
    var hhmm = Utilities.formatDate(val, tz, "HH:mm");
    if (hhmm === "00:00") return Utilities.formatDate(val, tz, "dd/MM/yyyy");
    return Utilities.formatDate(val, tz, "dd/MM/yyyy hh:mm a");
  }
  var s = String(val || "").trim();
  var mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (mIso) {
    var base = mIso[3] + "/" + mIso[2] + "/" + mIso[1];
    if (mIso[4] && !(mIso[4] === "0" && mIso[5] === "00") && !(mIso[4] === "00" && mIso[5] === "00")) {
      return base + " " + mIso[4] + ":" + mIso[5];
    }
    return base;
  }
  return s;
}

function recalculateMonthSheet_(sh, headerRow) {
  var lastRow = sh.getLastRow();
  var dataStart = headerRow + 1;
  if (lastRow < dataStart) {
    if (headerRow === 5) {
      sh.getRange("A3").setValue(0);
      sh.getRange("C3").setValue(0);
      sh.getRange("E3").setValue(0);
      sh.getRange("G3").setValue(0);
    }
    return;
  }
  var numRows = lastRow - dataStart + 1;
  var numCols = Math.max(sh.getLastColumn(), 6);
  var rows = sh.getRange(dataStart, 1, numRows, numCols).getValues();
  var running = 0;
  var totCr = 0;
  var totDr = 0;
  var validCount = 0;

  for (var i = 0; i < rows.length; i++) {
    var desc = String(rows[i][2] || "").trim();
    var cr = parseMoney_(rows[i][3]);
    var dr = parseMoney_(rows[i][4]);
    if (!desc && cr === 0 && dr === 0) continue;
    validCount++;
    running += (cr - dr);
    totCr += cr;
    totDr += dr;
    sh.getRange(dataStart + i, 1).setValue(validCount);
    sh.getRange(dataStart + i, 6).setValue(running);
  }

  if (headerRow === 5) {
    sh.getRange("A3").setValue(totCr);
    sh.getRange("C3").setValue(totDr);
    sh.getRange("E3").setValue(running);
    sh.getRange("G3").setValue(validCount);
  }
}

function getDashboardData(monthKey) {
  try {
    var ss = getTargetSpreadsheet_();
    var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
    var targetMonth = String(monthKey || Utilities.formatDate(new Date(), tz, "yyyy-MM")).trim();
    var tabName = monthKeyToTabName_(targetMonth);
    var sh = ss.getSheetByName(tabName);

    if (!sh) {
      return {
        ok: true,
        month: targetMonth,
        sheetName: tabName,
        totalCredit: 0,
        totalDebit: 0,
        totalBalance: 0,
        categoryTotals: {},
        dailyTrend: {},
        entries: []
      };
    }

    var headerRow = findHeaderRow_(sh);
    var dataStart = headerRow + 1;
    var lastRow = sh.getLastRow();
    if (lastRow < dataStart) {
      return {
        ok: true,
        month: targetMonth,
        sheetName: tabName,
        totalCredit: 0,
        totalDebit: 0,
        totalBalance: 0,
        categoryTotals: {},
        dailyTrend: {},
        entries: []
      };
    }

    var numCols = Math.max(sh.getLastColumn(), 8);
    var values = sh.getRange(dataStart, 1, lastRow - dataStart + 1, numCols).getValues();
    var runningBalance = 0;
    var totalCredit = 0;
    var totalDebit = 0;
    var categoryTotals = {};
    var dailyTrend = {};
    var entries = [];

    for (var i = 0; i < values.length; i++) {
      var r = values[i];
      var sheetRowNum = dataStart + i;
      var dateCell = r[1];
      var desc = String(r[2] || "").trim();
      var cr = parseMoney_(r[3]);
      var dr = parseMoney_(r[4]);
      var cat = String(r[6] || "").trim() || "General";
      var rawD = normalizeRawDate_(dateCell);

      if (!desc && cr === 0 && dr === 0) continue;

      runningBalance += (cr - dr);
      totalCredit += cr;
      totalDebit += dr;

      if (dr > 0) {
        categoryTotals[cat] = (Number(categoryTotals[cat]) || 0) + dr;
      }
      if (!dailyTrend[rawD]) dailyTrend[rawD] = { credit: 0, debit: 0 };
      dailyTrend[rawD].credit += cr;
      dailyTrend[rawD].debit += dr;

      entries.push({
        rowIndex: sheetRowNum,
        date: formatDisplayDate_(dateCell),
        rawDate: rawD,
        description: desc,
        category: cat,
        credit: cr,
        debit: dr,
        balance: runningBalance
      });
    }

    return {
      ok: true,
      month: targetMonth,
      sheetName: tabName,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      totalBalance: runningBalance,
      categoryTotals: categoryTotals,
      dailyTrend: dailyTrend,
      entries: entries
    };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function saveTransaction(payload) {
  try {
    var ss = getTargetSpreadsheet_();
    var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
    var rawDateStr = (payload && payload.date) ? String(payload.date).trim() : Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var monthKey = rawDateStr.slice(0, 7);
    var sh = getOrCreateMonthSheet_(ss, monthKey);
    var headerRow = findHeaderRow_(sh);

    var rowIndex = payload && payload.rowIndex ? Number(payload.rowIndex) : 0;
    var nowTimePart = Utilities.formatDate(new Date(), tz, "HH:mm:ss");
    var dateObj = new Date(rawDateStr + "T" + nowTimePart);
    if (isNaN(dateObj.getTime())) dateObj = new Date();

    var desc = String((payload && payload.description) || "").trim();
    var cat = String((payload && payload.category) || "General").trim() || "General";
    var cr = parseFloat(payload && payload.credit);
    var dr = parseFloat(payload && payload.debit);
    cr = isNaN(cr) || cr < 0 ? 0 : cr;
    dr = isNaN(dr) || dr < 0 ? 0 : dr;
    var typeTag = cr > 0 ? "📈 CREDIT" : "📉 DEBIT";

    if (rowIndex > headerRow && rowIndex <= sh.getLastRow()) {
      sh.getRange(rowIndex, 2, 1, 7).setValues([[dateObj, desc, cr, dr, 0, cat, typeTag]]);
    } else {
      var nextRow = Math.max(headerRow + 1, sh.getLastRow() + 1);
      var nextSerial = nextRow - headerRow;
      sh.getRange(nextRow, 1, 1, 8).setValues([[nextSerial, dateObj, desc, cr, dr, 0, cat, typeTag]]);
    }

    recalculateMonthSheet_(sh, headerRow);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function deleteTransaction(rowIndex, monthKey) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ss.getSheetByName(monthKeyToTabName_(monthKey));
    if (!sh) return { ok: true };
    var headerRow = findHeaderRow_(sh);
    var rIdx = Number(rowIndex);
    if (rIdx > headerRow && rIdx <= sh.getLastRow()) {
      sh.deleteRow(rIdx);
      recalculateMonthSheet_(sh, headerRow);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function clearMonthEntries(monthKey) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ss.getSheetByName(monthKeyToTabName_(monthKey));
    if (!sh) return { ok: true, message: "No sheet found for this month." };
    var headerRow = findHeaderRow_(sh);
    var lastRow = sh.getLastRow();
    var count = 0;
    if (lastRow > headerRow) {
      count = lastRow - headerRow;
      sh.deleteRows(headerRow + 1, count);
      recalculateMonthSheet_(sh, headerRow);
    }
    return { ok: true, message: "Cleared " + count + " entries!" };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function getUdhaarEntries(monthKey) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ensureUdhaarSheet_(ss);
    if (sh.getLastRow() < 6) return { ok: true, entries: [] };

    var targetMonth = String(monthKey || "").trim();
    var rows = sh.getRange(6, 1, sh.getLastRow() - 5, 9).getValues();
    var list = [];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var partyVal = String(r[2] || "").trim();
      var lenaAmt = parseMoney_(r[4]);
      var denaAmt = parseMoney_(r[5]);
      if (!partyVal && lenaAmt === 0 && denaAmt === 0) continue;

      var dtRawStr = String(r[1] || "").trim();
      var isoMonth = "";
      var mIso = dtRawStr.match(/^(\d{4}-\d{2})/);
      var mDmy = dtRawStr.match(/^\d{1,2}\/(\d{1,2})\/(\d{4})/);
      if (mIso) isoMonth = mIso[1];
      else if (mDmy) isoMonth = mDmy[2] + "-" + (mDmy[1].length === 1 ? "0" + mDmy[1] : mDmy[1]);

      if (targetMonth && isoMonth && isoMonth !== targetMonth) continue;

      var isDena = denaAmt > 0 && lenaAmt === 0;
      var statusLow = String(r[6] || "").trim().toLowerCase();
      var isSettled = (statusLow.indexOf("settled") !== -1);
      var dtInfo = parseDateTimeInput_(dtRawStr);

      list.push({
        id: String(r[8] || ("UDH-" + (i + 1))).trim(),
        dateTime: dtInfo.displayStr,
        dateTimeInput: dtInfo.isoLocal,
        month: isoMonth || targetMonth,
        party: partyVal,
        type: isDena ? "DENA" : "LENA",
        amount: isDena ? denaAmt : lenaAmt,
        note: String(r[3] || "").trim(),
        settled: isSettled,
        settledDate: String(r[7] || "").trim()
      });
    }
    return { ok: true, entries: list.reverse() };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function saveUdhaarEntry(item) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ensureUdhaarSheet_(ss);
    var targetId = String((item && item.id) || "").trim();
    var isDena = (item && item.type === "DENA");
    var amtNum = Number(item && item.amount) || 0;
    var lenaVal = isDena ? 0 : amtNum;
    var denaVal = isDena ? amtNum : 0;
    var partyStr = String((item && item.party) || "").trim();
    var noteStr = String((item && item.note) || "").trim();
    var dtInfo = parseDateTimeInput_((item && (item.dateTime || item.month)) || "");

    var updated = false;
    if (targetId && sh.getLastRow() >= 6) {
      var dataRows = sh.getRange(6, 1, sh.getLastRow() - 5, 9).getValues();
      for (var i = 0; i < dataRows.length; i++) {
        var rowId = String(dataRows[i][8] || "").trim();
        if (rowId && rowId === targetId) {
          sh.getRange(6 + i, 2, 1, 5).setValues([[dtInfo.displayStr, partyStr, noteStr, lenaVal, denaVal]]);
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      var nextRow = Math.max(6, sh.getLastRow() + 1);
      var serial = nextRow - 5;
      var newId = targetId || ("UDH-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
      sh.getRange(nextRow, 1, 1, 9).setValues([[
        serial, dtInfo.displayStr, partyStr, noteStr, lenaVal, denaVal, "⏳ PENDING", "", newId
      ]]);
    }

    formatUdhaarSheetRows_(sh);
    return { ok: true, updated: updated, dateTime: dtInfo.displayStr };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function settleUdhaarEntry(id, settledBool, settledDateStr) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ensureUdhaarSheet_(ss);
    var tz = Session.getScriptTimeZone() || "Asia/Kolkata";
    var nowDt = new Date();
    var settledDisplay = settledBool
      ? (settledDateStr ? String(settledDateStr) : Utilities.formatDate(nowDt, tz, "dd/MM/yyyy hh:mm a"))
      : "";

    var party = "";
    var note = "";
    var typeCode = "LENA";
    var amount = 0;

    if (sh.getLastRow() >= 6) {
      var rows = sh.getRange(6, 1, sh.getLastRow() - 5, 9).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][8] || "").trim() === String(id).trim()) {
          party = String(rows[i][2] || "").trim();
          note = String(rows[i][3] || "").trim();
          var lenaAmt = parseMoney_(rows[i][4]);
          var denaAmt = parseMoney_(rows[i][5]);
          typeCode = (denaAmt > 0 && lenaAmt === 0) ? "DENA" : "LENA";
          amount = (typeCode === "DENA") ? denaAmt : lenaAmt;

          sh.getRange(6 + i, 7).setValue(settledBool ? "✅ SETTLED" : "⏳ PENDING");
          sh.getRange(6 + i, 8).setValue(settledDisplay);
          break;
        }
      }
    }

    formatUdhaarSheetRows_(sh);
    syncUdhaarSettlementToCashbook_(ss, id, party, note, typeCode, amount, Boolean(settledBool), nowDt);
    return { ok: true, settledDate: settledDisplay };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function deleteUdhaarEntryOnSheet(id) {
  try {
    var ss = getTargetSpreadsheet_();
    var sh = ensureUdhaarSheet_(ss);
    if (sh.getLastRow() >= 6) {
      var rows = sh.getRange(6, 1, sh.getLastRow() - 5, 9).getValues();
      for (var i = rows.length - 1; i >= 0; i--) {
        if (String(rows[i][8] || "").trim() === String(id).trim()) {
          sh.deleteRow(6 + i);
          break;
        }
      }
    }
    syncUdhaarSettlementToCashbook_(ss, id, "", "", "LENA", 0, false, new Date());
    formatUdhaarSheetRows_(sh);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function getExcelExportInfo(monthKey) {
  try {
    var ss = getTargetSpreadsheet_();
    var tabName = monthKeyToTabName_(monthKey);
    var sh = ss.getSheetByName(tabName) || ss.getSheets()[0];
    var url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx&gid=" + sh.getSheetId();
    return { ok: true, url: url, sheetName: tabName, tempSheetName: "" };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function removeTempExportSheet(tempSheetName) {}

function handleBridgeRequest_(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = String(params.action || "").trim();
  if (!action && e && e.postData && e.postData.contents) {
    try {
      var parsedPost = JSON.parse(e.postData.contents);
      if (parsedPost && parsedPost.action) {
        action = String(parsedPost.action).trim();
        params = Object.assign({}, params, parsedPost);
      }
    } catch (errPost) {}
  }
  if (!action) return null;

  var result = { ok: false, error: "Unknown action: " + action };
  try {
    if (action === "getDashboardData") {
      result = getDashboardData(params.monthKey || params.month || "");
    } else if (action === "saveTransaction") {
      var txPayload = params.payload;
      if (typeof txPayload === "string") {
        try { txPayload = JSON.parse(txPayload); } catch (e1) { txPayload = {}; }
      }
      if (!txPayload || typeof txPayload !== "object") {
        txPayload = {
          rowIndex: params.rowIndex || "",
          date: params.date || "",
          description: params.description || "",
          category: params.category || "General",
          credit: params.credit || "",
          debit: params.debit || ""
        };
      }
      result = saveTransaction(txPayload);
    } else if (action === "deleteTransaction") {
      result = deleteTransaction(params.rowIndex, params.monthKey || params.month || "");
    } else if (action === "clearMonthEntries") {
      result = clearMonthEntries(params.monthKey || params.month || "");
    } else if (action === "getUdhaarEntries") {
      result = getUdhaarEntries(params.monthKey || params.month || "");
    } else if (action === "saveUdhaarEntry") {
      var udhItem = params.item;
      if (typeof udhItem === "string") {
        try { udhItem = JSON.parse(udhItem); } catch (e2) { udhItem = {}; }
      }
      if (!udhItem || typeof udhItem !== "object") {
        udhItem = {
          id: params.id || "",
          dateTime: params.dateTime || "",
          month: params.month || "",
          party: params.party || "",
          type: params.type || "LENA",
          amount: params.amount || 0,
          note: params.note || ""
        };
      }
      result = saveUdhaarEntry(udhItem);
    } else if (action === "settleUdhaarEntry") {
      var settledBool = (params.settledBool === true || String(params.settledBool).toLowerCase() === "true");
      result = settleUdhaarEntry(params.id, settledBool, params.settledDateStr || "");
    } else if (action === "deleteUdhaarEntryOnSheet") {
      result = deleteUdhaarEntryOnSheet(params.id);
    } else if (action === "getExcelExportInfo") {
      result = getExcelExportInfo(params.monthKey || params.month || "");
    }
  } catch (err) {
    result = { ok: false, error: err && err.message ? err.message : String(err) };
  }

  var jsonStr = JSON.stringify(result);
  var callback = String(params.callback || "").replace(/[^A-Za-z0-9_$]/g, "");
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonStr + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var bridged = handleBridgeRequest_(e);
  if (bridged) return bridged;
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "No action provided" }))
    .setMimeType(ContentService.MimeType.JSON);
}
