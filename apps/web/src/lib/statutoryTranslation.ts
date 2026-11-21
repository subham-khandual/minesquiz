// DGMS Statutory Bilingual Translation Dictionary
// Provides statutory Hindi terminology matching official DGMS CBT examinations

const TERM_MAP: Record<string, string> = {
  'Coal Mines Regulations 2017': 'कोयला खान विनियम 2017 (CMR 2017)',
  'Coal Mines Regulations': 'कोयला खान विनियम',
  'Mines Act 1952': 'खान अधिनियम 1952 (Mines Act 1952)',
  'Mines Act': 'खान अधिनियम',
  'Mines Rules 1955': 'खान नियम 1955',
  'Mines Rescue Rules': 'खान बचाव नियम',
  'Directorate General of Mines Safety': 'खान सुरक्षा महानिदेशालय (DGMS)',
  'DGMS': 'डीजीएमएस (DGMS)',
  'Chief Inspector': 'मुख्य निरीक्षक (Chief Inspector)',
  'Regional Inspector': 'क्षेत्रीय निरीक्षक (Regional Inspector)',
  'Manager': 'प्रबंधक (Manager)',
  'Safety Officer': 'सुरक्षा अधिकारी (Safety Officer)',
  'Ventilation Officer': 'वायु संचार अधिकारी (Ventilation Officer)',
  'Overman': 'ओवरमैन (Overman)',
  'Mining Sirdar': 'माइनिंग सरदार (Mining Sirdar)',
  'Shotfirer': 'शॉटफायरर (Shotfirer)',
  'Competent Person': 'सक्षम व्यक्ति (Competent Person)',
  'Flame Safety Lamp': 'फ्लेम सेफ्टी लैंप (Flame Safety Lamp)',
  'Methanometer': 'मीथेनोमीटर (Methanometer)',
  'Ventilating District': 'वायु संचार जिला (Ventilating District)',
  'Return Airway': 'रिटर्न एयरवे (Return Airway)',
  'Intake Airway': 'इनटेक एयरवे (Intake Airway)',
  'Splitting of Air': 'हवा का विभाजन (Air Splitting)',
  'Auxiliary Fan': 'सहायक पंखा (Auxiliary Fan)',
  'Booster Fan': 'बूस्टर पंखा (Booster Fan)',
  'Main Mechanical Ventilator': 'मुख्य यांत्रिक पंखा (MMV)',
  'Stone Dust Barrier': 'स्टोन डस्ट बैरियर (Stone Dust Barrier)',
  'First Aid Station': 'प्राथमिक उपचार केंद्र (First Aid Station)',
  'First Class Manager': 'प्रथम श्रेणी प्रबंधक (First Class Manager)',
  'Second Class Manager': 'द्वितीय श्रेणी प्रबंधक (Second Class Manager)',
  'Gas Testing Certificate': 'गैस टेस्टिंग प्रमाण पत्र',
  'Explosive': 'विस्फोटक (Explosive)',
  'Detonator': 'डेटोनेटर (Detonator)',
  'Magazine': 'मैगज़ीन (Magazine)',
  'Underground': 'भूमिगत (Underground)',
  'Opencast': 'ओपनकास्ट (Opencast)',
  'Haulage Road': 'हॉलेज रोड (Haulage Road)',
  'Winding Engine': 'वाइंडिंग इंजन (Winding Engine)',
  'Safety Lamp': 'सुरक्षा लैंप (Safety Lamp)',
  'Inflammable Gas': 'ज्वलनशील गैस (Inflammable Gas)',
  'Noxious Gas': 'विषाक्त गैस (Noxious Gas)',
};

export function translateToStatutoryHindi(englishText: string): string {
  if (!englishText) return '';

  let translated = englishText;

  // Replace statutory mining terms with official Hindi equivalents
  for (const [en, hi] of Object.entries(TERM_MAP)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, hi);
  }

  // Common statutory question prefixes
  translated = translated
    .replace(/^Under\b/i, 'के तहत (Under)')
    .replace(/^According to\b/i, 'के अनुसार (According to)')
    .replace(/^As per\b/i, 'के नियमानुसार (As per)')
    .replace(/^What is the minimum\b/i, 'न्यूनतम क्या है (Minimum)')
    .replace(/^What is the maximum\b/i, 'अधिकतम क्या है (Maximum)')
    .replace(/^Which of the following\b/i, 'निम्नलिखित में से कौन सा (Which of the following)')
    .replace(/\bminimum\b/gi, 'न्यूनतम (Minimum)')
    .replace(/\bmaximum\b/gi, 'अधिकतम (Maximum)')
    .replace(/\bnot less than\b/gi, 'कम से कम (Not less than)')
    .replace(/\bnot exceeding\b/gi, 'से अधिक नहीं (Not exceeding)')
    .replace(/\bevery year\b/gi, 'प्रत्येक वर्ष')
    .replace(/\bevery month\b/gi, 'प्रत्येक माह')
    .replace(/\bwithin 24 hours\b/gi, '24 घंटे के भीतर')
    .replace(/\bwithin 48 hours\b/gi, '48 घंटे के भीतर');

  return translated;
}
