// The Kindergarten Readiness Checklist Stephanie uploaded (Kindergarten_Readiness_2026.pdf,
// 2026-11-03). Connor works through it before the Kindergarten sheet of the milestones
// spreadsheet. Ids match the "Connor's Readiness Check" artifact.

export const READINESS_GRADE = "Kindergarten Readiness";

export const READINESS_ITEMS = [
  { id: "KR-Lang-1", area: "Language and communication", text: "Speaks in complete sentences and is understood by others" },
  { id: "KR-Lang-2", area: "Language and communication", text: "Expresses needs and wants" },
  { id: "KR-Lang-3", area: "Language and communication", text: "Responds to questions" },
  { id: "KR-Lang-4", area: "Language and communication", text: "Understands and completes 2-step directions" },
  { id: "KR-Math-1", area: "Math and reasoning", text: "Identifies numbers 1–10" },
  { id: "KR-Math-2", area: "Math and reasoning", text: "Counts from 1–10" },
  { id: "KR-Math-3", area: "Math and reasoning", text: "Counts items up to 10" },
  { id: "KR-Math-4", area: "Math and reasoning", text: "Identifies basic shapes" },
  { id: "KR-Math-5", area: "Math and reasoning", text: "Identifies basic colors" },
  { id: "KR-Math-6", area: "Math and reasoning", text: "Compares objects: more/less, larger/smaller" },
  { id: "KR-Math-7", area: "Math and reasoning", text: "Recognizes simple patterns like ABAB" },
  { id: "KR-Math-8", area: "Math and reasoning", text: "Classifies items into groups by color or other similarities" },
  { id: "KR-Read-1", area: "Reading and writing", text: "Enjoys listening to stories" },
  { id: "KR-Read-2", area: "Reading and writing", text: "Retells simple stories" },
  { id: "KR-Read-3", area: "Reading and writing", text: "Identifies most letter names and sounds" },
  { id: "KR-Read-4", area: "Reading and writing", text: "Recognizes name in print" },
  { id: "KR-Read-5", area: "Reading and writing", text: "Knows the alphabet" },
  { id: "KR-Read-6", area: "Reading and writing", text: "Prints first name" },
  { id: "KR-Read-7", area: "Reading and writing", text: "Writes many letters (letter reversal is acceptable)" },
  { id: "KR-Read-8", area: "Reading and writing", text: "Draws straight and curved lines and simple shapes" },
  { id: "KR-Social-1", area: "Social and emotional", text: "Interacts with other children and adults" },
  { id: "KR-Social-2", area: "Social and emotional", text: "Takes turns and shares with others" },
  { id: "KR-Social-3", area: "Social and emotional", text: "Cares for and shows respect for others and materials" },
  { id: "KR-Social-4", area: "Social and emotional", text: "Is attentive to speaker or task for brief periods" },
  { id: "KR-Social-5", area: "Social and emotional", text: "Demonstrates patience" },
  { id: "KR-Motor-1", area: "Fine and gross motor", text: "Holds pencil/crayon in fingers rather than fist (grip may still be developing)" },
  { id: "KR-Motor-2", area: "Fine and gross motor", text: "Holds and uses scissors" },
  { id: "KR-Motor-3", area: "Fine and gross motor", text: "Uses glue/glue stick" },
  { id: "KR-Motor-4", area: "Fine and gross motor", text: "Uses small manipulatives (blocks, beads, puzzles) with steady hands" },
  { id: "KR-Motor-5", area: "Fine and gross motor", text: "Runs, hops, skips, catches, throws" },
  { id: "KR-Ind-1", area: "Independence", text: "Completes some tasks independently and/or asks for help" },
  { id: "KR-Ind-2", area: "Independence", text: "Uses bathroom, dresses, and eats independently" },
  { id: "KR-Ind-3", area: "Independence", text: "Transitions from one activity to another" }
];

export const READINESS_AREAS = [...new Set(READINESS_ITEMS.map((item) => item.area))];
