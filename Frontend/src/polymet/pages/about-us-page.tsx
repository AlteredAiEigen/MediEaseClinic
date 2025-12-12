import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  UsersIcon,
  TargetIcon,
  LightbulbIcon,
  Linkedin,
  ArrowRightIcon,
  HeartIcon,
  SparklesIcon,
} from "lucide-react";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <MediEaseLogo size="md" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Features
              </Link>
              <Link
                to="/roadmap"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Roadmap
              </Link>
              <Link
                to="/security"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Security
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-teal-600 transition-colors"
              >
                Pricing
              </Link>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              About MediEase
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transforming healthcare delivery in India through AI-powered digital solutions
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6">
                <TargetIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To empower healthcare providers across India with cutting-edge digital solutions
                that streamline operations, enhance patient care, and make quality healthcare
                accessible to all. We believe technology should serve humanity, and our mission
                is to bridge the gap between traditional healthcare practices and modern digital
                innovation.
              </p>
            </Card>

            <Card className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6">
                <LightbulbIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted healthcare technology platform, enabling every
                clinic and hospital to deliver exceptional patient care through intelligent
                automation, seamless workflows, and data-driven insights. We envision a future
                where healthcare providers can focus entirely on patient care while technology
                handles the administrative burden.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 border border-teal-200 text-teal-700 text-sm font-semibold mb-6">
              <UsersIcon className="w-4 h-4" />
              Meet Our Founders
            </div>
            <h2 className="text-4xl font-bold mb-4">
              The Team Behind{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                MediEase
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Passionate about healthcare innovation and committed to transforming how medical
              practices operate in India.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Chanpreet Singh */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4 text-white text-3xl font-bold">
                  CS
                </div>
                <h3 className="text-2xl font-bold mb-2">Chanpreet Singh</h3>
                <p className="text-muted-foreground mb-4">Co-Founder</p>
                <a
                  href="https://www.linkedin.com/in/chanpreet-singh-018870168/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  Connect on LinkedIn
                </a>
              </div>
              <p className="text-muted-foreground leading-relaxed text-center">
                Chanpreet brings extensive experience in healthcare technology and digital
                innovation. Passionate about leveraging AI and modern technology to solve
                real-world healthcare challenges in India.
              </p>
            </Card>

            {/* Gunjan Rawat */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 text-white text-3xl font-bold">
                  GR
                </div>
                <h3 className="text-2xl font-bold mb-2">Gunjan Rawat</h3>
                <p className="text-muted-foreground mb-4">Co-Founder</p>
                <a
                  href="https://www.linkedin.com/in/gunjan-rawat-58356516/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  Connect on LinkedIn
                </a>
              </div>
              <p className="text-muted-foreground leading-relaxed text-center">
                Gunjan is dedicated to creating solutions that make healthcare more accessible
                and efficient. With a deep understanding of the Indian healthcare landscape,
                she drives product strategy and user experience excellence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-bold mb-2">Patient-Centric</h3>
              <p className="text-sm text-muted-foreground">
                Every feature we build prioritizes patient care and outcomes
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold mb-2">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Continuously pushing boundaries with cutting-edge technology
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-bold mb-2">Accessibility</h3>
              <p className="text-sm text-muted-foreground">
                Making quality healthcare technology accessible to all providers
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Join Us on Our Journey</h2>
          <p className="text-xl mb-8 text-white/90">
            Together, we're transforming healthcare delivery in India
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-teal-600 hover:bg-gray-100"
              >
                Get in Touch <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-teal-600"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

