import React, { useEffect, useRef, useState } from "react";
import { createPaperField } from "./renderer.js";
import { createPreviewHead } from "./preview-head.js";
import { HOLE_PRESET } from "./preset.js";
import "./preview.css";

const sources = [
  "/logos/inkzilla.webp",
  "/brands/chick-muy-caliente/campaign-artwork.webp",
  "/brands/bring-love-back/cover.webp",
  "/logos/coffeeology.webp",
  "/brands/better-mate/coastal-campaign.webp",
  "/logos/victor-valor.webp",
  "/brands/snackablez-01.webp",
  "/logos/crane-chow.webp",
  "/brands/riches/editorial-portrait.webp",
  "/logos/elite-dominion.webp",
  "/brands/better-mate/app-showcase.webp",
  "/logos/vyra-studios.webp",
];
export default function PaperHome({review=false}) {
  const stage = useRef(null),
    paper = useRef(null),
    head = useRef(null),
    clock = useRef(0),
    playing = useRef(!matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [paused, setPaused] = useState(!playing.current),
    [time, setTime] = useState(0),
    [cardsOnly, setCardsOnly] = useState(false);
  const [paperStatus, setPaperStatus] = useState("Loading paper artwork…"),
    [headStatus, setHeadStatus] = useState("Loading head…");
  useEffect(() => {
    let field,
      portrait,
      raf,
      last = performance.now(),
      lastDisplay = 0,
      disposed = false, visible = true;
    const observer = new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=performance.now()});
    observer.observe(stage.current);
    createPaperField(paper.current, sources)
      .then((result) => {
        if (disposed) {
          result.dispose();
          return;
        }
        field = result;
        setPaperStatus("Paper ready");
        field.seek(clock.current);
      })
      .catch((error) => {
        console.error(error);
        if (!disposed) setPaperStatus(/WebGL/i.test(error.message)
          ? "WebGL is unavailable in this browser; paper cannot render"
          : "Paper artwork could not load. Reload to retry.");
      });
    createPreviewHead(head.current)
      .then((result) => {
        if (disposed) {
          result.dispose();
          return;
        }
        portrait = result;
        setHeadStatus("Head ready");
      })
      .catch((error) => {
        console.error(error);
        if (!disposed)
          setHeadStatus(
            /WebGL/i.test(error.message)
              ? "WebGL is unavailable; head cannot render"
              : "Head could not load. Check /models/about/head-interactive.glb",
          );
      });
    const animate = (now) => {
      if (disposed) return;
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      const covered = !review && Number(stage.current.closest(".hero")?.style.getPropertyValue("--tools-progress") || 0) >= .34;
      if (!document.hidden && visible && !covered) {
        if (playing.current && field)
          clock.current = (clock.current + dt) % HOLE_PRESET.duration;
        field?.seek(clock.current);
        portrait?.render(playing.current ? dt : 0);
        if (now - lastDisplay > 100) {
          setTime(clock.current);
          lastDisplay = now;
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      field?.dispose();
      portrait?.dispose();
    };
  }, [review]);
  const toggle = () => {
    playing.current = !playing.current;
    setPaused(!playing.current);
  };
  const scrub = (event) => {
    clock.current = Number(event.target.value);
    playing.current = false;
    setPaused(true);
    setTime(clock.current);
  };
  return (
    <div className={`paper-home-shell ${review ? "is-review" : "is-home"}`}>
      <div
        ref={stage}
        className={`review-stage ${cardsOnly ? "cards-only" : ""}`}
        aria-label="Homepage paper motion preview"
      >
        <div className="composition-title">
          <p>
            <i />
            WELCOME TO MY
          </p>
          <h1>PORTFOLIO</h1>
        </div>
        <canvas
          ref={paper}
          className="paper-layer"
          aria-label="Continuously curling and fluttering artwork"
        />
        <div className="information-layer">
          <div className="disciplines">
            <span>Visual Designer</span>
            <span>Branding Identity</span>
            <span>Web Design</span>
            <span>UI/UX Design</span>
          </div>
          <p className="intro-copy">
            I build visual identities and digital experiences
            <br />
            that make ideas impossible to overlook.
          </p>
          <div className="slide-dots" aria-label="First homepage slide">
            <b />
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <canvas
          ref={head}
          className="head-layer"
          aria-label="John Wolf interactive floating head"
        />
        {!review && <p className="home-load-status" role="status">{paperStatus === "Paper ready" && headStatus === "Head ready" ? "" : `${paperStatus} · ${headStatus}`}</p>}
      </div>
      {review && <aside className="review-controls" aria-label="Motion review controls">
        <div className="review-heading">
          <strong>Paper motion review</strong>
          <a href="/">Back to portfolio ↗</a>
        </div>
        <div className="timeline-controls">
          <button onClick={toggle}>{paused ? "Play" : "Pause"}</button>
          <label htmlFor="timeline">Timeline</label>
          <input
            id="timeline"
            type="range"
            min="0"
            max="12"
            step="0.01"
            value={time}
            onChange={scrub}
          />
          <output>{time.toFixed(1)} / 12s</output>
          <button
            onClick={() => setCardsOnly(!cardsOnly)}
            aria-pressed={cardsOnly}
          >
            {cardsOnly ? "Show homepage" : "Cards only"}
          </button>
        </div>
        <p role="status">
          {paperStatus} · {headStatus}. Homepage composition study; slide
          changes and the two-turn section transition are not enabled here.
        </p>
      </aside>}
    </div>
  );
}

