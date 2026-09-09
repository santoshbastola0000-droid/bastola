import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQs | RoomKhoj",
  description:
    "Answers to common questions about rooms, jobs, messaging and RoomKhoj accounts.",
};

const faqs = [
  {
    question: "How do I find a room on RoomKhoj?",
    answer:
      "Browse available rooms from the home page, use location and preference filters, then open a listing to review its details. Some owner contact details may require the applicable RoomKhoj unlock flow.",
  },
  {
    question: "How do I list my room?",
    answer:
      "Tap the List Room button, sign in when required, complete the room information and submit it. You can track your room from your dashboard after submission.",
  },
  {
    question: "Why is my room not visible publicly yet?",
    answer:
      "A newly submitted listing may be pending review or may not currently be marked available. Check the room status in your dashboard for the latest state.",
  },
  {
    question: "Can I search for jobs on RoomKhoj?",
    answer:
      "Yes. Open Jobs to browse vacancies and use the available job details, candidate and application features. Always verify an employer and job terms before committing or paying anything.",
  },
  {
    question: "Can employers find candidates?",
    answer:
      "Where candidate discovery is enabled, employers can review candidate profiles and the information candidates have chosen to provide, subject to RoomKhoj access and privacy controls.",
  },
  {
    question: "How do RoomKhoj messages work?",
    answer:
      "Use Messages to continue conversations started from supported room, job or profile flows. Keep sensitive account credentials, OTP codes and banking PINs out of chat.",
  },
  {
    question: "What should I do if something looks suspicious?",
    answer:
      "Stop the transaction, avoid sending more money or sensitive information, keep relevant records, and contact RoomKhoj support so the activity can be reviewed.",
  },
  {
    question: "How do I contact RoomKhoj?",
    answer:
      "Use the Contact page for support questions, reports and other assistance.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-slate-950">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Quick answers to common RoomKhoj questions.
        </p>

        <div className="mt-8 divide-y divide-slate-200">
          {faqs.map((item) => (
            <section key={item.question} className="py-6 first:pt-0 last:pb-0">
              <h2 className="text-lg font-semibold text-slate-950">
                {item.question}
              </h2>
              <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-slate-100 p-5">
          <p className="font-medium text-slate-950">Still need help?</p>
          <p className="mt-1 text-sm text-slate-600">
            Contact RoomKhoj and include enough detail for us to understand the issue.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-flex font-semibold text-primary hover:underline"
          >
            Contact support
          </Link>
        </div>
      </article>
    </main>
  );
}
