import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  SendIcon,
  Loader2Icon,
  ArrowRightIcon,
} from "lucide-react";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { useToast } from "@/components/ui/use-toast";
import { post } from "@/lib/api-client";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const emptyContactForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactPage() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: keyof ContactFormState, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !contactForm.name.trim() ||
      !contactForm.email.trim() ||
      !contactForm.phone.trim() ||
      !contactForm.message.trim()
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await post("/api/contact", {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        query: contactForm.message.trim(),
        providerName: "Contact Form Submission",
      });
      toast({
        title: "Message sent!",
        description: "We'll get back to you shortly.",
      });
      setContactForm(emptyContactForm);
    } catch (err) {
      toast({
        title: "Unable to send message",
        description:
          err instanceof Error ? err.message : "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <MediEaseLogo size="lg" />
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
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
                <p className="text-muted-foreground">
                  Reach out to us through any of these channels. We're here to help!
                </p>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <MailIcon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Email</h3>
                      <a
                        href="mailto:alertedai@alertedai.care"
                        className="text-teal-600 hover:text-teal-700"
                      >
                        alertedai@alertedai.care
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <PhoneIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Phone</h3>
                      <p className="text-muted-foreground">
                        Available during business hours
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Location</h3>
                      <p className="text-muted-foreground">
                        Serving healthcare providers across India
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={contactForm.message}
                    onChange={(e) => handleFieldChange("message", e.target.value)}
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <SendIcon className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

