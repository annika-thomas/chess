import { Chess } from "chess.js";
import { explainBlunder, materialWords } from "../engine/bot";
import type { Board } from "./board";
import { h, md } from "./dom";
import { icon } from "./icons";

/**
 * Why a move is bad: the opponent's best reply and the line after it, steppable on the board.
 * Returns the box at once and fills it when the engine is done. Call board.sync() when leaving.
 */
export function whyBox(
  board: Board,
  fen: string,
  san: string,
  opts: {
    bestUci?: string;
    intro?: string;
    /** Leave the board alone until the learner steps in. */ wait?: boolean;
  } = {},
): HTMLElement {
  const box = h("div.why-box", h("p.muted", "Looking at the best reply…"));
  void fill();
  return box;

  async function fill(): Promise<void> {
    let ex;
    try {
      ex = await explainBlunder(fen, san, opts.bestUci);
    } catch {
      box.replaceChildren(h("p.muted", "Couldn’t start the engine."));
      return;
    }
    if (!ex.line.length) {
      box.replaceChildren(h("p.muted", "No clear reply found."));
      return;
    }
    const them = new Chess(fen).turn() === "w" ? "Black" : "White";
    const first = ex.line[0].san;
    const lineText = ex.line.map((m) => m.san).join(" ");
    const queens = (f: string) => (f.split(" ")[0].match(/q/gi) ?? []).length;
    const queensOff =
      queens(fen) >= 2 && queens(ex.line[ex.line.length - 1].fen) === 0;
    const verdict = ex.mate
      ? `it leads to checkmate: **${lineText}**.`
      : ex.material <= -1
        ? `after **${lineText}** you’re down ${materialWords(-ex.material)}.`
        : queensOff
          ? `it forces the queens off (**${lineText}**). Your queen was your strongest attacker; once it’s traded, the pressure you built is gone.`
          : ex.better
            ? `you don’t lose material, but you miss something much stronger. Compare the line (**${lineText}**) with the better move below.`
            : `you don’t lose material right away, but your position gets clearly worse (**${lineText}**).`;
    let k = 0;
    const label = h("span.step-label");
    const prev = h(
      "button.btn.ghost.nav-btn",
      { type: "button", "aria-label": "Previous move" },
      icon("prev"),
    );
    const next = h(
      "button.btn.ghost.nav-btn",
      { type: "button", "aria-label": "Next move" },
      icon("next"),
    );
    const show = (i: number) => {
      k = Math.max(0, Math.min(ex.line.length, i));
      if (k === 0) {
        board.showFen(fenAfter(fen, san));
        board.arrows([
          { from: ex.line[0].from, to: ex.line[0].to, color: "red" },
        ]);
        label.textContent = `${them}’s reply`;
      } else {
        const m = ex.line[k - 1];
        board.showFen(m.fen);
        board.arrows([
          {
            from: m.from,
            to: m.to,
            color: (k - 1) % 2 === 0 ? "red" : "green",
          },
        ]);
        label.textContent = `${k} / ${ex.line.length}`;
      }
    };
    prev.addEventListener("click", () => show(k - 1));
    next.addEventListener("click", () => show(k + 1));
    box.replaceChildren(
      md(
        `${opts.intro ?? ""}${them} answers **${first}** (red arrow), and ${verdict}${ex.better ? ` A better move was **${ex.better}**.` : ""}`,
      ),
      h("div.why-steps", prev, label, next),
    );
    if (opts.wait) {
      k = -1;
      label.textContent = "Tap ▶ to see it";
    } else show(0);
  }
}

function fenAfter(fen: string, san: string): string {
  const c = new Chess(fen);
  c.move(san);
  return c.fen();
}
