"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  QrCode,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  IndianRupee,
  ImageIcon,
  Smartphone,
  ArrowRight,
  Wallet,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { unlockService } from "@/http/services/unlock.service";
import { formatPriceNPR } from "@/lib/utils";
import type { CommissionSettings } from "@/types/unlock.types";

interface TopUpRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CommissionSettings | null;
  onSuccess?: () => void;
}

type Step = "info" | "amount" | "payment" | "success";

const MIN_TOPUP = 100;

export const TopUpRequestDialog: React.FC<TopUpRequestDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>("info");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const adminQrUrl = settings?.adminQrCodeUrl ?? null;
  const adminLabel = settings?.adminPaymentLabel ?? null;
  const serviceCharge = settings?.serviceCharge ?? 0;

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("info");
      setAmount("");
      setAmountError("");
      setScreenshot(null);
      setScreenshotPreview(null);
    }, 300);
  };

  const validateAmount = (val: string): boolean => {
    const num = Number(val);
    if (!val || isNaN(num)) {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (num < MIN_TOPUP) {
      setAmountError(`Minimum top-up amount is Rs. ${MIN_TOPUP}`);
      return false;
    }
    if (num > 100000) {
      setAmountError("Maximum top-up amount is Rs. 1,00,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleAmountNext = () => {
    if (validateAmount(amount)) setStep("payment");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    setSubmitting(true);
    try {
      // Use the direct upload method that sends file to the backend
      await unlockService.createTopUpWithScreenshot(Number(amount), screenshot);

      setStep("success");
      onSuccess?.();
      toast.success("Top-up request submitted!", {
        description: "Admin will review and credit your wallet shortly.",
        icon: "💰",
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogTitle className="sr-only">Add Money to Wallet</DialogTitle>

        <AnimatePresence mode="wait">
          {/* ── STEP: INFO ── */}
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-7 pb-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Add Money to Wallet
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    Pay manually & submit screenshot for approval
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* How it works */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    How it works
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        step: "1",
                        label: "Enter Amount",
                        desc: `Minimum Rs. ${MIN_TOPUP}`,
                        icon: IndianRupee,
                        color: "bg-blue-50 text-blue-500",
                      },
                      {
                        step: "2",
                        label: "Scan & Pay",
                        desc: "Use admin QR code to pay",
                        icon: QrCode,
                        color: "bg-purple-50 text-purple-500",
                      },
                      {
                        step: "3",
                        label: "Upload Screenshot",
                        desc: "Proof of payment",
                        icon: Upload,
                        color: "bg-orange-50 text-orange-500",
                      },
                      {
                        step: "4",
                        label: "Admin Approves",
                        desc: "Amount credited to wallet",
                        icon: CheckCircle,
                        color: "bg-emerald-50 text-emerald-500",
                      },
                    ].map(({ step: s, label, desc, icon: Icon, color }) => (
                      <div key={s} className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {label}
                          </p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-300">
                          Step {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {serviceCharge > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Tip:</span> Add at least
                      रू {formatPriceNPR(serviceCharge)} to unlock this room.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full rounded-xl py-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg transition-all"
                  onClick={() => setStep("amount")}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: AMOUNT ── */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Enter Amount
                </h2>
                <p className="text-slate-500 text-sm">
                  How much would you like to add?
                </p>
              </div>

              {/* Quick presets */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Quick Select
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000, 3000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(String(preset));
                        setAmountError("");
                      }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        amount === String(preset)
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      रू {formatPriceNPR(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Custom Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    रू
                  </span>
                  <Input
                    type="number"
                    placeholder={`Min. ${MIN_TOPUP}`}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (amountError) validateAmount(e.target.value);
                    }}
                    className={`pl-8 rounded-xl h-12 text-base font-semibold ${
                      amountError ? "border-red-300 focus:ring-red-200" : ""
                    }`}
                  />
                </div>
                {amountError && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {amountError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("info")}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleAmountNext}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                  disabled={!amount}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: PAYMENT ── */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Scan & Pay
                </h2>
                <p className="text-slate-500 text-sm">
                  Pay {formatPriceNPR(Number(amount))} using the QR code below
                </p>
              </div>

              {/* Amount chip */}
              <div className="flex items-center justify-center mb-5">
                <div className="px-6 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                  <p className="text-xs text-emerald-600 font-semibold text-center mb-0.5">
                    Amount to Pay
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 text-center">
                    {formatPriceNPR(Number(amount))}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              {adminQrUrl ? (
                <div className="flex flex-col items-center mb-5">
                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-md mb-2">
                    <img
                      src={adminQrUrl}
                      alt="Payment QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  {adminLabel && (
                    <div className="flex items-center gap-2 mt-1">
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-700">
                        {adminLabel}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center mb-5 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <QrCode className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 text-center">
                    QR code not set up yet. Please contact admin for payment
                    details.
                  </p>
                </div>
              )}

              <Separator className="mb-5" />

              {/* Screenshot upload */}
              <div className="mb-5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Upload Payment Screenshot *
                </Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 bg-slate-50">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      onClick={() => {
                        setScreenshot(null);
                        setScreenshotPreview(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 py-2 flex items-center justify-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-semibold text-white">
                        Screenshot uploaded
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-2 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 group-hover:text-emerald-600">
                      Tap to upload screenshot
                    </p>
                    <p className="text-xs text-slate-400">JPG, PNG up to 5MB</p>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("amount")}
                  disabled={submitting}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!screenshot || submitting}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, bounce: 0.5 }}
                className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Request Submitted!
              </h2>
              <p className="text-slate-500 text-sm mb-2 leading-relaxed">
                Your top-up request for{" "}
                <span className="font-semibold text-slate-700">
                  रू {formatPriceNPR(Number(amount))}
                </span>{" "}
                has been submitted.
              </p>
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-6">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Admin will review within 24 hours
                </p>
              </div>
              <Button
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                onClick={handleClose}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
