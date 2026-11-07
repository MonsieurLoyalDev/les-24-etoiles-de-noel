import { art } from "./world";
const people: Record<string, string> = {
  Loyal: "loyal",
  Debby: "debby",
  Augustin: "augustin",
  Madeleine: "madeleine",
  Émile: "emile",
  Célestine: "celestine",
  Basile: "basile",
  Flocon: "flocon",
};
export function dialoguePresentation(line: string) {
  const split = line.indexOf(" — ");
  const name = split < 0 ? "Étoilebois" : line.slice(0, split);
  const text = split < 0 ? line : line.slice(split + 3);
  const person = Object.keys(people).find((p) => name.startsWith(p));
  const emotion = /hélas|triste|manque|presque|regret/i.test(text)
    ? "triste"
    : /surprise|incroyable|oh !|étonn/i.test(text)
      ? "surpris"
      : /♥|merci|bienvenue|exactement|bonheur|sourire/i.test(text)
        ? "joyeux"
        : "neutre";
  return {
    name,
    text,
    emotion,
    portrait: person
      ? art[`${people[person]}_${emotion}` as keyof typeof art]
      : null,
  };
}
export function Dialogue({
  line,
  choices,
  choose,
  advance,
}: {
  line: string;
  choices: string[];
  choose: (i: number) => void;
  advance: () => void;
}) {
  const { name, text, portrait, emotion } = dialoguePresentation(line);
  return (
    <div className="dialogue" role="dialog" aria-label="Dialogue">
      <div className={`dialogue-frame${portrait ? "" : " without-portrait"}`}>
        {portrait && (
          <div className="portrait-slot">
            <img
              className="portrait"
              src={portrait}
              alt={`${name}, ${emotion}`}
            />
          </div>
        )}
        <div className="dialogue-content">
          <strong className="speaker">{name}</strong>
          <p>{text}</p>
          <div className="dialogue-choices">
            {choices.length ? (
              choices.slice(0, 4).map((choice, i) => (
                <button key={choice} onClick={() => choose(i)}>
                  {choice}
                </button>
              ))
            ) : (
              <button onClick={advance}>
                Continuer <kbd>E</kbd>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
