"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";

const PaymentModal = dynamic(() => import("@/components/PaymentModal"), { ssr: false });
import { Invoice, Subscription } from "@/lib/database";
import { formatCurrency } from "@/lib/payment";

export default function ProfilePage() {
  const { user, userData, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userData?.displayName || "");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<{
    id: string;
    slug: string;
    title: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user?.uid]);

  const loadData = async () => {
    try {
      const [invoicesRes, subsRes] = await Promise.all([
        fetch("/api/profile/invoices"),
        fetch("/api/profile/subscriptions"),
      ]);
      const invoicesData = await invoicesRes.json();
      const subsData = await subsRes.json();
      if (invoicesData.success) setInvoices(invoicesData.invoices);
      if (subsData.success) setSubscriptions(subsData.subscriptions);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateUserProfile({ displayName: name });
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.status === "unpaid" || invoice.status === "overdue") {
      setPaymentInvoice({
        id: invoice.id,
        slug: invoice.levelSlug,
        title: invoice.levelTitle,
        price: invoice.amount,
      });
      setShowPaymentModal(true);
    }
  };

  const handleSubscriptionAction = async (
    subscriptionId: string,
    action: "cancel" | "resume",
  ) => {
    try {
      await fetch(`/api/profile/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to update subscription:", error);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/profile/invoices/${invoice.id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download invoice:", error);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "recently";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-emerald-100 text-emerald-700",
      unpaid: "bg-amber-100 text-amber-700",
      overdue: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-blue-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Account Information
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <User size={32} />
              </div>
              {editing ? (
                <div className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name"
                  />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">
                    {userData?.displayName}
                  </p>
                  <p className="text-sm text-gray-500">Learner</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-gray-600">
              <Mail size={20} />
              <span>{user?.email}</span>
            </div>

            {userData?.phone && (
              <div className="flex items-center gap-4 text-gray-600">
                <Phone size={20} />
                <span>{userData.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-gray-600">
              <Calendar size={20} />
              <span>
                Joined{" "}
                {userData?.createdAt
                  ? "on " + formatDate(userData.createdAt)
                  : "recently"}
              </span>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(userData?.displayName || "");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Active Subscriptions
            </h2>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active subscriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {sub.levelTitle}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sub.status === "active"
                          ? `Renews on ${formatDate(sub.nextBillingDate)}`
                          : `Ended on ${formatDate(sub.endDate)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(sub.levelPrice, "RWF")}/mo
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sub.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>
                  {sub.status === "active" && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                      <button
                        onClick={() =>
                          handleSubscriptionAction(sub.id, "cancel")
                        }
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Invoice History
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Level</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4">
                        <button
                          onClick={() => handleInvoiceClick(invoice)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-4 text-gray-600">
                        {formatDate(invoice.createdAt || new Date())}
                      </td>
                      <td className="py-4 text-gray-600">
                        {invoice.levelTitle}
                      </td>
                      <td className="py-4 font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-4">
                        <span className={getStatusBadge(invoice.status)}>
                          {invoice.status === "paid" && (
                            <CheckCircle size={12} className="inline mr-1" />
                          )}
                          {invoice.status === "unpaid" && (
                            <AlertCircle size={12} className="inline mr-1" />
                          )}
                          {invoice.status === "overdue" && (
                            <X size={12} className="inline mr-1" />
                          )}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => downloadInvoice(invoice)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </main>

      {showPaymentModal && paymentInvoice && user && userData && (
        <PaymentModal
          level={paymentInvoice}
          invoiceId={paymentInvoice.id}
          user={{
            uid: user.uid,
            email: user.email || "",
            displayName: userData.displayName || "",
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInvoice(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentInvoice(null);
            loadData();
          }}
          isSubscription={true}
          billingDate={
            selectedInvoice
              ? formatDate(selectedInvoice.billingPeriodEnd)
              : undefined
          }
        />
      )}
    </div>
  );
}
