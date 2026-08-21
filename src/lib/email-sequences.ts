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

export const DEFAULT_SEQUENCES: Sequence[] = [
  {
    id: "hvac-seq",
    name: "HVAC Outreach",
    industry: "HVAC",
    steps: [
      {
        day: 0,
        subject: "Quick question about {{businessName}}",
        body: `Hi {{ownerName}},

I was looking at HVAC businesses in {{city}} and came across {{businessName}} — {{reviewCount}} reviews is impressive.

Quick question: when your techs are out on jobs, what happens to calls coming in? A lot of HVAC owners I talk to lose 3-5 leads a week just from missed calls during busy season.

I build AI systems that answer calls, qualify leads, and book appointments automatically — even at 2am.

Worth a 15-minute chat to see if it fits? No pressure either way.

— Saad
CyberCraft360`,
      },
      {
        day: 3,
        subject: "Re: Quick question about {{businessName}}",
        body: `Hi {{ownerName}},

Just following up on my last message.

I know things get hectic during the season — that's exactly why a lot of HVAC businesses are switching to AI call handling. It doesn't replace your team, it just makes sure no call goes unanswered.

If you'd like to see it in action, I'm happy to do a quick demo this week. Takes 15 minutes.

— Saad
CyberCraft360`,
      },
      {
        day: 7,
        subject: "One last thing — {{businessName}}",
        body: `Hi {{ownerName}},

Last follow-up, I promise.

I put together a quick breakdown of what an AI receptionist typically saves HVAC businesses per month — happy to send it over if useful.

If now's not the right time, no worries at all. Feel free to reach out whenever it makes sense.

— Saad
CyberCraft360`,
      },
      {
        day: 14,
        subject: "Checking in — {{businessName}}",
        body: `Hi {{ownerName}},

Circling back one more time. I've been working with a few {{city}} service businesses on automating their inbound calls and follow-ups.

If it's something you'd want to revisit down the road, just reply and I'll be in touch.

Best,
Saad
CyberCraft360`,
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
        subject: "After-hours patients — {{businessName}}",
        body: `Hi {{ownerName}},

Came across {{businessName}} in {{city}} — great reviews.

One thing I hear a lot from dental offices: patients call after hours and book with whoever picks up. You lose the patient and the revenue without even knowing.

I build AI systems that answer after-hours calls, collect patient info, and schedule appointments — so you capture every lead even when the office is closed.

Would a quick 15-minute call make sense this week?

— Saad
CyberCraft360`,
      },
      {
        day: 3,
        subject: "Re: After-hours patients — {{businessName}}",
        body: `Hi {{ownerName}},

Following up quickly. Dental offices that add AI after-hours booking typically capture 20-30% more new patient appointments per month.

Happy to walk you through exactly how it works for a practice like yours. Takes 15 minutes.

— Saad
CyberCraft360`,
      },
      {
        day: 7,
        subject: "Still thinking about it? — {{businessName}}",
        body: `Hi {{ownerName}},

No worries if the timing isn't right. Just wanted to leave this here: if you ever want to see how other dental offices in {{city}} are handling after-hours calls automatically, I'm happy to show you.

— Saad
CyberCraft360`,
      },
      {
        day: 14,
        subject: "Last note — {{businessName}}",
        body: `Hi {{ownerName}},

Final follow-up from me. If automation ever becomes a priority for {{businessName}}, feel free to reach out. Happy to help.

Best,
Saad
CyberCraft360`,
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
        subject: "Leads going cold — {{businessName}}",
        body: `Hi {{ownerName}},

Noticed {{businessName}} in {{city}} — solid presence.

Real estate moves fast, and leads that don't hear back within 5 minutes are 80% less likely to convert. Most agents can't respond that fast while showing homes.

I build AI systems that instantly respond to new leads, qualify them, and keep them warm until you're ready to talk.

Worth a quick 15-minute chat?

— Saad
CyberCraft360`,
      },
      {
        day: 3,
        subject: "Re: Leads going cold — {{businessName}}",
        body: `Hi {{ownerName}},

Just following up. A few agents I've worked with in {{city}} were losing 40-50% of their leads just from slow response time.

The AI handles the first contact instantly, so you only spend time on leads that are actually ready to move.

Happy to show you how it works — 15 minutes is all it takes.

— Saad
CyberCraft360`,
      },
      {
        day: 7,
        subject: "Quick question — {{businessName}}",
        body: `Hi {{ownerName}},

Last thing: what does your current lead follow-up process look like? If it's mostly manual, there's likely a lot of time being left on the table.

Happy to take a look and show you what's possible. No commitment needed.

— Saad
CyberCraft360`,
      },
      {
        day: 14,
        subject: "Keeping the door open — {{businessName}}",
        body: `Hi {{ownerName}},

This is my last message. If you ever want to talk about automating your lead follow-up, I'd be happy to help.

Best,
Saad
CyberCraft360`,
      },
    ],
  },
  {
    id: "general-seq",
    name: "General Outreach",
    industry: "General",
    steps: [
      {
        day: 0,
        subject: "Quick question — {{businessName}}",
        body: `Hi {{ownerName}},

Came across {{businessName}} in {{city}} — impressive reviews.

I build AI systems that handle inbound calls, follow up with leads, and book appointments automatically. Saves most business owners 10-15 hours a week.

Worth a 15-minute call to see if it's a fit?

— Saad
CyberCraft360`,
      },
      {
        day: 3,
        subject: "Re: Quick question — {{businessName}}",
        body: `Hi {{ownerName}},

Following up briefly. Happy to walk you through exactly how the AI works for businesses like yours — no commitment, just 15 minutes.

— Saad
CyberCraft360`,
      },
      {
        day: 7,
        subject: "One more thought — {{businessName}}",
        body: `Hi {{ownerName}},

Last thought: if missed calls or slow follow-up is something you deal with, I'd love to show you what's possible. Reach out anytime.

— Saad
CyberCraft360`,
      },
      {
        day: 14,
        subject: "Closing the loop — {{businessName}}",
        body: `Hi {{ownerName}},

Last message from me. If automating your follow-ups ever becomes a priority, feel free to get in touch.

Best,
Saad
CyberCraft360`,
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
