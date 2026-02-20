"use client";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
          Find Your Perfect Room
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 text-balance">
          Discover premium rooms with real-time location tracking and instant
          messaging
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="bg-white text-[var(--primary)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
            Get Started
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
