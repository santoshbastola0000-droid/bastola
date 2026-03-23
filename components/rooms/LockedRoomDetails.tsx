"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  MapPin,
  Phone,
  User,
  Wallet,
  Navigation,
  Copy,
  ExternalLink,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapComponent } from "@/components/common/MapComponent";
import type { UnlockResult, UnlockStatus } from "@/types/unlock.types";

interface LockedRoomDetailsProps {
  /** Whether the user is logged in */
  isAuthenticated: boolean;
  /** Current unlock status (null while loading) */
  unlockStatus: UnlockStatus | null;
  /** Unlock result (populated after unlock) */
  unlockedData: UnlockResult | null;
  /** Room fallback address (always visible) */
  address: string;
  /** Called when user clicks the main unlock button */
  onUnlockClick: () => void;
  /** Called when user clicks "Add money" */
  onTopUpClick: () => void;
}

function formatPriceNPR(n: number): string {
  return new Intl.NumberFormat("ne-NP").format(n);
}

// ─── Unlocked View ─────────────────────────────────────────────────────────────

const UnlockedView: React.FC<{
  data: UnlockResult;
}> = ({ data }) => {
  const { room } = data;
  const lat = room.location?.latitude ? Number(room.location.latitude) : null;
  const lng = room.location?.longitude ? Number(room.location.longitude) : null;
  const hasCoords = !!(lat && lng);

  const openDirections = () => {
    if (hasCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank",
      );
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { icon: "📋", duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Unlocked badge */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">
          Room details unlocked — full access granted
        </p>
      </div>

      {/* Map */}
      {hasCoords && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Exact Location
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={openDirections}
              className="rounded-full gap-1.5 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </Button>
          </div>
          <div className="h-[280px] w-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-md">
            <MapComponent
              latitude={lat!}
              longitude={lng!}
              popupText="This property"
            />
          </div>
          {room.location?.formattedAddress && (
            <button
              onClick={() =>
                copyText(room.location!.formattedAddress, "Address")
              }
              className="w-full flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors text-left group"
            >
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{room.location.formattedAddress}</span>
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Contact & Owner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {room.contactPhone && (
          <a
            href={`tel:${room.contactPhone}`}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Host Phone
              </p>
              <p className="text-sm font-bold text-blue-900 truncate">
                {room.contactPhone}
              </p>
            </div>
          </a>
        )}
        {room.user && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Owner Name
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {room.user.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp shortcut */}
      {room.contactPhone && (
        <a
          href={`https://wa.me/${room.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello! I found your room listing and I am interested.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-100"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.528 6.17 2.527 11.26c0 1.695.444 3.355 1.291 4.815L2 22l5.995-1.788c1.44.79 3.064 1.206 4.722 1.207h.005c5.195 0 9.476-4.17 9.477-9.26 0-2.476-.966-4.804-2.842-6.69z" />
          </svg>
          WhatsApp मा सोध्नुहोस्
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.div>
  );
};

// ─── Locked View ──────────────────────────────────────────────────────────────

const LockedView: React.FC<{
  isAuthenticated: boolean;
  unlockStatus: UnlockStatus | null;
  address: string;
  onUnlockClick: () => void;
  onTopUpClick: () => void;
}> = ({
  isAuthenticated,
  unlockStatus,
  address,
  onUnlockClick,
  onTopUpClick,
}) => {
  console.log("unlockstatus", unlockStatus);

  const serviceCharge = unlockStatus?.serviceCharge ?? 0;
  const walletBalance = unlockStatus?.walletBalance ?? 0;
  const hasSufficient = walletBalance >= serviceCharge;

  return (
    <div className="space-y-4">
      {/* Blurred map with lock overlay */}
      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-md relative">
        {/* Blurred map bg */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{ filter: "blur(10px)", transform: "scale(1.1)" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-slate-400" />
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[3px]" />

        {/* Lock CTA */}
        <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/96 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-2xl border border-slate-200 text-center max-w-xs w-full mx-auto"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-slate-900 text-base mb-1">
              Location & Details Locked
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Unlock to see exact location, host phone number, and owner
              details.
            </p>

            {!isAuthenticated ? (
              <Button
                size="sm"
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-2"
                onClick={onUnlockClick}
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In to Unlock
              </Button>
            ) : unlockStatus === null ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                <span className="text-xs text-slate-500">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Wallet balance */}
                <div className="flex items-center justify-between text-xs mb-2 px-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Your balance
                  </span>
                  <span
                    className={`font-bold ${hasSufficient ? "text-emerald-600" : "text-red-500"}`}
                  >
                    रू {formatPriceNPR(walletBalance)}
                  </span>
                </div>

                {hasSufficient ? (
                  <Button
                    size="sm"
                    className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold gap-2 shadow-md shadow-red-100"
                    onClick={onUnlockClick}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Unlock · रू {formatPriceNPR(serviceCharge)}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold gap-2 shadow-md shadow-red-100"
                      onClick={onUnlockClick}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Unlock · रू {formatPriceNPR(serviceCharge)}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                      onClick={onTopUpClick}
                    >
                      <Wallet className="w-3 h-3" />
                      Add Money to Wallet
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Address (always visible) */}
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="italic">Approximate area: {address}</span>
        <Badge variant="outline" className="ml-auto text-xs flex-shrink-0">
          <Lock className="w-2.5 h-2.5 mr-1" />
          Exact hidden
        </Badge>
      </div>

      {/* What's locked indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Exact Map", color: "text-red-400" },
          { icon: Phone, label: "Host Phone", color: "text-blue-400" },
          { icon: User, label: "Owner Name", color: "text-purple-400" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden"
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 ${color}`}
                style={{ filter: "blur(2px)" }}
              />
              <Lock className="w-3 h-3 text-slate-400 absolute -bottom-1 -right-1" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3" />
        One-time charge · Unlimited access after unlock
      </p>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export const LockedRoomDetails: React.FC<LockedRoomDetailsProps> = ({
  isAuthenticated,
  unlockStatus,
  unlockedData,
  address,
  onUnlockClick,
  onTopUpClick,
}) => {
  if (unlockedData) {
    return <UnlockedView data={unlockedData} />;
  }

  return (
    <LockedView
      isAuthenticated={isAuthenticated}
      unlockStatus={unlockStatus}
      address={address}
      onUnlockClick={onUnlockClick}
      onTopUpClick={onTopUpClick}
    />
  );
};
