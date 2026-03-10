"use client";

// Zigzag within the outer strips (never enters the card zone ~20-80% of width)
// Left col: row1 = far-left, row2 = indented right (but still in left strip), row3 = far-left
// Right col: row1 = far-right, row2 = indented left (but still in right strip), row3 = far-right

const TERMS = [
    {
        term: "Vibe Coding",
        def: "Using agentic AI to generate entire codebases through natural language",
        style: "typewriter",
        pos: "top-[7%] left-[1%]",       // far-left edge
        delay: "0s",
    },
    {
        term: "CIA Triad",
        def: "Confidentiality · Integrity · Availability — the pillars of information security",
        style: "gradient",
        pos: "top-[44%] left-[12%]",     // indented right — zigzag but still in left strip
        delay: "1.5s",
    },
    {
        term: "Zero-Day Exploit",
        def: "An attack targeting an unknown vulnerability before any patch exists",
        style: "fadein",
        pos: "bottom-[7%] left-[1%]",    // far-left edge
        delay: "2s",
    },
    {
        term: "Zero Trust",
        def: "Assume no user or system is trustworthy — verify everything, always",
        style: "neon",
        pos: "top-[7%] right-[1%]",      // far-right edge
        delay: "1s",
    },
    {
        term: "Vulnerability",
        def: "A flaw attackers exploit to gain unauthorized access to a system",
        style: "glitch",
        pos: "top-[52%] right-[12%]",    // indented left — zigzag but still in right strip
        delay: "0.5s",
    },
    {
        term: "Social Engineering",
        def: "Psychologically manipulating people into revealing sensitive information",
        style: "float",
        pos: "bottom-[7%] right-[1%]",   // far-right edge
        delay: "0.8s",
    },
];

const styleClass: Record<string, string> = {
    typewriter: "bgt-typewriter",
    glitch: "bgt-glitch",
    neon: "bgt-neon",
    gradient: "bgt-gradient",
    float: "bgt-float",
    fadein: "bgt-fadein",
};

export default function BackgroundTerms() {
    return (
        <div
            className="fixed inset-0 pointer-events-none select-none overflow-hidden"
            style={{ zIndex: -5 }}
            aria-hidden="true"
        >
            {TERMS.map(({ term, def, style, pos, delay }) => (
                <div key={term} className={`absolute ${pos} max-w-[240px]`}>
                    <p
                        className={`text-lg font-extrabold uppercase tracking-widest mb-1.5 ${styleClass[style]}`}
                        style={{ animationDelay: delay }}
                    >
                        {term}
                    </p>
                    <p className="text-sm leading-relaxed text-emerald-100/75 font-mono">
                        {def}
                    </p>
                </div>
            ))}
        </div>
    );
}
