import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon } from "lucide-react"
import { useDemoForm } from "@/polymet/layouts/mediease-layout"

export function MedieaseContact() {
  const { openDemoForm } = useDemoForm()
  return (
    <div className="w-full" style={{ background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 40%, #1d4ed8 100%)' }}>
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 mb-4">
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Let's Transform Healthcare Together
          </h1>
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed">
            Have questions about Mediease? Want to see a demo? Our team is here to help you revolutionize your healthcare practice.
          </p>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-blue-100 mb-2">
                      First Name *
                    </label>
                    <Input 
                      id="firstName"
                      placeholder="John"
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-blue-100 mb-2">
                      Last Name *
                    </label>
                    <Input 
                      id="lastName"
                      placeholder="Doe"
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                    Email Address *
                  </label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="john.doe@clinic.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-blue-100 mb-2">
                    Phone Number
                  </label>
                  <Input 
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-blue-100 mb-2">
                    Organization Name *
                  </label>
                  <Input 
                    id="organization"
                    placeholder="Your Clinic/Hospital Name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-blue-100 mb-2">
                    Subject *
                  </label>
                  <Input 
                    id="subject"
                    placeholder="How can we help you?"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-blue-100 mb-2">
                    Message *
                  </label>
                  <Textarea 
                    id="message"
                    placeholder="Tell us more about your requirements..."
                    rows={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-cyan-400 resize-none"
                  />
                </div>

                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-lg py-6">
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="space-y-6">
            {/* Email */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <MailIcon className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
              <p className="text-blue-100 text-sm mb-3">
                Get in touch via email
              </p>
              <a href="mailto:contact@mediease.com" className="text-cyan-300 hover:text-cyan-200 font-medium">
                contact@mediease.com
              </a>
            </div>

            {/* Phone */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <PhoneIcon className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
              <p className="text-blue-100 text-sm mb-3">
                Mon-Fri from 9am to 6pm IST
              </p>
              <a href="tel:+911234567890" className="text-cyan-300 hover:text-cyan-200 font-medium">
                +91 123 456 7890
              </a>
            </div>

            {/* Office */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <MapPinIcon className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Visit Us</h3>
              <p className="text-blue-100 text-sm">
                Bangalore, Karnataka<br />
                India - 560001
              </p>
            </div>

            {/* Business Hours */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Business Hours</h3>
              <div className="text-blue-100 text-sm space-y-1">
                <p>Monday - Friday: 9am - 6pm</p>
                <p>Saturday: 10am - 4pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-blue-100">
              Find answers to common questions about Mediease
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  What is Mediease and how does it work?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Mediease is an AI-powered healthcare management platform that streamlines clinic operations through intelligent documentation, multilingual voice transcription, and automated workflows. It captures patient consultations in 100+ languages, automatically generates clinical notes, and integrates seamlessly with existing EHR systems.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  Which languages does Mediease support?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Mediease supports 100+ languages including all major Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia) and international languages. Our AI-powered transcription achieves 99% accuracy across all supported languages.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  Is Mediease HIPAA compliant and secure?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Yes, Mediease is fully HIPAA compliant with enterprise-grade security and encryption. All patient data is encrypted at rest and in transit, with strict access controls and audit trails. We follow international healthcare data protection standards to ensure your patients' information is completely secure.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  Can Mediease integrate with my existing EHR system?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Absolutely! Mediease seamlessly integrates with existing EHR systems through our automated workflow integration. Patient records are automatically updated, eliminating manual data entry while maintaining complete audit trails. Our team will help you set up the integration during onboarding.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  What types of healthcare facilities can use Mediease?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Mediease is designed for all types of healthcare facilities including solo practices, multi-specialty clinics, hospitals, diagnostic centers, and telemedicine providers. Our platform scales from single-doctor clinics to large hospital networks with multiple locations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  How long does it take to implement Mediease?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Implementation typically takes 1-2 weeks depending on your setup. This includes system configuration, EHR integration, staff training, and testing. Our dedicated onboarding team will guide you through every step to ensure a smooth transition with minimal disruption to your practice.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-b border-white/10">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  What kind of support do you provide?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  We provide comprehensive support including 24/7 technical assistance, dedicated account managers, regular training sessions, and ongoing system updates. Our support team is available via phone, email, and chat to help you resolve any issues quickly.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border-b-0">
                <AccordionTrigger className="text-white hover:text-cyan-300 text-left">
                  How much does Mediease cost?
                </AccordionTrigger>
                <AccordionContent className="text-blue-100">
                  Mediease offers flexible pricing plans based on your practice size and needs. We have options for solo practitioners, small clinics, and large healthcare networks. Contact our sales team for a customized quote and to discuss which plan best fits your requirements. We also offer a free demo to help you experience the platform before making a decision.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Schedule a personalized demo with our team to see Mediease in action
          </p>
          <Button 
            onClick={openDemoForm}
            className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-6"
          >
            Book a Demo
          </Button>
        </div>
      </section>
    </div>
  )
}