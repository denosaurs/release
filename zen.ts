const quotes = [
  "It's not fully shipped until it's fast.",
  "Practicality beats purity.",
  "Avoid administrative distraction.",
  "Mind your words, they are important.",
  "Non-blocking is better than blocking.",
  "Design for failure.",
  "Half measures are as bad as nothing at all.",
  "Favor focus over features.",
  "Approachable is better than simple.",
  "Encourage flow.",
  "Anything added dilutes everything else.",
  "Speak like a human.",
  "Responsive is better than fast.",
  "Keep it logically awesome.",
];

export function zen(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
