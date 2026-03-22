function buildParentReport_(payload, config) {
  validatePayload_(payload);

  var folder = ensureReportFolder_(config.reportFolderName);
  var reportDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var fileName = reportDate + " " + payload.studentName + " 학부모 리포트";
  var docId = config.templateDocId
    ? DriveApp.getFileById(config.templateDocId).makeCopy(fileName, folder).getId()
    : DocumentApp.create(fileName).getId();

  if (!config.templateDocId) {
    DriveApp.getFileById(docId).moveTo(folder);
  }

  var doc = DocumentApp.openById(docId);
  renderReportDocument_(doc, payload, config, reportDate);
  doc.saveAndClose();

  var file = DriveApp.getFileById(docId);
  var docUrl = doc.getUrl();
  var pdfBlob = file.getAs(MimeType.PDF).setName(fileName + ".pdf");
  var pdfFile = folder.createFile(pdfBlob);
  var portalToken = payload.portalToken || generatePortalToken_();
  var portalUrl = buildParentPortalUrl_(portalToken, config);
  var deliveryResult = dispatchDelivery_(payload, config, {
    fileName: fileName,
    pdfBlob: pdfBlob,
    docUrl: docUrl,
    pdfUrl: pdfFile.getUrl(),
    portalToken: portalToken,
    portalUrl: portalUrl
  });

  appendReportLog_(payload, {
    docUrl: docUrl,
    pdfUrl: pdfFile.getUrl(),
    portalToken: portalToken,
    portalUrl: portalUrl,
    deliveryMode: config.deliveryMode,
    deliveryStatus: deliveryResult.status,
    sentAt: deliveryResult.sentAt,
    note: deliveryResult.note
  });

  return {
    studentName: payload.studentName,
    guardianEmail: payload.guardianEmail,
    docUrl: docUrl,
    pdfUrl: pdfFile.getUrl(),
    portalToken: portalToken,
    portalUrl: portalUrl,
    deliveryStatus: deliveryResult.status,
    deliveryNote: deliveryResult.note
  };
}

function renderReportDocument_(doc, payload, config, reportDate) {
  var body = doc.getBody();
  var replacements = {
    "{{brand_name}}": config.brandName,
    "{{campus_name}}": payload.campusName || config.campusName,
    "{{school_name}}": config.schoolName,
    "{{student_name}}": payload.studentName,
    "{{guardian_name}}": payload.guardianName,
    "{{class_name}}": payload.className,
    "{{teacher_name}}": payload.teacherName,
    "{{overall_score}}": payload.overallScore,
    "{{attendance_rate}}": payload.attendanceRate,
    "{{strengths}}": payload.strengths,
    "{{growth_areas}}": payload.growthAreas,
    "{{next_steps}}": payload.nextSteps,
    "{{comment}}": payload.comment,
    "{{report_date}}": reportDate
  };

  if (body.getText().indexOf("{{student_name}}") !== -1) {
    for (var key in replacements) {
      body.replaceText(key, replacements[key]);
    }
    return;
  }

  body.clear();
  body.appendParagraph(config.brandName + " 학습 리포트").setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph("캠퍼스: " + (payload.campusName || config.campusName));
  body.appendParagraph("작성일: " + reportDate);
  body.appendParagraph("학생명: " + payload.studentName);
  body.appendParagraph("보호자명: " + payload.guardianName);
  body.appendParagraph("반: " + payload.className);
  body.appendParagraph("담당교사: " + payload.teacherName);
  body.appendParagraph("");

  body.appendParagraph("이번 달 한눈에 보기").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    payload.studentName +
      " 학생은 " +
      payload.className +
      " 과정에서 종합 점수 " +
      payload.overallScore +
      "점, 출석률 " +
      payload.attendanceRate +
      "%를 기록했습니다."
  );

  body.appendParagraph("강점").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(payload.strengths);

  body.appendParagraph("보완 포인트").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(payload.growthAreas);

  body.appendParagraph("다음 학습 제안").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(payload.nextSteps);

  body.appendParagraph("원장/담당교사 코멘트").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(payload.comment);
}

function appendReportLog_(payload, output) {
  var sheet = ensureReportsSheet_();
  sheet.appendRow([
    new Date(),
    payload.studentName,
    payload.guardianName,
    payload.guardianEmail,
    payload.guardianPhone,
    payload.campusName,
    payload.className,
    payload.teacherName,
    payload.overallScore,
    output.docUrl,
    output.pdfUrl,
    output.portalToken,
    output.portalUrl,
    output.deliveryMode,
    output.deliveryStatus,
    output.sentAt,
    output.note
  ]);
}

function ensureReportFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function buildEmailBody_(payload, config, deliveryPayload) {
  return [
    payload.guardianName + "님 안녕하세요.",
    "",
    config.brandName + " " + (payload.campusName || config.campusName) + "에서 " +
      payload.studentName + " 학생의 학부모 리포트를 보내드립니다.",
    "",
    "학부모 확인 링크",
    deliveryPayload.portalUrl || "설정되지 않음",
    "",
    "첨부된 PDF 또는 링크를 확인해 주세요.",
    "",
    "감사합니다.",
    config.senderName
  ].join("\n");
}

function dispatchDelivery_(payload, config, deliveryPayload) {
  var sentAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  if (config.deliveryMode === "email" || config.deliveryMode === "email_and_link") {
    if (!config.enableEmailDelivery || !payload.guardianEmail) {
      return {
        status: "READY_LINK",
        sentAt: "",
        note: "이메일 발송 조건이 충족되지 않아 링크 전달 대기 상태로 저장했습니다."
      };
    }

    GmailApp.sendEmail(
      payload.guardianEmail,
      config.brandName + " 학부모 리포트: " + payload.studentName,
      buildEmailBody_(payload, config, deliveryPayload),
      {
        name: config.senderName,
        attachments: [deliveryPayload.pdfBlob]
      }
    );

    return {
      status: config.deliveryMode === "email_and_link" ? "SENT_EMAIL_LINK" : "SENT_EMAIL",
      sentAt: sentAt,
      note: "이메일 발송을 완료했습니다."
    };
  }

  if (config.deliveryMode === "kakao_webhook") {
    return sendKakaoWebhook_(payload, config, deliveryPayload, sentAt);
  }

  return {
    status: "READY_LINK",
    sentAt: "",
    note: "학부모 확인 링크를 복사해 카카오톡 채널, 알림톡, 문자로 전달해 주세요."
  };
}

function sendKakaoWebhook_(payload, config, deliveryPayload, sentAt) {
  if (!config.kakaoWebhookUrl) {
    return {
      status: "KAKAO_PENDING",
      sentAt: "",
      note: "카카오 webhook URL이 없어 링크 생성만 완료했습니다."
    };
  }

  var body = buildKakaoPayload_(payload, config, deliveryPayload);

  var headers = {
    "Content-Type": "application/json"
  };

  if (config.kakaoWebhookToken) {
    headers.Authorization = "Bearer " + config.kakaoWebhookToken;
  }

  try {
    var response = UrlFetchApp.fetch(config.kakaoWebhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: headers,
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return {
        status: "SENT_KAKAO",
        sentAt: sentAt,
        note: "카카오 webhook 호출이 성공했습니다."
      };
    }

    return {
      status: "KAKAO_FAILED",
      sentAt: "",
      note: "카카오 webhook 응답 코드: " + code
    };
  } catch (error) {
    return {
      status: "KAKAO_FAILED",
      sentAt: "",
      note: "카카오 webhook 오류: " + error.message
    };
  }
}

function buildKakaoPayload_(payload, config, deliveryPayload) {
  var campusName = payload.campusName || config.campusName;
  var portalUrl = deliveryPayload.portalUrl || "";
  var bookingUrl = config.bookingPageUrl || "";
  var buttons = [];

  if (portalUrl) {
    buttons.push({
      type: "WL",
      name: "리포트 확인",
      url_mobile: portalUrl,
      url_pc: portalUrl
    });
  }

  if (bookingUrl) {
    buttons.push({
      type: "WL",
      name: "상담 예약",
      url_mobile: bookingUrl,
      url_pc: bookingUrl
    });
  }

  return {
    vendor: "readmaster-parent-report",
    senderKey: config.kakaoSenderKey,
    templateCode: config.kakaoTemplateCode,
    brandName: config.brandName,
    campusName: campusName,
    guardian: {
      name: payload.guardianName,
      phone: payload.guardianPhone,
      email: payload.guardianEmail
    },
    student: {
      name: payload.studentName,
      className: payload.className,
      teacherName: payload.teacherName,
      overallScore: payload.overallScore,
      attendanceRate: payload.attendanceRate
    },
    report: {
      docUrl: deliveryPayload.docUrl,
      pdfUrl: deliveryPayload.pdfUrl,
      portalUrl: portalUrl,
      portalToken: deliveryPayload.portalToken
    },
    buttons: buttons,
    fallbackText: [
      "[READ MASTER 학부모 리포트]",
      payload.guardianName + "님, " + payload.studentName + " 학생 리포트가 준비되었습니다.",
      "캠퍼스: " + campusName,
      "반: " + payload.className,
      portalUrl ? "리포트 확인: " + portalUrl : "링크는 원장에게 문의해 주세요."
    ].join("\n"),
    meta: {
      source: "parent_report_gas",
      funnelEntryUrl: config.funnelEntryUrl,
      bookingPageUrl: config.bookingPageUrl,
      curriculumPageUrl: config.curriculumPageUrl
    }
  };
}

function buildParentPortalUrl_(token, config) {
  if (!config.enableParentPortal) {
    return "";
  }

  var baseUrl = safeString_(config.parentPortalBaseUrl, "");
  if (!baseUrl) {
    try {
      baseUrl = safeString_(ScriptApp.getService().getUrl(), "");
    } catch (error) {
      baseUrl = "";
    }
  }

  if (!baseUrl) {
    return "";
  }

  return baseUrl + (baseUrl.indexOf("?") === -1 ? "?token=" : "&token=") + encodeURIComponent(token);
}

function generatePortalToken_() {
  return Utilities.getUuid().replace(/-/g, "");
}

function validatePayload_(payload) {
  if (!payload.studentName) {
    throw new Error("학생 이름은 필수입니다.");
  }
  if (!payload.className) {
    throw new Error("반 이름은 필수입니다.");
  }
  if (!payload.teacherName) {
    throw new Error("교사 이름은 필수입니다.");
  }
  if (!payload.guardianName) {
    throw new Error("보호자 이름은 필수입니다.");
  }
}
