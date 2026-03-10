"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Home,
  MapPin,
  Play,
  Shield,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const stats = [
    { value: "10K+", label: "Happy Tenants", icon: Users },
    { value: "2.5K+", label: "Properties", icon: Home },
    { value: "50+", label: "Cities", icon: MapPin },
    { value: "4.9", label: "Rating", icon: Star },
  ];

  useEffect(() => {
    setIsMounted(true);

    // Set dimensions only on client side
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Handle resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Generate particles only on client side
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/40" />
      </motion.div>

      {/* Animated Particles - Only render on client side */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
              }}
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
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 mb-8"
        >
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">
            Trusted by 10,000+ tenants worldwide
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight"
        >
          Find Your
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Perfect Space
            </span>
            <svg
              className="absolute -bottom-4 left-0 w-full"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
            >
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 1 }}
                d="M0,6 Q25,0 50,6 T100,6"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto mt-8 text-lg md:text-xl text-white/80 leading-relaxed"
        >
          Discover curated spaces that inspire. From modern apartments to cozy
          studios, find the perfect place to call home.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
        >
          <Button
            size="lg"
            className="group relative overflow-hidden rounded-full px-8 py-6 text-base bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Exploring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-6 text-base border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-white">
                {stat.value}
              </p>
              <p className="text-sm text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-xs tracking-wider">SCROLL</span>
          <ArrowDown className="w-4 h-4 text-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
