/**
 * Curated, non-exhaustive PSHCP benefit directory.
 * Source: Public Service Health Care Plan Member Booklet, November 2026.
 * Page numbers are the PRINTED page numbers, not zero-based PDF indices.
 * Monetary limits are maximum ELIGIBLE expenses, not maximum reimbursement.
 * Keep conditions and cross-benefit caps intact when updating this file.
 */
(function (root, factory) {
  const result = factory();
  if (typeof module === 'object' && module.exports) module.exports = result;
  root.PSHCP_DATA = result;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const all = ['supplementary', 'comprehensive'];
  const travel = ['supplementary'];
  const abroad = ['comprehensive'];
  const hospitalRoomNotes = 'Booklet p. 61 describes eligible hospital room and board charges above the standard ward rate in Canada. NJC Directive section 7 applies regardless of where members reside and has a separate hospital charges rule for pensioners residing outside Canada (section 7.2.2).';
  const categories = [
    { id: 'all', label: 'All benefits', icon: '✳' },
    { id: 'therapy', label: 'Therapy & practitioners', icon: '♡' },
    { id: 'vision', label: 'Vision', icon: '◉' },
    { id: 'drugs', label: 'Medication', icon: '✚' },
    { id: 'equipment', label: 'Equipment & supplies', icon: '▤' },
    { id: 'travel', label: 'Travel & hospital', icon: '✈' },
    { id: 'dental', label: 'Dental & surgery', icon: '◇' }
  ];
  // Plain-language descriptions for the practitioner comparison. General information,
  // not medical advice: scope of practice and titles vary by province and territory.
  const providerDetails = {
    physiotherapy: {
      whatItIs: 'Physiotherapists assess how your body moves, then use exercise, hands-on treatment and education to help you recover or manage a physical condition.',
      focus: 'Mobility after injury or surgery, joint and muscle pain, balance, and rehabilitation.'
    },
    psychological: {
      whatItIs: 'Psychologists, psychotherapists, social workers and qualified counsellors provide talk-based assessment and treatment. They are different professions with different training, sharing one PSHCP limit.',
      focus: 'Anxiety, depression, stress, grief, relationships and other mental health concerns.'
    },
    massage: {
      whatItIs: 'Massage therapists work on muscles and soft tissues using hands-on techniques such as pressure, stretching and mobilization.',
      focus: 'Muscle tension, stiffness and soreness, often alongside other care.'
    },
    chiropractor: {
      whatItIs: 'Chiropractors assess and treat the musculoskeletal system, especially the spine and joints, often with manual adjustment and exercise guidance.',
      focus: 'Back, neck and joint pain, and movement problems.'
    },
    acupuncture: {
      whatItIs: 'Acupuncturists place thin, sterile needles at specific points on the body. Training and regulation differ across provinces and territories.',
      focus: 'Pain and symptom management.'
    },
    osteopathy: {
      whatItIs: 'Osteopathic manual practitioners use hands-on assessment and manipulation of joints, muscles and tissues. In Canada this is different from a US doctor of osteopathy (DO).',
      focus: 'Musculoskeletal pain and restricted movement.'
    },
    naturopathy: {
      whatItIs: 'Naturopathic doctors assess health and may combine nutrition, lifestyle guidance and natural remedies. The plan requires recognized qualifications.',
      focus: 'General health concerns and prevention.'
    },
    dietitian: {
      whatItIs: 'Dietitians assess nutrition needs and provide counselling on eating, meal planning and managing a health condition.',
      focus: 'Diabetes, heart health, digestive conditions and food allergies.'
    },
    occupational: {
      whatItIs: 'Occupational therapists help with everyday activities, work and self-care by adapting tasks, environments or equipment.',
      focus: 'Recovery after injury, ergonomics and adaptive equipment.'
    },
    lactation: {
      whatItIs: 'Lactation consultants provide assessment and practical support for breastfeeding and chestfeeding, including latch and supply concerns.',
      focus: 'Newborn feeding, pumping and postpartum support.'
    },
    nursing: {
      whatItIs: 'Private nursing provides medically necessary care at home by a licensed nurse, such as wound care, injections or monitoring.',
      focus: 'Post-hospital recovery and ongoing home care. A prescription is required.'
    },
    footcare: {
      whatItIs: 'Podiatrists and chiropodists assess and treat foot and lower-leg conditions, including nails, skin, gait and custom orthotics. The protected titles differ by province.',
      focus: 'Heel and arch pain, nail problems and foot care related to diabetes.'
    },
    speech: {
      whatItIs: 'Speech-language pathologists assess communication and swallowing. Audiologists assess hearing and hearing-related needs. Both share one PSHCP limit.',
      focus: 'Speech, language, voice and swallowing; hearing tests and hearing aids.'
    },
    electrology: {
      whatItIs: 'Electrologists remove hair using a fine electric current applied to the hair follicle.',
      focus: 'The plan covers eligible electrolysis for excessive facial or neck hair under specific conditions.'
    }
  };
  function benefit(id, title, category, limit, period, pages, notes, opts = {}) {
    return {
      id, title, category, limit, period, pages, notes,
      rate: opts.rate ?? 80,
      cap: opts.cap ?? null,
      eligibleExpenseCap: typeof opts.cap === 'number' ? opts.cap : null,
      planTypes: opts.planTypes ?? all,
      searchable: opts.searchable ?? '',
      docs: opts.docs ?? 'Check any prescription, provider, documentation and prior authorization requirements before spending.',
      combined: opts.combined ?? null,
      featured: opts.featured ?? false,
      submit: opts.submit ?? null,
      directiveRef: opts.directiveRef ?? null,
      whatItIs: opts.whatItIs ?? providerDetails[id]?.whatItIs ?? '',
      focus: opts.focus ?? providerDetails[id]?.focus ?? '',
      ...(opts.noEstimate ? { noEstimate: true } : {})
    };
  }
  const benefits = [
    // Practitioner benefits: the cap is on eligible expenses, per participant.
    benefit('physiotherapy', 'Physiotherapy', 'therapy', '$1,500', 'Per calendar year', [41, 81], 'Physiotherapy for injuries and conditions affecting movement.', {cap:1500, searchable:'physio physical therapy rehab', featured:true, docs:'Eligible services must be provided by an appropriately licensed, certified or registered practitioner. No additional medical documentation is normally required.'}),
    benefit('psychological', 'Mental health & counselling', 'therapy', '$5,000', 'Per calendar year, combined', [42, 81], 'Shared between psychologists, psychotherapists, social workers and eligible counsellors.', {cap:5000, combined:'psychological', searchable:'therapy psychologist psychotherapist counselling counselor social work mental health adhd', featured:true, docs:'No additional medical documentation is normally required. The provider must meet Canada Life’s applicable qualification requirements.'}),
    benefit('massage', 'Massage therapy', 'therapy', '$500', 'Per calendar year', [40, 81], 'Massage provided by an appropriately licensed or qualified massage therapist.', {cap:500, searchable:'RMT massage therapist', featured:true, docs:'No additional medical documentation is normally required.'}),
    benefit('chiropractor', 'Chiropractic care', 'therapy', '$500', 'Per calendar year', [39, 81], 'Chiropractic treatment from an eligible provider.', {cap:500, searchable:'chiropractor spinal back pain', docs:'No additional medical documentation is normally required.'}),
    benefit('acupuncture', 'Acupuncture', 'therapy', '$500', 'Per calendar year', [39, 81], 'Treatment provided by an eligible acupuncturist.', {cap:500, searchable:'acupuncturist needles', docs:'No additional medical documentation is normally required.'}),
    benefit('osteopathy', 'Osteopathy', 'therapy', '$500', 'Per calendar year, combined', [41, 81], 'Includes eligible osteopathic services and radiographs, under one combined limit.', {cap:500, searchable:'osteopath', docs:'No additional medical documentation is normally required.'}),
    benefit('naturopathy', 'Naturopathic care', 'therapy', '$500', 'Per calendar year', [41, 81], 'Treatment provided by a naturopath meeting plan qualifications.', {cap:500, searchable:'naturopath natural', docs:'No additional medical documentation is normally required.'}),
    benefit('dietitian', 'Dietitian', 'therapy', '$300', 'Per calendar year', [40, 81], 'Professional dietary and nutrition counselling from an eligible dietitian.', {cap:300, searchable:'nutrition diet nutritionist', docs:'No additional medical documentation is normally required.'}),
    benefit('occupational', 'Occupational therapy', 'therapy', '$300', 'Per calendar year', [41, 81], 'Coverage for eligible occupational therapist services after applicable provincial or territorial benefits.', {cap:300, searchable:'OT occupational therapist', docs:'No additional medical documentation is normally required. Use relevant provincial or territorial coverage first.'}),
    benefit('lactation', 'Lactation consultant', 'therapy', '$300', 'Per calendar year', [40, 81], 'Eligible services of a lactation consultant after applicable provincial or territorial benefits.', {cap:300, searchable:'breastfeeding nursing baby postpartum', docs:'No additional medical documentation is normally required. Use provincial or territorial coverage first.'}),
    benefit('nursing', 'Private nursing services', 'therapy', '$20,000', 'Per calendar year', [41, 81], 'Medically necessary private-duty and visiting nursing services in the patient’s private residence.', {cap:20000, searchable:'home nurse visiting care', docs:'A physician or nurse practitioner prescription and supporting documentation are required.'}),
    benefit('footcare', 'Podiatry & chiropody', 'therapy', '$500', 'Per calendar year, combined', [41, 81], 'One shared maximum for podiatrists, chiropodists and eligible community nursing station foot care.', {cap:500, combined:'footcare', searchable:'foot podiatrist chiropodist', docs:'No additional medical documentation is normally required.'}),
    benefit('speech', 'Speech therapy & audiology', 'therapy', '$750', 'Per calendar year, combined', [42, 81], 'One shared maximum for speech-language pathologists and audiologists.', {cap:750, combined:'speech', searchable:'speech hearing audiologist language', docs:'No additional medical documentation is normally required.'}),
    benefit('electrology', 'Electrology', 'therapy', '$1,200', 'Per calendar year, combined', [40, 81], 'Restricted to eligible electrolysis for excessive facial or neck hair under the plan’s conditions.', {cap:1200, searchable:'electrolysis hair removal', docs:'Additional medical documentation may be required. Review qualifying situations, prescriptions and exceptions for gender-affirming treatment.'}),

    // Vision: even/odd-year rules are not simple rolling 24 months.
    benefit('glasses', 'Glasses & contact lenses', 'vision', '$400', 'Every 2 calendar years, starting in odd years', [38, 80], 'Includes prescribed corrective glasses, contacts and repairs. Benefit cycles begin in odd-numbered calendar years.', {cap:400, searchable:'prescription glasses spectacles frames lenses contacts eye', featured:true, docs:'Prescription from an optometrist or ophthalmologist. A separate exception may apply after accident or surgery within 6 months.'}),
    benefit('eye-exam', 'Eye examination', 'vision', '1 exam', 'Every 2 calendar years, starting in odd years', [38, 80], 'One eligible optometrist examination per two-calendar-year benefit period.', {searchable:'vision exam optometrist sight check', docs:'No additional medical documentation is normally required. Reimbursement is 80% of reasonable and customary charges.', noEstimate:true}),
    benefit('laser-eye', 'Laser eye surgery', 'vision', '$2,000', 'Per lifetime, per person', [38, 80], 'Coverage for eligible corrective corneal laser surgery performed by an ophthalmologist; not cataract surgery.', {cap:2000, searchable:'LASIK PRK laser vision surgery', docs:'No additional medical documentation normally required, but only eligible procedures qualify.'}),
    benefit('artificial-eye', 'Artificial eye', 'vision', '1 replacement', 'Every 60 months (special child rule)', [38, 80], 'Replacement frequency differs for dependant children aged 21 and younger.', {searchable:'ocular prosthetic', noEstimate:true, docs:'Subject to reasonable and customary charges; see full booklet for the dependant-child exception.'}),

    // Prescription medicines; not every drug is automatically eligible.
    benefit('prescriptions', 'Eligible prescription drugs', 'drugs', 'R&C charge', 'Per eligible prescription', [31, 32], 'Covered drugs typically reimburse 80% of their reasonable and customary eligible charge.', {searchable:'prescription pharmacy medication insulin birth control contraceptives inhaler drugs', featured:true, docs:'Prescription requirements, drug eligibility, generic/biosimilar rules and prior authorization may apply. Check your specific drug in Canada Life.'}),
    benefit('dispensing', 'Pharmacy dispensing fees', 'drugs', '$8 fee cap', 'Per eligible dispensing', [36, 80], 'The plan generally recognizes up to $8 per dispensing fee at 80%. Exceptions apply for biologic and compound drugs.', {searchable:'refill pharmacist dispense prescription', docs:'Maintenance-drug dispensing fee frequency is generally limited to five per year, with listed exceptions.'}),
    benefit('smoking', 'Smoking cessation aids', 'drugs', '$2,000', 'Per lifetime', [33, 80], 'Eligible smoking cessation aids can include products that do not require a prescription.', {cap:2000, searchable:'quit smoking nicotine cessation', docs:'Review product eligibility with Canada Life.'}),
    benefit('erectile', 'Erectile dysfunction drugs', 'drugs', '$500', 'Per calendar year', [33, 80], 'Eligible prescription drugs for erectile dysfunction.', {cap:500, searchable:'ED medication viagra', docs:'Prescription drug eligibility rules apply.'}),
    benefit('catastrophic', 'Catastrophic drug coverage', 'drugs', '100%', 'After $3,500 eligible out-of-pocket drug expenses in a calendar year', [37, 80], 'Eligible prescription drug expenses above the out-of-pocket threshold may be reimbursed at 100%.', {rate:100, searchable:'expensive high cost prescriptions catastrophic', docs:'The $3,500 threshold is an out-of-pocket expense threshold, not a per-drug benefit cap. Review the exact calculation in the booklet.', noEstimate:true}),

    // Equipment, supplies and miscellaneous benefits.
    benefit('orthopaedic-shoes', 'Orthopaedic shoes', 'equipment', '$250', 'Per calendar year', [43, 81], 'Must be specially constructed, modified or an integral part of a brace.', {cap:250, searchable:'orthopedic shoes footwear', docs:'A valid written prescription is required; see booklet for eligible prescribers.'}),
    benefit('orthotics', 'Custom orthotics', 'equipment', '1 pair', 'Per calendar year', [43, 81], 'One eligible pair of orthotics, including applicable repairs.', {searchable:'insoles foot orthotic custom', docs:'Supporting medical documentation is required. 80% of reasonable and customary charges.', noEstimate:true}),
    benefit('hearing-aids', 'Hearing aids', 'equipment', '$1,500', 'In a 60-month period, combined for both ears', [44, 81], 'Includes eligible hearing aid purchases and repairs; eligible prior claims reduce the remaining cap.', {cap:1500, searchable:'hearing aids hearing loss', docs:'Medical documentation required. Exception for certain post-surgery or accident purchases within six months.'}),
    benefit('hearing-batteries', 'Hearing aid batteries', 'equipment', '$200', 'Per calendar year', [44, 82], 'Eligible batteries for hearing aids.', {cap:200, searchable:'hearing device batteries', docs:'Additional medical documentation is required.'}),
    benefit('breast-pump', 'Breast pump', 'equipment', '$500', 'Per lifetime', [53, 84], 'May qualify for preterm birth or a medical condition preventing normal breastfeeding.', {cap:500, searchable:'pumping postpartum breastfeeding newborn baby', docs:'Prescription and medical eligibility documentation required; applies only to the specified medical situations.'}),
    benefit('diabetes-supplies', 'Diabetic testing supplies', 'equipment', '$3,000', 'Per calendar year', [45, 82], 'Eligible testing supplies, subject to the listed exceptions.', {cap:3000, searchable:'diabetes blood glucose strips', docs:'Additional medical documentation is required. Special restrictions apply following an insulin jet injector purchase.'}),
    benefit('glucose-monitor', 'Diabetic monitors', 'equipment', '$700', 'Combined in a 60-month period', [46, 82], 'Includes eligible diabetic monitors; continuous glucose monitors are covered only for people with Type I diabetes.', {cap:700, searchable:'glucose meter CGM diabetes blood sugar', docs:'Additional medical documentation required. Repair and replacement restrictions apply.'}),
    benefit('cgm-supplies', 'Continuous glucose monitor supplies', 'equipment', '$3,000', 'Per calendar year', [46, 82], 'Supplies are covered only for people with Type I diabetes.', {cap:3000, searchable:'CGM sensor libre dexcom type 1 diabetes', docs:'Additional medical documentation required. Eligibility is restricted to Type I diabetes.'}),
    benefit('needles', 'Needles & syringes', 'equipment', '$200', 'Per calendar year', [45, 82], 'Eligible supplies for administering injectable drugs.', {cap:200, searchable:'injections medical needles insulin', docs:'Additional medical documentation may be required. See exceptions in the booklet.'}),
    benefit('wigs', 'Wigs', 'equipment', '$1,500', 'Every 60 months', [44, 82], 'For total hair loss caused by an illness, subject to plan requirements.', {cap:1500, searchable:'hair prosthesis wig', docs:'See booklet for medical documentation and eligibility requirements.'}),
    benefit('brassieres', 'Orthopaedic brassieres', 'equipment', '$200', 'Per calendar year', [44, 82], 'Eligible orthopaedic brassieres.', {cap:200, searchable:'breast bra post mastectomy', docs:'Additional medical documentation is required.'}),
    benefit('gender-care', 'Gender-affirming care', 'equipment', '$75,000', 'Per lifetime', [47, 82], 'Available for eligible, pre-approved care not otherwise covered by applicable provincial or territorial insurance.', {cap:75000, searchable:'gender affirmation surgery trans health care', docs:'Age 18+, physician-supervised, medically necessary, and prior approval required. For Supplementary, services must be in Canada; Comprehensive, in the country of residence.'}),
    benefit('cpap', 'CPAP / BiPAP devices', 'equipment', '1 purchase', 'Once every 60 months', [53, 85], 'Eligible CPAP/BiPAP and related dental appliance purchases or rentals share a 60-month frequency rule.', {searchable:'sleep apnea CPAP BiPAP positive airway pressure machine mask dental appliance', featured:true, docs:'Medical documentation required. A related dental appliance is only eligible where CPAP or BiPAP cannot be tolerated. Previous purchases/rentals affect the maximum.', noEstimate:true}),
    benefit('cpap-parts', 'CPAP / BiPAP parts & servicing', 'equipment', '$500', 'Per calendar year', [54, 85], 'Eligible repairs, servicing and replacement parts for aerotherapeutic devices.', {cap:500, searchable:'CPAP mask hose filter parts repair maintenance sleep apnea', docs:'No additional medical documentation is normally required. The $500 eligible-expense maximum can result in up to $400 reimbursement.'}),
    benefit('blood-pressure', 'Blood pressure monitor', 'equipment', '1 purchase', 'Once every 60 months', [52, 84], 'Eligible blood pressure monitoring device and applicable repairs.', {searchable:'BP cuff hypertension monitor', docs:'Additional medical documentation required; prior repair claims can affect eligibility.', noEstimate:true}),
    benefit('oximeter', 'Pulse oximeter', 'equipment', '1 purchase', 'Once every 60 months', [52, 84], 'Eligible pulse oximeter and applicable repairs.', {searchable:'oxygen saturation finger pulse', docs:'Additional medical documentation required; previous repair expenses can affect eligibility.', noEstimate:true}),
    benefit('wheelchair', 'Wheelchair', 'equipment', '1 purchase', 'Once every 60 months (exceptions)', [50, 83], 'Purchase and repair limits may change with medical necessity and for dependant children.', {searchable:'wheelchair mobility accessible', docs:'Medical documentation required; eligible repair costs are considered in the period limit.', noEstimate:true}),

    // Travel, hospital and specialized provisions.
    benefit('travel-emergency', 'Emergency care while travelling', 'travel', '$1,000,000', 'Per trip, within first 40 consecutive days', [58, 85], 'Emergency eligible medical expenses outside your home province or territory, after provincial coverage.', {rate:100, cap:1000000, planTypes:travel, submit:'msh-emergency', searchable:'travel insurance out of province overseas emergency vacation hospital', featured:true, docs:'Only Supplementary Coverage. Official-travel exceptions apply. MSH International handles emergency assistance and claims.'}),
    benefit('travel-family', 'Emergency family assistance', 'travel', '$5,000', 'Per travel emergency', [59, 85], 'Family assistance for eligible travel emergencies; sublimits apply.', {rate:100, cap:5000, planTypes:travel, submit:'msh-emergency', searchable:'travel family help accommodation meals', docs:'The booklet specifies a $200/day combined meals/accommodation sublimit. Confirm arrangements with MSH.', noEstimate:true}),
    benefit('travel-referral', 'Medical referral outside your province', 'travel', '$25,000', 'Per illness or injury', [60, 85], 'Eligible medical services unavailable at home, referred by a licensed attending physician or nurse practitioner.', {cap:25000, planTypes:travel, submit:'canada-life', searchable:'out of province referral specialist procedure', docs:'Requires referral and supporting documentation. Managed by Canada Life, not MSH.', noEstimate:true}),
    benefit('hospital-one', 'Hospital room · Level I', 'travel', '$90/day', 'Per hospital day', [20, 61], hospitalRoomNotes, {rate:100, directiveRef:'NJC Directive section 7', searchable:'hospital semi private private room level 1', docs:'Hospital Level I is included for all members. Reasonable and customary charges apply.', noEstimate:true}),
    benefit('hospital-two', 'Hospital room · Level II', 'travel', '$170/day', 'Per hospital day', [20, 61], hospitalRoomNotes, {rate:100, directiveRef:'NJC Directive section 7', searchable:'hospital private room level 2', docs:'Optional level with additional employee or pensioner contributions; verify your selected level.', noEstimate:true}),
    benefit('hospital-three', 'Hospital room · Level III', 'travel', '$250/day', 'Per hospital day', [20, 61], hospitalRoomNotes, {rate:100, directiveRef:'NJC Directive section 7', searchable:'hospital private room level 3', docs:'Optional level with contribution implications; executives may have different employer-paid contributions.', noEstimate:true}),
    benefit('basic-abroad', 'Basic health care outside Canada', 'travel', '100%', 'Comprehensive Coverage only', [62], 'Coverage designed to resemble provincial/territorial physician and related health-care benefits.', {rate:100, planTypes:abroad, submit:'msh-comprehensive', searchable:'expat posted deployed outside country comprehensive physician basic health', docs:'Eligible expenses are capped based on three times the Ontario Health Insurance Act fee schedule. Not a blanket reimbursement of every service.', noEstimate:true}),
    benefit('hospital-abroad', 'Hospital care outside Canada', 'travel', '100%', 'Comprehensive employees posted or deployed abroad', [61, 62], 'Separate NJC Directive section 9 provision for eligible hospital-related services for posted or deployed employees with Comprehensive Coverage.', {rate:100, planTypes:abroad, submit:'msh-comprehensive', directiveRef:'NJC Directive section 9', searchable:'comprehensive inpatient out of canada posted employee hospital', docs:'This provision is not available to pensioners living outside Canada. Exact hospital conditions are in the booklet and the Directive.', noEstimate:true}),

    // PSHCP dental is not the Public Service Dental Care Plan.
    benefit('oral-surgery', 'Specified oral surgery', 'dental', 'R&C charge', 'For eligible procedures', [55, 56, 57], 'Selected procedures including specified cyst, lesion, extraction and gingival procedures.', {searchable:'oral surgery dental teeth wisdom tooth gingivectomy gums', docs:'For many oral procedures, submit to your applicable dental plan first. Not comprehensive routine dental insurance.', noEstimate:true}),
    benefit('accident-dental', 'Dental injury from an accident', 'dental', 'R&C charge', 'Usually within 12 months of accident', [55], 'Treatment of accidental injury to natural teeth or a fractured jaw following an external, violent, accidental injury.', {searchable:'broken tooth dental injury chipped teeth accident emergency', docs:'Not normal chewing/eating injuries. Treatment deadline and dependant-child conditions apply; submit to PSHCP first when also enrolled in certain public-service dental plans.', noEstimate:true})
  ];
  return { benefits, categories, source: { title:'Public Service Health Care Plan Member Booklet', edition:'November 2026', updated:'23 November 2026', pdf:'https://www.canadalife.com/content/dam/rfp/welcome-sites/pshcp/PSHCP-member-booklet.pdf', directive:'https://www.njc-cnm.gc.ca/directive/d9/v283/en', member:'https://www.welcome.canadalife.com/pshcp', msh:'https://pshcp-msh.ca/', changelog:'https://github.com/uditkumar123/pshcp-benefit-explorer/blob/main/docs/content-changelog.md' } };
});
