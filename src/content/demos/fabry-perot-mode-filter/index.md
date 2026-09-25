---
title: Fabry–Perot Mode Filter
subtitle: Watch the light exiting an optical resonator rapidly cycle through a variety of intricate mode patterns.
added: 2026-09-23 # TODO: real date

diagram: ./diagram.svg
diagramAlt: >-
  Setup: a HeNe laser beam passes through two resonator mirrors separated by L, then a microscope
  objective, onto a viewing screen. Below, a plot of cavity transmission versus wavelength shows
  resonance peaks for different spatial modes; as the laser drifts it passes over each resonance in
  turn, lighting up that mode on the screen.

# Photos go in this folder, then list them here (the first one is also the thumbnail):
# photos:
#   - { src: ./photo-1.jpg, alt: The assembled cavity on a breadboard }
#   - { src: ./photo-2.jpg, alt: Mode patterns on the viewing screen }

budget: [250, 1000]
scores:
  tools: [2, 3]
  assembly: [5, 6]
  portability: [3, 4]
  setupTime: [3, 4]
  demoComplexity: [7, 9]
  conceptComplexity: [7, 9]
  wow: 5

supplies:
  - item: Small HeNe laser
    need: required
    details: >-
      Polarized laser source with only one or a few lasing longitudinal modes, each with a linewidth
      narrower than that of the FP cavity's resonances. Used lasers like the JDSU 1508 "Novette" can
      be found at modest cost and reused for many demos — more on our [light sources page](/resources/).
    cost: ["$200 used (eBay)", "$1000 new (Thorlabs)"]
    link: { label: Light sources, url: /resources/ }
  - item: Resonator mirrors
    need: required
    details: >-
      Two mirrors form the Fabry–Perot cavity. They should have a reflectivity near 99% at the HeNe
      wavelength (outcoupling mirrors) — higher R is *not* better. We used R = 30 cm
      radius-of-curvature mirrors.
    cost: $35 for 2 (eBay)
    link: { label: eBay }
  - item: Tip/tilt optic mounts
    need: effectively-required
    details: >-
      Yes, it's possible to align a cavity without these, but you won't be having a good time. DIY
      solutions are possible.
    cost: $100 for 2 (new)
    link: { label: Thorlabs }
  - item: Mirror-to-1″ optic adapter
    need: likely-required
    details: >-
      Most tip/tilt mounts take 1″ optics, but cheap HeNe mirrors from eBay are typically ~6 mm. 3D
      print (or buy, if you really want) a plastic ring to adapt them.
    cost: <$1 (3D print)
    link: { label: DIY }
  - item: Optomechanics and breadboard
    need: highly-recommended
    details: >-
      This setup benefits from off-the-shelf hardware and a breadboard to experiment on. See [our
      recommendations](/resources/) for items suited to a wide range of demos. If you own no such
      components, a DIY breadboard and mounting hardware can work for much cheaper.
    cost: $500
    link: { label: Recommendations, url: /resources/ }
  - item: Microscope objective
    need: recommended
    details: Enlarges the mode patterns coming from the cavity, which enhances the viewing experience.
    cost: $20–30
    link: { label: Amazon }
---

## Supplies

## Alignment

1. Put down the laser and turn it on.
2. Put down the second (furthest away) mirror, center the beam on it, and roughly center the back-reflection from this mirror on the incident beam. Make sure the reflective coated side faces **towards** the laser (towards what will be the inside of the cavity).
3. Put the other mirror down at the appropriate distance L from the first (see [Subtle tidbits](#subtle-tidbits)), with the coating facing **away** from the laser.
4. As you align this second mirror to reflect the light back towards the laser, you should start to see the flickering mode patterns at the output.
5. Place the microscope objective at the output and adjust the cavity until the patterns look nice.

:::note[Back-reflections into the laser]
- Back-reflections directly into the HeNe are technically not a good thing. We've seen large power fluctuations, and even the laser stop lasing, due to interference from the external mirrors/cavity.
- This won't damage the laser — just play with the mirrors until you get a nice output without the laser going all wonky.
- The proper fix in real engineering applications is an optical isolator, but that's overkill here (unless you happen to have one — lucky you).
:::

## Presentation ideas

### The effect

The images projected by this setup rapidly flicker through a variety of output mode patterns in a way that is visually striking.

### Audience

We've found this effect is actually more surprising and unintuitive to audiences that already have a decent amount of optics knowledge (late undergraduate to graduate level).

It can be visually interesting for audiences with little optics background, but we wouldn't make it the only demonstration at an event for early undergraduates or younger. It's a good choice as the "most complicated" setup for such audiences — something good to look at that showcases the depth and sophistication of optics as a field.

### Explaining it

Use [the diagram at the top of the page](#diagram) to explain at a high level how the effect works. More detail is in [Subtle tidbits](#subtle-tidbits).

### Hands-on

Let attendees turn the HeNe laser on and off and/or play with the cavity mirrors to see the effect change.

- Power-cycling the laser temporarily speeds up the flickering, due to thermal expansion of the cavity as it warms up or cools down.
- Slightly misaligning the cavity usually mode-matches the input beam to higher-order modes, making the output patterns more complex.

## Subtle tidbits

### Cavity stability

`L ≤ 2R`

If the two mirrors are identical, the cavity is stable for L ≤ 2R (the distance between mirrors is at most twice their radius of curvature) [ref](#). Don't put L > 2R or it won't work.

### Mode resonance frequencies

`L ≈ 1.5R` `avoid L = R, 2R`

For this demo to work, we want every mode to resonate at a different frequency — if two modes share a resonance, both appear at once and the output looks less clean. These frequencies are determined by the Gouy phase [ref](#).

It turns out the *worst* choice here is a confocal cavity, L = 2R, or L = R [ref](#) (the best choice for other applications, like Fabry–Perot laser spectroscopy). L = φR, where φ is the golden ratio, is probably ideal, since φ is often considered the "least composite number." In practice, any distance around L = 1.5R (but not exactly that) is probably good enough.

### Mode coupling

The maximum transmission for each resonance is set by the overlap of the incident beam with that mode's profile inside the cavity. If one output shape is much brighter than the others, you are well matched to that mode. Adding lenses to change the beam parameters can engineer a better result.

## Opportunities for improvement

- DIY tip/tilt mirror holders can lower the cost somewhat, at the price of more challenging alignment.
