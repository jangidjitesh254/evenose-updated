import React from "react";
import { motion } from "framer-motion";
import {
  Triangle,
  Trophy,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Code,
  Star,
  UserCheck,
  Zap,
  Plus,
  Menu,
  MoveRight,
  ChevronsLeftRight,
  ChevronRight,
  WandSparkles,
} from "lucide-react";
import Button from "../components/ui/Button";

export default function Home() {
  const categories = [
    {
      icon: Trophy,
      title: "Organize Hackathons",
      description: "Complete Event Management Platform",
      color: "from-indigo-400 to-purple-400",
      bgColor: "bg-gradient-to-br from-indigo-50 to-purple-50",
      tags: ["Registration", "Payment Gateway", "Team Formation"],
      featured: true,
    },
    {
      icon: Users,
      title: "Team Coordination",
      description: "Seamless Collaboration Tools",
      color: "from-purple-400 to-pink-400",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
      tags: ["Real-time Updates", "Communication", "Task Management"],
      featured: false,
    },
    {
      icon: Award,
      title: "Judging System",
      description: "Fair & Transparent Evaluation",
      color: "from-blue-400 to-cyan-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      tags: ["Custom Criteria", "Live Scoring", "Leaderboards"],
      featured: false,
    },
  ];

  const participants = [
    {
      name: "Priya Sharma",
      role: "Hackathon Organizer",
      company: "TechVista 2024",
      image: "P",
      rating: 5,
      review:
        "HackPlatform transformed our event! Managing 800+ participants was seamless. The payment integration saved us weeks of work.",
      color: "from-pink-400 to-rose-400",
      location: "Mumbai",
      rate: "$45/hr",
      available: true,
    },
    {
      name: "Arjun Patel",
      role: "Student Developer",
      company: "IIT Bombay",
      image: "A",
      rating: 5,
      review:
        "Best platform for finding hackathons! Formed my team in minutes and the submission process was super smooth.",
      color: "from-blue-400 to-indigo-400",
      location: "Delhi",
      rate: "$38/hr",
      available: true,
    },
    {
      name: "Dr. Sarah Chen",
      role: "Judge & Mentor",
      company: "Google Developer Expert",
      image: "S",
      rating: 5,
      review:
        "The judging interface is incredibly intuitive. Scored 50+ projects efficiently with custom criteria. Highly recommend!",
      color: "from-purple-400 to-indigo-400",
      location: "Bangalore",
      rate: "$52/hr",
      available: false,
    },
  ];

  const stats = [
    {
      value: "98%",
      label: "Organizer Satisfaction",
      sublabel: "Based on 500+ events",
    },
    {
      value: "85%",
      label: "Participants Found Teams",
      sublabel: "Through our platform",
    },
  ];

  const trustLogos = [
    "IIT Delhi",
    "BITS Pilani",
    "NIT Trichy",
    "VIT Vellore",
    "IIIT Hyderabad",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="max-w-full mx-auto p-4 pt-0">
        <div className="flex w-full bg-linear-to-b from-blue-100 to-white h-full px-4 sm:px-6 lg:px-8 pt-20 pb-16 rounded-2xl">
          <div className="text-center max-w-5xl mx-auto bgbl">
            {/* Rating Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 border border-gray-200"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-orange-400 text-orange-400"
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm font-medium">
                Rated 5/5 from over 700 reviews
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="inline-flex items-center justify-center gap-3">
                <div className="opacity-0 w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center transform rotate-12">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <span className="relative">
                  <span className="text-gray-900">Find Top </span>
                </span>
              </span>{" "}
              <span className="inline-flex items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center transform rotate-12">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <span className="relative">
                  <span className="text-gray-900">Hackathons to</span>
                </span>
              </span>
              <br />
              <div className="relative">
                <span className="text-gray-900">
                  Showcase Skills
                </span>
                <span className="inline-flex items-center ml-3 absolute right-20 -bottom-0">
                  <div
                    className="inline-block -mt-10 -rotate-130"
                    style={{
                      width: 0,
                      height: 0,
                      borderRadius: "5px",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: "10px solid #f97316", // orange-500
                    }}
                  />
                  <div className="px-3 py-2 w-fit rounded-full bg-linear-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs">Collaboration</span>
                  </div>
                </span>
              </div>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Hire expert top talents designers for websites, apps, and more.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 justify-center mb-16"
            >
              <Button className="group px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 text-base shadow-lg">
                <ChevronRight  className="w-5 h-5" />
                Get Started
              </Button>
              <Button variant="outline">Explore Hackathons</Button>
            </motion.div>

            {/* Trust Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-20"
            >
              <div className="text-gray-500 text-sm mb-6 uppercase tracking-wider font-medium">
                Trusted by
              </div>
              <div className="flex flex-wrap gap-8 items-center justify-center opacity-40">
                {trustLogos.map((logo, index) => (
                  <motion.div
                    key={logo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-gray-600 font-semibold text-lg hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {logo}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Explore
            </h2>
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center -rotate-100">
              <WandSparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Our Expert
            </h2>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Services
            </h2>
          <p className="text-gray-600 text-lg">
            Tailored Solutions for Every Innovation Challenge
          </p>
        </div>

        <div className="text-gray-500 text-sm uppercase tracking-wider font-medium mb-6">
          Categories
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group cursor-pointer rounded-3xl p-8 transition-all duration-300 ${
                  category.featured
                    ? "bg-black text-white shadow-xl hover:shadow-2xl"
                    : `${category.bgColor} border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg`
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      category.featured
                        ? "bg-white"
                        : `bg-gradient-to-br ${category.color}`
                    }`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        category.featured ? "text-black" : "text-white"
                      }`}
                    />
                  </div>
                </div>

                <h3
                  className={`text-2xl font-bold mb-3 ${
                    category.featured ? "text-white" : "text-gray-900"
                  }`}
                >
                  {category.title}
                </h3>
                <p
                  className={`text-base mb-6 ${
                    category.featured ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {category.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-4 py-2 rounded-full text-xs font-medium ${
                        category.featured
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-white border border-gray-200 text-gray-700"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex gap-16 items-start">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="size-70 aspect-square rounded-3xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden border-2 border-gray-200">
              <div className="w-full h-full flex items-center justify-center p-12">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ctext x='100' y='120' font-size='120' text-anchor='middle' fill='white' opacity='0.3' font-family='Arial'%3E👨‍💻%3C/text%3E%3C/svg%3E"
                    alt="Developer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              We believe that great innovation talent deserves to shine. Our platform is built to help organizers like you showcase your skills,
              <span className="text-gray-500">
                {" "}connect with high-quality participants, and take your events to
                the next level.
              </span>
            </h2>

            {/* Stats */}
            <div className="flex gap-6 mt-12">
              {stats.map((stat, index) => (
                <div className="bg-black rounded-4xl">
                  <div className="flex w-full items-center justify-center gap-2 py-2 px-5">
                    <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                    <span className="text-white text-center">{stat.label}</span>
                  </div>
                <div
                  key={index}
                  className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm"
                >
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-700 text-sm font-semibold mb-1">
                    {stat.label}
                  </div>
                  <div className="text-gray-500 text-xs">{stat.sublabel}</div>
                </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Participants Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Top-Rated Designers
            </h2>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              for Your Next Project
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            Handpicked Experts Ready to Bring Your Vision to Life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-3xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all">
                {/* Image Section */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <div
                    className={`w-full h-full bg-gradient-to-br ${participant.color} flex items-center justify-center`}
                  >
                    <span className="text-white text-8xl font-bold opacity-30">
                      {participant.image}
                    </span>
                  </div>

                  {/* Verified Badge */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-4 border-white">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>

                  {/* Review Overlay */}
                  <div className="absolute bottom-4 right-4 left-4 bg-black/90 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex gap-1 mb-2">
                      {[...Array(participant.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-orange-400 text-orange-400"
                        />
                      ))}
                    </div>
                    <p className="text-white/90 text-sm italic line-clamp-3">
                      "{participant.review}"
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-white font-semibold text-sm">
                        {participant.name.split(" ")[0]}{" "}
                        {participant.name.split(" ")[1]?.charAt(0)}.
                      </div>
                      <div className="text-white/60 text-xs">
                        {participant.company}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {participant.role}
                  </h3>
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="flex items-center gap-1 text-gray-600">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          participant.available ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></div>
                      {participant.available ? "Available" : "Busy"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{participant.rate}</span>
                    <span>{participant.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-12">
          <button className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
          <button className="w-12 h-12 rounded-full border-2 border-gray-900 bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-white rounded-3xl p-16 border-2 border-gray-200 shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of innovators and organizers who trust HackPlatform
            for their events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 text-lg justify-center">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-semibold hover:border-gray-300 transition-all inline-flex items-center gap-2 text-lg justify-center">
              <Trophy className="w-5 h-5" />
              Explore Events
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
