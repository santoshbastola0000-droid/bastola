import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
  Home,
  MapPin,
  PlusCircle,
  Shield,
  Users,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const quickLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rooms", label: "Browse Rooms", icon: Building2 },
  { href: "/jobs", label: "Jobs in Nepal", icon: BriefcaseBusiness },
  {
    href: "/user/dashboard/rooms/create",
    label: "List a Room",
    icon: PlusCircle,
  },
  { href: "/about", label: "About Us", icon: Users },
  { href: "/contact", label: "Contact", icon: Headphones },
];

const supportLinks = [
  { href: "/faq", label: "Help & FAQs", icon: FileText },
  { href: "/safety", label: "Safety Tips", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/cookies", label: "Cookie Policy", icon: BadgeCheck },
  { href: "/sitemap", label: "Sitemap", icon: FileText },
];

const contactInfo = [
  {
    icon: MapPin,
    text: "4th Floor, Pokhara Trade Mall, Pokhara 33800, Gandaki Province, Nepal",
  },
  {
    icon: Phone,
    text: "+977 9765408817",
    href: "tel:+9779765408817",
  },
  { icon: Clock, text: "Sunday-Friday: 9:00 AM - 5:00 PM NST" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-testid="footer"
      className="bg-gradient-to-b from-slate-900 to-slate-950 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo variant="light" />
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              RoomKhoj helps people in Nepal discover rooms, flats, houses and
              job opportunities, while giving owners and employers simple tools
              to publish and manage their listings.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <item.icon className="h-4 w-4 text-brand/80" />
                    <span>{item.label}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <item.icon className="h-4 w-4 text-brand/80" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} RoomKhoj. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-slate-300">
              Cookies
            </Link>
            <Link href="/sitemap" className="hover:text-slate-300">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
