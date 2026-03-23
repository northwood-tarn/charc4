

# Inclusion Guideline — Character Sheet Mapping

This document defines which mechanical elements from feats (and other features) should be explicitly modeled in the system, based on their relevance to the final printed character sheet.

This is a **guideline, not a hard rule**. Corner cases and exceptions should still be handled pragmatically.

---

## Core Principle

If a feature meaningfully affects something the player must reference during play, it should be modeled.  
Otherwise, it belongs in notes.

---

## 1. PRIMARY NUMERIC FIELDS (INCLUDE)

These are the highest priority. Any feat affecting these must be explicitly modeled.

- Ability Scores (STR, DEX, CON, INT, WIS, CHA)
- Ability Modifiers (derived)
- Proficiency Bonus
- Initiative
- Armor Class (AC)
- Speed
- Hit Point Maximum

---

## 2. COMBAT OUTPUTS (INCLUDE WHEN CLEAR)

- Attack Bonus (only when directly modified)
- Damage Modifiers (only when simple/static)

Note: Complex conditional combat rules remain in notes.

---

## 3. PROFICIENCY SYSTEMS (INCLUDE)

- Skill Proficiency
- Skill Expertise
- Saving Throw Proficiency
- Tool Proficiency
- Weapon Proficiency
- Armor Proficiency

These should be modeled structurally (not as text).

---

## 4. DERIVED / SECONDARY VALUES (SELECTIVE)

Include:
- Spell Save DC
- Spell Attack Bonus
- Class Ability DC (e.g. Monk, Battle Master, etc.)
- Class Attack Bonus (if applicable)

Exclude:
- Passive Perception (explicitly ignored)

---

## 5. RESOURCE COUNTS (INCLUDE)

These drive UI elements (checkboxes, counters):

- Uses per day / per rest (store as a number only)
  - Examples:
    - PB
    - 1
    - fixed numeric values

Do NOT store rest type (long/short) — this is handled in notes.

---

## 6. STRUCTURED CHOICES (INCLUDE)

- Ability Score choices (ASI)
- Skill choices
- Tool choices
- Resistance choices
- Weapon mastery choices (handled later via class features, but modeled here for consistency)

These must:
- define count
- define options or pool

---

## 7. RESISTANCES / IMMUNITIES (INCLUDE)

Only when:
- Always active (not conditional)

Format:
- Fixed: "fire"
- Choice: { "choice": 1, "options": [...] }

Do NOT include:
- Conditional resistances (e.g. "while raging")

---

## 8. SPELL-RELATED EFFECTS (STUB)

For now:
- Mark with "spellcasting_stub" or equivalent
- Do not attempt full modeling

---

## 9. EVERYTHING ELSE → NOTES

Anything that:
- Is conditional
- Requires runtime adjudication
- Cannot be cleanly represented numerically

Goes into:

"notes"

Examples:
- Advantage / disadvantage conditions
- Reaction abilities
- Movement triggers
- Combat riders
- “Once per turn” effects
- Complex weapon interactions

---

## 10. DESIGN HEURISTIC

When unsure, ask:

1. Does this change a number on the sheet?
2. Does it create a selectable option the player must choose?
3. Does it create a limited-use resource?

If yes → model it  
If no → notes

---

## 11. FINAL RULE

Prefer clarity and usefulness on paper over mechanical completeness.

This system is not simulating gameplay.  
It is producing a readable, usable character sheet.

---

## Status

This guideline is active but flexible.  
Adjust as edge cases emerge.