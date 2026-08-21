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

I came across {{businessName}} while looking into HVAC companies in {{city}} — your review count stood out.

I wanted to ask a simple question: what happens to your inbound calls when your techs are out on jobs?

Most HVAC owners I speak with don't realize how many leads go unanswered during peak season. Someone calls about a broken AC in August, gets voicemail, and books with the next company that picks up.

I run CyberCraft360, a small automation company that builds AI systems specifically for service businesses. We handle inbound calls, qualify the lead, and book the appointment — even at 11pm when your office is closed.

I wrote a short piece on our blog about this exact problem if you'd like to take a look:
${SITE}/blog

And if you want to see what we do: ${SITE}

No pitch, no pressure. If it's relevant I'd love to have a 15-minute conversation this week.

Best,
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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

I was looking at dental practices in {{city}} and came across {{businessName}} — you're clearly doing something right.

I wanted to raise something that often goes unnoticed: after-hours patient calls. When someone has a toothache at 7pm or a dental emergency on a Saturday, they call whoever comes up first on Google. If nobody answers, they book with the next practice that does.

I run CyberCraft360, and we build AI systems that handle exactly this — answering after-hours calls, collecting patient details, and scheduling appointments so your team has a full calendar waiting for them Monday morning.

If you're curious about how it works, we've written about it on our blog: ${SITE}/blog

And you can see what we build here: ${SITE}

Would a short call this week make sense? I can keep it to 15 minutes.

Best,
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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

I came across {{businessName}} in {{city}} and wanted to reach out directly.

There's a well-known stat in real estate: leads that don't get a response within 5 minutes are 80% less likely to convert. The problem is, that window is nearly impossible to hit when you're in the middle of a showing.

I run CyberCraft360, and we build AI systems that respond to new leads instantly, qualify them based on your criteria, and keep them engaged until you're free to have a real conversation.

It's not a chatbot. It's a fully automated system built around your specific business and the way you work.

You can see what we do at ${SITE}, and our blog at ${SITE}/blog has a few pieces on lead conversion that might be worth your time.

Would a 15-minute call make sense this week?

Best,
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
      },
      {
        day: 14,
        subject: "Closing out — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me.

If automating lead response or follow-up ever moves up your priority list, take a look at what we do at ${SITE}. Our blog also has some relevant reading for agents thinking about scaling without adding headcount: ${SITE}/blog

Wishing you a strong market ahead.

Best,
Saad
CyberCraft360
${SITE}`,
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

I came across {{businessName}} in {{city}} and wanted to reach out.

Running a business means wearing a lot of hats — and one of the most time-consuming is managing inbound calls, following up with leads, and booking appointments. Most business owners I speak with are handling this manually, and it's costing them hours a week they could be spending elsewhere.

I run CyberCraft360, and we build AI-powered systems that take care of all of this automatically. Calls get answered, leads get qualified, appointments get booked — without you needing to be involved in every step.

If you'd like to see what we do and how we've helped businesses like yours, our website is a good place to start: ${SITE}

We also write regularly about automation and business efficiency on our blog: ${SITE}/blog

Would a 15-minute call make sense to explore whether it's a fit?

Best,
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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
Saad
CyberCraft360
${SITE}`,
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

export function personalizeEmail(template: string, lead: Enrollment): string {
  const ownerFirst = lead.ownerName?.split(" ")[0] ?? "there";
  return template
    .replace(/\{\{businessName\}\}/g, lead.leadName)
    .replace(/\{\{ownerName\}\}/g, ownerFirst)
    .replace(/\{\{city\}\}/g, lead.leadCity)
    .replace(/\{\{industry\}\}/g, lead.leadIndustry)
    .replace(/\{\{reviewCount\}\}/g, "");
}
