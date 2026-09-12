---
workflow: product-launch-video
flow: automation
storyboard: no
message: "You never log anything — the board fills itself from what the team already said"
destination: demo-stage
aspect: 1920x1080
language: en
audience: hackathon judges and the team
length: 50s
angle: the agent that never posts
capture: localhost
vo_mode: none
audio: silent
---

## Intent

Fallback demo video for Overheard, a Telegram group agent, shown to judges at a
hackathon. It exists so the demo survives dead wifi, a rate-limited bot token, or
a silent group — it must tell the whole story without a live Telegram connection.

The story is the product's one surprising move: the agent is in the group and
never speaks. Someone says an ordinary sentence, the agent marks that message
with a single reaction, and a card appears on a board nobody typed into. Then the
board answers questions about itself.

Tone: quiet and factual, closer to a product note than a launch ad. The thing is
already impressive; overselling it would make it look smaller.

## Customizations

- Recreate the Telegram group chat in HTML — it cannot be captured, and a real
  screen recording of it is exactly what this video exists to replace.
- Use the real dashboard's own design tokens (DM Sans / DM Mono, #f1f1f4 ground,
  #f5401d accent) so the recreated chat and the captured board read as one product.
- The ✍️ reaction landing on the source message is the hero moment — hold on it.
- Show the in-dashboard agent answering a question and closing a card, so the
  board is visibly not a static list.

## Notes

- Silent by design. Not signed in to HeyGen and both local engines (Kokoro,
  MusicGen) are missing their Python deps; installing them would cost more of the
  remaining time than narration is worth here. On-screen type carries the whole
  story, which also survives a projector with no sound and lets the presenter
  narrate live over it.

- Real names only: Yasin, Mehmet Cem, Mert Gökhan, Ata, Sefa. No invented people.
- The product never posts a message into the group. Nothing in this video may
  show the bot writing text into the chat — that would misrepresent it.
- Every quote on a card must be a sentence a person actually said in the chat
  scene, verbatim. That mirrors the real extraction contract.
