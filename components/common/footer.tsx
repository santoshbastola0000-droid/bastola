import Link from "next/link";
import {
  Home,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  HelpCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
  Building2,
  Key,
  Users,
  BadgeCheck,
  CreditCard,
  Headphones,
  FileText,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/rooms", label: "Browse Rooms", icon: Building2 },
    { href: "/host", label: "Become a Host", icon: Key },
    { href: "/about", label: "About Us", icon: Users },
    { href: "/contact", label: "Contact", icon: Headphones },
  ];

  const propertyTypes = [
    { name: "Apartments", icon: Building2, count: "2.5k+" },
    { name: "Houses", icon: Home, count: "1.8k+" },
    { name: "Studios", icon: Building2, count: "950+" },
    { name: "Shared Rooms", icon: Users, count: "1.2k+" },
    { name: "Vacation Rentals", icon: Globe, count: "750+" },
  ];

  const supportLinks = [
    { href: "/help", label: "Help Center", icon: HelpCircle },
    { href: "/safety", label: "Safety Tips", icon: Shield },
    { href: "/faq", label: "FAQs", icon: FileText },
    { href: "/terms", label: "Terms of Service", icon: FileText },
    { href: "/privacy", label: "Privacy Policy", icon: Shield },
    { href: "/cookies", label: "Cookie Policy", icon: BadgeCheck },
  ];

  const hostLinks = [
    { href: "/host/guide", label: "Hosting Guide" },
    { href: "/host/resources", label: "Host Resources" },
    { href: "/host/insurance", label: "Host Insurance" },
    { href: "/host/community", label: "Host Community" },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://facebook.com/roomservise",
      label: "Facebook",
      external: true,
    },
    {
      icon: Twitter,
      href: "https://twitter.com/roomservise",
      label: "Twitter",
      external: true,
    },
    {
      icon: Instagram,
      href: "https://instagram.com/roomservise",
      label: "Instagram",
      external: true,
    },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/roomservise",
      label: "LinkedIn",
      external: true,
    },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      text: "4th Floor, Pokhara Trade Mall Pokhara 33800, Gandaki Province Nepal",
    },
    { icon: Phone, text: "+977 9765408817", href: "tel:+9779800000000" },
    {
      icon: Mail,
      text: "support@roomservise.com",
      href: "mailto:support@roomservise.com",
    },
    { icon: Clock, text: "Sunday-Friday: 9am - 5pm NST" },
  ];

  return (
    <footer
      data-testid="footer"
      className="bg-gradient-to-b from-slate-900 to-slate-950 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column - 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            <Logo variant="light" />

            <p className="text-slate-400 text-sm leading-relaxed">
              Your trusted platform for finding the perfect room or listing your
              property. We connect quality tenants with verified hosts
              worldwide.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-brand/80 to-brand border-2 border-slate-800 flex items-center justify-center"
                  >
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                Trusted by{" "}
                <span className="text-white font-semibold">10,000+</span> hosts
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-brand flex items-center justify-center transition-all duration-300 group"
                >
                  <social.icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-testid={`footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-brand opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    <link.icon className="w-4 h-4 text-brand/70" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types - 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-6">
              Popular Properties
            </h4>
            <ul className="space-y-3">
              {propertyTypes.map((type) => (
                <li key={type.name}>
                  <Link
                    href={`/rooms?type=${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group flex items-center justify-between text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <type.icon className="w-4 h-4 text-brand/70" />
                      {type.name}
                    </span>
                    <span className="text-xs bg-slate-800/50 px-2 py-0.5 rounded-full text-brand">
                      {type.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Resources - 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-6">
              Support & Resources
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-brand/70" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Host Badge */}
            <div className="mt-6 p-4 bg-gradient-to-r from-brand/10 to-transparent rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white mb-1">
                    Become a Host
                  </h5>
                  <p className="text-xs text-slate-400 mb-2">
                    Earn extra income by listing your property
                  </p>
                  <Link
                    href="/host"
                    className="text-xs text-brand hover:text-brand-light font-medium inline-flex items-center gap-1"
                  >
                    Learn more <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info - 3 cols */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <item.icon className="w-4 h-4 text-brand mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Newsletter Signup - Client Component */}
            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-slate-500 text-sm text-center lg:text-left">
              &copy; {currentYear} RoomServise. All rights reserved.
              <span className="block sm:inline sm:ml-1">
                Made with <span className="text-red-500">❤</span> for hosts and
                guests.
              </span>
            </p>

            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">We accept:</span>
              <div className="flex items-center gap-2">
                {[CreditCard, Shield, BadgeCheck].map((Icon, index) => (
                  <div
                    key={index}
                    className="w-8 h-5 bg-slate-800 rounded flex items-center justify-center"
                  >
                    <Icon className="w-4 h-3 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/cookies"
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Cookies
              </Link>
              <Link
                href="/sitemap"
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Shield className="w-4 h-4" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <BadgeCheck className="w-4 h-4" />
              <span>Verified Hosts</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Headphones className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Globe className="w-4 h-4" />
              <span>Global Listings</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Newsletter Signup Client Component
function NewsletterSignup() {
  return (
    <div className="mt-6">
      <h5 className="text-sm font-medium text-white mb-3">
        Subscribe to our newsletter
      </h5>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand transition-colors"
        />
        <button className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:scale-105">
          Subscribe
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Get updates on new listings and exclusive offers
      </p>
    </div>
  );
}
