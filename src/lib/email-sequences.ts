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

export const DEFAULT_SEQUENCES: Sequence[] = [
  {
    id: "hvac-seq",
    name: "HVAC Outreach",
    industry: "HVAC",
    steps: [
      {
        day: 0,
        subject: "{{businessName}} — a quick question",
        body: `Hi {{ownerName}},

{{observation}}

I wanted to ask a simple question: what happens to your inbound calls when your techs are out on jobs?

Most HVAC owners I speak with don't realize how many leads go unanswered during peak season. Someone calls about a broken AC in August, gets voicemail, and books with the next company that picks up.{{missedCallNote}}

I run CyberCraft360, a small automation company that builds AI systems specifically for service businesses. We handle inbound calls, qualify the lead, and book the appointment — even at 11pm when your office is closed.{{noWebsiteNote}}

I wrote a short piece on our blog about this exact problem if you'd like to take a look:
${SITE}/blog

And if you want to see what we do: ${SITE}

No pitch, no pressure. If it's relevant I'd love to have a 15-minute conversation this week.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — following up",
        body: `Hi {{ownerName}},

Just checking back on my previous message.

I know how busy things get — that's the whole point of what we build. When you're managing a team out in the field, the last thing you want is to also be chasing down missed calls.

One of our clients, an HVAC company, was losing an estimated 4-6 inbound leads a week just from unanswered calls during busy periods. Within the first month of using our system, those calls started converting into booked jobs automatically.

If that sounds like something worth exploring for {{businessName}}, I'm happy to show you how it works — takes about 15 minutes over a call or video.

You can also learn more about what we do here: ${SITE}

Happy to work around your schedule.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "One thing I wanted to share — {{businessName}}",
        body: `Hi {{ownerName}},

I wanted to share something useful before I stop following up.

We recently published a breakdown on our blog of the most common ways HVAC companies in competitive markets are losing revenue without realising it — missed calls is the biggest one, but there are a few others worth knowing about.

You can read it here: ${SITE}/blog

If any of it resonates, or you'd like to talk through what it would look like for {{businessName}} specifically, just reply to this email and we'll set something up.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Closing out — {{businessName}}",
        body: `Hi {{ownerName}},

This is my last message — I don't want to clog your inbox.

If there's ever a point where managing calls, bookings, or lead follow-up becomes something you want to take off your plate, I'd be glad to help. That's what CyberCraft360 is built for.

You can explore what we do anytime at ${SITE} — and our blog at ${SITE}/blog has some practical reads on automation for service businesses.

Wishing you a strong season.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
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
        subject: "{{businessName}} — patients calling after hours",
        body: `Hi {{ownerName}},

{{observation}}

I wanted to raise something that often goes unnoticed: after-hours patient calls. When someone has a toothache at 7pm or a dental emergency on a Saturday, they call whoever comes up first on Google. If nobody answers, they book with the next practice that does.

I run CyberCraft360, and we build AI systems that handle exactly this — answering after-hours calls, collecting patient details, and scheduling appointments so your team has a full calendar waiting for them Monday morning.{{missedCallNote}}{{noWebsiteNote}}

If you're curious about how it works, we've written about it on our blog: ${SITE}/blog

And you can see what we build here: ${SITE}

Would a short call this week make sense? I can keep it to 15 minutes.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — quick follow-up",
        body: `Hi {{ownerName}},

Following up briefly in case my first message got buried.

Dental practices that add automated after-hours call handling typically see a meaningful uptick in new patient bookings — simply because they're capturing inquiries that would have otherwise gone to a competitor.

The system we build answers the call in your practice's name, collects the patient's details and reason for calling, and books the appointment directly into your schedule. No voicemail, no missed opportunity.

You can read more about our work at ${SITE}, and our blog at ${SITE}/blog has a few pieces relevant to this if you're interested.

Happy to walk you through it — 15 minutes is all it takes.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "Something worth reading — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop following up, I wanted to share something.

We've put together content on our blog covering how small and mid-size practices are using automation to grow without increasing overhead. It's practical, not theoretical — drawn from what we've actually built for clients.

${SITE}/blog

If any of it is useful for {{businessName}}, great. And if you ever want to talk through what it could look like for your practice specifically, just reply and we'll find a time.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Last message — {{businessName}}",
        body: `Hi {{ownerName}},

This is my final follow-up — I won't reach out again after this.

If capturing after-hours patient calls or reducing the admin burden on your front desk ever becomes a priority, CyberCraft360 is worth looking at: ${SITE}

Our blog also has some reading on how automation is changing the way small practices operate: ${SITE}/blog

Thanks for your time. Wishing {{businessName}} continued success.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
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
        subject: "{{businessName}} — leads going cold while you're on a showing",
        body: `Hi {{ownerName}},

{{observation}}

There's a well-known stat in real estate: leads that don't get a response within 5 minutes are 80% less likely to convert. The problem is, that window is nearly impossible to hit when you're in the middle of a showing.

I run CyberCraft360, and we build AI systems that respond to new leads instantly, qualify them based on your criteria, and keep them engaged until you're free to have a real conversation.{{missedCallNote}}{{noWebsiteNote}}

It's not a chatbot. It's a fully automated system built around your specific business and the way you work.

You can see what we do at ${SITE}, and our blog at ${SITE}/blog has a few pieces on lead conversion that might be worth your time.

Would a 15-minute call make sense this week?

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — following up",
        body: `Hi {{ownerName}},

Just following up in case my last message got lost.

A real estate agent I worked with in a similar market was spending roughly 2 hours a day on initial lead qualification — calls, texts, follow-ups. After implementing our system, that dropped close to zero. The AI handles the first conversation and surfaces only the leads that are actually ready to move.

That means more time at showings, more time closing, less time chasing cold leads that go nowhere.

More about how we work: ${SITE}
Blog: ${SITE}/blog

Happy to show you a live demo — 15 minutes over a call or video.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "Quick thought — {{businessName}}",
        body: `Hi {{ownerName}},

One last thought before I close out my follow-ups.

The real estate agents getting the most leverage right now aren't necessarily the ones working the hardest — they're the ones who've automated the parts of the business that don't require them personally.

We've written about this on our blog: ${SITE}/blog

If you'd ever like to talk through how that could apply to {{businessName}}, I'd be glad to. No pitch, just a conversation.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me.

If automating lead response or follow-up ever moves up your priority list, take a look at what we do at ${SITE}. Our blog also has some relevant reading for agents thinking about scaling without adding headcount: ${SITE}/blog

Wishing you a strong market ahead.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
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
        subject: "{{businessName}} — a question about intake calls",
        body: `Hi {{ownerName}},

{{observation}}

One thing I hear consistently from attorneys and small firms: potential clients call during a consultation, during court, or after hours — and when nobody answers, they call the next firm on the list. That lead, and the fees attached to it, are gone.

I run CyberCraft360, and we build AI systems that handle intake calls automatically. The AI answers in your firm's name, collects the caller's details and case type, and either books a consultation or sends you a summary to follow up — so no potential client slips through.{{missedCallNote}}{{noWebsiteNote}}

You can see what we do at https://cybercraft360.com, and our blog covers how service businesses are using AI to stop losing inbound leads: https://cybercraft360.com/blog

Would a 15-minute conversation make sense this week?

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — following up",
        body: `Hi {{ownerName}},

Following up briefly in case my first message got buried.

The firms I've worked with that see the biggest impact are typically solo practitioners or small teams where every call matters — there's no receptionist catching what falls through the cracks.

Our system changes that. Every call gets answered, every intake gets logged, and you wake up knowing exactly who called and why.

More on how it works: https://cybercraft360.com
Blog: https://cybercraft360.com/blog

Happy to keep it to 15 minutes if you're curious.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "One thing worth reading — {{businessName}}",
        body: `Hi {{ownerName}},

Before I close out my follow-ups, I wanted to share something useful.

We've written on our blog about how solo and small-firm attorneys are using AI to handle intake without hiring additional staff — it's practical and specific to firms like {{businessName}}.

https://cybercraft360.com/blog

If any of it is relevant, or you'd like to talk through what it would look like for your practice, just reply and we'll find a time.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Last message — {{businessName}}",
        body: `Hi {{ownerName}},

This is my final follow-up.

If capturing intake calls automatically ever becomes a priority for {{businessName}}, I'd welcome the conversation: https://cybercraft360.com

Our blog is also worth bookmarking if you're thinking about this area: https://cybercraft360.com/blog

Wishing you continued success.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
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
        subject: "{{businessName}} — after-hours bookings",
        body: `Hi {{ownerName}},

{{observation}}

I wanted to raise something that med spas and aesthetic clinics often overlook: after-hours booking inquiries. When someone decides they want a treatment at 8pm on a Tuesday and calls your clinic, if nobody answers they'll book with whoever does — often a competitor running the same services.

I run CyberCraft360 and we build AI systems that handle exactly this. The AI answers calls in your clinic's name, collects the client's details and service interest, and books the appointment directly — even outside office hours.{{missedCallNote}}{{noWebsiteNote}}

You can see our work at https://cybercraft360.com, and our blog has relevant reading on how aesthetic practices are using automation to grow bookings: https://cybercraft360.com/blog

Would a 15-minute call make sense this week?

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — quick follow-up",
        body: `Hi {{ownerName}},

Just following up on my previous message.

Med spas that add automated after-hours call handling typically see a meaningful increase in new client bookings — not from spending more on advertising, but simply from capturing inquiries that were already coming in and going unanswered.

The system handles the booking in your name, so the client experience is seamless.

More on what we build: https://cybercraft360.com
Blog: https://cybercraft360.com/blog

Happy to show you exactly how it works — 15 minutes is all it takes.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "Something useful — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop following up, I wanted to share something that might be worth your time.

We've put together content on our blog covering how aesthetic clinics and med spas are using AI to increase bookings without increasing headcount. It's practical, based on what we've actually built.

https://cybercraft360.com/blog

If any of it resonates for {{businessName}}, just reply and we can set up a call.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me.

If automating bookings or after-hours call handling ever becomes a priority, take a look at what we do: https://cybercraft360.com

Our blog is also worth a read if you're thinking about this space: https://cybercraft360.com/blog

Wishing {{businessName}} continued growth.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
https://cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`,
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
        subject: "{{businessName}} — quick question about your inbound calls",
        body: `Hi {{ownerName}},

{{observation}}

Running a business means wearing a lot of hats — and one of the most time-consuming is managing inbound calls, following up with leads, and booking appointments. Most business owners I speak with are handling this manually, and it's costing them hours a week they could be spending elsewhere.

I run CyberCraft360, and we build AI-powered systems that take care of all of this automatically. Calls get answered, leads get qualified, appointments get booked — without you needing to be involved in every step.{{missedCallNote}}{{noWebsiteNote}}

If you'd like to see what we do and how we've helped businesses like yours, our website is a good place to start: ${SITE}

We also write regularly about automation and business efficiency on our blog: ${SITE}/blog

Would a 15-minute call make sense to explore whether it's a fit?

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 3,
        subject: "Re: {{businessName}} — following up",
        body: `Hi {{ownerName}},

Just circling back in case my first message got buried.

The short version of what we do: we build custom AI systems that handle the parts of your business that are repetitive and time-consuming — inbound calls, lead follow-up, appointment booking — so you and your team can focus on the work that actually requires you.

Every system we build is specific to the business, not an off-the-shelf product.

You can see our work here: ${SITE}
And our blog if you'd like some reading: ${SITE}/blog

Happy to keep it to 15 minutes if you're curious about what it could look like for {{businessName}}.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 7,
        subject: "Something that might be useful — {{businessName}}",
        body: `Hi {{ownerName}},

Before I stop following up, I wanted to share something that might be worth your time.

We've been writing on our blog about how small and medium-sized businesses are using AI automation to reduce costs and grow revenue without hiring additional staff. It covers practical examples, not theory.

${SITE}/blog

If any of it resonates, or you'd like to talk through what it could mean for {{businessName}} specifically, just reply and we can set up a call.

Best,
Saad Imran, Founder
CyberCraft360 — AI Automation for Service Businesses
${SITE}  ·  Schedule a call: +1 (346) 600-9210`,
      },
      {
        day: 14,
        subject: "Last message — {{businessName}}",
        body: `Hi {{ownerName}},

This is my last follow-up — I won't be in touch again after this.

If automating parts of {{businessName}} ever becomes a priority, I'd welcome the conversation. CyberCraft360 builds systems that save business owners real time and real money: ${SITE}

Our blog is also worth a bookmark if you're thinking about this space: ${SITE}/blog

Thanks for your time. All the best.

Saad
CyberCraft360
${SITE}`,
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
