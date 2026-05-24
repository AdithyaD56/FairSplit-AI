import { useEffect, useState } from "react";

export default function TypedTagline({
  text,
  phrases,
  speed = 55,
  deleteSpeed = 30,
  pauseMs = 1800,
  loop = true,
  className = "",
}) {
  const [visibleText, setVisibleText] = useState("");
  const items = phrases?.length ? phrases : text ? [text] : [];
  const sourceKey = items.join("||");

  useEffect(() => {
    setVisibleText("");
    if (!items.length) return undefined;

    let phraseIndex = 0;
    let charIndex = 0;
    let direction = "typing";
    let timer;

    const tick = () => {
      const currentText = items[phraseIndex];

      if (direction === "typing") {
        charIndex += 1;
        setVisibleText(currentText.slice(0, charIndex));

        if (charIndex >= currentText.length) {
          if (!loop && phraseIndex === items.length - 1) {
            return;
          }
          direction = "deleting";
          timer = window.setTimeout(tick, pauseMs);
          return;
        }

        timer = window.setTimeout(tick, speed);
        return;
      }

      charIndex -= 1;
      setVisibleText(currentText.slice(0, Math.max(charIndex, 0)));

      if (charIndex <= 0) {
        direction = "typing";
        phraseIndex = (phraseIndex + 1) % items.length;
        timer = window.setTimeout(tick, speed);
        return;
      }

      timer = window.setTimeout(tick, deleteSpeed);
    };

    timer = window.setTimeout(tick, speed);
    return () => window.clearTimeout(timer);
  }, [deleteSpeed, loop, pauseMs, sourceKey, speed]);

  return (
    <p className={className}>
      <span className="type-cursor">{visibleText}</span>
    </p>
  );
}
