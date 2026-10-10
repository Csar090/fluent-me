/* Sole authoritative learning definitions. No editable duplicate registry. */
const LEARNING_REGISTRY = {
  "version": "learning-v1",
  "schemaVersion": "diagnosis-v1",
  "rubricVersion": "cognitive-v1",
  "phase": "1-expanded",
  "domains": [
    {
      "id": "communication",
      "name": "Communication"
    },
    {
      "id": "flexibility",
      "name": "Flexibility"
    },
    {
      "id": "humour",
      "name": "Humour"
    }
  ],
  "competencies": [
    {
      "id": "communication.point",
      "version": 1,
      "domain": "communication",
      "name": "Point identification",
      "definition": "Choose one intended takeaway.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "communication.point.core",
          "definition": "Choose one intended takeaway."
        }
      ],
      "operationIds": [
        "select"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.prioritisation",
      "version": 1,
      "domain": "communication",
      "name": "Thought prioritisation",
      "definition": "Separate the central claim from supporting ideas.",
      "dependencies": [
        "communication.point"
      ],
      "subSkills": [
        {
          "id": "communication.prioritisation.core",
          "definition": "Separate the central claim from supporting ideas."
        }
      ],
      "operationIds": [
        "select"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.structure",
      "version": 1,
      "domain": "communication",
      "name": "Structure selection",
      "definition": "Choose and follow an organisation suited to the purpose.",
      "dependencies": [
        "communication.point"
      ],
      "subSkills": [
        {
          "id": "communication.structure.core",
          "definition": "Choose and follow an organisation suited to the purpose."
        }
      ],
      "operationIds": [
        "select"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.concision",
      "version": 1,
      "domain": "communication",
      "name": "Concision",
      "definition": "Preserve essential meaning with fewer unnecessary words.",
      "dependencies": [
        "communication.point"
      ],
      "subSkills": [
        {
          "id": "communication.concision.core",
          "definition": "Preserve essential meaning with fewer unnecessary words."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.spontaneity",
      "version": 1,
      "domain": "communication",
      "name": "Spontaneous expression",
      "definition": "Organise a response under limited preparation.",
      "dependencies": [
        "communication.structure"
      ],
      "subSkills": [
        {
          "id": "communication.spontaneity.core",
          "definition": "Organise a response under limited preparation."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.adaptation",
      "version": 1,
      "domain": "communication",
      "name": "Conversational adaptation",
      "definition": "Respond to the listener and changing context.",
      "dependencies": [
        "communication.listening"
      ],
      "subSkills": [
        {
          "id": "communication.adaptation.core",
          "definition": "Respond to the listener and changing context."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.storytelling",
      "version": 1,
      "domain": "communication",
      "name": "Storytelling",
      "definition": "Build context, tension, development and resolution.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "communication.storytelling.core",
          "definition": "Build context, tension, development and resolution."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "communication.listening",
      "version": 1,
      "domain": "communication",
      "name": "Listening and response",
      "definition": "Respond accurately to the question or objection.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "communication.listening.core",
          "definition": "Respond accurately to the question or objection."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.abstraction",
      "version": 1,
      "domain": "flexibility",
      "name": "Abstraction",
      "definition": "Identify the general idea behind a particular example.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.abstraction.core",
          "definition": "Identify the general idea behind a particular example."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.categorisation",
      "version": 1,
      "domain": "flexibility",
      "name": "Categorisation",
      "definition": "Group ideas by a useful distinguishing criterion.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.categorisation.core",
          "definition": "Group ideas by a useful distinguishing criterion."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.association",
      "version": 1,
      "domain": "flexibility",
      "name": "Association",
      "definition": "Connect ideas through relevant relationships.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.association.core",
          "definition": "Connect ideas through relevant relationships."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.comparison",
      "version": 1,
      "domain": "flexibility",
      "name": "Comparison",
      "definition": "Compare meaningful similarities and differences.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.comparison.core",
          "definition": "Compare meaningful similarities and differences."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.patterns",
      "version": 1,
      "domain": "flexibility",
      "name": "Pattern recognition",
      "definition": "Recognise recurring relationships with evidence.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.patterns.core",
          "definition": "Recognise recurring relationships with evidence."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.perspective",
      "version": 1,
      "domain": "flexibility",
      "name": "Perspective switching",
      "definition": "Consider another viewpoint without assuming its truth.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "flexibility.perspective.core",
          "definition": "Consider another viewpoint without assuming its truth."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "flexibility.reframing",
      "version": 1,
      "domain": "flexibility",
      "name": "Conceptual reframing",
      "definition": "Generate alternative interpretations of a situation.",
      "dependencies": [
        "flexibility.perspective"
      ],
      "subSkills": [
        {
          "id": "flexibility.reframing.core",
          "definition": "Generate alternative interpretations of a situation."
        }
      ],
      "operationIds": [
        "organise"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.observation",
      "version": 1,
      "domain": "humour",
      "name": "Observation",
      "definition": "Notice concrete unexpected details.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.observation.core",
          "definition": "Notice concrete unexpected details."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.incongruity",
      "version": 1,
      "domain": "humour",
      "name": "Incongruity detection",
      "definition": "Identify a mismatch between expectation and reality.",
      "dependencies": [
        "humour.observation"
      ],
      "subSkills": [
        {
          "id": "humour.incongruity.core",
          "definition": "Identify a mismatch between expectation and reality."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.frame",
      "version": 1,
      "domain": "humour",
      "name": "Alternate framing",
      "definition": "Interpret an observation through an unexpected frame.",
      "dependencies": [
        "humour.observation"
      ],
      "subSkills": [
        {
          "id": "humour.frame.core",
          "definition": "Interpret an observation through an unexpected frame."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.distortion",
      "version": 1,
      "domain": "humour",
      "name": "Distortion",
      "definition": "Transform a frame while preserving recognisable meaning.",
      "dependencies": [
        "humour.frame"
      ],
      "subSkills": [
        {
          "id": "humour.distortion.core",
          "definition": "Transform a frame while preserving recognisable meaning."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.exaggeration",
      "version": 1,
      "domain": "humour",
      "name": "Exaggeration",
      "definition": "Amplify a recognisable feature deliberately.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.exaggeration.core",
          "definition": "Amplify a recognisable feature deliberately."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.inversion",
      "version": 1,
      "domain": "humour",
      "name": "Inversion",
      "definition": "Reverse an expected relationship.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.inversion.core",
          "definition": "Reverse an expected relationship."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.analogy",
      "version": 1,
      "domain": "humour",
      "name": "Analogy",
      "definition": "Connect a situation to an illuminating comparison.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.analogy.core",
          "definition": "Connect a situation to an illuminating comparison."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.misdirection",
      "version": 1,
      "domain": "humour",
      "name": "Misdirection",
      "definition": "Establish then redirect an expectation.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.misdirection.core",
          "definition": "Establish then redirect an expectation."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.specificity",
      "version": 1,
      "domain": "humour",
      "name": "Specificity",
      "definition": "Use concrete details that make an observation vivid.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.specificity.core",
          "definition": "Use concrete details that make an observation vivid."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.compression",
      "version": 1,
      "domain": "humour",
      "name": "Punchline compression",
      "definition": "Remove explanation that weakens the payoff.",
      "dependencies": [
        "humour.frame"
      ],
      "subSkills": [
        {
          "id": "humour.compression.core",
          "definition": "Remove explanation that weakens the payoff."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.timing",
      "version": 1,
      "domain": "humour",
      "name": "Timing",
      "definition": "Place and deliver a payoff appropriately; requires delivery evidence.",
      "dependencies": [],
      "subSkills": [
        {
          "id": "humour.timing.core",
          "definition": "Place and deliver a payoff appropriately; requires delivery evidence."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    },
    {
      "id": "humour.spontaneity",
      "version": 1,
      "domain": "humour",
      "name": "Spontaneous humour",
      "definition": "Recognise a suitable humorous response in conversation.",
      "dependencies": [
        "humour.observation",
        "humour.frame"
      ],
      "subSkills": [
        {
          "id": "humour.spontaneity.core",
          "definition": "Recognise a suitable humorous response in conversation."
        }
      ],
      "operationIds": [
        "transform"
      ],
      "evidenceRequirements": [
        "Exact response and intended task",
        "Repeated independent attempts under varied constraints",
        "Retention and real-life transfer before mastery claims"
      ],
      "progressionCriteria": {
        "minimumIndependentAttempts": 3,
        "minimumContexts": 2,
        "retentionRequired": true,
        "transferRequired": true,
        "phase1AutomaticMastery": false
      }
    }
  ],
  "operations": [
    {
      "id": "select",
      "definition": "Choose a central idea or useful structure."
    },
    {
      "id": "organise",
      "definition": "Order ideas by a stated relationship."
    },
    {
      "id": "compress",
      "definition": "Retain necessary meaning under tighter expression constraints."
    },
    {
      "id": "transform",
      "definition": "Change a frame or expression while retaining a recognisable premise."
    }
  ],
  "errors": [
    {
      "id": "delayed-point",
      "version": 1,
      "competencyId": "communication.point",
      "observable": "Main point appears after unrelated setup.",
      "hypothesis": "The speaker may be discovering the takeaway during expression.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Write one sentence containing the takeaway before retrying.",
      "retrySuccess": "The intended takeaway appears in the first substantive sentence.",
      "exerciseId": "point-extraction"
    },
    {
      "id": "competing-ideas",
      "version": 1,
      "competencyId": "communication.prioritisation",
      "observable": "Several claims compete for attention.",
      "hypothesis": "Priorities may not have been separated.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Choose one main claim; place other claims under it.",
      "retrySuccess": "One main claim and clearly subordinate support.",
      "exerciseId": "pre-speech"
    },
    {
      "id": "premature-speaking",
      "version": 1,
      "competencyId": "communication.spontaneity",
      "observable": "Preparation was skipped, according to reported or measured preparation evidence.",
      "hypothesis": "Planning may have started after speech began; text alone cannot establish this.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Use the preparation interval to choose a main point.",
      "retrySuccess": "Preparation use recorded; response opens with chosen point.",
      "exerciseId": "spontaneous"
    },
    {
      "id": "qualification",
      "version": 1,
      "competencyId": "communication.concision",
      "observable": "Repeated qualifications obscure a claim.",
      "hypothesis": "Uncertainty may be expressed without a clear hierarchy.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "State the claim, then one necessary caveat.",
      "retrySuccess": "Claim remains clear and necessary caveats remain accurate.",
      "exerciseId": "compression"
    },
    {
      "id": "weak-structure",
      "version": 1,
      "competencyId": "communication.structure",
      "observable": "Relationship between claim and support is unclear.",
      "hypothesis": "A fitting organisation may not have been selected.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Select point–reason–example–implication or problem–cause–solution and follow it.",
      "retrySuccess": "Parts follow the selected organisation.",
      "exerciseId": "structure-selection"
    },
    {
      "id": "sequencing",
      "version": 1,
      "competencyId": "communication.structure",
      "observable": "Ideas appear in an order that obscures their relationship.",
      "hypothesis": "The response may lack an explicit ordering principle.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Choose an order and move each supporting idea into it.",
      "retrySuccess": "Listener can follow the relation between successive ideas.",
      "exerciseId": "structure-selection"
    },
    {
      "id": "repetition",
      "version": 1,
      "competencyId": "communication.concision",
      "observable": "The same idea is restated without useful added meaning.",
      "hypothesis": "The main point may not yet feel settled.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Delete one redundant restatement while keeping its unique information.",
      "retrySuccess": "Fewer repeated claims; essential meaning retained.",
      "exerciseId": "compression"
    },
    {
      "id": "repair",
      "version": 1,
      "competencyId": "communication.spontaneity",
      "observable": "Words show abandoned starts or repeated mid-sentence corrections.",
      "hypothesis": "Planning and expression may be competing.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Plan a single opening sentence, then pause between ideas.",
      "retrySuccess": "Fewer abandoned starts with unchanged meaning.",
      "exerciseId": "spontaneous"
    },
    {
      "id": "weak-conclusion",
      "version": 1,
      "competencyId": "communication.point",
      "observable": "Response ends without a takeaway or implication.",
      "hypothesis": "The communicative purpose may not be explicit.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "End with one implication or requested action.",
      "retrySuccess": "Ending makes the takeaway explicit.",
      "exerciseId": "pre-speech"
    },
    {
      "id": "over-explanation",
      "version": 1,
      "competencyId": "communication.concision",
      "observable": "Supporting detail exceeds what the stated listener needs.",
      "hypothesis": "Detail selection may not follow listener relevance.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Keep one reason and one necessary example.",
      "retrySuccess": "Response fits the constraint and retains key nuance.",
      "exerciseId": "compression"
    },
    {
      "id": "listener-adaptation",
      "version": 1,
      "competencyId": "communication.adaptation",
      "observable": "Assumed knowledge or wording mismatches the stated audience.",
      "hypothesis": "Audience needs may not have been considered.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Define the one unfamiliar concept needed by this listener.",
      "retrySuccess": "Listener can understand without unsupported assumptions.",
      "exerciseId": "pre-speech"
    },
    {
      "id": "narrative-tension",
      "version": 1,
      "competencyId": "communication.storytelling",
      "observable": "Events are listed without a meaningful challenge.",
      "hypothesis": "The change or difficulty may not have been identified.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Identify the challenge before telling the event.",
      "retrySuccess": "Story establishes a meaningful challenge.",
      "exerciseId": "future.storytelling"
    },
    {
      "id": "narrative-payoff",
      "version": 1,
      "competencyId": "communication.storytelling",
      "observable": "The story lacks a resolution or significance.",
      "hypothesis": "The outcome may not be linked to the opening tension.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Connect the outcome to the initial challenge.",
      "retrySuccess": "Resolution explains what changed.",
      "exerciseId": "future.storytelling"
    },
    {
      "id": "literal-frame",
      "version": 1,
      "competencyId": "flexibility.reframing",
      "observable": "Only one literal interpretation is supplied in a reframing task.",
      "hypothesis": "Alternative frames may not have been explored.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Generate two distinct interpretations before choosing.",
      "retrySuccess": "Two meaningfully different plausible frames.",
      "exerciseId": "future.reframing"
    },
    {
      "id": "limited-reframing",
      "version": 1,
      "competencyId": "flexibility.reframing",
      "observable": "Alternative interpretations only reword the original.",
      "hypothesis": "The underlying frame may remain unchanged.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Change viewpoint or organising assumption.",
      "retrySuccess": "Alternatives alter interpretation, not merely vocabulary.",
      "exerciseId": "future.reframing"
    },
    {
      "id": "predictable-analogy",
      "version": 1,
      "competencyId": "humour.analogy",
      "observable": "Comparison adds little new insight.",
      "hypothesis": "Associations may favour familiar rather than relevant surprising links.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Identify a specific shared relationship.",
      "retrySuccess": "Comparison is both intelligible and meaningfully fresh.",
      "exerciseId": "future.humour"
    },
    {
      "id": "weak-distortion",
      "version": 1,
      "competencyId": "humour.distortion",
      "observable": "Transformation has no recognisable link to the observation.",
      "hypothesis": "The distortion may outrun the shared premise.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Keep one concrete feature recognisable.",
      "retrySuccess": "Surprise remains connected to the observation.",
      "exerciseId": "future.humour"
    },
    {
      "id": "explained-punchline",
      "version": 1,
      "competencyId": "humour.compression",
      "observable": "Explanation follows and weakens the payoff.",
      "hypothesis": "The intended inference may be supplied instead of left to the listener.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Remove the explanation after the payoff.",
      "retrySuccess": "Payoff stands alone and remains understandable.",
      "exerciseId": "future.humour"
    },
    {
      "id": "forced-humour",
      "version": 1,
      "competencyId": "humour.spontaneity",
      "observable": "Humour distracts from or conflicts with the stated purpose.",
      "hypothesis": "Humour may be prioritised over context.",
      "uncertainty": "A transcript supports observable patterns, not certainty about internal cognition.",
      "intervention": "Choose a direct response when humour is unnecessary.",
      "retrySuccess": "Context and intent are respected.",
      "exerciseId": "future.humour"
    }
  ],
  "exercises": [
    {
      "id": "point-extraction",
      "version": 1,
      "name": "Point extraction",
      "domain": "communication",
      "competencyId": "communication.point",
      "subSkillId": "communication.point.core",
      "operationId": "select",
      "difficulty": 1,
      "prompts": [
        "Identify the one main point in this thought: We keep adding status meetings, people repeat updates, the same questions recur, and work loses momentum. I think the team needs one shared written update before discussing blockers.",
        "Identify the one main point: I enjoy taking on new work, but I have three commitments already. If I accept another one now, all four will move slowly. I want to finish one before starting another."
      ],
      "promptRule": "Rotate through the declared prompt bank; retry retains the exact prompt.",
      "modality": "speech-or-text",
      "preparationSeconds": 20,
      "responseSeconds": 45,
      "maxWords": 70,
      "constraints": "State the central claim first, then one supporting reason. Do not add facts.",
      "hint": "Point → reason",
      "errorIds": [
        "delayed-point",
        "competing-ideas"
      ],
      "prerequisites": [],
      "rubricVersion": "cognitive-v1",
      "retryStrategy": "Apply one intervention to the same prompt and constraints.",
      "progressionCriteria": "Repeated independent evidence across contexts; no automatic mastery in this phase."
    },
    {
      "id": "pre-speech",
      "version": 1,
      "name": "Pre-speech compression",
      "domain": "communication",
      "competencyId": "communication.prioritisation",
      "subSkillId": "communication.prioritisation.core",
      "operationId": "select",
      "difficulty": 1,
      "prompts": [
        "Explain why a short planning pause can improve a complex answer to a colleague.",
        "Recommend one way to make a recurring team discussion more useful without adding another meeting."
      ],
      "promptRule": "Rotate through the declared prompt bank; retry retains the exact prompt.",
      "modality": "speech-or-text",
      "preparationSeconds": 20,
      "responseSeconds": 60,
      "maxWords": 120,
      "constraints": "Choose a point before speaking; give one reason, one example and an implication.",
      "hint": "Point → reason → example → implication",
      "errorIds": [
        "competing-ideas",
        "weak-conclusion",
        "listener-adaptation"
      ],
      "prerequisites": [],
      "rubricVersion": "cognitive-v1",
      "retryStrategy": "Apply one intervention to the same prompt and constraints.",
      "progressionCriteria": "Repeated independent evidence across contexts; no automatic mastery in this phase."
    },
    {
      "id": "structure-selection",
      "version": 1,
      "name": "Structure selection",
      "domain": "communication",
      "competencyId": "communication.structure",
      "subSkillId": "communication.structure.core",
      "operationId": "organise",
      "difficulty": 1,
      "prompts": [
        "A project is delayed because decisions wait for several people. Explain the problem and propose a next step to a team lead.",
        "A friend asks whether to learn several new skills at once or focus on one. Give a reasoned recommendation."
      ],
      "promptRule": "Rotate through the declared prompt bank; retry retains the exact prompt.",
      "modality": "speech-or-text",
      "preparationSeconds": 25,
      "responseSeconds": 60,
      "maxWords": 120,
      "constraints": "Choose and name point–reason–example–implication or problem–cause–solution; follow it.",
      "hint": "Choose an organisation suited to your purpose",
      "errorIds": [
        "weak-structure",
        "sequencing"
      ],
      "prerequisites": [],
      "rubricVersion": "cognitive-v1",
      "retryStrategy": "Apply one intervention to the same prompt and constraints.",
      "progressionCriteria": "Repeated independent evidence across contexts; no automatic mastery in this phase."
    },
    {
      "id": "compression",
      "version": 1,
      "name": "Meaning-preserving compression",
      "domain": "communication",
      "competencyId": "communication.concision",
      "subSkillId": "communication.concision.core",
      "operationId": "compress",
      "difficulty": 1,
      "prompts": [
        "Compress this without losing the reason or caveat: I think it would probably be helpful if we could perhaps send an agenda before the meeting, because otherwise we spend quite a lot of time working out what we actually need to discuss. Of course urgent issues can still come up.",
        "Compress this without losing the recommendation or reason: There are quite a few things that I would like to learn and all of them feel interesting, but because time is limited and I cannot practise everything consistently, I think choosing one skill for the next month would help me make more noticeable progress."
      ],
      "promptRule": "Rotate through the declared prompt bank; retry retains the exact prompt.",
      "modality": "speech-or-text",
      "preparationSeconds": 20,
      "responseSeconds": 45,
      "maxWords": 60,
      "constraints": "Retain the main claim, reason and necessary nuance within the word limit; avoid new facts.",
      "hint": "Claim → necessary reason → essential caveat",
      "errorIds": [
        "qualification",
        "repetition",
        "over-explanation"
      ],
      "prerequisites": [],
      "rubricVersion": "cognitive-v1",
      "retryStrategy": "Apply one intervention to the same prompt and constraints.",
      "progressionCriteria": "Repeated independent evidence across contexts; no automatic mastery in this phase."
    },
    {
      "id": "spontaneous",
      "version": 1,
      "name": "Spontaneous response",
      "domain": "communication",
      "competencyId": "communication.spontaneity",
      "subSkillId": "communication.spontaneity.core",
      "operationId": "organise",
      "difficulty": 1,
      "prompts": [
        "What is one ordinary habit you would change to make your day easier, and why?",
        "When is slowing down a better way to make progress?"
      ],
      "promptRule": "Rotate through the declared prompt bank; retry retains the exact prompt.",
      "modality": "speech-or-text",
      "preparationSeconds": 5,
      "responseSeconds": 45,
      "maxWords": 90,
      "constraints": "Use limited preparation, state one point and support it. Preparation and delivery timing must be labelled as reported or measured.",
      "hint": "Point → reason → concrete example",
      "errorIds": [
        "repair",
        "delayed-point",
        "premature-speaking"
      ],
      "prerequisites": [],
      "rubricVersion": "cognitive-v1",
      "retryStrategy": "Apply one intervention to the same prompt and constraints.",
      "progressionCriteria": "Repeated independent evidence across contexts; no automatic mastery in this phase."
    }
  ]
};
function learningRegistry_(){validateLearningRegistry_();return{ok:true,registry:LEARNING_REGISTRY};}
function validateLearningRegistry_(){
  const r=LEARNING_REGISTRY,groups=['domains','competencies','operations','errors','exercises'],sets={};
  groups.forEach(k=>{sets[k]={};r[k].forEach(x=>{if(!x.id||sets[k][x.id])throw Error('Duplicate learning ID: '+x.id);sets[k][x.id]=x})});
  const seen={},visiting={};function visit(id){if(visiting[id])throw Error('Cyclic competency dependency.');if(seen[id])return;const c=sets.competencies[id];if(!c)throw Error('Unknown competency: '+id);visiting[id]=true;(c.dependencies||[]).forEach(visit);delete visiting[id];seen[id]=true;}
  r.competencies.forEach(c=>{if(!sets.domains[c.domain])throw Error('Unknown domain.');c.operationIds.forEach(id=>{if(!sets.operations[id])throw Error('Unknown operation.');});visit(c.id)});
  r.errors.forEach(e=>{if(!sets.competencies[e.competencyId])throw Error('Unknown error competency.');if(!sets.exercises[e.exerciseId]&&!e.exerciseId.startsWith('future.'))throw Error('Unknown error exercise.');});
  r.exercises.forEach(e=>{if(!sets.competencies[e.competencyId]||!sets.operations[e.operationId])throw Error('Unknown exercise reference.');if(!sets.competencies[e.competencyId].subSkills.some(s=>s.id===e.subSkillId))throw Error('Unknown sub-skill.');e.errorIds.forEach(id=>{if(!sets.errors[id])throw Error('Unknown exercise error.');});e.prerequisites.forEach(visit);});return true;
}
