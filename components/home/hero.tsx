"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Home,
  MapPin,
  Shield,
  Star,
  Users,
  Search,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const stats = [
    { value: "१०,०००+", label: "खुसी भाडाटारु", icon: Users },
    { value: "२,५००+", label: "घर / कोठाहरू", icon: Home },
    { value: "५०+", label: "शहरहरू", icon: MapPin },
    { value: "४.९ ⭐", label: "रेटिङ", icon: Star },
  ];

  useEffect(() => {
    setIsMounted(true);
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const particles = isMounted
    ? [...Array(20)].map((_, i) => ({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        duration: Math.random() * 5 + 5,
      }))
    : [];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with Parallax */}
      <motion.div style={{ y }} className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt="Luxury home interior"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/50" />
      </motion.div>

      {/* Animated Particles */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{ x: particle.x, y: particle.y, opacity: 0 }}
              animate={{
                y: [particle.y, particle.y - 100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 mb-6"
        >
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">
            १०,०००+ भाडाटारुले विश्वास गर्ने प्लेटफर्म
          </span>
        </motion.div>

        {/* ── Nepali main heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Nepali tagline above */}
          <p className="text-red-300 text-lg md:text-xl font-semibold tracking-wide mb-3 drop-shadow">
            🏠 सपनाको घर खोज्नुस् — सजिलो, सुरक्षित, भरपर्दो
          </p>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[1.05]">
            आफ्नो{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-red-400 via-red-500 to-rose-500 bg-clip-text text-transparent">
                सही घर
              </span>
              {/* Underline SVG */}
              <svg
                className="absolute -bottom-3 left-0 w-full"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 1 }}
                  d="M0,5 Q25,0 50,5 T100,5"
                  stroke="url(#heroGrad)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <defs>
                  <linearGradient
                    id="heroGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            <span className="text-white/90">यहीं भेट्टाउनुस्</span>
          </h1>
        </motion.div>

        {/* English sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto mt-7 text-base md:text-lg text-white/75 leading-relaxed"
        >
          नेपालका उत्कृष्ट घर, कोठा र अपार्टमेन्टहरू एकै ठाउँमा।{" "}
          <span className="text-white/95 font-medium">
            Discover verified rooms & houses across Nepal — modern apartments to
            cozy studios.
          </span>
        </motion.p>

        {/* Nepali micro-copy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap justify-center gap-3 mt-5"
        >
          {[
            "✅ Verified Listings",
            "💬 Direct Owner Contact",
            "🔒 Safe & Trusted",
            "📍 Pokhara & More",
          ].map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/15"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
        >
          <Button
            size="lg"
            className="group relative overflow-hidden rounded-full px-8 py-6 text-base bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer font-semibold"
            onClick={() => router.push("/rooms")}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Search className="w-4 h-4" />
              कोठा खोज्नुस् (Browse Rooms)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-red-500/40 transition-colors">
                <stat.icon className="w-5 h-5 text-red-300" />
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-white/55 mt-1 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-white/50 text-[10px] tracking-widest font-medium">
            तल हेर्नुस्
          </span>
          <ArrowDown className="w-4 h-4 text-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
