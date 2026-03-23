Here is the strict implementation rules memo version — no narrative, just constraints and invariants.

⸻

HoverChoiceField — Implementation Rules (STRICT)

0. Scope

HoverChoiceField.tsx is the only dropdown/choice control used across the builder.

All non-text selections must use this component.

⸻

1. Non-negotiable architecture rules
	•	DO NOT use native <select> for any hover-sensitive field
	•	DO NOT implement dropdown logic inside pickers
	•	DO NOT hardcode right-panel structure anywhere in this component
	•	DO NOT access global draft state inside this component
	•	DO NOT encode domain knowledge (class, background, spells, etc.)

This component is purely mechanical + presentational

⸻

2. Responsibility split

HoverChoiceField

Responsible for:
	•	open/close dropdown behavior
	•	hover detection
	•	keyboard navigation
	•	rendering selected values
	•	rendering option list
	•	emitting hover detail
	•	rendering selection markers

Pickers

Responsible for:
	•	supplying options
	•	supplying detail content
	•	setting preselected
	•	deciding multiple
	•	deciding instructionText
	•	handling onChange

RunnerView

Responsible for:
	•	rendering hover detail output
	•	nothing else

⸻

3. Hover rule (primary invariant)

The right panel must reflect what the cursor is over, not what is saved.

Required behaviors:
	•	hovering an open option → emits that option’s detail
	•	hovering a closed token → emits that token’s detail
	•	hovering instruction row → emits emptyDetail
	•	hover must always override stored state

⸻

4. Instruction row rules
	•	Must be rendered above all options
	•	Must NOT be part of options
	•	Must NOT be selectable
	•	Must emit emptyDetail
	•	Must describe:
	•	what is being chosen
	•	how many choices are required (if relevant)

Example patterns:
	•	— Choose a background —
	•	— Choose 2 skills —

⸻

5. Selection model

Two independent states exist:

A. Current selection (this field)
	•	driven by value
	•	rendered with blue tick (#6e92aa)

B. Preexisting selection (from earlier state)
	•	driven by option.preselected
	•	rendered with normal text colour tick

⸻

6. Tick rendering rules

Open list
	•	selected === true → show blue tick only
	•	selected === false && preselected === true → show normal tick
	•	never show both in open list

Closed state (when showDualClosedTicks === true)
	•	if item is both selected and preselected:
	•	show both ticks
	•	normal first
	•	blue second
	•	if only preselected:
	•	show normal tick
	•	if only selected:
	•	no extra tick needed (selection is implicit)

⸻

7. Closed display rules

Single-select

Must render:

Label: Value

Example:
Background: Sailor

Multi-select

Must render:
	•	label
	•	individual tokens per selection

Each token must:
	•	be independently hoverable
	•	emit its own detail
	•	not collapse into a single string blob

⸻

8. Token rules (multi-select)

Each token:
	•	must be a separate DOM element
	•	must support onMouseEnter
	•	must call emitOptionDetail(option)
	•	may include preselected ticks
	•	must not block hover propagation unintentionally

⸻

9. Styling rules (baseline)

Closed control
	•	width: fixed (sheet-aligned), responsive fallback
	•	low-contrast border
	•	subtle background
	•	no rounded UI-library styling
	•	left-aligned content
	•	label in #6e92aa

Arrow
	•	small
	•	low contrast
	•	purely indicative

Open list
	•	soft background
	•	hover highlight: pale blue wash
	•	no heavy UI chrome

⸻

10. Keyboard rules

Must support:
	•	Enter / Space → open/select
	•	ArrowUp / ArrowDown → navigate
	•	Escape → close

Navigation must:
	•	skip disabled options
	•	emit hover detail when moving

⸻

11. Event rules

Required
	•	onMouseEnter for options → emit detail
	•	onMouseEnter for tokens → emit detail
	•	onMouseLeave (root) → emit emptyDetail

Must NOT
	•	rely on click for hover updates
	•	rely on stored value for hover output

⸻

12. Data rules

Options must be treated as:

{
  value: string
  label: string
  detail?: ReactNode
  preselected?: boolean
}

This component must:
	•	not infer meaning from values
	•	not transform domain data
	•	not fetch data

⸻

13. Disabled behavior
	•	disabled options:
	•	must not be selectable
	•	must still be hoverable (optional but recommended)
	•	disabled field:
	•	must not open
	•	must not respond to keyboard

⸻

14. Open/close behavior
	•	click outside → close
	•	Escape → close
	•	selecting (single-select) → close by default
	•	selecting (multi-select) → stay open by default

⸻

15. Known accepted limitations
	•	opening the list does not auto-emit first option detail (intentional)
	•	closed single-select hover only reflects selected value (acceptable)

⸻

16. Forbidden regressions
	•	reintroducing native <select>
	•	collapsing multi-select tokens into plain text
	•	removing per-option hover emission
	•	hardcoding right-panel formatting
	•	hiding preselected items by default

⸻

17. Design intent

This component is:

A universal interaction layer for structured choice,
with hover-driven information flow.

Not:
	•	a domain renderer
	•	a data source
	•	a form library wrapper

⸻

If this file is followed, the system remains:
	•	consistent
	•	extensible
	•	hover-driven
	•	cognitively clear for the user