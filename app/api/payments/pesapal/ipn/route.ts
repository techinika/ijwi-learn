import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getAdminDb } from "@/db/firebaseAdmin";

export async function POST(req: Request) {
  const adminDb = getAdminDb();
  try {
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = await req.json();

    console.log(`[PESAPAL IPN] Received: Type=${OrderNotificationType}, Ref=${OrderMerchantReference}, TrackingId=${OrderTrackingId}`);

    if (OrderNotificationType !== "IPNCHANGE" && OrderNotificationType !== "RECURRING") {
      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }

    const authRes = await fetch(
      `${process.env.PESAPAL_URL}/api/Auth/RequestToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumer_key: process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        }),
      },
    );
    const { token } = await authRes.json();

    const statusRes = await fetch(
      `${process.env.PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const statusData = await statusRes.json();

    console.log(`[PESAPAL IPN] Transaction Status:`, statusData);

    let txQuery = await adminDb
      .collection("transactions")
      .where("ref", "==", OrderMerchantReference)
      .limit(1)
      .get();

    if (txQuery.empty) {
      txQuery = await adminDb
        .collection("transactions")
        .where("pesapal_tracking_id", "==", OrderTrackingId)
        .limit(1)
        .get();
    }

    if (txQuery.empty) {
      console.log(`[PESAPAL IPN] Transaction not found for ${OrderMerchantReference}`);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const txDoc = txQuery.docs[0];
    const txData = txDoc.data();

    if (txData.status === "successful" || txData.status === "success") {
      console.log(`[PESAPAL IPN] Transaction ${OrderMerchantReference} already processed`);
      return NextResponse.json({ status: 200, message: "Already processed" });
    }

    if (statusData.payment_status_description === "Completed") {
      const batch = adminDb.batch();

      batch.update(txDoc.ref, {
        status: "successful",
        pesapal_tracking_id: OrderTrackingId,
        payment_method: statusData.payment_method || "card",
        successfulAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmation_code: statusData.confirmation_code,
      });

      const levelId = txData.levelId;
      const userId = txData.userId || txData.buyerId;
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
                transactionId: OrderMerchantReference,
                paymentMethod: "card",
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

          console.log(`[PESAPAL IPN] Subscription activated for user ${userId}, level ${levelId}`);
        } else {
          if (invoiceId) {
            const invoiceRef = adminDb.collection("invoices").doc(invoiceId);
            const invoiceDoc = await invoiceRef.get();
            if (invoiceDoc.exists) {
              batch.update(invoiceRef, {
                status: "paid",
                paidAt: admin.firestore.Timestamp.fromDate(new Date()),
                transactionId: OrderMerchantReference,
                paymentMethod: "card",
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

          console.log(`[PESAPAL IPN] Level ${levelId} unlocked for user ${userId}`);
        }
      }

      await batch.commit();

      console.log(`[PESAPAL IPN] Payment successful for ${OrderMerchantReference}`);
      
      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    } else {
      await txDoc.ref.update({
        status: "failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        orderNotificationType: OrderNotificationType,
        orderTrackingId: OrderTrackingId,
        orderMerchantReference: OrderMerchantReference,
        status: 200,
      });
    }
  } catch (error: any) {
    console.error("[PESAPAL IPN] Error:", error.message);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}