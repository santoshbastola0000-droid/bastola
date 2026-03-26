"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Wallet,
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  User,
  ArrowRight,
  Loader2,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { unlockService } from "@/http/services/unlock.service";
import { formatPriceNPR } from "@/lib/utils";
import { RoomUnlockDialogProps } from "@/types/room.types";

type Step = "info" | "topup_needed" | "confirm" | "success";

export const RoomUnlockDialog: React.FC<RoomUnlockDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  roomTitle,
  unlockStatus,
  isAuthenticated,
  onUnlocked,
  onRequestTopUp,
}) => {
  const [step, setStep] = useState<Step>("info");
  const [unlocking, setUnlocking] = useState(false);

  const serviceCharge = unlockStatus?.serviceCharge ?? 0;
  const walletBalance = unlockStatus?.walletBalance ?? 0;
  const hasSufficientBalance = walletBalance >= serviceCharge;

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const result = await unlockService.unlockRoom(roomId);
      setStep("success");
      onUnlocked(result);
      toast.success("Room details unlocked!", {
        description: "You can now view the exact location and contact details.",
        icon: "🔓",
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to unlock room. Please try again.",
      );
    } finally {
      setUnlocking(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => setStep("info"), 300);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogTitle className="sr-only">Unlock Room Details</DialogTitle>

        <AnimatePresence mode="wait">
          {!isAuthenticated && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="p-8 text-center "
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Sign In Required
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Please sign in to your account to unlock room details. Your
                wallet balance will be used to access the exact location and
                contact information.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  onClick={() => {
                    handleClose();
                    window.location.href = "/auth/login";
                  }}
                >
                  Sign In to Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="w-full cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {isAuthenticated && step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-7 pb-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight mb-1">
                    Unlock Room Details
                  </h2>
                  <p className="text-slate-400 text-sm truncate">{roomTitle}</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    What you'll unlock
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        icon: MapPin,
                        label: "Exact Location",
                        desc: "Precise address & map",
                        color: "text-red-500 bg-red-50",
                      },
                      {
                        icon: Phone,
                        label: "Host Contact",
                        desc: "Direct phone number",
                        color: "text-blue-500 bg-blue-50",
                      },
                      {
                        icon: User,
                        label: "Owner Details",
                        desc: "Host name & info",
                        color: "text-emerald-500 bg-emerald-50",
                      },
                    ].map(({ icon: Icon, label, desc, color }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {label}
                          </p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Wallet balance */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Wallet className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Wallet Balance</p>
                      <p className="text-base font-bold text-slate-900">
                        {formatPriceNPR(walletBalance)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Service Charge</p>
                    <p
                      className={`text-base font-bold ${
                        hasSufficientBalance
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {formatPriceNPR(serviceCharge)}
                    </p>
                  </div>
                </div>

                {/* Balance warning */}
                {!hasSufficientBalance && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Insufficient Balance
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        You need {formatPriceNPR(serviceCharge - walletBalance)}{" "}
                        more to unlock this room.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {hasSufficientBalance ? (
                    <Button
                      className="w-full rounded-xl py-6 bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-100 hover:shadow-red-200 transition-all group"
                      onClick={() => setStep("confirm")}
                    >
                      <Unlock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Unlock for रू {formatPriceNPR(serviceCharge)}
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-xl py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all group cursor-pointer"
                      onClick={() => {
                        handleClose();
                        onRequestTopUp();
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Add Money to Wallet
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  One-time charge · Unlimited access after unlock
                </p>
              </div>
            </motion.div>
          )}

          {isAuthenticated && step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="p-6"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-4">
                  <Unlock className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Confirm Unlock
                </h2>
                <p className="text-slate-500 text-sm">
                  This will deduct from your wallet
                </p>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Room</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px] text-right">
                    {roomTitle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Balance</span>
                  <span className="font-medium text-slate-800">
                    {formatPriceNPR(walletBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service Charge</span>
                  <span className="font-semibold text-red-500">
                    − {formatPriceNPR(serviceCharge)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">Balance After</span>
                  <span className="text-emerald-600">
                    {formatPriceNPR(walletBalance - serviceCharge)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full rounded-xl py-6 bg-red-500 hover:bg-red-600 text-white font-semibold transition-all cursor-pointer"
                  onClick={handleUnlock}
                  disabled={unlocking}
                >
                  {unlocking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Yes, Unlock Now
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("info")}
                  disabled={unlocking}
                  className="w-full rounded-xl"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}

          {isAuthenticated && step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
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
                🎉 Room Unlocked!
              </h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                The exact location, host contact and owner details are now
                visible below on the page.
              </p>
              <Button
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                onClick={handleClose}
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
