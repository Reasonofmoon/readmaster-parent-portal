var APP_CONFIG_KEY = "PARENT_REPORT_APP_CONFIG";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("READ MASTER 리포트")
    .addItem("대시보드 열기", "showSidebar")
    .addItem("빠른 시작 가이드", "showTutorialDialog")
    .addSeparator()
    .addItem("워크스페이스 초기화", "initializeWorkspace")
    .addItem("학부모 페이지 미리보기", "openLatestParentPortal")
    .addToUi();
}

function doGet(e) {
  var mode = safeString_(e && e.parameter && e.parameter.mode, "");
  if (mode === "health") {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        app: "readmaster-parent-report",
        portalUrl: getResolvedPortalBaseUrl_(getAppConfig_())
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (mode === "intake-guide") {
    return ContentService
      .createTextOutput(JSON.stringify(buildPublicGuidePayload_()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var token = safeString_(e && e.parameter && e.parameter.token, "");
  var reportData = getReportByToken_(token);
  if (reportData.found) {
    logParentPortalView_(token, reportData);
  }
  var template = HtmlService.createTemplateFromFile("ParentPortal");
  template.report = reportData;

  return template
    .evaluate()
    .setTitle(reportData.found ? reportData.studentName + " 학부모 리포트" : "READ MASTER 리포트")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var data = parseLeadSubmission_(e);
    var lead = createLeadFromSubmission_(data);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        leadId: lead.id,
        campusName: lead.campusName,
        intakeMode: lead.intakeMode
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("READ MASTER 리포트 대시보드")
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showTutorialDialog() {
  var html = HtmlService.createHtmlOutputFromFile("Tutorial")
    .setWidth(720)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, "READ MASTER 빠른 시작");
}

function initializeWorkspace() {
  ensureStudentsSheet_();
  ensureReportsSheet_();
  ensureLeadsSheet_();
  ensureLevelTestsSheet_();
  ensurePortalViewsSheet_();
  SpreadsheetApp.getActive().toast("READ MASTER 운영 시트와 샘플 데이터가 준비되었습니다.", "READ MASTER");
}

function getDashboardData() {
  var studentsSheet = ensureStudentsSheet_();
  var reportsSheet = ensureReportsSheet_();
  var leadsSheet = ensureLeadsSheet_();
  var levelTestsSheet = ensureLevelTestsSheet_();
  var portalViewsSheet = ensurePortalViewsSheet_();
  var studentValues = studentsSheet.getDataRange().getValues();
  var reportValues = reportsSheet.getDataRange().getValues();
  var leadValues = leadsSheet.getDataRange().getValues();
  var levelTestValues = levelTestsSheet.getDataRange().getValues();
  var portalViewValues = portalViewsSheet.getDataRange().getValues();
  var config = getAppConfig_();

  return {
    config: config,
    stats: buildStats_(studentValues, reportValues, leadValues, levelTestValues, portalViewValues),
    latestReports: getLatestReports_(reportValues),
    latestLeads: getLatestLeads_(leadValues),
    leadsBoard: getLeadsBoard_(leadValues),
    latestPortalViews: getLatestPortalViews_(portalViewValues),
    followUpQueue: getFollowUpQueue_(leadValues, reportValues, portalViewValues),
    callList: getCallList_(leadValues, reportValues, portalViewValues),
    ownerWorkboard: getOwnerWorkboard_(leadValues, reportValues, portalViewValues),
    tutorialSteps: getTutorialSteps_(),
    channelGuide: getChannelGuide_(config),
    resolvedPortalBaseUrl: getResolvedPortalBaseUrl_(config),
    funnelGuide: getFunnelGuide_(config),
    integrationGuide: getIntegrationGuide_(config)
  };
}

function saveAppConfig(input) {
  var current = getAppConfig_();
  var nextConfig = {
    brandName: safeString_(input.brandName, current.brandName),
    campusName: safeString_(input.campusName, current.campusName),
    schoolName: safeString_(input.schoolName, current.schoolName),
    senderName: safeString_(input.senderName, current.senderName),
    templateDocId: safeString_(input.templateDocId, current.templateDocId),
    reportFolderName: safeString_(input.reportFolderName, current.reportFolderName),
    parentPortalBaseUrl: safeString_(input.parentPortalBaseUrl, current.parentPortalBaseUrl),
    enableParentPortal: Boolean(input.enableParentPortal),
    enableEmailDelivery: Boolean(input.enableEmailDelivery),
    deliveryMode: safeString_(input.deliveryMode, current.deliveryMode),
    kakaoWebhookUrl: safeString_(input.kakaoWebhookUrl, current.kakaoWebhookUrl),
    kakaoWebhookToken: safeString_(input.kakaoWebhookToken, current.kakaoWebhookToken),
    kakaoTemplateCode: safeString_(input.kakaoTemplateCode, current.kakaoTemplateCode),
    kakaoSenderKey: safeString_(input.kakaoSenderKey, current.kakaoSenderKey),
    funnelEntryUrl: safeString_(input.funnelEntryUrl, current.funnelEntryUrl),
    bookingPageUrl: safeString_(input.bookingPageUrl, current.bookingPageUrl),
    curriculumPageUrl: safeString_(input.curriculumPageUrl, current.curriculumPageUrl)
  };

  PropertiesService.getScriptProperties().setProperty(APP_CONFIG_KEY, JSON.stringify(nextConfig));
  return nextConfig;
}

function createStudentReport(formData) {
  var payload = normalizeStudentPayload_(formData);
  return buildParentReport_(payload, getAppConfig_());
}

function createReportsFromSheet() {
  var sheet = ensureStudentsSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var results = [];

  for (var i = 1; i < values.length; i += 1) {
    var row = values[i];
    if (!isTruthy_(row[0])) {
      continue;
    }

    var payload = mapStudentRow_(headers, row);
    var result = buildParentReport_(payload, getAppConfig_());
    sheet.getRange(i + 1, 15).setValue(result.portalToken || "");
    sheet.getRange(i + 1, 16).setValue(result.portalUrl || "");
    sheet.getRange(i + 1, 17).setValue(result.deliveryStatus || "CREATED");
    sheet.getRange(i + 1, 18).setValue(result.docUrl || "");
    results.push(result);
  }

  return {
    count: results.length,
    reports: results
  };
}

function promoteLeadToStudent(input) {
  var studentsSheet = ensureStudentsSheet_();
  var leadsSheet = ensureLeadsSheet_();
  var config = getAppConfig_();
  var guardianName = safeString_(input.guardianName, "");
  var phone = safeString_(input.guardianPhone || input.phone, "");
  var studentName = safeString_(input.studentName, "");
  var campusName = safeString_(input.campusName, config.campusName);
  var className = safeString_(input.className, "레벨테스트 대기");
  var teacherName = safeString_(input.teacherName, "배정 예정");
  var grade = safeString_(input.grade, "");
  var note = safeString_(input.note, "");

  if (!guardianName || !studentName) {
    throw new Error("보호자 이름과 학생 이름은 필수입니다.");
  }

  studentsSheet.appendRow([
    true,
    studentName,
    guardianName,
    safeString_(input.guardianEmail || input.email, ""),
    phone,
    campusName,
    className,
    teacherName,
    "",
    "",
    "",
    "",
    grade ? "설명회/상담 후 레벨테스트 예정 (" + grade + ")" : "설명회/상담 후 레벨테스트 예정",
    note || "Leads 시트에서 전환된 학생",
    "",
    "",
    "PROMOTED_FROM_LEAD",
    ""
  ]);

  markLeadAsPromoted_(leadsSheet, guardianName, phone, studentName);

  return {
    studentName: studentName,
    guardianName: guardianName,
    campusName: campusName,
    className: className
  };
}

function updateLeadStatus(input) {
  var rowIndex = Number(input.rowIndex || 0);
  var nextStatus = normalizeLeadStatus_(safeString_(input.status, "NEW"));
  var note = safeString_(input.note, "");
  var bookedAt = safeString_(input.bookedAt, "");
  var nextAction = safeString_(input.nextAction, "");
  var owner = safeString_(input.owner, "");
  var sheet = ensureLeadsSheet_();

  if (!rowIndex || rowIndex < 2) {
    throw new Error("유효한 리드 행을 찾지 못했습니다.");
  }

  sheet.getRange(rowIndex, 8).setValue(nextStatus);

  if (nextStatus === "ENROLLED" || nextStatus === "PROMOTED") {
    sheet.getRange(rowIndex, 9).setValue("Y");
  }

  if (note) {
    var currentMemo = safeString_(sheet.getRange(rowIndex, 10).getValue(), "");
    var stampedNote = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd HH:mm") + " " + note;
    sheet.getRange(rowIndex, 10).setValue(currentMemo ? currentMemo + " | " + stampedNote : stampedNote);
  }

  if (bookedAt) {
    sheet.getRange(rowIndex, 11).setValue(bookedAt);
  }

  if (nextAction) {
    sheet.getRange(rowIndex, 12).setValue(nextAction);
  }

  if (owner) {
    sheet.getRange(rowIndex, 13).setValue(owner);
  }

  return {
    rowIndex: rowIndex,
    status: nextStatus
  };
}

function generateFollowUpDraft(input) {
  var rowIndex = Number(input.rowIndex || 0);
  var leadRow = getLeadRowByIndex_(rowIndex);
  var reportMatch = findReportForLead_(leadRow);
  var config = getAppConfig_();
  var status = normalizeLeadStatus_(leadRow[7]);
  var guardianName = safeString_(leadRow[1], "");
  var campusName = safeString_(leadRow[5], config.campusName);
  var session = safeString_(leadRow[4], "");
  var bookingUrl = safeString_(config.bookingPageUrl, "");
  var portalUrl = reportMatch ? safeString_(reportMatch.portalUrl, "") : "";
  var title = "후속 안내";
  var body = "";

  if (status === "REPORT_READY") {
    title = "리포트 확인 안내";
    body = [
      guardianName + "님 안녕하세요.",
      campusName + "입니다.",
      "자녀 학습 리포트가 준비되어 안내드립니다.",
      portalUrl ? "리포트 확인 링크: " + portalUrl : "리포트 링크는 원장님이 별도로 전달드립니다.",
      bookingUrl ? "상담 예약: " + bookingUrl : "",
      "확인 후 궁금한 점은 편하게 회신 주세요."
    ].filter(Boolean).join("\n");
  } else if (status === "TEST_BOOKED") {
    title = "레벨테스트 후속 안내";
    body = [
      guardianName + "님 안녕하세요.",
      campusName + "입니다.",
      "예약하신 레벨테스트 일정 확인차 연락드립니다.",
      session ? "현재 기록된 일정: " + session : "",
      bookingUrl ? "일정 변경/상담 예약: " + bookingUrl : "",
      "가능한 시간 회신 주시면 빠르게 도와드리겠습니다."
    ].filter(Boolean).join("\n");
  } else if (status === "CONTACTED") {
    title = "상담 후속 안내";
    body = [
      guardianName + "님 안녕하세요.",
      campusName + "입니다.",
      "지난 상담 후 후속 안내 드립니다.",
      bookingUrl ? "상담/테스트 일정 예약: " + bookingUrl : "",
      "원하시는 시간 알려주시면 바로 도와드리겠습니다."
    ].filter(Boolean).join("\n");
  } else {
    title = "설명회 후속 안내";
    body = [
      guardianName + "님 안녕하세요.",
      campusName + "입니다.",
      "설명회/문의 접수 확인되어 안내드립니다.",
      session ? "희망 일정: " + session : "",
      bookingUrl ? "상담 예약 링크: " + bookingUrl : "",
      "가능한 시간 확인 후 연락드리겠습니다."
    ].filter(Boolean).join("\n");
  }

  return {
    rowIndex: rowIndex,
    title: title,
    text: body
  };
}

function createReportsFromLevelTests() {
  var sheet = ensureLevelTestsSheet_();
  var values = sheet.getDataRange().getValues();
  var results = [];

  for (var i = 1; i < values.length; i += 1) {
    var row = values[i];
    if (!isTruthy_(row[0])) {
      continue;
    }

    var payload = normalizeStudentPayload_({
      studentName: row[1],
      guardianName: row[2],
      guardianEmail: row[3],
      guardianPhone: row[4],
      campusName: row[5],
      className: row[7],
      teacherName: row[8],
      overallScore: buildCompositeScore_(row[9], row[10], row[11]),
      attendanceRate: "",
      strengths: row[12],
      growthAreas: row[13],
      nextSteps: row[14],
      comment: row[15]
    });

    var result = buildParentReport_(payload, getAppConfig_());
    sheet.getRange(i + 1, 17).setValue(result.deliveryStatus || "CREATED");
    sheet.getRange(i + 1, 18).setValue(result.portalUrl || "");
    results.push(result);
  }

  return {
    count: results.length,
    reports: results
  };
}

function openLatestParentPortal() {
  var reportsSheet = ensureReportsSheet_();
  var values = reportsSheet.getDataRange().getValues();

  for (var i = values.length - 1; i > 0; i -= 1) {
    var portalUrl = values[i][12];
    if (portalUrl) {
      var html = HtmlService.createHtmlOutput(
        '<script>window.open("' + portalUrl + '","_blank");google.script.host.close();</script>'
      );
      SpreadsheetApp.getUi().showModelessDialog(html, "학부모 페이지 열기");
      return { opened: true, url: portalUrl };
    }
  }

  throw new Error("아직 생성된 학부모 링크가 없습니다. 먼저 리포트를 생성해 주세요.");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppConfig_() {
  var raw = PropertiesService.getScriptProperties().getProperty(APP_CONFIG_KEY);
  if (!raw) {
    return {
      brandName: "READ MASTER",
      campusName: "본원",
      schoolName: "READ MASTER",
      senderName: "READ MASTER 리포트봇",
      templateDocId: "",
      reportFolderName: "READ MASTER Parent Reports",
      parentPortalBaseUrl: "",
      enableParentPortal: true,
      enableEmailDelivery: false,
      deliveryMode: "link_only",
      kakaoWebhookUrl: "",
      kakaoWebhookToken: "",
      kakaoTemplateCode: "",
      kakaoSenderKey: "",
      funnelEntryUrl: "",
      bookingPageUrl: "",
      curriculumPageUrl: ""
    };
  }

  return JSON.parse(raw);
}

function buildStats_(studentValues, reportValues, leadValues, levelTestValues, portalViewValues) {
  var pendingCount = 0;
  var sentCount = 0;
  var leadCount = Math.max(leadValues.length - 1, 0);
  var levelTestCount = Math.max(levelTestValues.length - 1, 0);
  var portalViewCount = Math.max(portalViewValues.length - 1, 0);
  var followUpCount = getFollowUpQueue_(leadValues, reportValues, portalViewValues).length;

  for (var i = 1; i < studentValues.length; i += 1) {
    if (isTruthy_(studentValues[i][0])) {
      pendingCount += 1;
    }
  }

  for (var j = 1; j < reportValues.length; j += 1) {
    if (safeString_(reportValues[j][14], "") === "SENT") {
      sentCount += 1;
    }
  }

  return {
    studentRows: Math.max(studentValues.length - 1, 0),
    reportRows: Math.max(reportValues.length - 1, 0),
    leadRows: leadCount,
    levelTestRows: levelTestCount,
    portalViewRows: portalViewCount,
    followUpRows: followUpCount,
    pendingBatchRows: pendingCount,
    sentReports: sentCount
  };
}

function getLatestReports_(reportValues) {
  var items = [];

  for (var i = reportValues.length - 1; i > 0 && items.length < 5; i -= 1) {
    items.push({
      createdAt: reportValues[i][0],
      studentName: reportValues[i][1],
      guardianName: reportValues[i][2],
      guardianEmail: reportValues[i][3],
      docUrl: reportValues[i][9],
      portalUrl: reportValues[i][12],
      deliveryStatus: reportValues[i][14]
    });
  }

  return items;
}

function getLatestLeads_(leadValues) {
  var items = [];

  for (var i = leadValues.length - 1; i > 0 && items.length < 5; i -= 1) {
    items.push({
      createdAt: leadValues[i][0],
      guardianName: leadValues[i][1],
      phone: leadValues[i][2],
      grade: leadValues[i][3],
      session: leadValues[i][4],
      campusName: leadValues[i][5],
      status: leadValues[i][7],
      nextAction: leadValues[i][11],
      owner: leadValues[i][12]
    });
  }

  return items;
}

function getLeadsBoard_(leadValues) {
  var columns = {
    NEW: [],
    CONTACTED: [],
    TEST_BOOKED: [],
    REPORT_READY: [],
    ENROLLED: []
  };

  for (var i = leadValues.length - 1; i > 0; i -= 1) {
    var status = normalizeLeadStatus_(leadValues[i][7]);
    if (!columns[status]) {
      status = "NEW";
    }

    columns[status].push({
      rowIndex: i + 1,
      createdAt: leadValues[i][0],
      guardianName: leadValues[i][1],
      phone: leadValues[i][2],
      grade: leadValues[i][3],
      session: leadValues[i][4],
      campusName: leadValues[i][5],
      source: leadValues[i][6],
      status: status,
      converted: leadValues[i][8],
      memo: leadValues[i][9],
      bookedAt: leadValues[i][10],
      nextAction: leadValues[i][11],
      owner: leadValues[i][12]
    });
  }

  return columns;
}

function getLatestPortalViews_(portalViewValues) {
  var items = [];

  for (var i = portalViewValues.length - 1; i > 0 && items.length < 5; i -= 1) {
    items.push({
      viewedAt: portalViewValues[i][0],
      studentName: portalViewValues[i][1],
      guardianName: portalViewValues[i][2],
      campusName: portalViewValues[i][3],
      userAgent: portalViewValues[i][5]
    });
  }

  return items;
}

function getFollowUpQueue_(leadValues, reportValues, portalViewValues) {
  var items = [];
  var now = new Date().getTime();
  var reportIndex = {};
  var viewedTokens = {};

  for (var r = 1; r < reportValues.length; r += 1) {
    var key = buildLeadMatchKey_(reportValues[r][2], reportValues[r][4]);
    reportIndex[key] = {
      portalToken: safeString_(reportValues[r][11], ""),
      portalUrl: safeString_(reportValues[r][12], ""),
      deliveryStatus: safeString_(reportValues[r][14], ""),
      studentName: safeString_(reportValues[r][1], "")
    };
  }

  for (var v = 1; v < portalViewValues.length; v += 1) {
    var token = safeString_(portalViewValues[v][4], "");
    if (token) {
      viewedTokens[token] = true;
    }
  }

  for (var i = leadValues.length - 1; i > 0; i -= 1) {
    var row = leadValues[i];
    var status = normalizeLeadStatus_(row[7]);
    var createdAt = parseDateMaybe_(row[0]);
    var bookedAt = parseDateMaybe_(row[10]);
    var rowIndex = i + 1;
    var guardianName = safeString_(row[1], "");
    var phone = safeString_(row[2], "");
    var matchKey = buildLeadMatchKey_(guardianName, phone);
    var matchedReport = reportIndex[matchKey];

    if (status === "CONTACTED" && createdAt && now - createdAt.getTime() > 2 * 24 * 60 * 60 * 1000) {
      items.push(buildFollowUpItem_(rowIndex, row, "상담 후속 필요", "연락 완료 후 2일 이상 다음 액션이 없습니다."));
      continue;
    }

    if (status === "TEST_BOOKED" && bookedAt && bookedAt.getTime() < now) {
      items.push(buildFollowUpItem_(rowIndex, row, "테스트 후속 필요", "예약일이 지났습니다. 테스트 결과 입력 또는 상담 후속이 필요합니다."));
      continue;
    }

    if (status === "REPORT_READY" && matchedReport && matchedReport.portalToken && !viewedTokens[matchedReport.portalToken]) {
      items.push(buildFollowUpItem_(rowIndex, row, "리포트 미열람", "학부모 링크가 아직 열리지 않았습니다. 카카오/전화 후속이 필요합니다."));
      continue;
    }

    if (status === "NEW" && !safeString_(row[12], "")) {
      items.push(buildFollowUpItem_(rowIndex, row, "담당자 미지정", "신규 리드에 담당자가 지정되지 않았습니다."));
    }
  }

  return items.slice(0, 8);
}

function getCallList_(leadValues, reportValues, portalViewValues) {
  return getFollowUpQueue_(leadValues, reportValues, portalViewValues).map(function (item, index) {
    return {
      priority: index + 1,
      rowIndex: item.rowIndex,
      guardianName: item.guardianName,
      phone: item.phone,
      campusName: item.campusName,
      title: item.title,
      nextAction: item.nextAction,
      owner: item.owner
    };
  });
}

function getOwnerWorkboard_(leadValues, reportValues, portalViewValues) {
  var list = getCallList_(leadValues, reportValues, portalViewValues);
  var grouped = {};

  list.forEach(function (item) {
    var owner = safeString_(item.owner, "").trim() || "미지정";
    if (!grouped[owner]) {
      grouped[owner] = [];
    }
    grouped[owner].push(item);
  });

  return Object.keys(grouped).sort().map(function (owner) {
    return {
      owner: owner,
      count: grouped[owner].length,
      items: grouped[owner]
    };
  });
}

function buildFollowUpItem_(rowIndex, row, title, reason) {
  return {
    rowIndex: rowIndex,
    title: title,
    reason: reason,
    guardianName: safeString_(row[1], ""),
    phone: safeString_(row[2], ""),
    grade: safeString_(row[3], ""),
    session: safeString_(row[4], ""),
    campusName: safeString_(row[5], ""),
    status: normalizeLeadStatus_(row[7]),
    nextAction: safeString_(row[11], ""),
    owner: safeString_(row[12], "")
  };
}

function buildLeadMatchKey_(guardianName, phone) {
  return safeString_(guardianName, "").trim() + "|" + safeString_(phone, "").replace(/\D/g, "");
}

function findReportForLead_(leadRow) {
  var reportValues = ensureReportsSheet_().getDataRange().getValues();
  var key = buildLeadMatchKey_(leadRow[1], leadRow[2]);

  for (var i = reportValues.length - 1; i > 0; i -= 1) {
    if (buildLeadMatchKey_(reportValues[i][2], reportValues[i][4]) === key) {
      return {
        studentName: safeString_(reportValues[i][1], ""),
        portalToken: safeString_(reportValues[i][11], ""),
        portalUrl: safeString_(reportValues[i][12], ""),
        deliveryStatus: safeString_(reportValues[i][14], "")
      };
    }
  }

  return null;
}

function getLeadRowByIndex_(rowIndex) {
  var sheet = ensureLeadsSheet_();
  if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error("선택한 리드를 찾지 못했습니다.");
  }
  return sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function parseDateMaybe_(value) {
  if (value instanceof Date) {
    return value;
  }

  var text = safeString_(value, "");
  if (!text) {
    return null;
  }

  var normalized = text.replace(/\./g, "-").replace(" ", "T");
  var date = new Date(normalized);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function getTutorialSteps_() {
  return [
    {
      title: "1. 가맹점 설정 저장",
      body: "브랜드명, 캠퍼스명, 리포트 폴더, 학부모 확인 링크 URL을 먼저 저장합니다."
    },
    {
      title: "2. 학생 데이터 입력",
      body: "Students 시트에 학생명, 보호자 연락처, 교사 코멘트, 강점·보완점을 입력합니다."
    },
    {
      title: "3. 리포트 생성",
      body: "단건 생성 또는 시트 일괄 생성으로 Docs/PDF/학부모 링크를 한 번에 만듭니다."
    },
    {
      title: "4. 전달 채널 선택",
      body: "이메일, 링크 복사, 알림톡 공급사 webhook 연동 중 하나를 선택합니다."
    },
    {
      title: "5. 학부모 확인",
      body: "학부모는 링크를 받아 모바일에서 바로 리포트를 확인할 수 있습니다."
    },
    {
      title: "6. 설명회 퍼널 연동",
      body: "같은 웹앱 URL로 설명회 예약/상담 요청을 POST하면 Leads 시트에 자동 누적됩니다."
    },
    {
      title: "7. 리드 학생 전환",
      body: "설명회 리드가 상담으로 이어지면 대시보드에서 Students 시트 행으로 바로 전환할 수 있습니다."
    },
    {
      title: "8. CRM 보드 운영",
      body: "Leads 데이터를 상태별 보드로 보고, 연락 완료·테스트 예약·등록 완료 상태를 사이드바에서 바로 변경합니다."
    },
    {
      title: "9. 후속조치 큐 확인",
      body: "연락 후 방치된 리드, 테스트 예약일이 지난 리드, 리포트를 아직 안 본 학부모를 자동으로 찾아 개요 화면에 우선 표시합니다."
    },
    {
      title: "10. 담당자별 오늘 할 일",
      body: "원장, 실장, 강사별로 오늘 처리할 콜 리스트를 자동으로 묶어 보여주므로 담당자별 할 일을 빠르게 배분할 수 있습니다."
    }
  ];
}

function getChannelGuide_(config) {
  if (config.deliveryMode === "kakao_webhook") {
    return "카카오 자동 발송은 알림톡 공급사 webhook 연동이 필요합니다. 공급사 URL과 토큰을 설정해 주세요.";
  }

  if (config.deliveryMode === "email_and_link") {
    return "이메일과 링크를 함께 보냅니다. 보호자 이메일과 웹앱 URL이 모두 필요합니다.";
  }

  return "가장 빠른 운영 방식은 학부모 확인 링크를 생성해 카카오톡 채널, 상담톡, 문자에 붙여 전달하는 방식입니다.";
}

function getResolvedPortalBaseUrl_(config) {
  if (config.parentPortalBaseUrl) {
    return config.parentPortalBaseUrl;
  }

  try {
    return safeString_(ScriptApp.getService().getUrl(), "");
  } catch (error) {
    return "";
  }
}

function getFunnelGuide_(config) {
  return {
    funnelEntryUrl: safeString_(config.funnelEntryUrl, ""),
    bookingPageUrl: safeString_(config.bookingPageUrl, ""),
    curriculumPageUrl: safeString_(config.curriculumPageUrl, ""),
    note: "설명회 퍼널, 상담 예약, 커리큘럼 소개 페이지를 리포트 전달과 연결하면 설명회 → 테스트 → 리포트 → 등록 상담 퍼널을 한 흐름으로 운영할 수 있습니다."
  };
}

function getIntegrationGuide_(config) {
  var baseUrl = getResolvedPortalBaseUrl_(config);

  return {
    portalBaseUrl: baseUrl,
    intakePostUrl: baseUrl,
    intakeGuideUrl: baseUrl ? baseUrl + (baseUrl.indexOf("?") === -1 ? "?mode=intake-guide" : "&mode=intake-guide") : "",
    supportedFields: [
      "parentName 또는 guardianName",
      "phone",
      "grade",
      "session",
      "branch 또는 campusName",
      "source",
      "studentName",
      "email",
      "memo"
    ],
    note: "설명회 퍼널 페이지는 같은 웹앱 URL로 POST하면 됩니다. JSON body 또는 일반 폼 전송 둘 다 처리합니다."
  };
}

function buildPublicGuidePayload_() {
  var config = getAppConfig_();
  var baseUrl = getResolvedPortalBaseUrl_(config);

  return {
    status: "ok",
    app: "readmaster-parent-report",
    intakePostUrl: baseUrl,
    parentPortalBaseUrl: baseUrl,
    samplePayload: {
      parentName: "홍길동",
      phone: "010-1234-5678",
      grade: "초5",
      session: "설명회 3/28 11:00",
      branch: safeString_(config.campusName, "READ MASTER 대치점"),
      source: "설명회 퍼널",
      studentName: "홍서준",
      email: "parent@example.com",
      memo: "레벨테스트 희망"
    }
  };
}

function ensureStudentsSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("Students");
  var headers = [[
    "Generate",
    "Student Name",
    "Guardian Name",
    "Guardian Email",
    "Guardian Phone",
    "Campus Name",
    "Class Name",
    "Teacher Name",
    "Overall Score",
    "Attendance Rate",
    "Strengths",
    "Growth Areas",
    "Next Steps",
    "Comment",
    "Portal Token",
    "Portal URL",
    "Delivery Status",
    "Last Report URL"
  ]];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Students");
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 3, 18).setValues([
      headers[0],
      [
        true,
        "김하준",
        "김민서",
        "parent@example.com",
        "010-1234-5678",
        "READ MASTER 대치점",
        "초등 영어 심화 A",
        "박선영",
        91,
        96,
        "어휘 활용과 읽기 이해가 안정적입니다.",
        "말하기에서 문장 연결 표현을 더 보강하면 좋습니다.",
        "주 3회 쉐도잉 과제와 짧은 발표 훈련을 권장합니다.",
        "수업 집중도가 높고 과제 제출이 성실합니다.",
        "",
        "",
        "",
        ""
      ],
      [
        false,
        "이서윤",
        "이도윤",
        "guardian@example.com",
        "010-9876-1234",
        "READ MASTER 목동점",
        "초등 영어 기본 B",
        "정지후",
        84,
        88,
        "듣기 이해와 기본 문장 구조가 좋습니다.",
        "쓰기에서 철자 정확도가 더 필요합니다.",
        "주간 단어 테스트와 짧은 문장 쓰기를 추가해 주세요.",
        "수업 태도는 좋고 질문 참여가 활발합니다.",
        "",
        "",
        "",
        ""
      ],
      [
        true,
        "박지아",
        "박정훈",
        "mom3@example.com",
        "010-2222-3333",
        "READ MASTER 송도점",
        "중등 문해력 마스터 C",
        "최유리",
        93,
        100,
        "지문 구조 파악과 요약 능력이 뛰어납니다.",
        "고난도 비문학에서 배경지식 확장이 더 필요합니다.",
        "주 1회 심화 독해 노트 작성과 발표형 과제를 추천합니다.",
        "설명회 이후 등록 상담으로 이어질 수 있도록 심화반 안내가 적합합니다.",
        "",
        "",
        "",
        ""
      ]
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 18);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.join("|") !== headers[0].join("|")) {
      sheet.getRange(1, 1, 1, 18).setValues(headers);
    }
  }

  return sheet;
}

function ensureReportsSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("Reports");
  var headers = [[
    "Created At",
    "Student Name",
    "Guardian Name",
    "Guardian Email",
    "Guardian Phone",
    "Campus Name",
    "Class Name",
    "Teacher Name",
    "Overall Score",
    "Doc URL",
    "PDF URL",
    "Portal Token",
    "Portal URL",
    "Delivery Mode",
    "Delivery Status",
    "Last Sent At",
    "Notes"
  ]];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Reports");
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 17).setValues(headers);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 17);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.join("|") !== headers[0].join("|")) {
      sheet.getRange(1, 1, 1, 17).setValues(headers);
    }
  }

  return sheet;
}

function ensureLeadsSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("Leads");
  var headers = [[
    "Created At",
    "Guardian Name",
    "Phone",
    "Student Grade",
    "Preferred Session",
    "Campus Name",
    "Source",
    "Status",
    "Converted To Student",
    "Memo",
    "Booked At",
    "Next Action",
    "Owner"
  ]];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Leads");
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 3, 13).setValues([
      headers[0],
      [
        new Date(),
        "장수민",
        "010-3333-4444",
        "초5",
        "3/28(토) 11:00 설명회",
        "READ MASTER 대치점",
        "설명회 퍼널",
        "NEW",
        "N",
        "설명회 예약 리드",
        "",
        "설명회 참석 확인",
        "원장"
      ],
      [
        new Date(),
        "한서진",
        "010-5555-6666",
        "중1",
        "상담 예약 희망",
        "READ MASTER 목동점",
        "상담 예약 페이지",
        "CONTACTED",
        "N",
        "상담 후 레벨테스트 권유 예정",
        "2026-03-24 15:00",
        "레벨테스트 일정 확정",
        "실장"
      ]
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 13);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.join("|") !== headers[0].join("|")) {
      sheet.getRange(1, 1, 1, 13).setValues(headers);
    }
  }

  return sheet;
}

function ensureLevelTestsSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("LevelTests");
  var headers = [[
    "Generate Report",
    "Student Name",
    "Guardian Name",
    "Guardian Email",
    "Guardian Phone",
    "Campus Name",
    "Grade",
    "Recommended Class",
    "Teacher Name",
    "Reading Score",
    "Vocabulary Score",
    "Speaking Score",
    "Strengths",
    "Growth Areas",
    "Next Steps",
    "Teacher Comment",
    "Report Status",
    "Portal URL"
  ]];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("LevelTests");
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 3, 18).setValues([
      headers[0],
      [
        true,
        "윤서진",
        "윤지현",
        "lead-parent@example.com",
        "010-4444-5555",
        "READ MASTER 대치점",
        "초5",
        "초등 영어 심화 A",
        "박선영",
        92,
        88,
        81,
        "읽기 속도와 내용 파악이 안정적입니다.",
        "말하기 확장 표현과 어휘 정교화가 필요합니다.",
        "심화반 배정 후 주 3회 쉐도잉 과제를 권장합니다.",
        "설명회 이후 테스트 진행 학생으로 등록 상담 전환 가능성이 높습니다.",
        "",
        ""
      ],
      [
        false,
        "한도윤",
        "한서진",
        "lead2@example.com",
        "010-5555-6666",
        "READ MASTER 목동점",
        "중1",
        "중등 문해력 마스터 B",
        "최유리",
        86,
        84,
        79,
        "지문 핵심 문장 찾기가 좋습니다.",
        "서술형 요약 문장 구성 보완이 필요합니다.",
        "중등 문해력 반에서 비문학 요약 훈련을 병행합니다.",
        "상담 후 바로 배정 가능한 수준입니다.",
        "",
        ""
      ]
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 18);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.join("|") !== headers[0].join("|")) {
      sheet.getRange(1, 1, 1, 18).setValues(headers);
    }
  }

  return sheet;
}

function ensurePortalViewsSheet_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getSheetByName("PortalViews");
  var headers = [[
    "Viewed At",
    "Student Name",
    "Guardian Name",
    "Campus Name",
    "Portal Token",
    "User Agent"
  ]];

  if (!sheet) {
    sheet = spreadsheet.insertSheet("PortalViews");
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 6).setValues(headers);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 6);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.join("|") !== headers[0].join("|")) {
      sheet.getRange(1, 1, 1, 6).setValues(headers);
    }
  }

  return sheet;
}

function normalizeStudentPayload_(input) {
  return {
    studentName: safeString_(input.studentName, ""),
    guardianName: safeString_(input.guardianName, ""),
    guardianEmail: safeString_(input.guardianEmail, ""),
    guardianPhone: safeString_(input.guardianPhone, ""),
    campusName: safeString_(input.campusName, ""),
    className: safeString_(input.className, ""),
    teacherName: safeString_(input.teacherName, ""),
    overallScore: safeString_(input.overallScore, ""),
    attendanceRate: safeString_(input.attendanceRate, ""),
    strengths: safeString_(input.strengths, ""),
    growthAreas: safeString_(input.growthAreas, ""),
    nextSteps: safeString_(input.nextSteps, ""),
    comment: safeString_(input.comment, ""),
    portalToken: safeString_(input.portalToken, ""),
    portalUrl: safeString_(input.portalUrl, "")
  };
}

function mapStudentRow_(headers, row) {
  var data = {};
  for (var i = 0; i < headers.length; i += 1) {
    data[headers[i]] = row[i];
  }

  return normalizeStudentPayload_({
    studentName: data["Student Name"],
    guardianName: data["Guardian Name"],
    guardianEmail: data["Guardian Email"],
    guardianPhone: data["Guardian Phone"],
    campusName: data["Campus Name"],
    className: data["Class Name"],
    teacherName: data["Teacher Name"],
    overallScore: data["Overall Score"],
    attendanceRate: data["Attendance Rate"],
    strengths: data["Strengths"],
    growthAreas: data["Growth Areas"],
    nextSteps: data["Next Steps"],
    comment: data["Comment"],
    portalToken: data["Portal Token"],
    portalUrl: data["Portal URL"]
  });
}

function getReportByToken_(token) {
  if (!token) {
    return {
      found: false,
      title: "유효하지 않은 링크",
      message: "링크에 필요한 토큰이 없습니다."
    };
  }

  var sheet = ensureReportsSheet_();
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i += 1) {
    if (safeString_(values[i][11], "") === token) {
      return {
        found: true,
        title: values[i][1] + " 학부모 리포트",
        studentName: values[i][1],
        guardianName: values[i][2],
        campusName: values[i][5],
        className: values[i][6],
        teacherName: values[i][7],
        overallScore: values[i][8],
        docUrl: values[i][9],
        pdfUrl: values[i][10],
        deliveryStatus: values[i][14],
        createdAt: values[i][0],
        note: values[i][16],
        bookingPageUrl: getAppConfig_().bookingPageUrl,
        curriculumPageUrl: getAppConfig_().curriculumPageUrl
      };
    }
  }

  return {
    found: false,
    title: "리포트를 찾을 수 없습니다",
    message: "링크가 만료되었거나 잘못되었습니다."
  };
}

function logParentPortalView_(token, reportData) {
  var sheet = ensurePortalViewsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var last = sheet.getRange(lastRow, 1, 1, 6).getValues()[0];
    var lastToken = safeString_(last[4], "");
    var lastViewedAt = last[0];
    if (lastToken === token && lastViewedAt instanceof Date) {
      var diff = new Date().getTime() - lastViewedAt.getTime();
      if (diff < 60000) {
        return;
      }
    }
  }

  sheet.appendRow([
    new Date(),
    safeString_(reportData.studentName, ""),
    safeString_(reportData.guardianName, ""),
    safeString_(reportData.campusName, ""),
    token,
    ""
  ]);
}

function createLeadFromSubmission_(input) {
  var sheet = ensureLeadsSheet_();
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var campusName = safeString_(input.branch || input.campusName, getAppConfig_().campusName);
  var guardianName = safeString_(input.parentName || input.guardianName, "");
  var phone = safeString_(input.phone, "");
  var grade = safeString_(input.grade, "");
  var session = safeString_(input.session, "");
  var source = safeString_(input.source, "설명회 퍼널");
  var memoParts = [];
  var id = "lead-" + Utilities.getUuid().slice(0, 8);

  if (input.studentName) {
    memoParts.push("학생명: " + safeString_(input.studentName, ""));
  }
  if (input.email) {
    memoParts.push("이메일: " + safeString_(input.email, ""));
  }
  if (input.memo) {
    memoParts.push("메모: " + safeString_(input.memo, ""));
  }

  sheet.appendRow([
    now,
    guardianName,
    phone,
    grade,
    session,
    campusName,
    source,
    "NEW",
    "N",
    memoParts.length ? memoParts.join(" | ") : id,
    "",
    "1차 연락",
    "미지정"
  ]);

  return {
    id: id,
    campusName: campusName,
    intakeMode: safeString_(input._intakeMode, "json")
  };
}

function normalizeLeadStatus_(status) {
  var value = safeString_(status, "NEW").toUpperCase();

  if (value === "PROMOTED") {
    return "ENROLLED";
  }

  if (
    value === "NEW" ||
    value === "CONTACTED" ||
    value === "TEST_BOOKED" ||
    value === "REPORT_READY" ||
    value === "ENROLLED"
  ) {
    return value;
  }

  return "NEW";
}

function buildCompositeScore_(readingScore, vocabularyScore, speakingScore) {
  var values = [readingScore, vocabularyScore, speakingScore]
    .map(function (item) { return Number(item); })
    .filter(function (item) { return !isNaN(item) && item > 0; });

  if (!values.length) {
    return "";
  }

  var total = values.reduce(function (sum, value) { return sum + value; }, 0);
  return Math.round(total / values.length);
}

function markLeadAsPromoted_(sheet, guardianName, phone, studentName) {
  var values = sheet.getDataRange().getValues();

  for (var i = values.length - 1; i > 0; i -= 1) {
    var rowGuardian = safeString_(values[i][1], "");
    var rowPhone = safeString_(values[i][2], "");
    if (rowGuardian === guardianName && (!phone || rowPhone === phone)) {
      sheet.getRange(i + 1, 8).setValue("PROMOTED");
      sheet.getRange(i + 1, 9).setValue("Y");
      sheet.getRange(i + 1, 10).setValue("학생 전환: " + studentName);
      return;
    }
  }
}

function parseLeadSubmission_(e) {
  var raw = safeString_(e && e.postData && e.postData.contents, "");
  var params = (e && e.parameter) || {};

  if (raw) {
    try {
      var json = JSON.parse(raw);
      json._intakeMode = "json";
      return json;
    } catch (jsonError) {
      // noop, fallback to form fields below
    }
  }

  return {
    parentName: safeString_(params.parentName || params.guardianName, ""),
    guardianName: safeString_(params.guardianName || params.parentName, ""),
    phone: safeString_(params.phone, ""),
    grade: safeString_(params.grade, ""),
    session: safeString_(params.session, ""),
    branch: safeString_(params.branch || params.campusName, ""),
    campusName: safeString_(params.campusName || params.branch, ""),
    source: safeString_(params.source, "설명회 퍼널"),
    studentName: safeString_(params.studentName, ""),
    email: safeString_(params.email, ""),
    memo: safeString_(params.memo, ""),
    _intakeMode: "form"
  };
}

function safeString_(value, fallback) {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function isTruthy_(value) {
  return value === true || value === "TRUE" || value === "true" || value === 1;
}
