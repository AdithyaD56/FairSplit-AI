import { useLayoutEffect, useState } from "react";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveringInteractive, setHoveringInteractive] = useState(false);

  useLayoutEffect(() => {
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    if (!pointerFine) return undefined;

    document.documentElement.classList.add("custom-cursor-enabled");
    document.body.classList.add("custom-cursor-enabled");

    const handleMove = (event) => {
      setVisible(true);
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleLeave = () => setVisible(false);

    const handleOver = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setHoveringInteractive(Boolean(target.closest("a, button, input, textarea, select, [role='button']")));
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerleave", handleLeave);
    document.addEventListener("pointerdown", handleMove);
    document.addEventListener("mouseover", handleOver);

    return () => {
      document.documentElement.classList.remove("custom-cursor-enabled");
      document.body.classList.remove("custom-cursor-enabled");
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("pointerdown", handleMove);
      document.removeEventListener("mouseover", handleOver);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`custom-cursor ${visible ? "is-visible" : ""} ${hoveringInteractive ? "is-hovering" : ""}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`,
      }}
    >
      <span className="custom-cursor-ring" />
      <span className="custom-cursor-core" />
    </div>
  );
}
