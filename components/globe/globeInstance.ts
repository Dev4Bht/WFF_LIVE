import ThreeGlobe from "three-globe";

export function createGlobe() {
  return new ThreeGlobe()
    .globeImageUrl("/textures/earth-day.jpg")
    .bumpImageUrl("/textures/earth-topology.png")
    .showAtmosphere(true)
    .atmosphereColor("#38bdf8")
    .atmosphereAltitude(0.18)
    .pointAltitude(0.015)
    .pointRadius(0.28)
    .pointResolution(12)
    .pointsMerge(false)
    .arcAltitudeAutoScale(0.35)
    .arcStroke(0.35)
    .arcDashLength(0.4)
    .arcDashGap(2)
    .arcDashAnimateTime(4000)
    .ringMaxRadius(3.5)
    .ringPropagationSpeed(2.5)
    .ringRepeatPeriod(1400);
}

export type Globe = ReturnType<typeof createGlobe>;
