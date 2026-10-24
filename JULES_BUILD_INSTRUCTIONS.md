# JULES BUILD INSTRUCTIONS — God's Eye View: Sovereign Awareness Platform

> **For Google Jules (or any AI coding agent):** This document outlines the complete build plan to transform God's Eye View from a browser-based OSINT globe into a full-stack personal awareness platform with hardware integration, sensor fusion, and a premium course delivery system.

---

## Project Overview

**Current state:** Photorealistic 3D globe with live aircraft, ships, satellites, earthquakes, traffic, and public cameras. Voice-controlled AI agent. Runs locally via Vite + Node.js.

**Target state:** Complete "God's Eye View" personal awareness system — 360° sensor fusion, wearable/implantable device integration, real-time environmental awareness, and a premium course platform ($20,000/person) taught by Bob and Lum.

---

## PHASE 1: Core Platform Enhancement (Weeks 1-4)

### 1.1 Real-Time Sensor Fusion Engine
```
src/sensor-fusion/
├── index.js              # Main fusion orchestrator
├── providers/
│   ├── camera360.js      # 360° camera array input (Ricoh Theta, Insta360, custom rigs)
│   ├── lidar.js          # LiDAR point cloud processing (Livox, Ouster, custom)
│   ├── radar.js          # mmWave radar (TI IWR6843, Infineon)
│   ├── ultrasonic.js     # Proximity sensing array
│   ├── imu.js            # 9-axis IMU (BNO085, ICM-20948)
│   ├── gps.js            # Multi-band GNSS (u-blox ZED-F9P RTK)
│   ├── audio.js          # Microphone array beamforming (ReSpeaker, custom MEMS)
│   ├── thermal.js        # FLIR Lepton / MLX90640 thermal imaging
│   └── environmental.js  # Air quality, UV, radiation (PMS5003, GUVA-S12SD, Geiger)
├── fusion/
│   ├── kalman.js         # Extended Kalman Filter for multi-sensor state estimation
│   ├── particle.js       # Particle filter for non-Gaussian distributions
│   ├── slam.js           # Simultaneous Localization and Mapping
│   └── object-track.js   # Multi-object tracking (DeepSORT + YOLO)
└── visualization/
    ├── globe-overlay.js  # 3D globe sensor overlay
    ├── ar-hud.js         # AR heads-up display rendering
    └── tactical.js       # Tactical awareness display modes
```

**Dependencies to add:**
- `@tensorflow/tfjs-node` — ML inference
- `three` (already present) — 3D rendering
- `socket.io` — real-time sensor data streaming
- `protobufjs` — efficient sensor data serialization
- `opencv4nodejs` — computer vision pipeline

### 1.2 Hardware Abstraction Layer (HAL)
```
src/hal/
├── index.js              # Hardware detection and initialization
├── protocols/
│   ├── serial.js         # USB/UART communication (FTDI, CP210x)
│   ├── i2c.js            # I2C sensor bus (via i2c-bus npm)
│   ├── spi.js            # SPI high-speed sensor interface
│   ├── mqtt.js           # MQTT IoT sensor network
│   ├── ble.js            # Bluetooth Low Energy wearables
│   ├── can-bus.js        # CAN bus vehicle integration
│   └── usb-video.js      # UVC camera capture (via v4l2 / DirectShow)
├── devices/
│   ├── smartwatch.js     # Apple Watch, WearOS, Garmin integration
│   ├── smart-ring.js     # Oura Ring, Samsung Galaxy Ring
│   ├── smart-glasses.js  # Meta Ray-Ban, Xreal, Vuzix
│   ├── implant-devices.js# Neuralink API, custom BLE implants
│   ├── drone.js          # DJI SDK, MAVLink drone integration
│   └── vehicle.js        # OBD-II, Tesla API, CAN bus
└── calibration/
    ├── auto-calibrate.js # Automatic sensor calibration routines
    └── drift-comp.js     # Sensor drift compensation
```

### 1.3 360° Camera System
```
src/camera360/
├── stitcher.js           # Real-time 360° video stitching (OpenCV + CUDA)
├── depth-estimator.js    # Monocular depth estimation (MiDaS / Depth Anything)
├── object-detector.js    # YOLOv8 / RT-DETR real-time detection
├── face-recognition.js   # FaceNet / ArcFace embedding matching
├── license-plate.js      # ANPR/LPR (OpenALPR integration)
├── ocr.js               # Text recognition in scene (PaddleOCR)
└── scene-understanding.js # CLIP-based scene description
```

---

## PHASE 2: Wearable & Implantable Integration (Weeks 5-8)

### 2.1 Wearable Device Hub
```
src/wearables/
├── manager.js            # Device lifecycle management
├── health/
│   ├── heart-rate.js     # PPG heart rate monitoring
│   ├── ecg.js            # Single-lead ECG (AliveCor KardiaMobile)
│   ├── spo2.js           # Blood oxygen saturation
│   ├── eeg.js            # Consumer EEG (Muse, Emotiv, OpenBCI)
│   ├── emg.js            # Muscle activity (MyoWare, OYMotion)
│   ├── temperature.js    # Core body temperature (TempTale, Oura)
│   ├── gsr.js            # Galvanic skin response (stress detection)
│   └── blood-pressure.js # Continuous BP (Biobeat, Valencell)
├── position/
│   ├── uwb.js            # Ultra-wideband indoor positioning (DWM1001)
│   ├── rssi-trilateration.js # BLE RSSI positioning
│   └── dead-reckoning.js # IMU-based dead reckoning
├── communication/
│   ├── haptic.js         # Haptic feedback (bHaptics, Woojer)
│   ├── bone-conduction.js # Audio via bone conduction (Shokz)
│   └── neural-band.js    # Neural interface headband (NextMind, OpenBCI)
└── security/
    ├── biometric-lock.js # Biometric device authentication
    └── encryption.js     # End-to-end sensor data encryption (Signal protocol)
```

### 2.2 Implantable Device Support
```
src/implants/
├── rfid-nfc.js           # NFC/RFID implant readers (Apex, xNT, VivoKey)
├── magnetometer.js       # Magnet implant sensing (cyborg magnetometers)
├── led-implant.js        # LED implant control (Dangerous Things)
├── emg-implant.js        # Subdermal EMG electrodes
├── neural-link.js        # Brain-computer interface (Neuralink N1, Synchron Stentrode)
└── bio-sensor.js         # Implantable glucose, lactate, pH sensors
```

**Hardware procurement list (for course kit):**
| Component | Model | Est. Cost | Purpose |
|-----------|-------|-----------|---------|
| 360° Camera | Insta360 X4 | $500 | Surround vision |
| LiDAR | Livox Mid-360 | $1,000 | 3D point cloud |
| Radar | TI IWR6843ISK | $150 | Through-obstacle detection |
| Thermal | FLIR Lepton 3.5 | $250 | Thermal imaging |
| EEG Headband | OpenBCI Cyton + Ganglion | $1,000 | Brain-computer interface |
| Smart Ring | Oura Ring 4 | $350 | Health monitoring |
| Smart Glasses | Xreal Air 2 Ultra | $700 | AR overlay |
| UWB Anchors | DWM1001 × 8 | $800 | Indoor positioning |
| Edge Computer | NVIDIA Jetson Orin Nano | $500 | On-device ML |
| Drone | DJI Mini 4 Pro | $1,100 | Aerial reconnaissance |
| Custom PCB | ESP32-S3 sensor hub | $50 | IoT sensor network |
| **Total hardware kit** | | **~$6,400** | |

---

## PHASE 3: Course Platform (Weeks 9-12)

### 3.1 Course Delivery System
```
src/course/
├── platform/
│   ├── enrollment.js     # Student enrollment ($20,000 tier)
│   ├── payment.js        # Stripe high-value payment processing
│   ├── scheduling.js     # Live session scheduling with Bob & Lum
│   ├── video-streaming.js # WebRTC live streaming + recording
│   ├── whiteboard.js     # Collaborative spatial whiteboard
│   └── certification.js  # "Certified God's Eye Operator" credentials
├── curriculum/
│   ├── module-1-awareness/    # Global situational awareness fundamentals
│   ├── module-2-sensors/      # Hardware deployment and calibration
│   ├── module-3-fusion/       # Multi-sensor data fusion
│   ├── module-4-ai/           # AI-powered analysis and prediction
│   ├── module-5-tactical/     # Tactical awareness and response
│   ├── module-6-privacy/      # OPSEC and privacy protection
│   ├── module-7-business/     # Commercial applications and ROI
│   └── module-8-mastery/      # Advanced integration practicum
├── labs/
│   ├── lab-01-globe-setup/    # Set up your God's Eye View instance
│   ├── lab-02-sensor-deploy/  # Deploy physical sensor array
│   ├── lab-03-fusion-config/  # Configure multi-sensor fusion
│   ├── lab-04-ai-training/    # Train custom detection models
│   ├── lab-05-ar-overlay/     # Build AR awareness overlay
│   ├── lab-06-drone-intel/    # Aerial reconnaissance integration
│   ├── lab-07-threat-model/   # Threat modeling and response
│   └── lab-08-full-deploy/    # Complete system deployment
└── community/
    ├── forum.js          # Private course community (Discourse integration)
    ├── mentorship.js     # 1-on-1 mentorship scheduling
    └── alumni-network.js # Graduate network and referrals
```

### 3.2 Bob & Lum Course: "Sovereign Awareness Intensive"

**Price: $20,000 per person (includes hardware kit)**

**Format:** 8 weeks, 2 live sessions per week (2 hours each), plus self-paced labs

**Session Structure:**
- **Bob** covers the technical build: sensors, fusion, AI, deployment
- **Lum** covers the strategic layer: privacy, business applications, threat modeling, philosophy of awareness

**Module Breakdown:**

| Week | Module | Bob (Technical) | Lum (Strategic) | Lab |
|------|--------|----------------|-----------------|-----|
| 1 | Global Awareness | Globe setup, data feeds, API keys | Why awareness matters, threat landscape | Lab 01 |
| 2 | Sensor Hardware | Unbox kit, deploy sensors, calibrate | Sensor placement strategy, OPSEC | Lab 02 |
| 3 | Data Fusion | Kalman filters, SLAM, object tracking | Information theory, signal vs noise | Lab 03 |
| 4 | AI Pipeline | YOLO, CLIP, custom model training | AI ethics, bias, responsible deployment | Lab 04 |
| 5 | AR & Visualization | AR HUD, smart glasses, haptics | Human factors, cognitive load management | Lab 05 |
| 6 | Aerial & Mobile | Drone integration, mobile sensors | Legal framework, airspace regulations | Lab 06 |
| 7 | Threat Response | Alert systems, automated response | Threat modeling, incident response | Lab 07 |
| 8 | Mastery | Full system integration practicum | Business case, ROI, scaling | Lab 08 |

**Deliverables per student:**
1. Complete hardware sensor kit ($6,400 value)
2. Private GitHub repo with personalized config
3. "Certified God's Eye Operator" credential
4. Lifetime access to course community
5. 2 hours of 1-on-1 mentorship post-course
6. Priority access to advanced modules

---

## PHASE 4: Infrastructure (Ongoing)

### 4.1 Edge Deployment
```
deploy/
├── jetson/               # NVIDIA Jetson deployment scripts
├── raspberry-pi/         # RPi 5 sensor node deployment
├── docker/               # Containerized services
├── k8s/                  # Kubernetes cluster for multi-site
└── terraform/            # Cloud infrastructure (AWS IoT Greengrass)
```

### 4.2 Data Pipeline
```
src/pipeline/
├── ingest.js             # Multi-source data ingestion
├── normalize.js          # Schema normalization and validation
├── enrich.js             # Contextual enrichment (weather, events, demographics)
├── store.js              # Time-series database (TimescaleDB / QuestDB)
├── index.js              # Spatial indexing (PostGIS / H3)
└── api.js                # GraphQL + REST API for course platform
```

---

## Build Instructions for Jules

### Getting Started
```bash
# Clone and setup
git clone https://github.com/robertpelloni/gods-eye-view
cd gods-eye-view
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Docker deployment
docker compose up -d
```

### Development Priorities (in order)

1. **[P0]** Sensor Fusion Engine — core architecture (`src/sensor-fusion/`)
2. **[P0]** Hardware Abstraction Layer — device connectivity (`src/hal/`)
3. **[P1]** 360° Camera Pipeline — computer vision (`src/camera360/`)
4. **[P1]** Wearable Device Hub — health monitoring (`src/wearables/`)
5. **[P2]** Course Platform — enrollment and delivery (`src/course/`)
6. **[P2]** AR Visualization — heads-up display (`src/ar/`)
7. **[P3]** Implantable Device Support (`src/implants/`)
8. **[P3]** Edge Deployment — distributed sensors (`deploy/`)

### Testing Strategy
- Unit tests for each sensor provider (mock hardware)
- Integration tests with real hardware (CI + hardware-in-loop)
- End-to-end tests for course platform
- Performance benchmarks for real-time fusion (< 100ms latency target)

### Code Standards
- ES modules throughout
- TypeScript for sensor-fusion and hal layers
- JSDoc comments on all public APIs
- 80%+ test coverage on critical paths
- Hardware abstraction: every device must have a mock implementation

---

## API Keys & Services (for course platform)

| Service | Purpose | Free Tier | Paid Tier |
|---------|---------|-----------|-----------|
| Mapbox | 3D globe tiles | 50k loads/mo | $5/1k loads |
| OpenSky | Live flight data | Free (rate-limited) | N/A |
| AISstream | Ship tracking | Free | N/A |
| Stripe | Payment processing | 2.9% + $0.30 | Volume discounts |
| Twilio | SMS alerts | Pay-per-use | $0.0075/SMS |
| AWS IoT | Device management | 12 months free | $0.08/device/mo |
| TimescaleDB | Time-series storage | Free (self-host) | Cloud from $30/mo |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Sensor fusion latency | < 100ms |
| Object detection accuracy | > 95% mAP |
| Platform uptime | 99.9% |
| Course completion rate | > 80% |
| Student satisfaction | > 4.8/5.0 |
| Hardware kit deployment time | < 2 hours |
| Revenue per cohort (20 students) | $400,000 |

---

*This document is the authoritative build specification for Google Jules and any AI coding agent working on the God's Eye View platform. Update this document as the architecture evolves.*
