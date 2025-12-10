import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const emailQueueCollection = collection(db, "emailQueue");

export const emailQueueService = {
  async queueNoticeEmail(params: {
    ownerId: string;
    tenantId: string;
    noticeId: string;
    to: string;
    subject: string;
    bodyText: string;
  }) {
    const { ownerId, tenantId, noticeId, to, subject, bodyText } = params;
    await addDoc(emailQueueCollection, {
      ownerId,
      tenantId,
      noticeId,
      to,
      subject,
      bodyText,
      status: "pending",
      createdAt: new Date(),
    });
  },
};
