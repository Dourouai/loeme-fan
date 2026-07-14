"use client";

import { useEffect, useState } from "react";

type Point = { x: number; y: number };

const COUNT = 48;
const DURATION = 7.6;
const KEY_TIMES = "0;0.12;0.2;0.28;0.4;0.48;0.56;0.68;0.76;0.84;1";
const KEY_SPLINES = Array.from({ length: 10 }, () => ".2 .7 .2 1").join(";");

function linePoints(count: number, x1: number, y1: number, x2: number, y2: number): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    return { x: x1 + (x2 - x1) * progress, y: y1 + (y2 - y1) * progress };
  });
}

function ellipsePoints(count: number, cx: number, cy: number, rx: number, ry: number, phase = 0): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + index / count * Math.PI * 2;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
}

function resamplePolyline(anchors: Point[], count: number): Point[] {
  const segments = anchors.slice(1).map((point, index) => {
    const previous = anchors[index];
    return { start: previous, end: point, length: Math.hypot(point.x - previous.x, point.y - previous.y) };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);

  return Array.from({ length: count }, (_, index) => {
    const target = index / (count - 1) * total;
    let travelled = 0;
    for (const segment of segments) {
      if (travelled + segment.length >= target) {
        const progress = segment.length ? (target - travelled) / segment.length : 0;
        return {
          x: segment.start.x + (segment.end.x - segment.start.x) * progress,
          y: segment.start.y + (segment.end.y - segment.start.y) * progress,
        };
      }
      travelled += segment.length;
    }
    return anchors.at(-1) ?? { x: 200, y: 140 };
  });
}

function curvedTransition(from: Point[], to: Point[], amplitude: number, phase: number): Point[] {
  return from.map((start, index) => {
    const end = to[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const direction = Math.sin(index * 1.71 + phase);
    const bend = amplitude * direction * (0.58 + seeded(index, phase + 4) * 0.42);
    return {
      x: (start.x + end.x) / 2 - dy / length * bend,
      y: (start.y + end.y) / 2 + dx / length * bend,
    };
  });
}

const PERSON = resamplePolyline([
  { x: 132, y: 215 }, { x: 137, y: 196 }, { x: 150, y: 180 }, { x: 166, y: 169 }, { x: 171, y: 151 },
  { x: 164, y: 135 }, { x: 158, y: 117 }, { x: 160, y: 94 }, { x: 172, y: 73 }, { x: 191, y: 62 },
  { x: 211, y: 62 }, { x: 228, y: 74 }, { x: 236, y: 91 }, { x: 235, y: 102 }, { x: 245, y: 109 },
  { x: 235, y: 115 }, { x: 239, y: 121 }, { x: 231, y: 124 }, { x: 232, y: 132 }, { x: 221, y: 142 },
  { x: 213, y: 156 }, { x: 211, y: 171 }, { x: 231, y: 178 }, { x: 251, y: 190 }, { x: 264, y: 207 },
  { x: 268, y: 215 },
], COUNT);

const TREE = [
  ...linePoints(10, 203, 218, 200, 126),
  ...linePoints(6, 201, 174, 166, 138),
  ...linePoints(6, 200, 158, 239, 121),
  ...Array.from({ length: 26 }, (_, index) => {
    const angle = index / 26 * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 3 + 0.7) * 0.12;
    return {
      x: 202 + Math.cos(angle) * 69 * wobble,
      y: 102 + Math.sin(angle) * 52 * wobble,
    };
  }),
];

const EARTH = [
  ...ellipsePoints(24, 200, 140, 88, 88, -Math.PI / 2),
  ...ellipsePoints(12, 200, 140, 87, 30),
  ...ellipsePoints(12, 200, 140, 34, 87),
];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 42.17 + salt * 91.31) * 43758.5453;
  return value - Math.floor(value);
}

const STARS = Array.from({ length: COUNT }, (_, index) => ({
  x: 22 + seeded(index, 1) * 356,
  y: 24 + seeded(index, 2) * 226,
}));

const TRANSITION_ONE = curvedTransition(PERSON, TREE, 23, 0.4);
const TRANSITION_TWO = curvedTransition(TREE, EARTH, 28, 1.3);
const TRANSITION_THREE = curvedTransition(EARTH, STARS, 38, 2.1);

function values(points: Point[]) {
  return points.map((point) => point.x.toFixed(2)).join(";");
}

function yValues(points: Point[]) {
  return points.map((point) => point.y.toFixed(2)).join(";");
}

function pointSequence(index: number) {
  return [
    PERSON[index], PERSON[index], TRANSITION_ONE[index], TREE[index], TREE[index],
    TRANSITION_TWO[index], EARTH[index], EARTH[index], TRANSITION_THREE[index], STARS[index], STARS[index],
  ];
}

function stageColor(index: number) {
  const person = index % 7 === 0 ? "#765bea" : index % 3 === 0 ? "#514276" : "#382d57";
  const tree = index < 22 ? "#49306f" : ["#46bd90", "#35aa84", "#8bcf9f", "#f2b653"][index % 4];
  const earth = index < 24 ? "#5977dd" : index % 3 === 0 ? "#51c397" : "#89a0ef";
  const star = ["#f6f2ff", "#b6a8ff", "#78d9ba", "#f3c671"][index % 4];
  return { person, tree, earth, star };
}

function stageRadius(index: number) {
  const star = 1.2 + seeded(index, 3) * 1.7;
  return { person: index % 7 === 0 ? 2.45 : 2.05, tree: index < 22 ? 2.8 : 3.75, earth: 2.6, star };
}

export function HomePlayground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="home-playground home-story">
      <div className="home-playground-bar">
        <div><i /> One form, four states</div>
      </div>

      <svg
        className={`home-story-canvas ${reducedMotion ? "is-reduced" : ""}`}
        viewBox="0 0 400 280"
        role="img"
        aria-label="The same vector particles continuously morph from a person into a tree, the Earth, and a field of stars"
      >
        <defs>
          <radialGradient id="morph-space" cx="50%" cy="44%" r="78%">
            <stop offset="0" stopColor="#302a61" />
            <stop offset="0.58" stopColor="#181630" />
            <stop offset="1" stopColor="#0f0f22" />
          </radialGradient>
          <filter id="morph-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <rect className="home-morph-background" width="400" height="280" fill={reducedMotion ? "#121127" : "#f8f3ff"}>
          {!reducedMotion && (
            <animate
              attributeName="fill"
              calcMode="spline"
              dur={`${DURATION}s`}
              fill="freeze"
              keySplines={KEY_SPLINES}
              keyTimes={KEY_TIMES}
              values="#f8f3ff;#f8f3ff;#f4f8f5;#eff9f4;#eff9f4;#f3f6ff;#eef4ff;#eef4ff;#28234e;#121127;#121127"
            />
          )}
        </rect>
        <rect className="home-morph-space-overlay" width="400" height="280" fill="url(#morph-space)" opacity={reducedMotion ? 1 : 0}>
          {!reducedMotion && (
            <animate
              attributeName="opacity"
              calcMode="spline"
              dur={`${DURATION}s`}
              fill="freeze"
              keySplines={KEY_SPLINES}
              keyTimes={KEY_TIMES}
              values="0;0;0;0;0;0;0;0;0.25;1;1"
            />
          )}
        </rect>

        <g className="home-morph-ambient" aria-hidden="true">
          <circle cx="200" cy="140" r="72" />
          <circle cx="200" cy="140" r="108" />
          <circle cx="200" cy="140" r="142" />
        </g>

        {Array.from({ length: COUNT }, (_, index) => {
          const sequence = pointSequence(index);
          const colors = stageColor(index);
          const radii = stageRadius(index);
          const fillValues = [
            colors.person, colors.person, colors.person, colors.tree, colors.tree,
            colors.tree, colors.earth, colors.earth, colors.earth, colors.star, colors.star,
          ].join(";");
          const radiusValues = [
            radii.person, radii.person, 1.6, radii.tree, radii.tree,
            1.8, radii.earth, radii.earth, 1.4, radii.star, radii.star,
          ].join(";");
          const staticPoint = reducedMotion ? STARS[index] : PERSON[index];

          return (
            <g className="home-morph-particle-wrap" key={index}>
              <circle
                className="home-morph-particle-glow"
                cx={staticPoint.x}
                cy={staticPoint.y}
                r={reducedMotion ? radii.star * 2.8 : radii.person * 2.5}
              >
                {!reducedMotion && (
                  <>
                    <animate attributeName="cx" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={values(sequence)} />
                    <animate attributeName="cy" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={yValues(sequence)} />
                    <animate attributeName="r" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={radiusValues.split(";").map((value) => Number(value) * 2.5).join(";")} />
                  </>
                )}
              </circle>
              <circle
                className="home-morph-particle"
                cx={staticPoint.x}
                cy={staticPoint.y}
                fill={reducedMotion ? colors.star : colors.person}
                r={reducedMotion ? radii.star : radii.person}
              >
                {!reducedMotion && (
                  <>
                    <animate attributeName="cx" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={values(sequence)} />
                    <animate attributeName="cy" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={yValues(sequence)} />
                    <animate attributeName="fill" calcMode="linear" dur={`${DURATION}s`} fill="freeze" keyTimes={KEY_TIMES} values={fillValues} />
                    <animate attributeName="r" calcMode="spline" dur={`${DURATION}s`} fill="freeze" keySplines={KEY_SPLINES} keyTimes={KEY_TIMES} values={radiusValues} />
                  </>
                )}
              </circle>
            </g>
          );
        })}

        <g className="home-morph-progress" aria-hidden="true">
          <line x1="26" y1="256" x2="374" y2="256" />
          <circle cx={reducedMotion ? 374 : 26} cy="256" r="3.2">
            {!reducedMotion && <animate attributeName="cx" dur={`${DURATION}s`} fill="freeze" from="26" to="374" />}
          </circle>
        </g>
      </svg>

      <div className="home-playground-footer home-story-footer">
        <span>Human</span><i>→</i><span>Tree</span><i>→</i><span>Earth</span><i>→</i><span>Stars</span>
        <strong>Continuous vector</strong>
      </div>
    </div>
  );
}
