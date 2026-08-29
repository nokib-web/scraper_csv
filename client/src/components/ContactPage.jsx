import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, User, Globe, PhoneCall } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1FF0A]/20 border border-[#F1FF0A]/40 text-neutral-950 dark:text-[#F1FF0A] text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 dark:text-white tracking-tight">
          Contact & Support
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
          Have a custom store scraping request, bug report, or feature suggestion? Send a message directly.
        </p>
      </div>

      {/* Main Grid: Form + Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contact Information & Channels */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-neutral-950 dark:text-white uppercase tracking-wider">
              Direct Channels
            </h3>

            <div className="space-y-4 text-xs">
              <a
                href="mailto:nokibweb@gmail.com"
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-[#F1FF0A] flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-950 dark:text-white group-hover:text-[#687500] dark:group-hover:text-[#F1FF0A] transition-colors">
                    Email Support
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-[11px] truncate">
                    nokibweb@gmail.com
                  </div>
                </div>
              </a>

              <a
                href="https://nokib.vercel.app/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#F1FF0A]/60 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-[#F1FF0A] flex-shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-950 dark:text-white group-hover:text-[#687500] dark:group-hover:text-[#F1FF0A] transition-colors">
                    Developer Portfolio
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    nokib.vercel.app
                  </div>
                </div>
              </a>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed block">
                ⚡ Typical response time: within <strong>2–12 hours</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="md:col-span-2">
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            {submitted ? (
              <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-[#F1FF0A]/20 border-2 border-[#F1FF0A] flex items-center justify-center mx-auto text-neutral-950 dark:text-[#F1FF0A]">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-neutral-950 dark:text-white">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                    Thank you for reaching out. We will get back to your email ({formData.email}) shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-300">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Nokib Ahmed"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-xs font-medium outline-none focus:border-[#F1FF0A]"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-xs font-medium outline-none focus:border-[#F1FF0A]"
                    />
                  </div>
                </div>

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-300">
                    Topic / Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-medium outline-none focus:border-[#F1FF0A] cursor-pointer"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Custom Scraper Request">Custom Scraper Request</option>
                    <option value="Report an Issue / Bug">Report an Issue / Bug</option>
                    <option value="Enterprise / Agency License">Enterprise / Agency License</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                  </select>
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what store you'd like to scrape, or how we can help..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-xs font-medium outline-none focus:border-[#F1FF0A] resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#F1FF0A]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <span>Sending message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
