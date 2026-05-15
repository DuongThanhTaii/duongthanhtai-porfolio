"use client";
import { useEffect } from "react";

export default function PreventScrollClient() {
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if ("scrollRestoration" in window.history)
        window.history.scrollRestoration = "manual";
      if (window.location.hash && window.location.hash !== "") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
      window.scrollTo(0, 0);
    } catch (e) {
      // ignore
    }
    // Coordinate removal of SSR hide class with both spline and projects readiness.
    let splineReady = false;
    let projectsReady = false;

    const tryRemove = () => {
      if (splineReady && projectsReady) {
        try {
          console.log(
            "prevent-scroll-client: removing spline-ssr-hidden (both ready)",
          );
          document.documentElement.classList.remove("spline-ssr-hidden");
          // allow Spline to mount now
          try {
            window.dispatchEvent(new Event("mount-spline"));
            console.log("prevent-scroll-client: dispatched mount-spline");
          } catch (e) {
            console.warn(
              "prevent-scroll-client: dispatch mount-spline failed",
              e,
            );
          }
        } catch (e) {
          console.warn("prevent-scroll-client: remove failed", e);
        }
      }
    };

    const onSpline = () => {
      // Deprecated: spline:ready still respected but prefer frames-hidden
      splineReady = true;
      console.log("prevent-scroll-client: got spline:ready");
      tryRemove();
    };

    // Listen for frames-hidden which guarantees initial frames are hidden
    const onFramesHidden = () => {
      console.log("prevent-scroll-client: got spline:frames-hidden");
      splineReady = true;
      tryRemove();
    };

    const onProjects = () => {
      projectsReady = true;
      tryRemove();
    };

    window.addEventListener("spline:ready", onSpline);
    window.addEventListener("spline:frames-hidden", onFramesHidden);
    window.addEventListener("projects:ready", onProjects);

    // If projects were already loaded earlier, respect that.
    if ((window as any).__projectsLoaded) {
      projectsReady = true;
    }

    // Fallback: remove after 3s even if one of them didn't fire
    const fallback = setTimeout(() => {
      try {
        console.log(
          "prevent-scroll-client: fallback removing spline-ssr-hidden",
        );
        document.documentElement.classList.remove("spline-ssr-hidden");
        try {
          window.dispatchEvent(new Event("mount-spline"));
          console.log(
            "prevent-scroll-client: fallback dispatched mount-spline",
          );
        } catch (e) {
          console.warn("prevent-scroll-client: fallback dispatch failed", e);
        }
      } catch (e) {
        console.warn("prevent-scroll-client: fallback remove failed", e);
      }
    }, 3000);

    return () => {
      window.removeEventListener("spline:ready", onSpline);
      window.removeEventListener("spline:frames-hidden", onFramesHidden);
      window.removeEventListener("projects:ready", onProjects);
      clearTimeout(fallback);
    };
  }, []);
  return null;
}
