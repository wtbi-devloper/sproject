function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function makePlaceholder(
  gradientId: string,
  from: string,
  to: string,
  icon: string,
  label: string
): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">` +
      `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>` +
      `<rect width="600" height="400" fill="url(#${gradientId})"/>` +
      `<text x="300" y="190" text-anchor="middle" font-size="48" fill="white" opacity="0.9">${icon}</text>` +
      `<text x="300" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="white" opacity="0.85">${label}</text>` +
    `</svg>`
  );
}

const GRADIENTS = [
  { id: 'g1', from: '#2C1A0E', to: '#C8962A' },
  { id: 'g2', from: '#1a3a2a', to: '#4ade80' },
  { id: 'g3', from: '#1e293b', to: '#60a5fa' },
  { id: 'g4', from: '#3b1764', to: '#c084fc' },
  { id: 'g5', from: '#7c2d12', to: '#fb923c' },
  { id: 'g6', from: '#0c4a6e', to: '#22d3ee' },
  { id: 'g7', from: '#4a1d3a', to: '#f472b6' },
  { id: 'g8', from: '#1a2e1a', to: '#a3e635' },
  { id: 'g9', from: '#3b2f1e', to: '#fbbf24' },
  { id: 'g10', from: '#1e1b4b', to: '#818cf8' },
];

export const STORY_IMAGES = [
  makePlaceholder('s1', GRADIENTS[0].from, GRADIENTS[0].to, '\u{1F4D6}', 'The Beginning'),
  makePlaceholder('s2', GRADIENTS[1].from, GRADIENTS[1].to, '\u{1F331}', 'Growth Phase'),
  makePlaceholder('s3', GRADIENTS[2].from, GRADIENTS[2].to, '\u{2B50}', 'New Horizons'),
  makePlaceholder('s4', GRADIENTS[3].from, GRADIENTS[3].to, '\u{1F680}', 'Taking Flight'),
  makePlaceholder('s5', GRADIENTS[4].from, GRADIENTS[4].to, '\u{1F3AF}', 'Mission Driven'),
];

export const LOG_IMAGES = [
  makePlaceholder('l1', GRADIENTS[5].from, GRADIENTS[5].to, '\u{1F4CB}', 'Daily Update'),
  makePlaceholder('l2', GRADIENTS[6].from, GRADIENTS[6].to, '\u{1F4BC}', 'Work Progress'),
  makePlaceholder('l3', GRADIENTS[7].from, GRADIENTS[7].to, '\u{1F91D}', 'Collaboration'),
  makePlaceholder('l4', GRADIENTS[8].from, GRADIENTS[8].to, '\u{1F4CA}', 'Milestones'),
  makePlaceholder('l5', GRADIENTS[9].from, GRADIENTS[9].to, '\u{1F525}', 'Highlights'),
];

export const THOUGHT_IMAGES = [
  makePlaceholder('t1', GRADIENTS[3].from, GRADIENTS[3].to, '\u{1F4A1}', 'Insight'),
  makePlaceholder('t2', GRADIENTS[4].from, GRADIENTS[4].to, '\u{1F9E0}', 'Innovation'),
  makePlaceholder('t3', GRADIENTS[0].from, GRADIENTS[0].to, '\u{1F30D}', 'Perspective'),
  makePlaceholder('t4', GRADIENTS[1].from, GRADIENTS[1].to, '\u{1F4AC}', 'Reflection'),
  makePlaceholder('t5', GRADIENTS[2].from, GRADIENTS[2].to, '\u{2728}', 'Vision'),
];

function makePressClipping(outlet: string, type: string, headline: string): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">` +
      `<rect width="800" height="500" fill="#F6F4ED"/>` +
      `<rect x="24" y="20" width="752" height="460" fill="#FFFFFF" stroke="#E2DCD0" stroke-width="1.5" rx="6"/>` +
      `<line x1="44" y1="64" x2="756" y2="64" stroke="#2C1A0E" stroke-width="2.5"/>` +
      `<text x="400" y="54" text-anchor="middle" font-family="'Times New Roman', serif" font-size="22" font-weight="900" letter-spacing="3" fill="#2C1A0E">${outlet.toUpperCase()}</text>` +
      `<line x1="44" y1="70" x2="756" y2="70" stroke="#2C1A0E" stroke-width="1"/>` +
      `<text x="400" y="86" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" letter-spacing="1.5" fill="#8C7A6B">${type.toUpperCase()} EDITION • ARCHIVAL MEDIA FEATURE</text>` +
      `<line x1="44" y1="96" x2="756" y2="96" stroke="#EAE5DB" stroke-width="1"/>` +
      `<text x="400" y="132" text-anchor="middle" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#1C130B">${headline.slice(0, 44)}...</text>` +
      `<rect x="44" y="152" width="220" height="150" fill="#EAE5DB" rx="4"/>` +
      `<rect x="44" y="152" width="220" height="150" fill="none" stroke="#D5CEC0" stroke-width="1"/>` +
      `<line x1="284" y1="162" x2="756" y2="162" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="184" x2="756" y2="184" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="206" x2="756" y2="206" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="228" x2="756" y2="228" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="250" x2="756" y2="250" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="272" x2="756" y2="272" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="284" y1="294" x2="660" y2="294" stroke="#DCD5C7" stroke-width="7"/>` +
      `<line x1="44" y1="330" x2="264" y2="330" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="44" y1="350" x2="264" y2="350" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="44" y1="370" x2="264" y2="370" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="44" y1="390" x2="220" y2="390" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="290" y1="330" x2="510" y2="330" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="290" y1="350" x2="510" y2="350" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="290" y1="370" x2="510" y2="370" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="290" y1="390" x2="470" y2="390" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="536" y1="330" x2="756" y2="330" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="536" y1="350" x2="756" y2="350" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="536" y1="370" x2="756" y2="370" stroke="#E6E0D4" stroke-width="5"/>` +
      `<line x1="536" y1="390" x2="710" y2="390" stroke="#E6E0D4" stroke-width="5"/>` +
      `<rect x="330" y="426" width="140" height="28" fill="#FAF8F3" stroke="#C8962A" stroke-width="1.5" rx="4"/>` +
      `<text x="400" y="445" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="900" letter-spacing="2" fill="#C8962A">PRESS ARCHIVE</text>` +
    `</svg>`
  );
}

function makeOutletLogo(name: string, isSquare = false): string {
  if (isSquare) {
    return svgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
        `<rect width="80" height="80" rx="14" fill="#2C1A0E"/>` +
        `<rect x="4" y="4" width="72" height="72" rx="10" fill="none" stroke="#C8962A" stroke-width="2"/>` +
        `<text x="40" y="49" text-anchor="middle" font-family="'Times New Roman', serif" font-size="26" font-weight="900" fill="#FFFFFF">${name.slice(0, 2).toUpperCase()}</text>` +
      `</svg>`
    );
  }
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60">` +
      `<text x="8" y="38" font-family="Playfair Display, Georgia, serif" font-size="22" font-weight="900" letter-spacing="1.5" fill="#2C1A0E">${name}</text>` +
      `<line x1="8" y1="46" x2="230" y2="46" stroke="#C8962A" stroke-width="1.5" opacity="0.7"/>` +
    `</svg>`
  );
}

export const PRESS_IMAGES = [
  makePressClipping('The Daily Chronicle', 'Newspaper', 'Salman Shariff: Changing Lives Through Philanthropy'),
  makePressClipping('Impact Magazine', 'Magazine', 'Top 40 Under 40 Social Innovators to Watch'),
  makePressClipping('Prajavani News', 'Newspaper', 'How Purpose-Driven Startups Are Reshaping India'),
  makePressClipping('Youth Voice Radio', 'Broadcast', 'Interview: Building a Generation of Believers'),
  makePressClipping('National Herald', 'Newspaper', 'Community Champion Award — Recognizing Impact'),
];

export const DEMO_STORY = [
  { _id: 'demo-s1', year: '2018', title: 'The Spark of Purpose', description: 'A journey began with a simple belief — that entrepreneurship and compassion can change lives. The seeds of impact were planted early.', images: [STORY_IMAGES[0]] },
  { _id: 'demo-s2', year: '2020', title: 'Building Foundations', description: 'Launched the first community initiative focused on education and empowerment, touching over 500 families in the first year.', images: [STORY_IMAGES[1]] },
  { _id: 'demo-s3', year: '2022', title: 'Scaling Impact', description: 'Expanded programs across multiple cities, forming partnerships with NGOs and corporate sponsors to amplify reach.', images: [STORY_IMAGES[2]] },
  { _id: 'demo-s4', year: '2024', title: 'A Movement Takes Shape', description: 'What started as a vision became a movement — inspiring a new generation of believers and leaders across the nation.', images: [STORY_IMAGES[3]] },
];

export const DEMO_LOGS = [
  { _id: 'demo-l1', date: '2026-03-28', title: 'Morning Strategy Session', body: 'Reviewed quarterly goals with the leadership team. Key focus areas: youth mentorship expansion and sustainable funding models.', tags: ['Strategy', 'Leadership'], images: [LOG_IMAGES[0]] },
  { _id: 'demo-l2', date: '2026-03-27', title: 'Community Visit — North Zone', body: 'Spent the day meeting beneficiaries of the skill development program. Heartening to see the tangible impact on ground.', tags: ['Community', 'Impact'], images: [LOG_IMAGES[1]] },
  { _id: 'demo-l3', date: '2026-03-26', title: 'Partnership Meeting with TechCorp', body: 'Discussed the CSR collaboration for digital literacy in rural schools. Exciting possibilities ahead for Phase 2 rollout.', tags: ['Partnership', 'Education'], images: [LOG_IMAGES[2]] },
];

export const DEMO_THOUGHTS = [
  { _id: 'demo-t1', topic: 'Leadership', title: 'Why Servant Leadership Wins', summary: 'True leaders serve first. When you put people before profit, loyalty and impact follow naturally — building legacies, not just businesses.', images: [THOUGHT_IMAGES[0]] },
  { _id: 'demo-t2', topic: 'Philanthropy', title: 'The Ripple Effect of Giving', summary: 'Every act of generosity creates waves far beyond what we see. One scholarship can transform a family for generations to come.', images: [THOUGHT_IMAGES[1]] },
  { _id: 'demo-t3', topic: 'Entrepreneurship', title: 'Purpose Over Profit', summary: 'The most enduring businesses are built on purpose. When your why is bigger than your wallet, success becomes a byproduct of meaning.', images: [THOUGHT_IMAGES[2]] },
];

export const DEMO_PRESS = [
  {
    _id: 'demo-p1',
    outlet: 'The Daily Chronicle',
    outletLogo: makeOutletLogo('Daily Chronicle'),
    mediaType: 'Newspaper',
    title: 'Salman Shariff: The Entrepreneur Changing Lives Through Philanthropy',
    year: '2025',
    url: 'https://example.com/daily-chronicle',
    images: [PRESS_IMAGES[0]],
  },
  {
    _id: 'demo-p2',
    outlet: 'Impact Magazine',
    outletLogo: makeOutletLogo('Impact', true), // Square logo test
    mediaType: 'Magazine',
    title: 'Top 40 Under 40 Social Innovators to Watch Across the Region',
    year: '2024',
    url: 'https://example.com/impact-magazine',
    images: [PRESS_IMAGES[1]],
  },
  {
    _id: 'demo-p3',
    outlet: 'Prajavani News',
    // No logo: tests full text outlet name without any "Prajava..." truncation!
    mediaType: 'Newspaper',
    title: 'How Purpose-Driven Startups Are Reshaping India’s Social Fabric',
    year: '2024',
    url: 'https://example.com/prajavani',
    images: [PRESS_IMAGES[2]],
  },
  {
    _id: 'demo-p4',
    outlet: 'Youth Voice Online',
    outletLogo: makeOutletLogo('Youth Voice'),
    mediaType: 'Online Article',
    title: 'Exclusive Interview: Building a Generation of Believers and Leaders',
    year: '2023',
    url: 'https://example.com/youth-voice',
    images: [PRESS_IMAGES[3]],
  },
  {
    _id: 'demo-p5',
    outlet: 'National Herald',
    outletLogo: makeOutletLogo('NH', true), // Square logo test
    mediaType: 'Newspaper',
    title: 'Community Champion Award — Recognizing Grassroots Groundwork',
    year: '2023',
    url: 'https://example.com/national-herald',
    images: [PRESS_IMAGES[4]],
  },
];

export const ACHIEVEMENT_IMAGES = [
  makePlaceholder('a1', GRADIENTS[0].from, GRADIENTS[0].to, '\u{1F3C6}', 'Award'),
  makePlaceholder('a2', GRADIENTS[4].from, GRADIENTS[4].to, '\u{1F3AF}', 'Goal Reached'),
  makePlaceholder('a3', GRADIENTS[2].from, GRADIENTS[2].to, '\u{1F4AA}', 'Strength'),
  makePlaceholder('a4', GRADIENTS[3].from, GRADIENTS[3].to, '\u{2B50}', 'Excellence'),
  makePlaceholder('a5', GRADIENTS[1].from, GRADIENTS[1].to, '\u{1F31F}', 'Shining'),
];

export const DEMO_ACHIEVEMENTS = [
  { _id: 'demo-a1', icon: '\u{1F3C6}', title: 'Social Entrepreneur of the Year', description: 'Recognized for outstanding contributions to community development through innovative social enterprise models.', year: '2025', images: [ACHIEVEMENT_IMAGES[0]] },
  { _id: 'demo-a2', icon: '\u{1F393}', title: 'Youth Mentorship Excellence Award', description: 'Honored for mentoring over 1,000 young entrepreneurs and helping them launch purpose-driven ventures.', year: '2024', images: [ACHIEVEMENT_IMAGES[1]] },
  { _id: 'demo-a3', icon: '\u{1F30D}', title: 'Global Impact Fellowship', description: 'Selected as a fellow for the Global Impact Accelerator, representing India at the international social innovation summit.', year: '2024', images: [ACHIEVEMENT_IMAGES[2]] },
  { _id: 'demo-a4', icon: '\u{2B50}', title: 'Community Champion — Bangalore', description: 'Awarded by the city council for sustained community service and impact-driven programs across urban underserved areas.', year: '2023', images: [ACHIEVEMENT_IMAGES[3]] },
];
