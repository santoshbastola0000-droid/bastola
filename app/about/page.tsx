"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Target,
  Award,
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  Globe,
  Clock,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";

export default function AboutPage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });
  const teamRef = useRef(null);
  const teamInView = useInView(teamRef, { once: true });

  const stats = [
    {
      value: "10K+",
      label: "Happy Tenants",
      icon: Users,
      color: "from-red-500 to-orange-500",
    },
    {
      value: "2.5K+",
      label: "Properties",
      icon: Home,
      color: "from-red-500 to-pink-500",
    },
    {
      value: "50+",
      label: "Cities",
      icon: Globe,
      color: "from-red-500 to-rose-500",
    },
    {
      value: "4.9",
      label: "Rating",
      icon: Star,
      color: "from-red-500 to-purple-500",
      suffix: "/5",
    },
    {
      value: "5+",
      label: "Years",
      icon: Clock,
      color: "from-red-500 to-indigo-500",
    },
    {
      value: "24/7",
      label: "Support",
      icon: Shield,
      color: "from-red-500 to-emerald-500",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To revolutionize the rental experience by making it transparent, secure, and effortless for everyone.",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: Heart,
      title: "Community First",
      description:
        "Building lasting relationships between tenants and hosts through trust and mutual respect.",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description:
        "Every property is personally verified to ensure you get exactly what you see.",
      color: "from-red-500 to-purple-500",
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description:
        "Your transactions and data are protected with enterprise-grade security.",
      color: "from-red-500 to-indigo-500",
    },
  ];

  const team = [
    {
      name: "Alex Johnson",
      role: "Founder & CEO",
      bio: "Former real estate tech executive with 15+ years of experience in property management.",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
      social: "linkedin",
    },
    {
      name: "Maria Garcia",
      role: "Head of Operations",
      bio: "Passionate about creating seamless experiences for both tenants and property owners.",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80",
      social: "linkedin",
    },
    {
      name: "David Kim",
      role: "Lead Developer",
      bio: "Tech enthusiast building innovative solutions to simplify the rental process.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      social: "github",
    },
    {
      name: "Sarah Chen",
      role: "Customer Success",
      bio: "Dedicated to ensuring every tenant finds their perfect home with complete satisfaction.",
      image:
        "https://images.unsplash.com/photo-1494790108777-6e8e3e4e5b0?w=400&q=80",
      social: "linkedin",
    },
  ];

  const milestones = [
    { year: "2020", event: "RoomServise founded in San Francisco" },
    { year: "2021", event: "Reached 1,000 properties listed" },
    { year: "2022", event: "Expanded to 25 cities nationwide" },
    { year: "2023", event: "10,000 happy tenants milestone" },
    { year: "2024", event: "Launched in international markets" },
  ];

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, #ef4444 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Gradient Orbs */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-200 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-20" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Badge className="mb-6 bg-red-50 text-red-600 border-0 px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Our Story
                </Badge>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                  Making Renting
                  <br />
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                      Effortless & Secure
                    </span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 100 8"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,4 Q25,0 50,4 T100,4"
                        stroke="#ef4444"
                        strokeWidth="2"
                        fill="none"
                        strokeOpacity="0.3"
                      />
                    </svg>
                  </span>
                </h1>

                <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-xl">
                  Founded in 2020, RoomServise was born from a simple idea:
                  finding a rental home shouldn't be stressful. We've built a
                  platform that connects quality properties with quality
                  tenants, making the entire process seamless, transparent, and
                  secure.
                </p>

                <div className="flex flex-wrap gap-4 mt-8">
                  <Link href="/rooms">
                    <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all group">
                      Browse Listings
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      variant="outline"
                      className="rounded-full px-8 py-6 border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                      Get in Touch
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-white"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    Trusted by{" "}
                    <span className="font-semibold text-slate-900">
                      10,000+
                    </span>{" "}
                    tenants
                  </p>
                </div>
              </motion.div>

              {/* Right Content - Image Collage */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-square">
                      <Image
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                        alt="Luxury home"
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                      <Image
                        src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
                        alt="Modern apartment"
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                      <Image
                        src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
                        alt="Cozy room"
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="relative rounded-2xl overflow-hidden aspect-square">
                      <Image
                        src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"
                        alt="Beautiful interior"
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-100"
                >
                  <p className="text-2xl font-bold text-slate-900">5+</p>
                  <p className="text-sm text-slate-500">Years of Excellence</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          ref={statsRef}
          className="py-20 bg-gradient-to-b from-slate-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-red-50 text-red-600 border-0">
                Our Impact
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                RoomServise in Numbers
              </h2>
              <p className="text-slate-600 mt-4">
                We're proud of what we've achieved together with our community
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-red-50 text-red-600 border-0">
                Our Values
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                What Drives Us Forward
              </h2>
              <p className="text-slate-600 mt-4">
                Every decision we make is guided by our core principles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Border on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <value.icon className="w-8 h-8 text-red-500" />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-red-600 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {value.description}
                  </p>

                  <div
                    className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${value.color} group-hover:w-full transition-all duration-500`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones Timeline */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-red-50 text-red-600 border-0">
                Our Journey
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Key Milestones
              </h2>
              <p className="text-slate-600 mt-4">
                How we've grown and evolved over the years
              </p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-red-200 to-red-500" />

              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div className="w-1/2 px-6">
                      <div
                        className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${index % 2 === 0 ? "text-right" : "text-left"}`}
                      >
                        <Badge className="mb-2 bg-red-50 text-red-600 border-0">
                          {milestone.year}
                        </Badge>
                        <p className="text-slate-700">{milestone.event}</p>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-center w-12">
                      <div className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-100 z-10" />
                    </div>

                    <div className="w-1/2" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section ref={teamRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-red-50 text-red-600 border-0">
                Meet The Team
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                The People Behind RoomServise
              </h2>
              <p className="text-slate-600 mt-4">
                Passionate individuals dedicated to revolutionizing the rental
                experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={teamInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group text-center"
                >
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
                    <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-red-100 group-hover:ring-red-200 transition-all">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-sm text-red-500 mt-1">{member.role}</p>
                  <p className="text-sm text-slate-500 mt-3 max-w-xs mx-auto">
                    {member.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-red-500/20 text-red-400 border-0">
                Join Us Today
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Find Your Perfect Home?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of happy tenants who found their dream homes
                through RoomServise. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/rooms">
                  <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-base shadow-lg hover:shadow-xl transition-all">
                    Browse Listings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/30 text-base"
                  >
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
