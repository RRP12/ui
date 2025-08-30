"use client"

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

export default function TerminalComponentClient({ webcontainer }) {
  const ref = useRef(null)
  const shellRef = useRef(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !webcontainer || !ref.current) return;

    const term = new Terminal({ convertEol: true });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();

    (async () => {
      try {
        const proc = await webcontainer.spawn("jsh", {
          terminal: { cols: term.cols, rows: term.rows },
        });
        shellRef.current = proc;

        proc.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );
        // term.onData((d) => proc.input.getWriter().write(d));
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
      }
    })();

    const handleResize = () => {
      fit.fit();
      shellRef.current?.resize({ cols: term.cols, rows: term.rows });
    };

    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      shellRef.current = null;
    };
  }, [webcontainer]);

  return <div ref={ref} style={{ flex: 1, height: "100%" }} />
}

