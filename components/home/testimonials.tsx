"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Graphic Designer",
    image:
      "https://images.unsplash.com/photo-1494790108777-6e8e3e4e5b0?w=200&q=80",
    rating: 5,
    text: "Found my dream apartment in just two days! The search filters made it incredibly easy to narrow down exactly what I needed. The verification process gave me peace of mind.",
    location: "New York, NY",
  },
  {
    id: 2,
    name: "James Rodriguez",
    role: "Software Engineer",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    text: "The best rental platform I've used. The team was responsive and helped me through every step of the process. Found a great apartment in San Francisco within a week.",
    location: "San Francisco, CA",
  },
  {
    id: 3,
    name: "Emma Chen",
    role: "Marketing Manager",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    rating: 5,
    text: "As a host, I've listed 3 properties and all were rented within a month. The platform makes it easy to manage bookings and communicate with tenants.",
    location: "Chicago, IL",
  },
  {
    id: 4,
    name: "Michael Brown",
    role: "Architect",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    rating: 5,
    text: "The property verification process is thorough. I felt confident booking without seeing the place in person. The virtual tours are a game-changer.",
    location: "Miami, FL",
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Product Manager",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80",
    rating: 5,
    text: "Moved to a new city and found the perfect apartment within days. The neighborhood guides and detailed listings helped me make an informed decision.",
    location: "Seattle, WA",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #ef4444 1px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2">
            What Our Users Say
          </h2>
          <p className="text-slate-600 mt-4 text-lg">
            Join thousands of satisfied tenants and hosts who found their
            perfect match
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative" ref={containerRef}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
              {/* Quote Icon */}
              <Quote className="w-12 h-12 text-red-200 mb-6" />

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-xl md:text-2xl text-slate-700 leading-relaxed mb-8 italic">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-red-100">
                  <Image
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {testimonials[currentIndex].name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {testimonials[currentIndex].role} •{" "}
                    {testimonials[currentIndex].location}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-100 flex items-center justify-center hover:scale-110 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-100 flex items-center justify-center hover:scale-110 transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-red-500"
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">Trustpilot {i}.0</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
