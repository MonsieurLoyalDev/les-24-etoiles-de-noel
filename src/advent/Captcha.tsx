import { useEffect, useRef, useState } from "react";
type TurnstileAPI = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};
export function Captcha({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false,
      id: string | undefined;
    const win = window as Window & { turnstile?: TurnstileAPI };
    onToken("");
    const render = () => {
      if (cancelled || !root.current) return;
      try {
        id = win.turnstile!.render(root.current, {
          sitekey: siteKey,
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            setFailed(true);
          },
        });
      } catch {
        setFailed(true);
      }
    };
    let script = document.querySelector<HTMLScriptElement>(
      "#etoilebois-turnstile",
    );
    if (win.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.id = "etoilebois-turnstile";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.append(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", error);
    }
    function error() {
      setFailed(true);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      script?.removeEventListener("error", error);
      if (id) win.turnstile?.remove(id);
    };
  }, [siteKey, onToken]);
  return (
    <>
      <div ref={root} aria-label="Vérification anti-robot" />
      {failed && (
        <p role="alert">
          La vérification anti-robot est indisponible. Réouvrez la connexion
          pour réessayer.
        </p>
      )}
    </>
  );
}
