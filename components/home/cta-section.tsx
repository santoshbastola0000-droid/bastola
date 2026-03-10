"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full"
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium">
                Start Your Journey Today
              </span>
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Ready to Find Your
              <br />
              <span className="text-red-400">Perfect Space?</span>
            </h2>

            <p className="text-white/70 text-lg mt-6 max-w-lg leading-relaxed">
              Join thousands of happy tenants who found their dream homes
              through RoomServise. Start exploring today and discover your
              perfect match.
            </p>

            {/* Features */}
            <div className="flex flex-col sm:flex-row gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Home className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">2,500+</p>
                  <p className="text-white/60 text-sm">Properties</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">10,000+</p>
                  <p className="text-white/60 text-sm">Happy Tenants</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link href="/rooms">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Browse Listings
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/host">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/30 text-base font-semibold transition-all duration-300"
                >
                  Become a Host
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Content - Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              {
                value: "4.9/5",
                label: "Average Rating",
                color: "from-red-400 to-red-600",
              },
              {
                value: "24/7",
                label: "Customer Support",
                color: "from-orange-400 to-red-600",
              },
              {
                value: "15min",
                label: "Average Response",
                color: "from-red-500 to-pink-500",
              },
              {
                value: "100%",
                label: "Verified Listings",
                color: "from-red-500 to-rose-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl shadow-lg backdrop-blur-sm`}
              >
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/80 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-8"
        >
          {[
            "Secure Payments",
            "Verified Hosts",
            "Best Price Guarantee",
            "24/7 Support",
          ].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-sm">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
