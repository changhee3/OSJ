const {setGlobalOptions} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue, Timestamp} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");
const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

initializeApp();
setGlobalOptions({maxInstances: 10, region: "asia-northeast3"});

const db = getFirestore();

/**
 * 알림 여부를 켜둔 회원에게 푸시 알림을 보내고,
 * notifications 시트에 발송 기록을 남긴다.
 */
async function sendNotificationToUsers(userDocs, content, eventRef) {
  const tokens = [];
  const batch = db.batch();

  for (const userDoc of userDocs) {
    if (!userDoc.exists) continue;
    const user = userDoc.data();

    if (user["알림 여부"] === false) continue;
    if (user["FCM 토큰"]) tokens.push(user["FCM 토큰"]);

    const notifRef = db.collection("notifications").doc();
    batch.set(notifRef, {
      "수신자": userDoc.ref,
      "내용": content,
      "발송일시": FieldValue.serverTimestamp(),
      "관련 일정": eventRef || null,
    });
  }

  await batch.commit();

  if (tokens.length > 0) {
    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {title: "클럽 일정 알림", body: content},
    });
  }
}

// 1. onEventCreated
exports.onEventCreated = onDocumentCreated("events/{eventId}", async (event) => {
  const snap = event.data;
  const eventData = snap.data();

  await snap.ref.update({"참가자 수": 0});

  const usersSnap = await db.collection("users").get();
  await sendNotificationToUsers(
      usersSnap.docs,
      `새 일정이 등록되었습니다: ${eventData["제목"]}`,
      snap.ref,
  );
});

// 2. onEventUpdated (수정 또는 삭제 시 참가자에게 알림)
exports.onEventUpdated = onDocumentWritten("events/{eventId}", async (event) => {
  const beforeSnap = event.data.before;
  const afterSnap = event.data.after;

  // 새로 생성된 경우는 onEventCreated에서 처리하므로 건너뜀
  if (!beforeSnap.exists) return;

  const eventRef = beforeSnap.ref;
  const title = beforeSnap.data()["제목"];
  const message = afterSnap.exists ?
      `일정이 변경되었습니다: ${title}` :
      `일정이 취소되었습니다: ${title}`;

  const participationsSnap = await db
      .collection("participations")
      .where("일정", "==", eventRef)
      .where("신청 상태", "==", "신청함")
      .get();

  if (participationsSnap.empty) return;

  const userRefs = participationsSnap.docs.map((doc) => doc.data()["회원"]);
  const userDocs = await Promise.all(userRefs.map((ref) => ref.get()));

  await sendNotificationToUsers(
      userDocs,
      message,
      afterSnap.exists ? eventRef : null,
  );
});

// 3. onParticipationCreated
exports.onParticipationCreated = onDocumentCreated(
    "participations/{participationId}",
    async (event) => {
      const data = event.data.data();
      const eventRef = data["일정"];
      await eventRef.update({"참가자 수": FieldValue.increment(1)});
    },
);

// 4. onParticipationCancelled
// 신청 상태가 "신청함" ↔ "취소함"으로 바뀔 때마다 참가자 수를 맞춘다.
// (취소 후 재신청하는 경우까지 처리하기 위해 양방향으로 본다.)
exports.onParticipationCancelled = onDocumentUpdated(
    "participations/{participationId}",
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();
      const eventRef = after["일정"];

      if (before["신청 상태"] !== "취소함" && after["신청 상태"] === "취소함") {
        await eventRef.update({"참가자 수": FieldValue.increment(-1)});
      } else if (before["신청 상태"] === "취소함" && after["신청 상태"] !== "취소함") {
        await eventRef.update({"참가자 수": FieldValue.increment(1)});
      }
    },
);

// 5. sendEventStartReminder
// 5분마다 실행하며, 각 회원이 "일정 알림 설정"에서 정한 "몇 분 전" 값에
// 도달한 참가자에게만 리마인더를 보낸다. (설정 예: 10분 전 / 30분 전 / 60분 전)
exports.sendEventStartReminder = onSchedule("every 5 minutes", async () => {
  const now = new Date();
  // 회원이 고를 수 있는 최댓값(60분)보다 넉넉하게 미래 구간의 일정만 가져온다.
  const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);

  const eventsSnap = await db
      .collection("events")
      .where("날짜", ">=", Timestamp.fromDate(now))
      .where("날짜", "<=", Timestamp.fromDate(windowEnd))
      .get();

  for (const eventDoc of eventsSnap.docs) {
    const eventRef = eventDoc.ref;
    const eventData = eventDoc.data();
    const eventDate = eventData["날짜"].toDate();
    const title = eventData["제목"];
    const minutesUntilStart = (eventDate.getTime() - now.getTime()) / 60000;

    const participationsSnap = await db
        .collection("participations")
        .where("일정", "==", eventRef)
        .where("신청 상태", "==", "신청함")
        .get();

    for (const participationDoc of participationsSnap.docs) {
      if (participationDoc.data()["리마인더 발송됨"]) continue;

      const userRef = participationDoc.data()["회원"];
      const userSnap = await userRef.get();
      if (!userSnap.exists) continue;

      const user = userSnap.data();
      if (user["알림 여부"] === false) continue;

      const remindMinutes = user["일정 알림 분전"] ?? 30;
      if (minutesUntilStart > remindMinutes) continue;

      await sendNotificationToUsers(
          [userSnap],
          `${remindMinutes}분 후 일정이 시작됩니다: ${title}`,
          eventRef,
      );
      await participationDoc.ref.update({"리마인더 발송됨": true});
    }
  }
});
