# Confession Wall — Design Direction

## Three stylistic approaches

### Theme Name: Velvet Noticeboard
Very dark, cinematic confession cards pinned against a warm editorial wall, with soft paper texture and one bright signal color for moments of delight.
**Probability:** 0.04

### Theme Name: Bubblegum Bulletin
A bright, kinetic scrapbook interface with candy color tabs, chunky type, and playful stickers that turns every confession into a tiny collectible note.
**Probability:** 0.07

### Theme Name: Pinboard After Dark
A late-night campus zine: ink-black canvas, warm paper notes, coral ink, and lime “correct guess” sparks. It feels mischievous and personal without becoming a neon-tech dashboard.
**Probability:** 0.02

## Chosen approach: Pinboard After Dark

### Design Movement
Contemporary editorial collage with references to risograph posters, hand-pinned bulletin boards, and indie magazine layouts.

### Core Principles
1. **Confessions feel physical.** Notes should look like found artifacts, with paper surfaces, small shifts in angle, and visible tape/pin details.
2. **Play is a reward, not noise.** Motion and color are reserved for the guessing ritual, successful matches, and GIF reactions.
3. **Asymmetry creates curiosity.** Use a wide editorial rail, offset cards, and a lively side column instead of a generic centered dashboard.
4. **Private energy, public fun.** The writing stays anonymous and safe while the interface encourages harmless, opt-in guessing.

### Color Philosophy
Ink-black gives the wall a late-night, conspiratorial mood. Warm oat paper makes each confession feel touchable and readable. Coral is the emotional ink for affection and urgency; acid chartreuse is reserved for “you got it” moments so a correct guess feels unmistakably special. Aubergine shadows and muted lavender keep the dark field dimensional without relying on a gradient-heavy cyber look.

### Layout Paradigm
A split editorial canvas: sticky top rail, wide confession feed on the left, and a narrow “Guessing Club” column on the right. On mobile the column becomes a horizontal invitation between feed sections. The send flow is a two-step sheet with a preview stage so the user sees the note before posting.

### Signature Elements
- A small coral dot-and-dash “signal” mark used as the wall’s visual signature.
- Oat paper confession cards with a washi-tape top edge and oversized rotated confession number.
- A chartreuse sparkle burst and stamped “MATCHED” label on exact guesses.

### Interaction Philosophy
Every action should feel like placing something on a real noticeboard: select a paper, pick a GIF mood, preview the note, then pin it. Guessing is intentionally low-stakes: users can submit multiple names, hints are never revealed, and the match state is celebratory rather than exposing.

### Animation
Use short, tactile transitions under 260ms for buttons, drawers, chips, and card hover. Confession cards enter with a staggered rise and tiny tilt correction. GIF choice selection uses a slight lift and paper-shadow change. A correct guess triggers a one-shot sparkle burst, a gentle stamp rotation, and a soft card glow; reduced-motion users receive the same color and copy state without movement.

### Typography System
Use **Fraunces** for expressive display headlines, confession numerals, and the matching stamp. Use **DM Sans** for body text, controls, labels, and helper copy. Headlines are sentence case with tight leading; utility labels are uppercase with generous tracking; confession text stays at a comfortable 1.5–1.65 line height.

### Brand Essence
**A secret-sharing wall for people who want the room to guess along — anonymously, playfully, and with a little more feeling.** Personality: nosy, warm, mischievous.

### Brand Voice
Headlines sound like a friend passing over a folded note. CTAs are direct, specific, and lightly teasing; microcopy reassures without sounding corporate.

Example lines:
- “Somebody left a note. The room is listening.”
- “Pick a GIF. Pin the feeling.”

### Wordmark & Logo
A custom-looking “CW” signal mark: two coral dots connected by a broken chartreuse dash, paired with a small folded-note notch. It appears as an icon in the masthead and favicon; the wordmark is rendered with Fraunces in a tight lockup rather than a default system treatment.

### Signature Brand Color
**Signal Coral — #FF5A67.** A warm, human red-pink that reads like a felt-tip underline on paper and is ownable against the ink canvas.

## Style Decisions

- Keep large surfaces ink-black and warm paper; do not introduce purple gradients.
- Reserve chartreuse for active, selected, and matched states.
- The guessing interface should always show “Guess who it is?” rather than revealing the hidden answer.
- GIFs are optional and should never overpower the confession text.

### Accepted style-review amendments

- Chartreuse is now disciplined as a reward and active-state color: selected filters, live/match indicators, guessing sparks, and small tape accents. Signal Coral carries primary action and emotional emphasis.
- The masthead uses a custom CSS CW signal mark made from coral dots, a broken chartreuse dash, and a folded-note corner so the brand reads without relying on a generic image or default wordmark.
- The hero now uses a layered pinned-note artifact with paper edges, tape, pins, stamps, marginalia, and rotated notes, matching the physical vocabulary of the confession cards from the first screen.

Checkpoint note: implementation verified in the live preview after the visual refinement pass.
