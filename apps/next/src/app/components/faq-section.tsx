"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@humanize/ui/components/accordion";

const FAQ_ITEMS = [
  {
    id: "what-is-humanize",
    question: "What is Humanize?",
    answer:
      "Humanize is an AI text tool that converts AI-generated content into human-like text with a 100% human score while maintaining plagiarism-free content.",
  },
  {
    id: "how-often-updates",
    question: "How often do you update the tool?",
    answer:
      "We continuously update our tool to stay ahead of AI detectors and improve the quality of humanized content.",
  },
  {
    id: "student-discounts",
    question: "Do you have discounts for students and educators?",
    answer:
      "Yes, we offer special pricing for students and educators. Please contact our support team for more information.",
  },
  {
    id: "payment-methods",
    question: "What forms of payment do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and other common payment methods.",
  },
  {
    id: "cancel-subscription",
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel your subscription at any time from your account settings.",
  },
  {
    id: "switch-plans",
    question: "How do I switch from a Pro plan to a Team plan?",
    answer:
      "You can upgrade or downgrade your plan anytime from your account dashboard.",
  },
  {
    id: "enterprise-vs-team",
    question: "What is the difference between Enterprise plan and Team plan?",
    answer:
      "Enterprise plan includes additional features like advanced analytics, dedicated support, and custom integrations.",
  },
  {
    id: "refund-policy",
    question: "What is your refund policy?",
    answer:
      "We offer a 30-day money-back guarantee. Contact our support team for refund requests.",
  },
];

export function FAQSection() {
  return (
    <div className="w-full bg-white py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-semibold text-2xl text-slate-900 sm:text-3xl md:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion className="space-y-2" collapsible type="single">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                className="rounded-lg border-slate-200 bg-white px-4"
                key={item.id}
                value={item.id}
              >
                <AccordionTrigger className="py-4 text-slate-900 hover:text-slate-700">
                  <span className="text-left font-medium">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-8 text-center text-slate-600 text-sm sm:text-base">
            Still have more questions? Find answers in our{" "}
            <a
              className="text-slate-900 underline hover:text-slate-700"
              href="/help"
            >
              help center
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
