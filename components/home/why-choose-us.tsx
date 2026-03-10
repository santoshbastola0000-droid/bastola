"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  Star,
  Heart,
  Users,
  CreditCard,
  Zap,
  Globe,
  Headphones,
  Home,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Properties",
    description:
      "Every listing is personally verified by our team to ensure quality and authenticity.",
    color: "from-red-500 to-orange-500",
    gradient: "from-red-50 to-orange-50",
  },
  {
    icon: Clock,
    title: "Quick & Easy Booking",
    description:
      "Book your perfect space in minutes with our streamlined process.",
    color: "from-red-500 to-pink-500",
    gradient: "from-red-50 to-pink-50",
  },
  {
    icon: Star,
    title: "Top Rated Service",
    description: "4.9/5 rating from thousands of satisfied tenants worldwide.",
    color: "from-red-500 to-rose-500",
    gradient: "from-red-50 to-rose-50",
  },
  {
    icon: Heart,
    title: "Personalized Matches",
    description:
      "Get recommendations tailored to your preferences and lifestyle.",
    color: "from-red-500 to-purple-500",
    gradient: "from-red-50 to-purple-50",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a community of trusted tenants and verified hosts.",
    color: "from-red-500 to-indigo-500",
    gradient: "from-red-50 to-indigo-50",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Your transactions are protected with bank-level security.",
    color: "from-red-500 to-emerald-500",
    gradient: "from-red-50 to-emerald-50",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2">
            The RoomServise Advantage
          </h2>
          <p className="text-slate-600 mt-4 text-lg">
            We're redefining the rental experience with transparency, security,
            and exceptional service.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Gradient Border on Hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity" />

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-8 h-8 text-red-500`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-red-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative Line */}
              <div
                className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.color} group-hover:w-full transition-all duration-500 rounded-b-2xl`}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-white rounded-2xl shadow-sm"
        >
          {[
            { value: "10K+", label: "Happy Tenants", icon: Users },
            { value: "2.5K+", label: "Properties", icon: Home },
            { value: "50+", label: "Cities", icon: Globe },
            { value: "24/7", label: "Support", icon: Headphones },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
