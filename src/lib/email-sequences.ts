// Default email sequence templates — editable from admin UI
export interface SequenceStep {
  day: number;
  subject: string;
  body: string;
}

export interface Sequence {
  id: string;
  name: string;
  industry: string;
  steps: SequenceStep[];
}

export interface Enrollment {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadIndustry: string;
  leadCity: string;
  ownerName?: string;
  leadFlags?: string[];        // e.g. ["No website", "Missed call signals", "Very few reviews"]
  leadWebsite?: string;
  leadPhone?: string;
  leadRating?: number;
  leadReviewCount?: number;
  sequenceId: string;
  currentStep: number;        // next step index to send (0 = first email not sent yet)
  nextSendAt: string;         // ISO — when to send next step
  status: "active" | "paused" | "completed" | "replied" | "unsubscribed";
  enrolledAt: string;
  sentSteps: number[];        // step indices already sent
  openedSteps: number[];      // step indices opened
  fromEmail: string;
  fromName: string;
}

export interface SentEmail {
  id: string;
  enrollmentId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  step: number;
  subject: string;
  sentAt: string;
  opened: boolean;
  openedAt?: string;
}

const SITE = "https://cybercraft360.com";

const SIG = `Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`;

export const DEFAULT_SEQUENCES: Sequence[] = [
  {
    id: "hvac-seq",
    name: "HVAC Outreach",
    industry: "HVAC",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — missed calls this season?",
        body: `Hi {{ownerName}},

{{observation}}

Quick question: what happens to your inbound calls when your techs are out on jobs?

An HVAC company in Dallas we worked with was losing 5-6 leads a week from unanswered calls during peak season — customers who called, got voicemail, and booked with whoever picked up next. Within 30 days of using our system, those calls were converting into booked jobs automatically.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360 — we build AI call-handling systems specifically for service businesses. Worth a 15-minute conversation?

${SIG}

P.S. We put together a breakdown of how HVAC companies lose revenue without realising it — might be worth a read: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Just checking back — I know how busy things get running a crew.

The system we build handles inbound calls in your company's name, qualifies the lead, and books the appointment — even at 11pm when your office is closed. No staff required, no missed opportunities.

If it's worth 15 minutes, I'm happy to show you how it works: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "one thing before I go — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop reaching out — we published something on our blog specifically about how HVAC companies in competitive markets are losing revenue from missed calls and slow response times.

${SITE}/blog

If any of it rings true for {{businessName}}, just reply and we'll talk.

${SIG}`,
      },
      {
        day: 14,
        subject: "closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me — I won't follow up again after this.

If managing calls, bookings, or lead follow-up ever becomes something you want off your plate, CyberCraft360 is worth a look: ${SITE}

Wishing you a strong season ahead.

${SIG}`,
      },
    ],
  },
  {
    id: "dental-seq",
    name: "Dental Outreach",
    industry: "Dental",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — after-hours calls",
        body: `Hi {{ownerName}},

{{observation}}

Here's something most practices don't track: how many patients call after hours, get voicemail, and book with another dentist before Monday morning.

A dental practice we worked with in Houston added automated after-hours call handling — their new patient bookings increased 22% in the first 60 days, without a single dollar in extra advertising.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360 and we build exactly this kind of system. The AI answers in your practice's name, collects patient details, and books directly into your schedule.

Worth a 15-minute call? ${SITE}

${SIG}

P.S. We wrote about this on our blog if you'd like more context: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Following up briefly in case my first message got buried.

The short version: we build AI systems that answer calls after hours, handle appointment requests, and keep your schedule full — so your front desk walks in Monday morning with a full week already booked.

15 minutes to see if it fits: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "quick read — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop following up — we've put together some practical content on our blog about how small practices are using automation to grow without adding overhead.

${SITE}/blog

If any of it's relevant for {{businessName}}, just reply and we'll find a time.

${SIG}`,
      },
      {
        day: 14,
        subject: "last message — {{businessName}}",
        body: `Hi {{ownerName}},

This is my final note — I won't reach out again.

If capturing after-hours calls or reducing front-desk admin ever becomes a priority, we'd be glad to help: ${SITE}

Wishing {{businessName}} continued success.

${SIG}`,
      },
    ],
  },
  {
    id: "realestate-seq",
    name: "Real Estate Outreach",
    industry: "Real Estate",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — leads going cold?",
        body: `Hi {{ownerName}},

{{observation}}

Industry data is clear: leads that don't get a response within 5 minutes are 80% less likely to convert. When you're on a showing, that window is impossible to hit manually.

A real estate agent we worked with in a similar market cut their lead qualification time from 2 hours a day to near-zero. The AI handles the first conversation and surfaces only the leads ready to move.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360 — we build these systems specifically for agents and brokers. Worth a 15-minute call? ${SITE}

${SIG}

P.S. We wrote about lead conversion and response time on our blog: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Just following up in case my last message got lost.

What we build isn't a chatbot — it's a system specific to how you work, that responds to every new lead instantly, qualifies them, and keeps them engaged until you're free.

More time at showings. Less time chasing cold leads.

Happy to demo it in 15 minutes: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "thought you'd find this useful — {{businessName}}",
        body: `Hi {{ownerName}},

One last thought before I close out — the agents getting the most leverage right now aren't necessarily working harder, they've automated the parts that don't require them personally.

We've written about this: ${SITE}/blog

If you'd ever like to talk through how it applies to {{businessName}}, I'm glad to.

${SIG}`,
      },
      {
        day: 14,
        subject: "closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me.

If automating lead response ever moves up your list, take a look at what we do: ${SITE}

Wishing you a strong market ahead.

${SIG}`,
      },
    ],
  },
  {
    id: "lawfirm-seq",
    name: "Law Firm Outreach",
    industry: "Law Firm",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — intake calls you may be missing",
        body: `Hi {{ownerName}},

{{observation}}

Every unanswered intake call is a potential client — and the fees attached to them — walking to the next firm on the list.

A solo attorney we worked with was missing 3-4 intake calls a week during consultations and court appearances. Our system now answers in their firm's name, logs the case type, and books the consultation automatically. They haven't missed a potential client since.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360 — we build AI intake systems for law firms. Worth 15 minutes? ${SITE}

${SIG}

P.S. We've written about this for attorneys specifically: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Following up briefly — I know your time is limited.

The system we build answers every call in your firm's name, collects the caller's details and case type, and either books a consultation or sends you a summary. Every intake logged, nothing slips through.

15 minutes to walk you through it: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "worth reading — {{businessName}}",
        body: `Hi {{ownerName}},

Before I close out — we've written on our blog about how solo and small-firm attorneys are handling intake without additional staff.

${SITE}/blog

If it's relevant to {{businessName}}, just reply.

${SIG}`,
      },
      {
        day: 14,
        subject: "last message — {{businessName}}",
        body: `Hi {{ownerName}},

Final note from me.

If capturing intake calls automatically ever becomes a priority, I'd welcome the conversation: ${SITE}

Wishing you continued success.

${SIG}`,
      },
    ],
  },
  {
    id: "medspa-seq",
    name: "Med Spa Outreach",
    industry: "Med Spa",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — bookings you're missing after hours",
        body: `Hi {{ownerName}},

{{observation}}

Most booking decisions happen in the evening — after work, when clients are browsing and ready to commit. If your clinic isn't reachable at 8pm, those clients book with whoever is.

A med spa we worked with added automated after-hours call handling and saw a 30% increase in new client bookings within 45 days — without increasing their ad spend.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360 — we build these systems for aesthetic clinics. The AI answers in your clinic's name, captures the service interest, and books the appointment directly.

Worth 15 minutes? ${SITE}

${SIG}

P.S. We've written about this for aesthetic practices on our blog: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Just following up briefly.

The system handles bookings in your clinic's name — the client experience is seamless and every inquiry gets captured, even outside business hours.

Happy to show you exactly how it works in 15 minutes: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "something useful — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop reaching out — we've published content on our blog covering how aesthetic clinics are using automation to grow bookings without growing overhead.

${SITE}/blog

If any of it resonates for {{businessName}}, just reply.

${SIG}`,
      },
      {
        day: 14,
        subject: "closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me.

If automating bookings or after-hours calls ever becomes a priority, take a look: ${SITE}

Wishing {{businessName}} continued growth.

${SIG}`,
      },
    ],
  },
  {
    id: "general-seq",
    name: "General Business Outreach",
    industry: "General",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — a question about your inbound calls",
        body: `Hi {{ownerName}},

{{observation}}

One question: how many inbound calls, quote requests, or booking inquiries does {{businessName}} miss each week when you're busy with the actual work?

Most business owners I speak with are handling all of this manually — and it's costing them hours and leads they don't even know they're losing.{{missedCallNote}}{{noWebsiteNote}}

I run CyberCraft360. We build AI systems that handle inbound calls, qualify leads, and book appointments automatically — built specifically for your business, not an off-the-shelf tool.

Worth 15 minutes? ${SITE}

${SIG}

P.S. We write about this regularly on our blog: ${SITE}/blog`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}}",
        body: `Hi {{ownerName}},

Circling back briefly in case my first message got buried.

What we build is custom — specific to how {{businessName}} operates. Calls answered, leads qualified, appointments booked. No staff required.

15 minutes to see if it fits: ${SITE}

${SIG}`,
      },
      {
        day: 7,
        subject: "thought this might be useful — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop following up — we've been writing on our blog about how small businesses are cutting costs and growing revenue with AI automation. Practical examples, not theory.

${SITE}/blog

If any of it resonates for {{businessName}}, just reply.

${SIG}`,
      },
      {
        day: 14,
        subject: "last message — {{businessName}}",
        body: `Hi {{ownerName}},

This is my last follow-up.

If automating parts of {{businessName}} ever moves up your priority list, I'd welcome the conversation: ${SITE}

Thanks for your time. All the best.

${SIG}`,
      },
    ],
  },
];

// Build a specific observation sentence based on what the scraper found about this lead
function buildObservation(lead: Enrollment): string {
  const flags = lead.leadFlags ?? [];
  const observations: string[] = [];

  if (flags.includes("No website")) {
    observations.push(`I noticed {{businessName}} doesn't have a website listed — which usually means you're relying entirely on calls and word of mouth to bring in new business.`);
  }
  if (flags.includes("Missed call signals")) {
    observations.push(`I came across a few reviews for {{businessName}} mentioning difficulty getting through — which tells me inbound calls may be slipping through the cracks.`);
  }
  if (flags.includes("Very few reviews")) {
    observations.push(`{{businessName}} has relatively few reviews online, which often means a lot of happy customers just aren't being asked — and new leads are judging you against competitors with more visible social proof.`);
  }
  if (lead.leadPhone && flags.includes("No website")) {
    observations.push(`With only a phone number and no web presence, every lead that can't reach you by phone is a lead you lose permanently.`);
  }

  if (observations.length === 0) {
    // Generic observation using what we know
    const rc = lead.leadReviewCount;
    const rat = lead.leadRating;
    if (rc && rc > 50 && rat && rat >= 4.3) {
      observations.push(`I came across {{businessName}} while researching {{industry}} businesses in {{city}} — strong ratings and a solid review count.`);
    } else {
      observations.push(`I came across {{businessName}} while researching {{industry}} businesses in {{city}}.`);
    }
  }

  return observations[0];
}

export function personalizeEmail(template: string, lead: Enrollment): string {
  const ownerFirst = lead.ownerName?.split(" ")[0] ?? "there";
  const observation = buildObservation(lead);

  return template
    .replace(/\{\{businessName\}\}/g, lead.leadName)
    .replace(/\{\{ownerName\}\}/g, ownerFirst)
    .replace(/\{\{city\}\}/g, lead.leadCity)
    .replace(/\{\{industry\}\}/g, lead.leadIndustry)
    .replace(/\{\{reviewCount\}\}/g, lead.leadReviewCount ? String(lead.leadReviewCount) : "")
    .replace(/\{\{observation\}\}/g, observation.replace(/\{\{businessName\}\}/g, lead.leadName).replace(/\{\{industry\}\}/g, lead.leadIndustry).replace(/\{\{city\}\}/g, lead.leadCity))
    .replace(/\{\{noWebsiteNote\}\}/g, (lead.leadFlags ?? []).includes("No website")
      ? `\n\nOne thing I noticed: {{businessName}} doesn't appear to have a website. If a potential customer Googles you and finds nothing, they move on. We can also help with that — a simple, fast landing page that converts is part of what we build.`.replace(/\{\{businessName\}\}/g, lead.leadName)
      : "")
    .replace(/\{\{missedCallNote\}\}/g, (lead.leadFlags ?? []).includes("Missed call signals")
      ? `\n\nI also noticed some reviews mentioning difficulty getting through to {{businessName}} — which is exactly the problem our call-handling system solves.`.replace(/\{\{businessName\}\}/g, lead.leadName)
      : "");
}
