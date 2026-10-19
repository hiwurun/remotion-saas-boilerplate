import React from "react";

type Tok = { t: string; c: string };
const COL = {
  plain: "#EDEDED",
  kw: "#FF4D8D",
  str: "#62C073",
  com: "#7A7A7A",
  num: "#F2A044",
  tag: "#52A8FF",
  attr: "#C792EA",
  fn: "#52A8FF",
  punc: "#A1A1A1",
};
const KW = new Set(["import", "from", "export", "default", "function", "return", "const", "let", "type", "interface", "async", "await", "if", "else", "map", "new", "true", "false", "null"]);

/** Tiny TSX tokenizer: comments, strings, JSX tags/attrs, keywords, numbers, function calls. */
export const tokenize = (line: string): Tok[] => {
  const out: Tok[] = [];
  const re = /(\/\/.*$|\/\*.*?\*\/)|("[^"]*"|'[^']*'|`[^`]*`)|(<\/?[A-Za-z][\w.]*|\/?>)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)|(\s+)|([^\sA-Za-z0-9_$])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [s] = m;
    if (m[1]) out.push({ t: s, c: COL.com });
    else if (m[2]) out.push({ t: s, c: COL.str });
    else if (m[3]) out.push({ t: s, c: COL.tag });
    else if (m[4]) out.push({ t: s, c: COL.num });
    else if (m[5]) {
      const next = line[re.lastIndex];
      if (KW.has(s)) out.push({ t: s, c: COL.kw });
      else if (next === "=" && line[re.lastIndex + 1] !== "=") out.push({ t: s, c: COL.attr });
      else if (next === "(") out.push({ t: s, c: COL.fn });
      else out.push({ t: s, c: COL.plain });
    } else if (m[6]) out.push({ t: s, c: COL.plain });
    else out.push({ t: s, c: COL.punc });
  }
  return out;
};

export const CodeEditor: React.FC<{ code: string; width: number; height: number; font: string; mono: string; fileName?: string; fontSize?: number }> = ({ code, width, height, font, mono, fileName = "dashboard.tsx", fontSize = 19 }) => {
  const lines = code.split("\n");
  return (
    <div style={{ width, height, borderRadius: 22, background: "#0A0A0A", border: "1px solid #1F1F1F", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: font }}>
      <div style={{ height: 64, borderBottom: "1px solid #1F1F1F", display: "flex", alignItems: "center", padding: "0 22px", gap: 10, flexShrink: 0 }}>
        {["#3A3A3A", "#3A3A3A", "#3A3A3A"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        <div style={{ marginLeft: 18, height: 36, padding: "0 16px", borderRadius: 8, background: "#1A1A1A", color: "#EDEDED", display: "flex", alignItems: "center", fontSize: 15, fontFamily: mono }}>{fileName}</div>
        <div style={{ height: 36, padding: "0 16px", color: "#7A7A7A", display: "flex", alignItems: "center", fontSize: 15, fontFamily: mono }}>globals.css</div>
        <div style={{ flex: 1 }} />
        <div style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid #2E2E2E", color: "#EDEDED", display: "flex", alignItems: "center", fontSize: 15 }}>预览</div>
      </div>
      <div style={{ flex: 1, padding: "26px 0", fontFamily: mono, fontSize, lineHeight: 1.65, overflow: "hidden" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
            <span style={{ width: 64, textAlign: "right", paddingRight: 26, color: "#4A4A4A", flexShrink: 0 }}>{i + 1}</span>
            <span>
              {tokenize(l).map((tk, j) => (
                <span key={j} style={{ color: tk.c }}>{tk.t}</span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
