// Extracted from the real trial creator guides Smith shared (Aura_Trial_
// Creator_Guide.docx, NQ_Trial_Creator_Guide_Revised.docx,
// Cashdrive_Cars_Trial_Creator_Guide_1.pdf) — only the parts that actually
// help someone decide what to film: the content formats and the one piece
// of house style. Account setup, saved-detail tables, and creator passwords
// stay out of the app entirely (the last of those was an explicit no from
// an earlier pass this session).
const CONTENT_GUIDES = {
  northquest: {
    styleLine: "Sound like a real person talking to a friend, not a brand talking to a customer. Don't sell the app — sell the feeling of having your money sorted. The app is just how you got there.",
    formats: [
      { name: "The Relatable Joke", description: "You're not selling. You're laughing at a shared truth. NorthQuest shows up as part of the punchline, not the pitch." },
      { name: "The Soft Flex", description: "You're not bragging. You're just noticing the difference between people who save and people who don't. Said simply. Said with calm." },
      { name: "The Money Drama", description: "There's a story, a transfer, a twist. Something happened that made people stop scrolling. NorthQuest is in the scene but doesn't need to be the headline." },
      { name: "The Casual Mention", description: "NorthQuest is just on the list, among other things you actually use. No fanfare — sometimes low-pressure hits harder than a direct pitch." },
    ],
  },
  aura: {
    styleLine: "Sound like someone who actually uses Aura, not someone reading out its features. Ask yourself: would I actually send this to a friend because it's fun or interesting? If not, rewrite it.",
    formats: [
      { name: "The Story Reaction", description: "React in real time as you go through an interactive story — your actual choices, your actual reactions." },
      { name: "The Group Challenge", description: "Film yourself and friends playing a quiz or game together — the energy of playing with people, not against a screen." },
      { name: "The Late Night Chat", description: "A casual, low-key clip of talking to Aura like you would a friend — nothing scripted, nothing salesy." },
      { name: "The Story I Made", description: "Show off a personal story you built inside the app, the way you'd show off something you made, not something you're advertising." },
    ],
  },
  cashdrive: {
    styleLine: "Don't sell the car. Sell the feeling of driving away in something you trust, without the headache of buying it. The dealership is just how you got there.",
    formats: [
      { name: "The Car Experience", description: "What it's like to drive a specific car — the feel, the sound, the vibe. You're not listing specs, you're showing what it's like to be behind the wheel." },
      { name: "Trust and Scam Answers", description: "How to verify car papers, spot a rolled-back odometer, or check if a car was flooded. Positions CashDrive as the safe place to buy." },
      { name: "Price Category Videos", description: "What ₦15 million gets you. What you can buy with ₦8 million. Browse-along, shopping together with the viewer." },
      { name: "The Car Spotter", description: "Aspirational hype featuring the cars — beautiful shots, good angles, making them look desirable." },
    ],
  },
};

export function contentGuideFor(slug) {
  return CONTENT_GUIDES[slug] || null;
}
