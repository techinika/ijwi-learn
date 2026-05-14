import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const {
      amount,
      currency,
      description,
      callbackUrl,
      reference,
      user: userData,
      invoiceId,
      levelId,
      levelTitle,
      levelSlug,
      paymentType,
      account_number,
      subscription_details,
    } = body;

    const email = userData?.email || user?.email || "";
    const nameParts = (userData?.name || user?.displayName || "Customer IJWI-LEARN").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "IJWI-LEARN";

    const authRes = await fetch(
      `${process.env.PESAPAL_URL}/api/Auth/RequestToken`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          consumer_key: process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        }),
      },
    );
    const { token } = await authRes.json();

    if (!token) {
      return NextResponse.json({ success: false, message: "Failed to get auth token" }, { status: 400 });
    }

    const merchantRef = reference || `IJWI-${Date.now()}`;

    const payload: Record<string, unknown> = {
      id: merchantRef,
      currency: currency || "RWF",
      amount: Number(amount),
      description: description || "IJWI-LEARN Payment",
      callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
      notification_id: process.env.PESAPAL_IPN_ID,
      billing_address: {
        email_address: email,
        phone_number: "",
        country_code: "RW",
        first_name: firstName,
        middle_name: "",
        last_name: lastName,
        line_1: "IJWI-LEARN",
        line_2: "",
        city: "Kigali",
        state: "",
        postal_code: "",
        zip_code: "",
      },
    };

    if (account_number) {
      payload.account_number = account_number;
    }

    if (subscription_details && paymentType === 'subscription') {
      payload.subscription_details = subscription_details;
    }

    const payRes = await fetch(
      `${process.env.PESAPAL_URL}/api/Transactions/SubmitOrderRequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const payData = await payRes.json();

    if (payData.redirect_url) {
      return NextResponse.json({
        success: true,
        paymentUrl: payData.redirect_url,
        merchant_reference: merchantRef,
        orderTrackingId: payData.order_tracking_id,
      });
    }

    return NextResponse.json({ success: false, message: payData.error?.message || "Failed to initiate payment" }, { status: 400 });
  } catch (error) {
    console.error("Pesapal payment error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}