---
format: 1920x1080
duration: 65s
message: "You never log anything — the board fills itself from what the team already said"
arc: Hook → The group → The mark → The board → Ask it → Your own list → The point → Brand
audience: hackathon judges and the team
mode: autonomous
music: none
---

## Video direction

**Palette system** — from `frame.md`, by role, nothing invented. `bg` (#F1F1F4) is the
video's ground in every frame; `card-bg` (#FFFFFF) is every raised surface; `text`
(#111114) carries display and headline; `text-muted` (#6A6A74) carries body and
secondary; `text-light` (#A2A2AC) carries chrome, timestamps and counters; `primary`
(#F5401D) is the single accent and is **rationed** — it appears only on the thing the
frame is about (the mark, the live card, the count that changes). A frame with two
accented elements is wrong. `border` (#EBEBF0) draws every hairline. One licensed
exception: Frame 2 and Frame 6's recreated Telegram chrome uses Telegram's own blues
and bubble greens so the app reads as itself and is never mistaken for our product.

**Motion grammar and reveal model** — long-tail eases, `power3` default; smooth over
bouncy, nothing overshoots except the ✍️ mark, which is the one spring in the film.
There is no voiceover, so **reveals pace to the on-screen line beats**: at t=0 only
the first line or first message exists, and each further piece enters when the read
reaches it, weighted into the back half of every shot. Screen content moves like the
product does — messages arrive from the bottom, cards settle into place, counts tick.
During a hold, at most a caret blink or a live-pip pulse stays alive.

**Rhythm and held frames** — Frames 2, 4 and 5 are the working shots and carry the
reveals. **Frame 3 ends held** (the card lands and the frame stops moving — the
climax reads against the travel that preceded it) and **Frame 6 is a full breather**,
still from its first beat, so the payoff line is read and not watched. Frame 7 settles
once and stops.

**Negative list** — no browser chrome, no scrollbars, no real OS cursor, no nav or
footer, no floating bokeh, no purple-blue "AI" gradient, no stock-photo texture, no
drop shadow heavier than the board's own. Never show the bot writing a message into
the chat — it would misrepresent the product. Both motion failure modes are barred:
**slideshow** (everything dumped by 25%, then frozen) and **screensaver** (elements
drifting independently with nothing driving them).

## Frame 1 — Hook

- scene: Two lines of type state the thesis cold, on the product's own ground
- duration: 4s
- poster: 3s
- transition_in: cut
- status: animated
- blueprint: kinetic-type-beats (Reproduce)
- focal: the second line's turn — "and nowhere else"
- roles: none (typographic frame)
- asset_candidates: none
- src: compositions/frames/01-hook.html

Open on the claim, not the product. Every team already says what it is going to
do — out loud, in the group, in passing — and then loses it. State that, and the
rest of the video is the proof.

Scene 1 (0.0–1.5s): bare `bg` ground. Display line one — "Everything your team
promised today" — enters as a single mask-up reveal, set left on the golden
upper-third, ~70% of canvas width. Nothing else on screen.
Scene 2 (1.5–2.9s): line two — "is in the chat." — lands beneath it on the same
left margin, same weight, by hard cut rather than a fade; the two lines now read
as one sentence. Layout stays rule-of-thirds, two depth layers.
Scene 3 (2.9–4.0s): the closing clause "And nowhere else." swaps in on the third
line in `primary` — the frame's only accent — and everything holds still. No push,
no drift; the stillness is what makes the cut to the chat land.

## Frame 2 — The group

- scene: A Telegram group thread builds message by message; five real people, ordinary sentences
- duration: 9s
- poster: 7s
- transition_in: crossfade
- status: animated
- blueprint: grid-card-assemble (Adapt)
- focal: Yasin's message — "I'll send the repo link to the judges after the demo"
- roles: recreated Telegram thread = cutout (the frame's subject) · `bg` ground = background
- asset_candidates: none
- registry: `thread-message-stack` — install and cast it rather than hand-building bubbles
- src: compositions/frames/02-group.html

The chat is the product's only input, so it has to feel real: real names, real
sentences off the actual board, no staging. The thread lands on the line that
matters — Yasin saying he will send the repo link to the judges after the demo —
and holds there. Nothing about the agent is visible yet. That is the point: it is
already in the room and has said nothing.

Adapt: keep the staggered-cascade signature, but the array is a vertical conversation
rather than a grid, and the cascade is **cued one message at a time** like a live
thread instead of firing as one stagger. Messages arrive from the bottom, each nudging
the stack up.

Scene 1 (0.0–1.6s): the Telegram group panel sits centred on the `bg` ground, ~62% of
canvas width, phone-less (no device mockup) — group title "AI Thinkerer x OpenAI hackathon · 5
members" and one message already resting: **Mert Gökhan — "the bot reconnected fine
after I killed the wifi"**. Two depth layers: ground, panel.
Scene 2 (1.6–3.2s): **Sefa — "can everyone send one message here so I can grab your
ids"** arrives from the bottom edge; the stack slides up to receive it. A read-receipt
tick settles a beat after the bubble, the way the real app does it.
Scene 3 (3.2–4.8s): **Mehmet Cem — "our slot is 16.9. at 10:30"** arrives the same way.
Three messages now read as an ordinary working conversation — deliberately unremarkable.
Scene 4 (4.8–6.6s): **Yasin — "I'll send the repo link to the judges after the demo"**
arrives and the stack settles for the last time. No emphasis, no highlight, no zoom —
it must look exactly as unremarkable as the three above it.
Scene 5 (6.6–9.0s): held. The thread sits still and complete; only the typing-indicator
dots under the group title stay alive. Nothing has happened yet, and the frame lets
that sit.

## Frame 3 — The mark

- scene: A ✍️ reaction lands on that one message; the camera travels to the board, and the card it became is read close-up before it docks into its column
- duration: 10s
- poster: 5s
- transition_in: cut
- status: animated
- blueprint: camera-journey (Reproduce — sub-shape A, action roundtrip)
- focal: screenshots/scroll-000.png
- roles: screenshots/scroll-000.png = cutout · recreated thread = supporting · ground = background
- asset_candidates: screenshots/scroll-000.png
- handoff_out: board plate centred at x 960 / y 540, scale 1.0, opacity 1, motionless at the cut; the Yasin card outlined in `primary` at the plate's left column
- src: compositions/frames/03-mark.html

The hero beat. The agent's entire visible output is one reaction on one message —
that is the whole interface, and it has to read as small and deliberate. Then the
cause travels to its effect in one unbroken move: the same sentence, now a card,
with the quote preserved word for word. The journey is the argument.

Scene 1 (0.0–1.4s): straight cut back into the held thread from Frame 2, framing
unchanged. A slow dive pushes toward Yasin's message until it fills the upper two
thirds — the one moment the frame commits to a single sentence.
Scene 2 (1.4–2.6s): the **✍️ reaction chip springs onto the bottom-left corner of that
bubble** — the film's only overshoot, small, landing like a stamp, with a soft impact.
This is the signature beat of the whole video: hold the frame otherwise dead still so
the mark is the only thing that moves. Nothing is written into the chat.
Scene 3 (2.6–4.6s): the camera swoops off the message to the right, the thread sliding
out of frame, and the board plate travels in behind it — one continuous move, motion
blur through the middle of the leg, decelerating hard. Layered depth, three planes.
Scene 4 (4.6–6.6s): the board lands at 1:1, and the card the sentence became
**materialises large and centred over it** — big enough to read at a glance: what
(`send the repo link to the judges`), the `after the demo` tag, and the verbatim quote
underneath. The plate dims behind it. Hold it there long enough to actually be read;
this is the payoff of the mark and it must not be squinted at. Centred hero, ~45% of
frame, two depth layers.
Scene 5 (6.6–8.4s): the card **shrinks and travels down into its real slot in the Yasin
column**, landing on the plate's own geometry at the plate's own type size, outline in
`primary`. One continuous move, decelerating; the plate lifts back to full brightness as
it lands. This is the beat that says the card is not an overlay — it lives on the board.
Scene 6 (8.4–10.0s): **held.** The outline fades from `primary` to `border` as the card
becomes an ordinary card among the others, and the frame stops entirely. Nothing moves
into the cut.

## Frame 4 — The board

- scene: The real captured dashboard, cards settling into their columns, the outstanding count climbing
- duration: 8s
- poster: 6s
- transition_in: crossfade
- status: animated
- blueprint: grid-card-assemble (Reproduce)
- focal: screenshots/scroll-000.png
- roles: screenshots/scroll-000.png = cutout · screenshots/full-page.png = supporting · ground = background
- asset_candidates: screenshots/scroll-000.png; screenshots/full-page.png
- handoff_in: board plate centred at x 960 / y 540, scale 1.0, opacity 1, motionless at the cut — matches Frame 3's handoff_out exactly; no re-entry animation on the plate
- src: compositions/frames/04-board.html

Widen from the one card to everything the group has said today. This frame is the
captured product, not a rebuild — the proof that the board in Frame 3 is a real
screen. Let the per-person columns and the meeting column read on their own.

Scene 1 (0.0–1.8s): the plate continues exactly where Frame 3 left it, dead still.
A label sets into the top-left margin over the ground — "one group, one morning" —
in `text-muted` chrome, small. The plate itself does not move.
Scene 2 (1.8–3.8s): the per-person columns **light column by column**, left to right,
each one's header and outstanding count arriving a beat after the one before —
a cascade across the real screen rather than over it. Full-width strip framing.
Scene 3 (3.8–5.6s): the **OUTSTANDING figure counts up to 35** in `primary` while the
meeting column on the right lifts last, carrying `16.9.2026 at 10:30` — the one card
in the film that belongs to nobody, which is the point of having it.
Scene 4 (5.6–8.0s): everything resolved; the plate holds still and reads. Only the
LISTENING pip pulses. No push, no drift.

## Frame 5 — Ask it

- scene: A question is typed into the sidebar agent; it answers from the board, then closes a card and the board changes underneath it
- duration: 10s
- poster: 8s
- transition_in: cut
- status: animated
- blueprint: prompt-type-submit-generate (Reproduce — full loop, twice)
- focal: the sidebar answer, then the card that strikes through
- roles: screenshots/scroll-000.png = background · sidebar panel = cutout
- asset_candidates: screenshots/scroll-000.png
- registry: `typed-prompt` — install it for both questions; its deterministic caret is render-safe where a hand-rolled typing loop is not
- src: compositions/frames/05-ask.html

The board is not a static list. Ask it what is due today and it answers in the
team's own words; tell it to close one and the card strikes through on screen.
Two asks, one after the other — the second is the one that proves it writes as
well as reads.

Scene 1 (0.0–1.4s): the board plate holds as background at its landed position; the
agent sidebar slides in from the right edge, ~30% of canvas width, `card-bg` over
`border` hairline. Asymmetric 70/30, three depth layers.
Scene 2 (1.4–3.2s): **"what's due today?"** types itself into the sidebar input behind
a blinking caret at human cadence, then submits — the input clears and a thinking dot
appears.
Scene 3 (3.2–5.2s): the answer streams in word by word on an uneven token rhythm: three
rows naming **Gökhan — clean up the seed fixture · tonight**, **Yasin — review the
ata-dev branch · tonight**, **Sefa — collect everyone's Telegram ids · in the next 10
minutes**. Each row, as it lands, flashes its matching card on the board behind the
panel — the answer is visibly sourced from the screen, not invented.
Scene 4 (5.2–7.0s): second ask. **"close the seed fixture one"** types into the same
input and submits.
Scene 5 (7.0–8.6s): the agent replies "Closed." and **the card on the board strikes
through and greys**, its owner's outstanding count dropping by one — the write, seen
happening on the real screen.
Scene 6 (8.6–10.0s): held. Caret blinks in the empty input; the board sits changed.

## Frame 6 — Your own list

- scene: A private DM to the bot; /me returns everything you owe, and the tap that closes one flies out of Telegram and lands on the board
- duration: 15s
- poster: 7s
- transition_in: cut
- status: outline
- blueprint: prompt-type-submit-generate (Adapt)
- focal: the bot's digest message
- roles: recreated Telegram DM = cutout · screenshots/scroll-000.png = cutout (the board the tap lands on, held at 1:1) · ground = background
- asset_candidates: screenshots/scroll-000.png
- src: compositions/frames/06-me.html

The board answers the room. This answers you. The same agent that stayed silent in
the group will talk in a direct message, and what it sends back is not a dashboard
link — it is the list of what you personally owe, each line carrying the sentence you
actually said. Item 4 is the promise this film has been following since Frame 2, now
sitting in its owner's pocket. Then one tap closes it, from Telegram, without opening
anything.

Adapt: keep the ask → answer loop, but the ask is a slash command rather than a typed
question, and the answer is a real bot message with an inline keyboard rather than a
streamed one. The second beat is a **button press**, not a second prompt.

Scene 1 (0.0–1.6s): a private Telegram chat, ~46% of canvas, centred on the `bg`
ground. The header is the giveaway and must read clearly: **Overheard · bot**, not a
group — this is the one place the agent is allowed to speak. Empty thread, composer
resting.
Scene 2 (1.6–2.8s): **`/me`** types into the composer at human cadence and sends; the
command chip settles right-aligned as an outgoing message. Two words, no ceremony.
Scene 3 (2.8–5.2s): the bot's reply arrives as one message and builds line by line —
header **"You're on the hook for 5 things:"**, then the five numbered items, each with
its due and its verbatim quote indented beneath in `text-light`. The list arrives in
reading order, not as one dump.
Scene 4 (5.2–6.6s): the inline keyboard appears under the message — five stacked
**`Done: N`** buttons, Telegram's own button chrome.
Scene 5 (6.6–8.4s): a press lands on **`Done: 1`**; the button depresses, a **`Done ✍️`**
toast slides in at the top, and the message **edits in place** — the header re-reads
**"You're on the hook for 4 things:"** and item 1 leaves, the rest renumbering up.
Scene 6 (8.4s): the edit settles.
Scene 7 (8.4–9.7s): the tap **leaves Telegram as a paper plane** — it lifts off the
message, banks right and climbs, while the DM panel recedes and the board it writes
to comes forward behind it. The plane is the only thing carrying continuity across
the two surfaces, so it must never be lost behind either.
Scene 8 (9.7–11.6s): the plane sweeps left across the full board, turning as it goes.
The board is the real captured plate at 1:1, already showing the state Frame 5 left
it in — 34 outstanding, not 35.
Scene 9 (11.6–13.4s): it dives onto **"write the 90 second script"** in the Yasin
column — the card the DM just closed — and is absorbed into it. The strike draws
through the title, the card greys, and the counts fall: the column to 4 outstanding,
the headline figure to 33. This is the same write the sidebar made in Frame 5, only
made from a phone, from inside a chat.
Scene 10 (13.4–15.0s): held on the changed board. Nothing moves.

## Frame 7 — The point

- scene: The chat returns, scrolled through the whole session — every agent message count still zero
- duration: 5s
- poster: 4s
- transition_in: crossfade
- status: animated
- blueprint: kinetic-type-beats (Adapt)
- focal: the counter pair — 1 reaction / 0 messages
- roles: recreated thread = background (dimmed ~40%, unreadable, present only as texture) · counter pair = cutout
- asset_candidates: none
- src: compositions/frames/07-point.html

Pay off the hook with the restraint. Everything just shown came out of a group the
agent never once posted into. Say the number: one reaction, zero messages.

Adapt: keep the full-screen statement beats, but the payoff is a **numeral pair**
rather than a spring-popped word, and it arrives already still — this is the film's
breather and nothing in it may feel eager.

Scene 1 (0.0–1.6s): the Telegram thread returns behind everything, dimmed ~40% and
blurred past reading — texture, not content. Centred over it, "Overheard sat in that
group all morning." in display weight, ~55% of canvas.
Scene 2 (1.6–3.2s): the line clears and the counter pair sets in its place, centred,
tabular: **1 reaction** in `primary` · **0 messages** in `text`. Both arrive together
by a single mask-up — no count-up, no stagger; the restraint is the content.
Scene 3 (3.2–5.0s): held, completely still. A hairline rule draws once beneath the
pair and stops. Nothing else moves.

## Frame 8 — Brand

- scene: The wordmark settles with the one line that describes the product
- duration: 4s
- poster: 3s
- transition_in: crossfade
- status: animated
- blueprint: logo-assemble-lockup (Adapt)
- focal: the Overheard wordmark
- roles: none (typographic lockup)
- asset_candidates: none
- src: compositions/frames/08-brand.html

Close quietly. The product's own brand block already says it better than a tagline
would: promises people made to each other, never typed into anything.

Adapt: keep the assemble-into-lockup signature, but the mark is set type rather than
a logo, so it **settles** into place from a short rise instead of being built from
parts — the product has no logo and inventing one here would ship off-brand.

Scene 1 (0.0–1.5s): the `text` ink block from the real dashboard's own brand tile
rises into the centre of the `bg` ground, ~45% of canvas, and the wordmark
**Overheard** settles inside it on a long tail.
Scene 2 (1.5–3.0s): beneath it, in `text-light`, the product's own line —
"Promises people made to each other, never typed into anything." — fades up on the
same left margin as the wordmark.
Scene 3 (3.0–4.0s): held. A single `primary` pip sets to the left of the wordmark and
stays lit. Nothing moves out; the film ends on the still frame.
