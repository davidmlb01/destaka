# Hyperframes Composition Brief: Destaka

## Objective
Create a short launch-style brag video for Destaka.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape -- 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: /Users/davidlevy/Desktop/PJ/DESTAKA
- Primary files read: src/app/page.tsx, src/app/globals.css, src/components/dashboard/ScoreCard.tsx, src/app/(dashboard)/dashboard/components/ScoreHero.tsx, src/components/ui/Logo.tsx
- Product name: Destaka
- Tagline / strongest claim: "Seu perfil no Google trabalhando por voce" / "7x mais cliques no Google"
- Key UI moment to recreate: Score Hero dashboard (43/100 rising to 87/100) with category breakdown bars
- Copy that must appear verbatim:
  - "Seu cliente esta no Google agora."
  - "Ele vai te encontrar?"
  - "46% das buscas sao locais"
  - "76% visitam no mesmo dia"
  - "88% confiam em avaliacoes"
  - "Destaka"
  - "Google Meu Negocio no piloto automatico."

## Creative Direction
- Tone preset: polished
- Creative direction: premium dark-mode SaaS tool, confident and clean
- Interpretation: fewer scenes, longer holds, generous spacing. Confidence through restraint.
- Angle: The fear of invisibility. Your client is searching right now, and your competitor shows up instead. Destaka fixes that.
- Hook: "Seu cliente esta no Google agora. Ele vai te encontrar?"
- Outro: Destaka logo + "Google Meu Negocio no piloto automatico."
- Avoid: generic SaaS language, abstract filler visuals, anything not grounded in the product

## Visual Identity
- Background: #071a19
- Text: #ffffff (primary), rgba(255,255,255,0.7) (secondary)
- Accent: #14B8A6 (teal), bright variant #5EEAD4
- Status colors: #EF4444 (weak/red), #4ADE80 (strong/green)
- Display font: system sans-serif (Outfit unavailable in composition, use clean sans)
- Body font: system sans-serif
- Visual references: pin-eye SVG logo mark, score card with progress bars, stat cards with teal borders

## Storyboard
Use the storyboard in brag-output/brag-plan.md as the creative contract.

1. Hook -- 4s -- "Seu cliente esta no Google agora." + "Ele vai te encontrar?"
2. Score Reveal -- 5s -- Score 43/100 "Presenca Fraca" with category breakdown bars
3. Stats -- 5s -- Three stat cards (46%, 76%, 88%) arrive sequentially
4. Transformation + Outro -- 6s -- Score climbs 43->87, logo reveal

## Audio
- Audio role: warm professional bed with restrained accents
- Audio arc: music establishes warmth, score slam adds weight, stats pulse, logo resolves
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: 0.30 volume, fade gently under logo at ~18s
- Music cue guidance: bundled preset, ~110 BPM. Target 8.74s for score slam, 17.47s for logo. Beat grid ~10.93/12.02/13.11 for stats.
- Audio-reactive treatment: subtle; score glow breathes with RMS
- Audio-coupled moments:
  - Scene 2 score slam -- impact bell on 8.74s beat
  - Scene 3 stat cards -- drop sounds on beat grid
  - Scene 4 logo -- gentle bell on 17.47s beat
- SFX selection guidance: polished, sparse. impactBell_heavy_000 for score, drop_001/002/003 for cards, impactSoft_medium_001 for logo
- Audio files: copied into composition/assets/
