"use client";

import Link from "next/link";
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-[var(--primary)]">
          RoomServise
        </Link>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden"
        >
          <Menu size={24} />
        </button>

        <div
          className={`${isMenuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-4 items-center absolute md:static top-16 left-0 right-0 bg-white md:bg-transparent p-4 md:p-0 border-b md:border-0 border-[var(--border)]`}
        >
          <Link
            href="/rooms"
            className="hover:text-[var(--primary)] transition"
          >
            Browse Rooms
          </Link>
          <Link href="/host" className="hover:text-[var(--primary)] transition">
            Become a Host
          </Link>

          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:text-[var(--primary)] transition"
            >
              <User size={20} />
              My Dashboard
            </Link>
            <button className="flex items-center gap-2 text-[var(--primary)] hover:opacity-70 transition">
              <LogOut size={20} />
              Logout
            </button>
          </>
          <>
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 transition"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition"
            >
              Sign Up
            </Link>
          </>
        </div>
      </div>
    </nav>
  );
}
