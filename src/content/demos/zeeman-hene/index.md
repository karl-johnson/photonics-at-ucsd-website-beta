---
title: Zeeman Splitting
subtitle: Use magnetic fields to change the wavelength of light
blurb: The Zeeman effect is quantum mechanical effect where electronic energy levels split slightly in the presence of a magnetic field. The slightness of this effect makes it usually very difficult to observe, but this demo/experiment uses the amazing properties of frequency beating (heterodyne detection) to make this effect visible with relatively modest equipment. 
added: 2026-10-23
stub: true
diagram: ./diagram.svg
diagramAlt: >-
  Setup: an unpolarized HeNe tube between permanent magnets, followed by a polarizer and a photodiode
  with a terminating resistor, connected to an oscilloscope or spectrum analyzer. Below, the optical
  spectrum shows left- and right-circularly polarized modes separated by a splitting proportional to
  the magnetic field (typically ~1 MHz); after the polarizer and photodetection, the electrical
  spectrum shows a single line at that splitting frequency.
photos:
  - { src: ./setup_rough.jpg, alt: The demo roughly put together on a big optical table in the lab.}
  - { src: ./trace_close.jpg, alt: A close-up of the beatnote signal measured by the oscilloscope.}
# Scores: see /resources/rubric/ for what each number means.
scores:
  budget: [300,1500]
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

- Interfere the transmitted beam with the diffracted beam on a photodetector: a beatnote will appear at the drive frequency of the AOM due to the frequency shift the AOM applies to the diffracted beam 
