---
title: Fiber Modes
subtitle: See the output intensity patterns of single- and multi-mode fiber, and manipulate them using fiber paddles.
added: 2026-09-24 # TODO: real date

diagram: ./diagram.svg
diagramAlt: >-
  Setup: a fiber fault locator (red laser) feeds fiber through a set of polarization paddles on a
  breadboard, then into a single-mode, few-mode, or multi-mode fiber aimed at a viewing screen
  through a polarizer. Below, the patterns on the screen: a smooth round spot for single-mode fiber,
  a two-lobed pattern for few-mode fiber, and a grainy speckle pattern for multi-mode fiber.

budget: [50, 100]
scores:
  tools: [1, 3]
  assembly: [2, 3]
  portability: [6, 7]
  setupTime: [2, 3]
  demoComplexity: [5, 7]
  conceptComplexity: [6, 8]
  wow: 4

supplies:
  - item: Red laser fault finder
    need: required
    details: >-
      Some way to fiber-couple laser light is required. This is by far the cheapest and easiest way,
      but other laser sources and optics can be used if that is more convenient.
    cost: $15
    link: { label: Amazon, url: https://www.amazon.com/CHunreegow-Visual-Fault-Locator-Compatibility/dp/B0F7QXG2HT }
  - item: FC to LC fiber adapters
    need: maybe-required
    details: >-
      Depends on the connectors on your fibers and laser source. This adapter often comes with red
      laser fault finders.
    cost: $10
    link: { label: Amazon, url: https://www.amazon.com/Locator-Adapter-Connector-Convertor-Compatible/dp/B09BZDZZFY/ }
  - item: SMF-28 fiber patch cable
    need: required
    details: At least one fiber that is multimode at the excitation wavelength is required.
    cost: $10
    link: { label: Amazon, url: https://www.amazon.com/FLYPROFiber-Fiber-Patch-Length-Options/dp/B08B3JT2V3/ }
  - item: Platform to base things off of
    need: effectively-required
    details: >-
      You want all this on some sort of table. An optical breadboard is the fancy solution, but you
      can just tape things to a piece of wood, honestly.
    cost: TODO
  - item: Polarizer / polarizing film
    need: highly-recommended
    details: >-
      Using a polarizer to view the output mode pattern is cheap and adds a lot of technical depth to
      the explanations.
    cost: $5
    link: { label: Amazon, url: https://www.amazon.com/Polarized-Polarizing-Non-Adhesive-Educational-Photography/dp/B08Q767R82 }
  - item: Polarization paddles
    need: recommended
    details: >-
      This demo can be performed simply by bending fibers by hand, but paddles provide much finer
      control and permanence (fibers don't just bend back). Expensive from Thorlabs! But a great
      opportunity for a DIY 3D-printed project — it's just a moving piece of plastic.
    cost: $200+
    link: { label: Thorlabs, url: https://www.thorlabs.com/item/FPC030 }
  - item: 50 µm core multi-mode fiber patch cable
    need: optional
    details: Adds a lot to the demo for a similar cost to the other fiber.
    cost: $10
    link: { label: Amazon, url: https://www.amazon.com/FLYPROFiber-Fiber-Patch-Length-Options/dp/B093GV4N5K/ }
  - item: Single-mode 650 nm fiber patch cable
    need: optional
    details: >-
      Adds a lot to the demo. Unfortunately these fibers are much more expensive, as they are not used
      anywhere in telecommunications.
    cost: $150
    link: { label: Thorlabs, url: https://www.thorlabs.com/item/P3-S405-FC-1 }
---

## Supplies

## Presentation ideas

### Main idea

Let attendees play with the paddles or move un-taped SMF-28 fiber and observe the changing intensity patterns on the screen.

- Switching to 50 µm fiber will produce more complex intensity patterns.
- Switching to single-mode fiber will produce an intensity pattern that does not vary spatially as the paddles are moved — only its intensity as viewed through a polarizer changes. Polarization control in SMF is the most typical use case of polarization paddles.

### Concepts, from simple to complex

- How fiber works ([LINK TO OTHER DEMOS THAT HELP DO THIS BETTER])
- What the different modes in a fiber mean
  - Analogy 1: angles of light undergoing TIR
  - Analogy 2 (for modes in general): a guitar string
- Impact of modes on fiber applications
  - Communications: modal dispersion (light from each mode arrives at the receiver at different times, like echoes)
  - Focusing light from a fiber: single-mode fiber light can be collimated like a laser pointer, while multi-mode light becomes progressively harder to collimate (diverges more) as the number of modes increases
- What the paddles are actually doing
  - Why polarization is affected: strain on the fiber induces birefringence, which delays the polarization components relative to each other
  - Why modes are affected: bending changes the refractive index and geometry of the fiber, which delays each mode differently (explain either through their different modal profiles or their different angular distributions)
- Spatial coherence
  - More modes = less spatially coherent, with the important note that light is only truly spatially incoherent if the output can only be represented as a sum of modes whose amplitudes and phases vary randomly over the integration time of interest.
  - If the integration time is short enough that a snapshot "freezes" the evolution of this mixture of many modes, we can in principle design an optical system that transforms this complex-looking field into a nice-looking beam. This is the basis of adaptive optics, where the pattern is measured very rapidly and a deformable mirror undoes it.
  - Many important spatially incoherent sources, like LEDs and sunlight, emit light whose field changes randomly at extremely fast rates (the optical bandwidth of the source, for natural light sources). For almost every practical application the integration time is too long and these fluctuations average out, so no passive optical element can transform the beam back into a single mode.

### Gamification

Print out a diagram of Hermite–Gaussian or Laguerre–Gaussian modes. Attendees play with the paddles and polarizer to see if they can reproduce some of the nice-looking patterns on the paper. Recommended with red light and SMF-28 fiber:

- (1,0) modes are the easiest
- (2,0) modes are possible
- (0,0) is possible with some luck and effort
- Many other patterns are possible

## Subtle tidbits

- Bend the fiber very tightly and you'll see more red light leak out. This is because we're frustrating the condition for TIR — a good lead-in to the minimum bending radius of fibers.
- Try turning the laser fault finder on and off while viewing the multimode intensity patterns. When you first turn it on, the speckle pattern changes rapidly, and if you look closely the changes happen in discrete steps. After the laser has been on for a bit, the changes slow and eventually stop.
  - This is the laser diode inside the fault finder mode hopping.
  - As the laser heats up, its cavity expands and the frequencies of its modes change. When the lasing mode drifts away from the gain peak, a different mode suddenly begins lasing, causing a step change in the output wavelength.
  - The intensity patterns at the output of the multimode fiber are highly wavelength dependent: they come from interference between light in different fiber modes, which travel different optical path lengths. The phase difference between modes is k·L·Δn, so if k changes, the phase changes, and so does the output pattern.
  - Accumulating long path-length differences in fiber for interferometry is a very powerful general concept, though doing it in multimode fiber is less common (separate single-mode fibers are more typical).

## Opportunities for improvement

- Polarization paddles are one of the most comically overpriced optics supplies I've ever seen. You should be able to 3D print them for cheap: [fiber polarization controller on Printables](https://www.printables.com/model/268294-fiber-polarization-controller).
- Find a cheaper source of single-mode visible fiber. It is a bit niche, but it's wild that it's so much more expensive.
