import dns from 'dns';
import mongoose from 'mongoose';
import { QuizModel } from '../models/Quiz';
import { env } from '../config/env';

// Configure reliable DNS for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore fallback
}

export const MINING_STATUTORY_QUESTIONS = [
  // --- Domain 1: Coal Mines Regulations (CMR 2017) & Statutory Rules ---
  {
    text: 'Under Coal Mines Regulations (CMR 2017), what is the maximum permissible concentration of inflammable gas (Methane) in the return airway of a ventilating district?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: '0.50% by volume' },
      { id: 'opt2', text: '0.75% by volume (Statutory Limit)' },
      { id: 'opt3', text: '1.25% by volume' },
      { id: 'opt4', text: '2.00% by volume' },
    ],
    correctOptionIds: ['opt2'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under CMR 2017 Regulation 153, the concentration of inflammable gas shall not exceed 0.75% in the return airway of any ventilating district.',
  },
  {
    text: 'At what concentration of inflammable gas (CH4) in the general body of air must all electric power be immediately cut off in a coal mine?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: '0.50%' },
      { id: 'optB', text: '0.75%' },
      { id: 'optC', text: '1.25%' },
      { id: 'optD', text: '1.50%' },
    ],
    correctOptionIds: ['optC'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under CMR Regulation 154, when inflammable gas reaches 1.25% in the general body of air, all electrical supply must be disconnected immediately.',
  },
  {
    text: 'According to CMR 2017, within what timeframe prior to the commencement of work in a shift must a competent person (Mining Sirdar) inspect the district?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: 'Within 2 hours immediately before shift commencement' },
      { id: 'opt2', text: 'Within 4 hours before shift commencement' },
      { id: 'opt3', text: 'At any time during the preceding shift' },
      { id: 'opt4', text: 'Within 30 minutes of shift commencement' },
    ],
    correctOptionIds: ['opt1'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under CMR Regulation 129, the pre-shift inspection by the Mining Sirdar shall be made within two hours immediately before the commencement of the shift.',
  },
  {
    text: 'What is the minimum height of an underground travelling roadway prescribed under Coal Mines Regulations?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: '1.5 meters' },
      { id: 'optB', text: '1.8 meters' },
      { id: 'optC', text: '2.0 meters' },
      { id: 'optD', text: '2.4 meters' },
    ],
    correctOptionIds: ['optB'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'CMR mandates that every travelling roadway in an underground coal mine must be maintained at a minimum clear height of not less than 1.8 meters.',
  },
  {
    text: 'How frequently must the Mine Safety Committee meet under the statutory DGMS guidelines?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: 'At least once every 15 days' },
      { id: 'opt2', text: 'At least once every month' },
      { id: 'opt3', text: 'Once every quarter' },
      { id: 'opt4', text: 'Bi-annually' },
    ],
    correctOptionIds: ['opt2'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Safety committee meetings must be convened at least once every calendar month to review safety protocols, accidents, and remedial measures.',
  },
  {
    text: 'Under the Mines Act 1952, within how many hours must notice of a fatal or serious bodily injury accident be transmitted to the Chief Inspector of Mines (DGMS)?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: 'Within 12 hours' },
      { id: 'optB', text: 'Within 24 hours' },
      { id: 'optC', text: 'Within 48 hours' },
      { id: 'optD', text: 'Within 7 days' },
    ],
    correctOptionIds: ['optB'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under Section 23 of the Mines Act, written notice of fatal and serious accidents must be delivered within 24 hours in the prescribed statutory format (Form IV-A).',
  },

  // --- Domain 2: Mine Ventilation & Mine Gases ---
  {
    text: 'What is the minimum statutory quantity of air per minute required per person employed in the largest shift in an underground coal mine?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: '2.5 cubic meters per minute' },
      { id: 'opt2', text: '4.5 cubic meters per minute' },
      { id: 'opt3', text: '6.0 cubic meters per minute' },
      { id: 'opt4', text: '10.0 cubic meters per minute' },
    ],
    correctOptionIds: ['opt3'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'CMR Regulation 153 specifies a minimum air supply of 6 cubic meters per minute for every person employed in the mine on the largest shift.',
  },
  {
    text: 'Why is Methane (Firedamp) gas testing with a Flame Safety Lamp always conducted near the roof/highest accessible point of the airway?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: 'Methane has a relative density of 0.55 and accumulates along the roof' },
      { id: 'optB', text: 'Air velocity is fastest near the floor' },
      { id: 'optC', text: 'Carbon dioxide pushes methane downward' },
      { id: 'optD', text: 'The lamp flame can only burn upside down' },
    ],
    correctOptionIds: ['optA'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Methane (CH4) has a relative density of approximately 0.554 (air = 1.0) and naturally layers and accumulates in cavities and roof horizons.',
  },
  {
    text: 'What is the maximum permissible 8-hour Time Weighted Average (TWA) threshold limit for Carbon Monoxide (CO) in underground mine air?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: '10 ppm' },
      { id: 'opt2', text: '25 ppm' },
      { id: 'opt3', text: '50 ppm' },
      { id: 'opt4', text: '100 ppm' },
    ],
    correctOptionIds: ['opt3'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'The DGMS threshold limit value for Carbon Monoxide in mine atmosphere is 50 ppm (0.005%) for a standard 8-hour working shift.',
  },
  {
    text: 'Which instrument is commonly utilized for measuring low air velocities (below 0.5 m/s) in underground coal mine roadways?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: 'Vane Anemometer' },
      { id: 'optB', text: 'Kata Thermometer / Smoke Tube' },
      { id: 'optC', text: 'Pitot Tube' },
      { id: 'optD', text: 'Barometer' },
    ],
    correctOptionIds: ['optB'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Smoke tubes and cooling Kata thermometers measure sluggish air currents below the stalling threshold of mechanical vane anemometers.',
  },

  // --- Domain 3: Strata Control & Underground Support ---
  {
    text: 'What is the statutory minimum anchorage load capacity required for high-tensile resin roof bolts installed under Systematic Support Rules (SSR)?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: '3 tonnes' },
      { id: 'opt2', text: '6 tonnes' },
      { id: 'opt3', text: '10 tonnes (minimum anchorage)' },
      { id: 'opt4', text: '25 tonnes' },
    ],
    correctOptionIds: ['opt3'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'DGMS circulars specify that full-column resin-grouted roof bolts must demonstrate a minimum anchorage capacity of 10 tonnes during routine pull testing.',
  },
  {
    text: 'In Bord and Pillar depillaring, what is the primary purpose of installing "indicator props" at the goaf edge?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: 'To provide visual and auditory warning of impending roof weight/fall' },
      { id: 'optB', text: 'To permanently hold the entire weight of the overburden' },
      { id: 'optC', text: 'To measure humidity in the goaf' },
      { id: 'optD', text: 'To hang ventilation brattice cloth' },
    ],
    correctOptionIds: ['optA'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Indicator props bend, creak, and crush under accelerating strata convergence, providing vital advance warning to miners before a main roof fall.',
  },
  {
    text: 'Which resin capsule type provides fast initial setting within 30 to 60 seconds in mechanized roof bolting operations?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: 'Slow setting resin (2 to 5 minutes)' },
      { id: 'opt2', text: 'Quick setting resin (30 to 60 seconds)' },
      { id: 'opt3', text: 'Cementitious cartridge' },
      { id: 'opt4', text: 'Epoxy polyurethane mortar' },
    ],
    correctOptionIds: ['opt2'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Quick-setting polyester resin capsules set within 30-60 seconds at the anchorage horizon, anchoring the bolt end while the remainder cures.',
  },

  // --- Domain 4: Opencast Mining & Blasting Safety ---
  {
    text: 'Under DGMS statutory guidelines, what is the standard radius of the danger zone to be cleared of all personnel during deep-hole blasting in an opencast mine?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: '100 meters' },
      { id: 'optB', text: '300 meters (or 500m where proper blasting shelters are unavailable)' },
      { id: 'optC', text: '1000 meters' },
      { id: 'optD', text: '50 meters' },
    ],
    correctOptionIds: ['optB'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'DGMS guidelines define the statutory blasting danger zone as 300 meters from the blasting site, extended to 500 meters if adequate blasting shelters are absent.',
  },
  {
    text: 'In mechanized opencast coal mines, what is the statutory minimum width required for an operational working bench?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: 'Not less than the height of the bench or widest operating machine width plus 2m' },
      { id: 'opt2', text: 'Exactly 3 meters irrespective of equipment size' },
      { id: 'opt3', text: 'Half the height of the bench' },
      { id: 'opt4', text: 'No statutory width is prescribed' },
    ],
    correctOptionIds: ['opt1'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under CMR Regulation 106, opencast bench width must be at least equal to bench height, or the widest machine plus 2 meters, to ensure heavy earthmoving machinery safety.',
  },
  {
    text: 'In the event of a blasting misfire in an opencast mine, what is the minimum statutory waiting period before any person may approach the face when electrical shotfiring is used?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: '5 minutes' },
      { id: 'optB', text: '15 minutes' },
      { id: 'optC', text: '30 minutes' },
      { id: 'optD', text: '1 hour' },
    ],
    correctOptionIds: ['optC'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Under CMR Regulation 204, when an electric shot has misfired, no person shall enter the danger zone until at least 30 minutes have elapsed after disconnecting the cable.',
  },

  // --- Domain 5: Mine Fires, Inundation & Rescue ---
  {
    text: 'What is the characteristic initial odor signaling the onset of spontaneous combustion (heating) of coal in an underground seam?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: 'Rotten egg smell (H2S)' },
      { id: 'opt2', text: 'Paraffin or petrolic odor known as "Gob Stink"' },
      { id: 'opt3', text: 'Strong garlic scent' },
      { id: 'opt4', text: 'Odorless cold air' },
    ],
    correctOptionIds: ['opt2'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'The distillation of volatile hydrocarbons during early coal self-heating produces a distinct petrol/kerosene aroma termed "gob stink" or "fire stink".',
  },
  {
    text: 'Under CMR standards, what is the minimum percentage of incombustible matter required in coal dust samples collected from roadways in a dry underground coal mine?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: '50% by weight' },
      { id: 'optB', text: '65% by weight' },
      { id: 'optC', text: '75% by weight' },
      { id: 'optD', text: '95% by weight' },
    ],
    correctOptionIds: ['optC'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'CMR Regulation 144 requires treated coal dust mixtures along floor, roof, and sides to maintain an incombustible content of not less than 75% to inhibit explosion propagation.',
  },
  {
    text: 'What is the rated operational duration of a statutory Self-Contained Chemical Oxygen Self-Rescuer (SCSR) carried by underground mine personnel?',
    type: 'mcq' as const,
    options: [
      { id: 'opt1', text: '15 minutes' },
      { id: 'opt2', text: '30 minutes' },
      { id: 'opt3', text: '60 minutes (1 hour) continuous escape duration' },
      { id: 'opt4', text: '4 hours' },
    ],
    correctOptionIds: ['opt3'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Standard emergency SCSR units deliver a minimum of 60 minutes of breathing oxygen to enable safe evacuation through unbreathable post-explosion or fire atmospheres.',
  },
  {
    text: 'What is Graham\'s Ratio (CO/O2 deficiency index) primarily utilized to diagnose in coal mining?',
    type: 'mcq' as const,
    options: [
      { id: 'optA', text: 'The presence and intensity of active spontaneous heating / underground fire' },
      { id: 'optB', text: 'The efficiency of the main surface fan' },
      { id: 'optC', text: 'The calorific value of harvested coal' },
      { id: 'optD', text: 'Water seepage rates from overlying aquifers' },
    ],
    correctOptionIds: ['optA'],
    marks: 1,
    negativeMarks: 0,
    explanation: 'Graham\'s ratio (CO formed per 100 parts of O2 absorbed) is the standard gas chromatographic index used by ventilation officers to detect incipient heating.',
  },
];

export async function seedMiningQuiz() {
  console.log('[Seed] Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[Seed] Connected to database successfully.');

    // Upsert the Official Mining Safety & CMR Statutory Quiz
    const quizData = {
      title: 'Mining Engineering & Safety Regulations (CMR)',
      description: 'Official statutory standardized assessment covering Coal Mines Regulations (CMR 2017), Mine Ventilation, Gas Testing, Strata Control, Opencast Blasting, and Mine Rescue protocols.',
      category: 'Mining & Geo-Engineering',
      durationMinutes: 30,
      totalMarks: 25,
      passingMarks: 15,
      questionsCount: MINING_STATUTORY_QUESTIONS.length,
      questions: MINING_STATUTORY_QUESTIONS,
      shuffleQuestions: true,
      proctoringEnabled: true,
      maxViolationsAllowed: 3,
      status: 'published' as const,
      createdBy: 'admin-statutory',
    };

    const existing = await QuizModel.findOne({ category: 'Mining & Geo-Engineering' });
    if (existing) {
      console.log(`[Seed] Updating existing Quiz '${existing.title}' (${existing._id}) with ${MINING_STATUTORY_QUESTIONS.length} Mining Questions...`);
      existing.questions = MINING_STATUTORY_QUESTIONS as any;
      existing.totalMarks = 25;
      existing.questionsCount = MINING_STATUTORY_QUESTIONS.length;
      await existing.save();
      console.log('[Seed] Update complete.');
    } else {
      console.log(`[Seed] Inserting fresh Mining Quiz with ${MINING_STATUTORY_QUESTIONS.length} Questions...`);
      await QuizModel.create(quizData);
      console.log('[Seed] Insert complete.');
    }

    await mongoose.disconnect();
    console.log('[Seed] Database disconnected cleanly.');
  } catch (error) {
    console.error('[Seed Error]:', (error as Error).message);
  }
}

if (require.main === module) {
  seedMiningQuiz().then(() => process.exit(0)).catch(() => process.exit(1));
}
