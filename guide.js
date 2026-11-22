/**
 * Plain-language benefit finder.
 * Curated topic-to-benefit navigation, NOT medical advice or a determination
 * that a diagnosis/service/provider qualifies for a PSHCP claim.
 * Source: PSHCP Member Booklet, November 2026, printed pp. 39–42, 80–81;
 * equipment and vision topics also refer to their linked booklet pages.
 */
(function (root, factory) {
  const guide = factory();
  if (typeof module === 'object' && module.exports) module.exports = guide;
  root.PSHCP_GUIDE = guide;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const topics = [
    {
      id: 'back', label: 'Back, neck or muscle pain', icon: '◒',
      match: ['back','neck','shoulder','muscle','stiff','sore','tension','spine','sciatica','sciatic','lower back'],
      intro: 'Several types of practitioners have separate PSHCP benefits. Which service is appropriate depends on your needs and the provider’s advice.',
      benefits: [
        ['physiotherapy','Helps with movement, rehabilitation and physical function.'],
        ['massage','Massage therapy (often called RMT) focuses on muscles and soft tissues.'],
        ['chiropractor','Chiropractic care is a separate practitioner benefit.'],
        ['acupuncture','Acupuncture is another separately listed practitioner benefit.'],
        ['osteopathy','Osteopathic care is also listed separately.']
      ],
      notes: ['These five practitioner benefits have separate annual limits. Using massage therapy does not use up your physiotherapy limit.', 'Eligible X-rays provided by a chiropractor or osteopath count within that practitioner’s own $500 limit; they are not an extra limit.']
    },
    {
      id: 'injury', label: 'Injury or movement problems', icon: '↗',
      match: ['injury','injured','rehab','recovery','mobility','movement','joint','knee','ankle','sprain','physical therapy','recovering','surgery recovery'],
      intro: 'These services may be relevant to recovery and day-to-day movement. They are different benefits and may have different rules.',
      benefits: [
        ['physiotherapy','Physiotherapy focuses on injuries and movement.'],
        ['occupational','Occupational therapy may help with activities and everyday function.'],
        ['massage','Massage therapy is a separate soft-tissue service benefit.']
      ],
      notes: ['These benefits have separate annual limits. Occupational therapy may require using provincial or territorial coverage first.']
    },
    {
      id: 'mental', label: 'Stress or mental health', icon: '♡',
      match: ['stress','anxiety','anxious','depress','mental','therapy','counselling','counseling','psycholog','psychotherap','adhd','burnout','grief','trauma','social worker'],
      intro: 'The plan includes eligible psychological services from several kinds of qualified providers.',
      benefits: [['psychological','Psychologists, psychotherapists, social workers and eligible counsellors are included.']],
      notes: ['Shared limit: all eligible psychological services listed here draw from ONE $5,000 annual eligible-expense limit. That is not $5,000 for each provider type.']
    },
    {
      id: 'feet', label: 'Foot pain or foot support', icon: '◇',
      match: ['foot','feet','heel','arch','podiatr','chiropod','orthotic','insole','orthopedic shoe','orthopaedic shoe'],
      intro: 'Foot care, custom inserts and certain special footwear are different types of benefits.',
      benefits: [
        ['footcare','Podiatry and chiropody are covered under one practitioner limit.'],
        ['orthotics','Custom orthotics have their own eligibility and documentation rules.'],
        ['orthopaedic-shoes','Only certain specially constructed or modified shoes qualify.']
      ],
      notes: ['Shared limit: podiatrists, chiropodists and eligible foot care by community nursing station nurses use the SAME $500 annual maximum.', 'Orthotics and eligible orthopaedic shoes are separate benefits with their own conditions. Ordinary shoes are not automatically covered.']
    },
    {
      id: 'speech', label: 'Speech or hearing help', icon: '◉',
      match: ['speech','language','audiolog','hearing','hard of hearing','hearing loss','hearing aid','communication','stutter','voice'],
      intro: 'The plan distinguishes professional assessments or treatment from hearing devices and supplies.',
      benefits: [
        ['speech','Speech-language pathologists and audiologists share one practitioner limit.'],
        ['hearing-aids','Hearing aids and eligible repairs have a separate benefit and 60-month period.'],
        ['hearing-batteries','Eligible hearing-aid batteries have a separate annual maximum.']
      ],
      notes: ['Shared limit: eligible speech-language pathology and audiology services together use ONE $750 annual eligible-expense maximum.', 'Hearing-aid purchases and batteries have separate limits and documentation requirements.']
    },
    {
      id: 'eyes', label: 'Eyesight or glasses', icon: '◎',
      match: ['glasses','contacts','contact lens','eyesight','vision','eye exam','optometrist','see clearly','blurry','spectacles'],
      intro: 'Routine vision benefits include eligible corrective eyewear and eye examinations.',
      benefits: [
        ['glasses','Prescription glasses, contact lenses and eligible repairs share an eyewear maximum.'],
        ['eye-exam','An eligible eye examination is a separate benefit.']
      ],
      notes: ['The eyewear maximum combines eligible glasses, contacts and repairs. Eye examinations are a separate benefit.', 'Both benefits use two-calendar-year cycles beginning in odd-numbered years.']
    },
    {
      id: 'sleep', label: 'Sleep apnea or CPAP supplies', icon: '☾',
      match: ['sleep apnea','sleep apnoea','cpap','bipap','sleep machine','cpap mask','cpap hose','cpap filter'],
      intro: 'Eligible airway-pressure devices and their replacement parts have different rules.',
      benefits: [
        ['cpap','Eligible CPAP/BiPAP devices and related dental appliances have a 60-month frequency rule.'],
        ['cpap-parts','Eligible repairs, maintenance and replacement parts have a separate annual maximum.']
      ],
      notes: ['A device, its rental and an eligible dental appliance may affect the same 60-month rule. A dental appliance has additional conditions.', 'Eligible parts and servicing have a separate $500 annual eligible-expense maximum.']
    },
    {
      id: 'nutrition', label: 'Food or nutrition advice', icon: '◈',
      match: ['nutrition','diet','dietitian','eating','food advice','malnutrition','dietary'],
      intro: 'The plan includes professional dietary and nutritional counselling from eligible dietitians.',
      benefits: [['dietitian','Dietitian visits have an annual eligible-expense maximum.']],
      notes: ['The plan lists dietitian services; this does not mean ordinary food, meal plans or supplements are automatically covered.']
    },
    {
      id: 'diabetes', label: 'Diabetes or glucose monitoring', icon: '＋',
      match: ['diabetes','diabetic','glucose','blood sugar','blood glucose','cgm','dexcom','libre','test strip'],
      intro: 'Monitoring devices and supplies may have different frequency rules and documentation needs.',
      benefits: [
        ['diabetes-supplies','Eligible blood-glucose testing supplies have an annual limit.'],
        ['glucose-monitor','Eligible monitors have a 60-month combined maximum.'],
        ['cgm-supplies','Continuous glucose monitor supplies have a Type I diabetes restriction.']
      ],
      notes: ['Device and supply benefits are not interchangeable. Continuous glucose monitoring has specific Type I diabetes restrictions in the booklet.']
    },
    {
      id: 'feeding', label: 'Breastfeeding or pumping', icon: '◡',
      match: ['breastfeeding','breastfeed','lactation','latch','pumping','breast pump','nursing baby'],
      intro: 'Support from a lactation consultant and a breast pump are two separate benefit types.',
      benefits: [
        ['lactation','Eligible lactation consultations have an annual maximum; provincial benefits go first.'],
        ['breast-pump','A pump is eligible only in certain medical situations, with documentation.']
      ],
      notes: ['These are separate benefits. Breast pumps are not automatically covered for every new parent.']
    },
    {
      id: 'medication', label: 'Prescription medication', icon: '✚',
      match: ['medication','prescription','pharmacy','medicine','meds','pill','refill','dispensing','drug'],
      intro: 'Prescription drug eligibility depends on the specific product and plan rules.',
      benefits: [
        ['prescriptions','Eligible prescriptions typically reimburse a percentage of the plan-recognized price.'],
        ['dispensing','Pharmacy dispensing fees have a separate per-dispensing recognition limit.']
      ],
      notes: ['Not every medication qualifies. Prior authorization and generic or biosimilar substitution rules may apply.']
    }
  ];
  const sharedLimits = {
    psychological: 'Psychologists, psychotherapists, social workers and qualified counsellors share ONE $5,000 eligible-expense maximum per calendar year (booklet pp. 42, 81).',
    footcare: 'Podiatrists, chiropodists and eligible community nursing-station foot care share ONE $500 eligible-expense maximum per calendar year (booklet pp. 41, 81).',
    speech: 'Speech-language pathologists and audiologists share ONE $750 eligible-expense maximum per calendar year (booklet pp. 42, 81).'
  };
  function normalized(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function matchesTerm(text, term) {
    const needle = normalized(term);
    return (` ${text} `).includes(` ${needle} `) || (needle.length >= 5 && text.split(' ').some(word => word.startsWith(needle)));
  }
  function matchTopic(query) {
    const text = normalized(query);
    if (!text) return null;
    const ranked = topics.map(topic => ({topic, score: topic.match.reduce((sum, term) => sum + (matchesTerm(text,term) ? (term.includes(' ') ? 3 : 1) : 0), 0)}));
    ranked.sort((a,b) => b.score-a.score || topics.indexOf(a.topic)-topics.indexOf(b.topic));
    return ranked[0]?.score ? ranked[0].topic : null;
  }
  function findTopic(id) { return topics.find(topic => topic.id === id) || null; }
  return {topics, sharedLimits, matchTopic, findTopic};
});