"use client";

import React from "react";
import Link from "next/link";
import {
  FiClock,
  FiTruck,
  FiShield,
  FiHeart,
  FiArrowRight,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiLogIn,
} from "react-icons/fi";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/70 via-white to-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 to-amber-100/30 -z-10" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                <FiClock className="h-4 w-4" />
                <span>Fresh everyday • No preservatives</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                Home-cooked meals
                <span className="text-orange-600"> delivered daily</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-xl mx-auto lg:mx-0">
                Healthy, hygienic, affordable tiffin service in Bhopal.
                Choose daily meals or monthly subscriptions — cooked fresh every morning.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition shadow-md text-lg"
                >
                  Start Subscription
                  <FiArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-orange-600 text-orange-700 font-semibold rounded-xl hover:bg-orange-50 transition text-lg"
                >
                  See Today's Menu
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiTruck className="h-5 w-5 text-orange-600" />
                  <span>Free delivery in Bhopal</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiShield className="h-5 w-5 text-orange-600" />
                  <span>100% hygienic</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiHeart className="h-5 w-5 text-orange-600" />
                  <span>Home-style taste</span>
                </div>
              </div>
            </div>

            {/* Right - Visual / Mockup */}
            <div className="relative hidden lg:block">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white rounded-2xl p-6 shadow-inner">
                    <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      Meal Box Preview
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-6 -right-6 bg-white rounded-full p-4 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹89</div>
                    <div className="text-xs text-gray-500">starting</div>
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-8 bg-white rounded-full p-5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <FiUsers className="h-6 w-6 text-orange-600" />
                    <div>
                      <div className="font-bold">2,300+</div>
                      <div className="text-xs text-gray-600">happy customers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Benefits */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why choose ReadyMealz?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Fresh, healthy, home-style meals delivered at your doorstep — every single day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                icon: FiClock,
                title: "Fresh every morning",
                desc: "Cooked daily between 6–9 AM. No overnight storage.",
              },
              {
                icon: FiMapPin,
                title: "Wide delivery network",
                desc: "Covering most areas of Bhopal with timely delivery.",
              },
              {
                icon: FiCalendar,
                title: "Flexible plans",
                desc: "Daily, weekly, monthly subscriptions. Pause anytime.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gradient-to-b from-white to-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                  <item.icon className="h-7 w-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Start eating healthy home-cooked food today
          </h2>

          <p className="mt-6 text-lg sm:text-xl opacity-90 max-w-3xl mx-auto">
            First week trial at special price • Cancel anytime • No long-term commitment
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-orange-700 font-bold text-lg rounded-xl shadow-lg hover:bg-gray-50 transition transform hover:-translate-y-1"
            >
              Get Started Now
              <FiArrowRight className="h-6 w-6" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-10 py-5 bg-orange-800/40 border-2 border-white/60 text-white font-bold text-lg rounded-xl hover:bg-orange-800/60 transition transform hover:-translate-y-1"
            >
              <FiLogIn className="h-6 w-6" />
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer space */}
      <div className="h-16 md:h-24"></div>
    </div>
  );
}