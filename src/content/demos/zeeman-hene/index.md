---
title: Zeeman Splitting
subtitle: Use magnetic fields to change the wavelength of light
blurb: The Zeeman effect is quantum mechanical effect where electronic energy levels split slightly in the presence of a magnetic field. The slightness of this effect makes it usually very difficult to observe, but this demo/experiment uses the amazing properties of frequency beating (heterodyne detection) to make this effect visible with relatively modest equipment. 
added: 2026-10-23
stub: true
# TODO: add diagram.svg to this folder, then uncomment these lines.
# diagram: ./diagram.svg
# diagramAlt: >-
#   Diagram and visual explanation of the zeeman splitting demo. TODO
photos:
  - { src: ./setup_rough.jpg, alt: The demo roughly put together on a big optical table in the lab.}
  - { src: ./trace_close.jpg, alt: A close-up of the beatnote signal measured by the oscilloscope.}
# Scores: see /resources/rubric/ for what each number means.
scores:
  budget: [300,1000]
  tools: [2,3]
  manufacturingDifficulty: [4]
  alignmentDifficulty: [1,3]
  portability: 3
  setupTime: [3,4]
  presentationComplexity: [7,9]
  conceptComplexity: [8,9]
  wow: [1,2]

---

## Opportunities for improvement

- Finish this documentation! There are nuances to this such as the beatnote intensity fading in and out as the modes drift in the laser resonator, etc.
- Use an electromagnet instead of permanent magnets, so the amount of Zeeman splitting can be varied! This would also make the demo more compelling, as you can show the difference of the behavior between having a magnetic field and having no magnetic field
