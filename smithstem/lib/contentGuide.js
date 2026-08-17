// Extracted from the real trial creator guides Smith shared (Aura_Trial_
// Creator_Guide.docx, NQ_Trial_Creator_Guide_Revised.docx,
// Cashdrive_Cars_Trial_Creator_Guide_1.pdf) — only the parts that actually
// help someone decide what to film and get set up: content formats, house
// style, the account-setup steps, and who reviews the work. Saved-detail
// tables and creator passwords stay out of the app entirely (the last of
// those was an explicit no from an earlier pass this session). Steps are
// broken out as their own array, not one paragraph, per Smith's own
// instruction on how instructional copy should read.
const CONTENT_GUIDES = {
  northquest: {
    trialViews: 10000,
    beforeSteps: [
      "Create a brand-new Gmail — not linked to your phone number — used only for your NorthQuest accounts.",
      "Use it to set up new TikTok, Instagram, and Facebook accounts under your own name or nickname. Never anything with \"northquest\" or \"nq\" in it — the point is that it reads as a real person, not a brand.",
      "Link Facebook to your Instagram so posts go out there automatically once you're live.",
      "Save your login info somewhere of your own — a notes app or password manager, not Smithstem. You'll need it again at onboarding.",
    ],
    posting: "Shoot 2 videos a day, minimum. Post the same 2 videos on TikTok and Instagram — not 2 per platform separately, the same 2 cross-posted to both. Facebook goes out automatically once it's linked.",
    reviewNote: "Nothing goes up without review first. Follow the reviewer on TikTok (@ellaikipo) to stay in the loop.",
    styleLine: "Sound like a real person talking to a friend, not a brand talking to a customer. Don't sell the app — sell the feeling of having your money sorted. The app is just how you got there.",
    formats: [
      { name: "The Relatable Joke", description: "You're not selling. You're laughing at a shared truth. NorthQuest shows up as part of the punchline, not the pitch." },
      { name: "The Soft Flex", description: "You're not bragging. You're just noticing the difference between people who save and people who don't. Said simply. Said with calm." },
      { name: "The Money Drama", description: "There's a story, a transfer, a twist. Something happened that made people stop scrolling. NorthQuest is in the scene but doesn't need to be the headline." },
      { name: "The Casual Mention", description: "NorthQuest is just on the list, among other things you actually use. No fanfare — sometimes low-pressure hits harder than a direct pitch." },
    ],
    afterHire: "Once you're hired, monthly pay is based on a quota of 62 cross-posted videos a month (about 2 a day). Pay follows what's actually completed.",
  },
  aura: {
    trialViews: 10000,
    beforeSteps: [
      "Create a brand-new Gmail — not linked to your phone number — used only for your Aura accounts.",
      "Use it to set up new TikTok, Instagram, and Facebook accounts under your own name or nickname. Never anything with \"aura\" in it.",
      "Link Facebook to your Instagram so posts go out there automatically once you're live.",
      "Save your login info somewhere of your own — a notes app or password manager, not Smithstem. You'll need it again at onboarding.",
    ],
    posting: "Shoot at least 2 videos a day — this matches the pace you'll need once you're an active creator. Post the same videos on TikTok and Instagram, cross-posted, not separate per platform. Facebook goes out automatically once it's linked.",
    reviewNote: "Nothing goes up without review first. Follow the reviewer on TikTok (@ellaikipo) to stay in the loop.",
    styleLine: "Sound like someone who actually uses Aura, not someone reading out its features. Ask yourself: would I actually send this to a friend because it's fun or interesting? If not, rewrite it.",
    formats: [
      { name: "The Story Reaction", description: "React in real time as you go through an interactive story — your actual choices, your actual reactions." },
      { name: "The Group Challenge", description: "Film yourself and friends playing a quiz or game together — the energy of playing with people, not against a screen." },
      { name: "The Late Night Chat", description: "A casual, low-key clip of talking to Aura like you would a friend — nothing scripted, nothing salesy." },
      { name: "The Story I Made", description: "Show off a personal story you built inside the app, the way you'd show off something you made, not something you're advertising." },
    ],
    afterHire: "Once you're hired, monthly pay is based on a quota of 62 cross-posted videos a month (about 2 a day). Pay follows what's actually completed.",
  },
  cashdrive: {
    trialViews: 5000,
    beforeSteps: [
      "Create a brand-new Gmail — not linked to your phone number — used only for your CashDrive accounts.",
      "Use it to set up new TikTok and Instagram accounts. Whatever name or handle you like.",
      "Save your login info somewhere of your own — a notes app or password manager, not Smithstem. You'll need it again at onboarding.",
    ],
    posting: "Shoot 2 videos a day, minimum. Post the same 2 videos on TikTok and Instagram — the same 2 cross-posted to both, not 2 per platform.",
    reviewNote: "Nothing goes up without review first. Follow the reviewer on TikTok (@ellaikipo) to stay in the loop.",
    styleLine: "Don't sell the car. Sell the feeling of driving away in something you trust, without the headache of buying it. The dealership is just how you got there.",
    formats: [
      { name: "The Car Experience", description: "What it's like to drive a specific car — the feel, the sound, the vibe. You're not listing specs, you're showing what it's like to be behind the wheel." },
      { name: "Trust and Scam Answers", description: "How to verify car papers, spot a rolled-back odometer, or check if a car was flooded. Positions CashDrive as the safe place to buy." },
      { name: "Price Category Videos", description: "What ₦15 million gets you. What you can buy with ₦8 million. Browse-along, shopping together with the viewer." },
      { name: "The Car Spotter", description: "Aspirational hype featuring the cars — beautiful shots, good angles, making them look desirable." },
    ],
    afterHire: "Once you're hired, pay is ₦200,000 a month, flat — worked out as ₦3,226 a video across a 62-video monthly quota (about 2 a day). Pay follows what's actually completed.",
  },
};

export function contentGuideFor(slug) {
  return CONTENT_GUIDES[slug] || null;
}
