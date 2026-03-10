"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Home, MapPin, Star, Award, Clock } from "lucide-react";
import CountUp from "react-countup";

const stats = [
  {
    icon: Users,
    value: 10000,
    label: "Happy Tenants",
    suffix: "+",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Home,
    value: 2500,
    label: "Properties Listed",
    suffix: "+",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: MapPin,
    value: 50,
    label: "Cities Covered",
    suffix: "+",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Star,
    value: 4.9,
    label: "Average Rating",
    suffix: "/5",
    color: "from-red-500 to-purple-500",
    decimals: 1,
  },
  {
    icon: Award,
    value: 5,
    label: "Years Experience",
    suffix: "+",
    color: "from-red-500 to-indigo-500",
  },
  {
    icon: Clock,
    value: 24,
    label: "Hour Support",
    suffix: "/7",
    color: "from-red-500 to-emerald-500",
  },
];

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Our Impact in Numbers
          </h2>
          <p className="text-slate-600 mt-4">
            We're proud of what we've achieved together with our community
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div
                className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">
                {isInView && (
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    decimals={stat.decimals || 0}
                    suffix={stat.suffix}
                  />
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
