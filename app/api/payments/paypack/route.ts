import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      amount,
      phone,
      network,
      reference,
      user,
      invoiceId,
      levelId,
      levelTitle,
      levelSlug,
      paymentType,
      subscriptionId,
    } = await req.json();

    if (!amount || !phone) {
      return NextResponse.json({ success: false, message: "Amount and phone number are required" }, { status: 400 });
    }

    const authRes = await fetch(
      "https://payments.paypack.rw/api/auth/agents/authorize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.PAYPACK_CLIENT_ID,
          client_secret: process.env.PAYPACK_CLIENT_SECRET,
        }),
      },
    );

    const authData = await authRes.json();
    
    if (!authData.access) {
      return NextResponse.json({ success: false, message: "Failed to authenticate with Paypack" }, { status: 400 });
    }

    const access = authData.access;

    const payRes = await fetch(
      "https://payments.paypack.rw/api/transactions/cashin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
          "X-Webhook-Mode": process.env.NODE_ENV === "production" ? "production" : "development",
        },
        body: JSON.stringify({ 
          amount: Number(amount), 
          number: phone,
          client_id: user?.id,
          client_name: user?.name,
          client_email: user?.email,
          level_id: levelId,
          level_title: levelTitle,
          level_slug: levelSlug,
          invoice_id: invoiceId,
          subscription_id: subscriptionId,
          payment_type: paymentType,
          reference: reference,
        }),
      },
    );

    const payData = await payRes.json();

    if (payData.ref) {
      return NextResponse.json({
        success: true,
        ref: payData.ref,
        status: payData.status,
        message: "Payment initiated. Check your phone for STK push.",
      });
    }

    return NextResponse.json({ success: false, message: payData.message || "Payment failed to initiate" }, { status: 400 });
  } catch (error) {
    console.error("Paypack payment error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}