/**
 * Weekly Vacation Schedule - Web App
 * Reads the "Eqrarawda" tab (Sunday-Thursday grid) and serves it as a live web page.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Weekly Vacation Schedule')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Reads the schedule tab and returns a JSON-friendly structure:
 * { days: [ { day, date, names: [...] }, ... ], generatedAt }
 */
function getScheduleData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Eqrarawda');

  if (!sheet) {
    throw new Error('Sheet "Eqrarawda" was not found in this spreadsheet.');
  }

  var tz = ss.getSpreadsheetTimeZone();
  var lastRow = Math.max(sheet.getLastRow(), 30); // buffer in case FILTER spill is short
  var numNameRows = Math.max(lastRow - 2, 1);

  var headers = sheet.getRange(1, 1, 1, 5).getValues()[0];  // day names (row 1)
  var dates   = sheet.getRange(2, 1, 1, 5).getValues()[0];  // dates (row 2)
  var namesGrid = sheet.getRange(3, 1, numNameRows, 5).getValues(); // names (row 3+)

  var days = [];
  for (var col = 0; col < 5; col++) {
    var dateVal = dates[col];
    var dateStr = (dateVal instanceof Date)
      ? Utilities.formatDate(dateVal, tz, 'dd/MM/yyyy')
      : String(dateVal || '');

    var names = [];
    for (var r = 0; r < namesGrid.length; r++) {
      var val = namesGrid[r][col];
      if (val !== '' && val !== null && val !== undefined) {
        names.push(String(val));
      }
    }

    days.push({
      day: String(headers[col] || ''),
      date: dateStr,
      names: names
    });
  }

  return {
    days: days,
    generatedAt: Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm')
  };
}
function syncDataFast() {
  const destSS = SpreadsheetApp.getActiveSpreadsheet();

  // 1. CONFIGURATION: List your sources and destinations here
  const syncJobs = [
    {
      sourceId: "1siA7v8Ib3tWyI-GNUHr-baUK2o61qQtZVWxsHcZBShA", // Vacation
      sourceTab: "Vacation", 
      sourceRange: "A1:BQ", 
      destTab: "Vacation", 
      destRow: 1, 
      destCol: 1  // This puts it in Column A
    },
    {
      sourceId: "1siA7v8Ib3tWyI-GNUHr-baUK2o61qQtZVWxsHcZBShA", // Khafarat
      sourceTab: "Khafarat", 
      sourceRange: "A1:P", 
      destTab: "Khafarat", 
      destRow: 1, 
      destCol: 1 // This puts it in Column A
    },
    {
      sourceId: "1siA7v8Ib3tWyI-GNUHr-baUK2o61qQtZVWxsHcZBShA", // Khafarat
      sourceTab: "SickLeave", 
      sourceRange: "A1:BQ", 
      destTab: "SickLeave", 
      destRow: 1, 
      destCol: 1 // This puts it in Column A
    },
    {
      sourceId: "1siA7v8Ib3tWyI-GNUHr-baUK2o61qQtZVWxsHcZBShA", // Information Normal
      sourceTab: "Information", 
      sourceRange: "A1:Q", 
      destTab: "Information", 
      destRow: 1, 
      destCol: 1 // This puts it in Column A
    }

    
  ];

  // 2. EXECUTION: Loop through each job defined above
  syncJobs.forEach(function(job) {
    try {
      // Connect to Source
      const sourceSS = SpreadsheetApp.openById(job.sourceId);
      const sourceSheet = sourceSS.getSheetByName(job.sourceTab);
      const data = sourceSheet.getRange(job.sourceRange).getValues();

      // Connect to Destination
      const destSheet = destSS.getSheetByName(job.destTab);
      
      // Clear ONLY the area where data is about to be pasted
      // This prevents old data from staying behind if the new pull is smaller
      destSheet.getRange(job.destRow, job.destCol, destSheet.getLastRow() || 1, data[0].length).clearContent();

      // Paste the fresh data
      destSheet.getRange(job.destRow, job.destCol, data.length, data[0].length).setValues(data);
      
      console.log(`Success: ${job.sourceTab} synced to ${job.destTab}`);
      
    } catch (e) {
      console.log(`Error syncing ${job.sourceTab}: ${e.message}`);
    }
  });

  console.log("Global Sync Finished: " + new Date());
}