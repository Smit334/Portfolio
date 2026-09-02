// All copy here is real, approved content sourced from the live site (index.html +
// projects/*.html, approved Aug 2026). Do not introduce placeholder text.
// FEB overlay copy is tense-updated from the old project page (he left the team
// June 2025) — flagged for Smit's review before ship.

import portraitPhoto from '../assets/photos/portrait.jpg';
import aboutPhoto from '../assets/photos/about.jpg';
import nairobiPhoto from '../assets/photos/nairobi.jpg';
import logoTesla from '../assets/logos/tesla.png';
import logoFeb from '../assets/logos/formula-electric.png';
import logoRivian from '../assets/logos/rivian.png';
import logoIdol from '../assets/logos/idol.png';
import febSn3a from '../assets/photos/feb-sn3-a.jpg';
import febSn3b from '../assets/photos/feb-sn3-b.jpg';
import febArchitecture from '../assets/photos/feb-architecture.png';
import febSn4Track from '../assets/photos/feb-sn4-track.jpg';
import febSn4Tilt from '../assets/photos/feb-sn4-tilt.jpg';
import dartFlight from '../assets/photos/dart-flight.jpg';
import dartDrive from '../assets/photos/dart-drive.jpg';
import dartElectronics from '../assets/photos/dart-electronics.jpg';
import dartRolling from '../assets/photos/dart-rolling.jpg';
import pvBoardA from '../assets/photos/pv-board-a.jpg';
import pvBoardB from '../assets/photos/pv-board-b.jpg';
import pvBoardC from '../assets/photos/pv-board-c.jpg';
import pvSimA from '../assets/photos/pv-sim-a.png';
import pvSimB from '../assets/photos/pv-sim-b.png';

export const hero = {
  name: 'Smit Malde',
  tag: 'Electrical Design Engineer · Tesla Battery Electronics',
  // Smit's original approved tagline, verbatim; shine on "sustainable future"
  ledeBefore: 'Passionate about creating innovative solutions for a ',
  ledeShine: 'sustainable future',
  ledeAfter: '.',
  portrait: portraitPhoto,
  portraitAlt: 'Smit Malde sitting in the Formula Electric at Berkeley race car',
  metaLeft: "UC Berkeley — EECS '25",
  metaRight: 'California',
};

// Rewritten for readability from the approved copy — same facts, tighter voice.
// PENDING SMIT'S SIGN-OFF.
export const about = {
  photo: aboutPhoto,
  photoAlt: 'Smit Malde on a mountain hike',
  // Roots vignette — Nairobi dusk, letterboxed under the copy
  rootsPhoto: nairobiPhoto,
  rootsAlt: 'Nairobi skyline at dusk, a giraffe silhouetted in the foreground',
  rootsKicker: 'Nairobi, Kenya — 1°17′ S',
  paragraphs: [
    "I'm Smit — an Electrical Design Engineer on Tesla's Battery Electronics team, where I design and validate battery management system boards and high-voltage controllers. I carry hardware the whole way: schematic capture, layout, bring-up, and validation on the bench.",
    "I'm equally passionate about what AI can do for hardware engineering. It runs through my design, debugging, and validation workflows — including AI-driven test automation that accelerates bench validation.",
    "I grew up in Nairobi, Kenya, before moving to the Bay Area to study Electrical Engineering and Computer Sciences at UC Berkeley (Class of 2025). At Berkeley, I served as Chief of Electrical Engineering and Computer Science for Formula Electric at Berkeley — overseeing the low-voltage and high-voltage electronics, firmware, software, and vehicle integration of our electric race cars, and leading a team of talented engineers. Along the way I interned at Tesla and Rivian, designing BMS boards, cell simulators, and test automation systems.",
    "My goal is to help build the sustainable, efficient energy systems the future runs on.",
  ],
};

export const experience = [
  {
    company: 'Tesla',
    logo: logoTesla,
    role: 'Electrical Design Engineer — Battery Electronics',
    dates: 'August 2025 — Present',
    description:
      'Design and validate battery management system (BMS) boards and high voltage controllers, from schematic capture and layout through bring-up and validation. Apply AI across the hardware workflow, including AI-driven test automation that accelerates bench validation.',
  },
  {
    company: 'Formula Electric at Berkeley',
    logo: logoFeb,
    role: 'Chief of Electrical Engineering and Computer Science',
    dates: 'September 2022 — June 2025',
    description:
      'Led the Electrical Engineering and Computer Science division for Formula Electric at Berkeley, responsible for overseeing the design and implementation of cutting-edge systems for our electric racing vehicle.',
  },
  {
    company: 'Tesla',
    logo: logoTesla,
    role: 'Electrical & Firmware Engineer Intern',
    dates: 'January 2024 — August 2024',
    description:
      'Designed and developed a 24-channel BMS PCB, a thermistor reliability evaluation board designed for 100s of hours of reliability testing in extreme conditions, and an isoSPI communication interface board to bridge multiple BMS ASICs.',
  },
  {
    company: 'Rivian',
    logo: logoRivian,
    role: 'Electrical Engineer Intern — Hardware',
    dates: 'May 2023 — August 2023',
    description:
      'Developed stackable cell simulator boards and a test automation framework for next-gen vehicle architecture updates.',
  },
  {
    company: 'Idol',
    logo: logoIdol,
    role: 'Full Stack Blockchain Developer',
    dates: 'May 2022 — December 2022',
    description:
      'Developed and deployed a smart contract on the Polygon Network to mint custom NFTs for high-profile clients.',
  },
];

export const education = {
  school: 'University of California, Berkeley',
  degree: 'B.S. in Electrical Engineering and Computer Sciences',
  gradDate: 'May 2025',
};

// Uniform project cards; cards may have an overlay, an external link, or
// neither, and a small photo thumb when real imagery exists (full galleries
// live in the overlay panels).
export const cards = [
  {
    title: 'Formula Electric at Berkeley',
    desc: 'Designed and developed multiple systems and PCBs, authored firmware and system diagrams, validated and brought up PCBs for integration into various vehicle functions.',
    tags: ['588V Systems', 'PCB Design', 'Firmware'],
    overlay: 'feb',
    thumb: febSn4Track,
  },
  {
    title: 'PV–12V 100W Buck Converter',
    desc: 'Designed, simulated and iterated on a PV panel input to 12V output buck converter and wrote an MPPT algorithm, achieving efficiencies over 97% on all operating points.',
    tags: ['Power Electronics', 'MPPT', '97% Efficiency'],
    overlay: 'pv',
    thumb: pvBoardA,
  },
  {
    title: 'DART',
    desc: 'Designed a four-wheel drone with EVTOL capabilities by utilizing an in-wheel toroidal propeller design, eliminating the need for additional propellers. Designed a custom flight controller PCB with a suite of distance sensors to enable intelligent object detection and path planning.',
    tags: ['EVTOL', 'Flight Controller', 'Path Planning'],
    overlay: 'dart',
    thumb: dartFlight,
  },
  {
    title: 'Custom 16nm Chip Bring-Up',
    desc: 'Designed a PCB to bring up and boot Linux on a custom 16nm chip developed at UC Berkeley and taped out by Intel. The PCB includes comprehensive peripheral and driver support to enable seamless Linux integration and operation on the chip.',
    tags: ['PCB Design', 'Linux Bring-Up', '16nm Silicon'],
  },
  {
    title: '24-Channel BMS',
    desc: 'Designed a 24 channel BMS using new ADI ASICs from the ADBMS family. This has a stackable design to add multiple BMS Boards in a daisy chain. The board is designed with EIS (Electrochemical Impedance Spectroscopy) capabilities.',
    tags: ['ADBMS', 'Daisy Chain', 'EIS'],
    nda: true,
  },
  {
    title: 'SpeakEasy — AI Language Companion',
    desc: "Designed an AI-powered language tool designed to help users localize their own voice into other languages. SpeakEasy enables natural-sounding translations and assists with language learning by replicating the user's unique intonation.",
    tags: ['AI', 'Voice Localization'],
    href: 'https://github.com/Boomaa23/speak-easy',
  },
  {
    title: 'Cell Simulator',
    desc: 'Designed modular, stackable (up to 20 cells) cell simulator boards with 1.22mV precision to test ECU functionalities with a DMM during my Rivian internship. Also designed a motherboard to stack the cellsim on, the motherboard controlled a test automation suite with a constant current card and Digital/Analog IO board.',
    tags: ['Cell Simulation', '1.22mV Precision', 'Test Automation'],
    nda: true,
  },
  {
    title: '3-Stage Pipelined RISC-V CPU ASIC',
    desc: 'Developed a 3-stage pipelined RISC-V CPU with a custom cache system using Verilog and the Skywater 130nm process for digital ASIC design.',
    tags: ['RISC-V', 'Verilog', 'Skywater 130nm'],
  },
  {
    title: 'Thermistor Reliability Testing Board',
    desc: 'Developed a PCB for thermistor characterization and reliability testing using advanced ADI BMS ASICs during my Tesla internship. Designed to collect high precision data from 41 thermistors using a 16 Channel ADBMS ASIC.',
    tags: ['Reliability Testing', 'ADBMS', 'Precision Sensing'],
    nda: true,
  },
  {
    title: 'SIXT33N',
    desc: 'Built an RC scale car controlled via voice commands using an Arduino and a custom voice-word classifier model.',
    tags: ['Arduino', 'Voice Classifier'],
  },
  {
    title: 'Other Projects',
    desc: 'A collection of computer-science projects — version control, secure file storage, encryption, and machine learning.',
    tags: ['Software', 'Security', 'ML'],
    overlay: 'other',
  },
];

export const overlays = {
  feb: {
    title: 'Formula Electric at Berkeley',
    kicker: 'Chief of Electrical Engineering & Computer Science · SN3 & SN4',
    intro: [
      'As the Chief of Electrical Engineering and Computer Science for the SN3 and SN4 seasons, I was responsible for the design, development, and integration of all electrical systems in the vehicle — leading the team through the completion of SN4 in the 2024-25 season.',
      'I designed and developed multiple systems and PCBs, authored firmware, and validated and brought up boards for integration into vehicle functions across both cars.',
      'Our system architecture comprises a 588V pack, 140s4p, built from Energus 1s4p modules. The BMS is built on the LTC6813 family of chips from ADI, with the newer ADBMS ASICs adopted for SN4. The inverter is the Cascadia Motion Rinehart PM100DZ 3-phase motor controller driving an Emrax 228 High Voltage motor (Axial Flux, PMSM, SPM). Everything on the electrical architecture except the inverter and motor is custom designed and brought up in house.',
    ],
    designs: [
      {
        heading: '600V–12V Flyback Converter',
        text: 'Designed an isolated 600V to 12V flyback converter with UVLO at 60V to power the high-voltage indicator and supply power to a BMS motherboard.',
      },
      {
        heading: 'PCU — Acceleration Pedal Positional Sensor',
        text: 'The PCU (Powertrain Control Unit) reads acceleration and brake sensors. This data is used to calculate a torque value command that is broadcast over the CAN network so the inverter can draw the power necessary for the requested torque. This board is also the base for the BSPD.',
      },
      {
        heading: 'BSPD — Brake System Plausibility Device',
        text: 'The BSPD ensures safety by cutting power to the drivetrain if the brake and accelerator are engaged simultaneously, or if more than 5kW of power flows through the drivetrain while the brakes are pressed. It detects faults in pedal signals and prevents unintended acceleration.',
      },
      {
        heading: 'DCU and DASH',
        text: 'The DCU (Data Control Unit) logs everything on the CAN bus to an on-board SD card and transmits all messages through an XBee wireless transceiver module for live telemetry, with a supercapacitor UPS to avoid corruption of SD cards. The Dash acts as the I/O for the driver — relaying information from the CAN bus to the screen, and driver input onto the CAN bus.',
      },
    ],
    galleryCols: 2,
    gallery: [
      { image: febArchitecture, alt: 'SN4 electrical system high-level diagram', cap: 'SN4 System Architecture', wide: true, natural: true },
      { image: febSn4Track, alt: 'SN4, car 257, driving through the cones on track at competition', cap: 'SN4' },
      { image: febSn4Tilt, alt: 'SN4 on the tilt-table test at competition, driver seated', cap: 'SN4 — Tilt Test' },
      { image: febSn3a, alt: 'The SN3 race car at the June 2024 competition', cap: 'SN3' },
      { image: febSn3b, alt: 'A closer view of the SN3 race car', cap: 'SN3' },
    ],
    links: [
      { label: 'Team Website', href: 'https://ev.studentorg.berkeley.edu/' },
      { label: 'EECS Overview Deck', href: '/projects/FEB/High%20Level%20EECS%20Overview.pdf' },
      { label: 'Inverter & Motor Docs', href: 'https://elemental-hawk-04e.notion.site/SN2-RMS-Inverter-Documentation-5aa13ddd1dea40b8a2d1ffd78fd6838a' },
      { label: 'Flyback Documentation', href: 'https://elemental-hawk-04e.notion.site/SN2-Flyback-Converter-095e4428098c45faab3466b8fb5d547c' },
      { label: 'Flyback Design Notes', href: 'https://elemental-hawk-04e.notion.site/Design-600V-flyback-converter-b3b28f530cfb4a2cbbb9fb3ce9b4cb16' },
    ],
  },
  pv: {
    title: 'PV–12V 100W Buck Converter',
    kicker: 'Power Electronics · 97% Efficiency',
    intro: [
      'Designed, simulated (on PLECS) and iterated on a PV panel input to 12V output buck converter and wrote an MPPT algorithm, achieving efficiencies over 97% on all operating points.',
      'The project involves designing a buck converter that steps down the voltage from a photovoltaic (PV) panel to a stable 12V output, including the development of a Maximum Power Point Tracking (MPPT) algorithm to optimize the efficiency of the power conversion process.',
    ],
    designs: [
      {
        heading: 'Design Manual',
        text: 'A comprehensive guide to the design process: component selection and sizing, simulation results and analysis, thermal management considerations, and PCB layout guidelines.',
      },
      {
        heading: 'Schematics',
        text: 'The circuit design in detail: PV panel input section, buck converter topology, control circuitry for MPPT, and output filtering and regulation.',
      },
    ],
    gallery: [
      { image: pvBoardA, alt: 'The assembled PV buck converter PCB', wide: true },
      { image: pvBoardB, alt: 'Top view of the PV buck converter board' },
      { image: pvBoardC, alt: 'Detail of the PV buck converter power stage' },
      { image: pvSimA, alt: 'PV buck converter design screenshot, 1 of 2', fit: true },
      { image: pvSimB, alt: 'PV buck converter design screenshot, 2 of 2', fit: true },
    ],
    links: [
      { label: 'Design Manual', href: '/projects/PVBuck/DesignManualPVBUCK-SmitMalde.pdf' },
      { label: 'Schematics', href: '/projects/PVBuck/Schematics_PV_Buck_Converter_113B.pdf' },
      { label: 'Layout Design Deck', href: '/projects/PVBuck/EE%20113B%20PV%20BUCK%20CONVERTER.pdf' },
    ],
  },
  dart: {
    title: 'DART',
    kicker: 'Four-Wheel EVTOL Drone · Custom Flight Controller',
    intro: [
      'Designed a four-wheel drone with EVTOL capabilities by utilizing an in-wheel toroidal propeller design, eliminating the need for additional propellers — the wheels drive on the ground, then rotate flat to fly.',
      'Designed a custom flight controller PCB with a suite of distance sensors to enable intelligent object detection and path planning.',
    ],
    designs: [],
    galleryCols: 3,
    gallery: [
      { image: dartFlight, alt: 'DART in flight configuration, its four wheels rotated flat with the in-wheel propellers facing up', cap: 'Flight Mode', wide: true },
      { image: dartDrive, alt: 'DART standing on its four wheels in drive mode', cap: 'Drive Mode' },
      { image: dartRolling, alt: 'DART rolling across the floor', cap: 'Rolling' },
      { image: dartElectronics, alt: 'Close-up of the custom flight controller board with ultrasonic distance sensors', cap: 'Flight Controller' },
    ],
    links: [],
  },
  other: {
    title: 'Other Projects',
    kicker: 'Software · Security · Machine Learning',
    intro: [],
    designs: [
      {
        heading: 'GitLet — Git-Inspired Version Control',
        text: 'Built a version control system inspired by Git.',
        href: 'https://github.com/Smit334/GitLet.git',
      },
      {
        heading: 'Phish-Phighters',
        text: 'A secure file storage and sharing system in Go, offering encrypted file operations, user authentication, and access control for secure sharing and management.',
        href: 'https://github.com/Smit334/Phish-Phighters.git',
      },
      {
        heading: 'Enigma',
        text: 'Programmed an encryption and decryption software based on the Enigma Machine.',
        href: 'https://github.com/Smit334/Enigma.git',
      },
      {
        heading: 'Ataxx',
        text: 'Created the Ataxx game with an AI opponent using game tree algorithms.',
        href: 'https://github.com/Smit334/Ataxx.git',
      },
      {
        heading: 'ML Classifier for Movie Genres',
        text: 'Developed a machine learning classifier to identify movie genres based on words spoken in the movie dialogues.',
      },
    ],
    gallery: [],
    links: [],
  },
};

export const contact = {
  heading: 'Get in Touch',
  intro: "If you're interested in collaborating or learning more about my work, feel free to reach out.",
  email: 'smit334@berkeley.edu',
  linkedin: 'https://www.linkedin.com/in/smit-malde/',
  formspree: 'https://formspree.io/f/xgvovnll',
  resume: '/Smit-Malde-Resume.pdf',
  copyright: '© 2026 Smit Malde — California',
  farewellSw: 'Asante', // Swahili: thank you — footer farewell lockup
  farewellEn: 'Thank you',
};
