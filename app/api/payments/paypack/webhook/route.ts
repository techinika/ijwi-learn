import { NextResponse } from "next/server";
import crypto from "crypto";
import admin from "firebase-admin";
import { getAdminDb } from "@/db/firebaseAdmin";

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(req: Request) {
  const adminDb = getAdminDb();
  const body = await req.text();
  
  const signature = req.headers.get("x-paypack-signature");
  const secret = process.env.PAYPACK_WEBHOOK_SECRET!;

  if (signature && secret) {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      console.log("[PAYPACK WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);
  const { ref, status, client } = payload.data || payload;

  console.log(`[PAYPACK WEBHOOK] Received: ref=${ref}, status=${status}`);

  const txQuery = await adminDb
    .collection("transactions")
    .where("ref", "==", ref)
    .limit(1)
    .get();

  if (txQuery.empty) {
    console.log(`[PAYPACK WEBHOOK] Transaction ${ref} not found`);
    return NextResponse.json({ error: "Tx not found" }, { status: 404 });
  }

  const txDoc = txQuery.docs[0];
  const txData = txDoc.data();

  if (txData.status === "successful" || txData.status === "pending") {
    console.log(`[PAYPACK WEBHOOK] Transaction ${ref} already processed or pending`);
    return NextResponse.json({ received: true, note: "Already processed or pending" });
  }

  if (status === "successful") {
    const now = new Date();
    const batch = adminDb.batch();

    batch.update(txDoc.ref, {
      status: "successful",
      successfulAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const levelId = txData.levelId;
    const userId = txData.userId || txData.clientId;
    const paymentType = txData.paymentType || "one_time";
    const invoiceId = txData.invoiceId;
    const subscriptionId = txData.subscriptionId;

    if (levelId && userId) {
      if (paymentType === "subscription") {
        const now = new Date();
        const nextBilling = new Date(now);
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        let subRef;
        if (subscriptionId) {
          subRef = adminDb.collection("subscriptions").doc(subscriptionId);
          batch.update(subRef, {
            status: "active",
            nextBillingDate: admin.firestore.Timestamp.fromDate(nextBilling),
            reminderSent: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          subRef = adminDb.collection("subscriptions").doc();
          const userDoc = await adminDb.collection("users").doc(userId).get();
          const userData = userDoc.data();

          batch.set(subRef, {
            id: subRef.id,
            userId: userId,
            userEmail: txData.userEmail || userData?.email || "",
            userName: txData.userName || userData?.displayName || "",
            levelId: levelId,
            levelTitle: txData.levelTitle || "",
            levelSlug: txData.levelSlug || "",
            levelPrice: Number(txData.amount) || 0,
            status: "active",
            startDate: admin.firestore.Timestamp.fromDate(now),
            endDate: admin.firestore.Timestamp.fromDate(nextBilling),
            nextBillingDate: admin.firestore.Timestamp.fromDate(nextBilling),
            reminderSent: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (invoiceId) {
          const invoiceRef = adminDb.collection("invoices").doc(invoiceId);
          const invoiceDoc = await invoiceRef.get();
          if (invoiceDoc.exists) {
            batch.update(invoiceRef, {
              status: "paid",
              paidAt: admin.firestore.Timestamp.fromDate(now),
              transactionId: ref,
              paymentMethod: "momo",
              subscriptionId: subRef.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        const userRef = adminDb.collection("users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const purchasedLevels = userData?.purchasedLevels || [];
        if (!purchasedLevels.includes(levelId)) {
          batch.update(userRef, {
            purchasedLevels: admin.firestore.FieldValue.arrayUnion(levelId),
          });
        }

        console.log(`[PAYPACK WEBHOOK] Subscription activated for user ${userId}, level ${levelId}`);
      } else {
        if (invoiceId) {
          const invoiceRef = adminDb.collection("invoices").doc(invoiceId);
          const invoiceDoc = await invoiceRef.get();
          if (invoiceDoc.exists) {
            batch.update(invoiceRef, {
              status: "paid",
              paidAt: admin.firestore.Timestamp.fromDate(now),
              transactionId: ref,
              paymentMethod: "momo",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        const userRef = adminDb.collection("users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const purchasedLevels = userData?.purchasedLevels || [];
        if (!purchasedLevels.includes(levelId)) {
          batch.update(userRef, {
            purchasedLevels: admin.firestore.FieldValue.arrayUnion(levelId),
          });
        }

        console.log(`[PAYPACK WEBHOOK] Level ${levelId} unlocked for user ${userId}`);
      }
    }

    await batch.commit();

    console.log(`[PAYPACK WEBHOOK] Payment successful for ${ref}`);
    return NextResponse.json({ received: true });
  }

  if (status === "failed") {
    await txDoc.ref.update({ status: "failed" });
  }

  return NextResponse.json({ received: true });
}