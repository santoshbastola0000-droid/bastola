"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Headphones,
  Globe,
  Building2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import Link from "next/link";

// Define proper types
interface ContactInfoWithAction {
  icon: any;
  title: string;
  details: string[];
  action: {
    label: string;
    href: string;
    external: boolean;
  };
  badge?: never;
}

interface ContactInfoWithBadge {
  icon: any;
  title: string;
  details: string[];
  badge: string;
  action?: never;
}

type ContactInfo = ContactInfoWithAction | ContactInfoWithBadge;

// Google Maps location URL
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/JLAQ5KnQBGMoSNa19";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("general");

  const subjects = [
    { value: "general", label: "General Inquiry", icon: MessageCircle },
    { value: "property", label: "Property Question", icon: Building2 },
    { value: "listing", label: "List My Property", icon: Globe },
    { value: "support", label: "Technical Support", icon: Headphones },
  ];

  const contactInfo: ContactInfo[] = [
    {
      icon: MapPin,
      title: "Visit Our Office",
      details: [
        "Rental Servise Pokhara",
        "4th Floor, Pokhara Trade Mall Pokhara 33800, Gandaki Province Nepal",
        "Nepal",
      ],
      action: {
        label: "Get Directions",
        href: GOOGLE_MAPS_URL,
        external: true,
      },
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+977 9765408817"],
      action: {
        label: "Call Now",
        href: "tel:+9779800000000",
        external: true,
      },
    },
    {
      icon: Mail,
      title: "Email Us",
      details: ["support@roomservise.com", "hello@roomservise.com"],
      action: {
        label: "Send Email",
        href: "mailto:support@roomservise.com",
        external: true,
      },
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: ["Sunday - Friday: 9:00 AM - 5:00 PM", "Saturday: Closed"],
      badge: "Open Now",
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://facebook.com/roomservise",
      label: "Facebook",
      color: "hover:bg-blue-600",
    },
    {
      icon: Twitter,
      href: "https://twitter.com/roomservise",
      label: "Twitter",
      color: "hover:bg-sky-500",
    },
    {
      icon: Instagram,
      href: "https://instagram.com/roomservise",
      label: "Instagram",
      color: "hover:bg-pink-600",
    },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/roomservise",
      label: "LinkedIn",
      color: "hover:bg-blue-700",
    },
  ];

  const faqs = [
    {
      question: "How quickly do you respond to inquiries?",
      answer:
        "We typically respond within 24 hours during business days. For urgent matters, please call us directly.",
    },
    {
      question: "Can I list my property on RoomServise?",
      answer:
        "Yes! Contact our team through this form or visit our 'Become a Host' page to get started.",
    },
    {
      question: "Do you offer property management services?",
      answer:
        "We provide tools and support for hosts, but direct property management is handled by the property owners.",
    },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.", {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
      return;
    }

    setSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Message sent successfully!", {
        description: "We'll get back to you within 24 hours.",
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        duration: 5000,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "general",
        message: "",
      });
      setSelectedSubject("general");
    } catch (error) {
      toast.error("Failed to send message. Please try again.", {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Type guard to check if contact info has action
  const hasAction = (info: ContactInfo): info is ContactInfoWithAction => {
    return "action" in info && info.action !== undefined;
  };

  // Type guard to check if contact info has badge
  const hasBadge = (info: ContactInfo): info is ContactInfoWithBadge => {
    return "badge" in info && info.badge !== undefined;
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-white pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-4 bg-red-50 text-red-600 border-0 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Get in Touch
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
                Let's Start a
                <span className="relative ml-2">
                  <span className="relative z-10 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                    Conversation
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
              <p className="text-lg text-slate-600 mt-4">
                Have a question about a property, want to list yours, or just
                want to say hello? We'd love to hear from you. Our team
                typically responds within 24 hours.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form - 2 columns */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-2"
            >
              <Card className="rounded-2xl border-slate-100 shadow-lg overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Send us a message
                      </h2>
                      <p className="text-sm text-slate-500">
                        We'll get back to you as soon as possible
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-slate-700"
                        >
                          Your Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-slate-700"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium text-slate-700"
                        >
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Subject
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {subjects.map((subject) => (
                            <button
                              key={subject.value}
                              type="button"
                              onClick={() => {
                                setSelectedSubject(subject.value);
                                handleChange("subject", subject.value);
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                selectedSubject === subject.value
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : "border-slate-200 hover:border-red-200 hover:bg-red-50/50 text-slate-600"
                              }`}
                            >
                              <subject.icon className="w-4 h-4" />
                              <span className="text-sm">{subject.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="message"
                        className="text-sm font-medium text-slate-700"
                      >
                        Your Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help you..."
                        value={formData.message}
                        onChange={(e) =>
                          handleChange("message", e.target.value)
                        }
                        className="min-h-[150px] rounded-xl border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-400">
                      By submitting this form, you agree to our privacy policy
                      and terms of service.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info - 1 column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              {contactInfo.map((info, index) => (
                <Card
                  key={info.title}
                  className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {info.title}
                          </h3>
                          {hasBadge(info) && (
                            <Badge className="bg-green-50 text-green-600 border-0 text-xs">
                              {info.badge}
                            </Badge>
                          )}
                        </div>
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-sm text-slate-500 mb-1">
                            {detail}
                          </p>
                        ))}
                        {hasAction(info) && (
                          <Link
                            href={info.action.href}
                            target={info.action.external ? "_blank" : undefined}
                            rel={
                              info.action.external
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="inline-flex items-center gap-1 mt-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors group"
                          >
                            {info.action.label}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Social Links */}
              <Card className="rounded-2xl border-slate-100">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Connect With Us
                  </h3>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className={`w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center transition-all duration-300 ${social.color} group hover:scale-110`}
                      >
                        <social.icon className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Map Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <Badge className="mb-2 bg-red-50 text-red-600 border-0">
                Visit Us
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Find Us on the Map
              </h2>
              <p className="text-slate-500 mt-2">
                We're located in the heart of Pokhara
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 h-[400px] group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3515.449988158879!2d83.9786!3d28.2098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3995944b0f3d5c9f%3A0x1a0b3d8c9e5f4d3!2sConnect%20Job%20Center%20Pokhara!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />

              {/* Overlay with location info */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Connect Job Center Pokhara
                      </p>
                      <p className="text-xs text-slate-500">
                        Lakeside Road, Pokhara 33700
                      </p>
                    </div>
                  </div>
                  <Link
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full transition-colors"
                  >
                    Get Directions
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FAQs Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <Badge className="mb-2 bg-red-50 text-red-600 border-0">
                FAQs
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 mt-2">
                Quick answers to common questions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="rounded-2xl border-slate-100 hover:shadow-md transition-all"
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-slate-500">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
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

              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Prefer to talk? We're here to help
                </h3>
                <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                  Our support team is available 24/7 to assist you with any
                  questions or concerns.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="tel:+97761123456">
                    <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Us Now
                    </Button>
                  </a>
                  <a href="mailto:support@roomservise.com">
                    <Button
                      variant="outline"
                      className="rounded-full px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
      <Footer />
    </>
  );
}
