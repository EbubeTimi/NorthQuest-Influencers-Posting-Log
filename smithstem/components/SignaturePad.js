"use client";
import { useRef, useState, useImperativeHandle, forwardRef } from "react";
const SignaturePad = forwardRef(function SignaturePad(_, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [hasDrawn, setHasDrawn] = useState(false);
  function point(e) { const rect = canvasRef.current.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - rect.left, y: t.clientY - rect.top }; }
  function start(e) { e.preventDefault(); drawing.current = true; last.current = point(e); }
  function move(e) { if (!drawing.current) return; e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const p = point(e); ctx.strokeStyle = "#161221"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; setHasDrawn(true); }
  function end() { drawing.current = false; }
  useImperativeHandle(ref, () => ({ isEmpty: () => !hasDrawn, clear: () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHasDrawn(false); }, toDataURL: () => canvasRef.current.toDataURL("image/png") }));
  return (<div><canvas ref={canvasRef} width={480} height={180} className="w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} /><p className="mt-1 text-xs text-slate-400">Sign with your finger or mouse above.</p></div>);
});
export default SignaturePad;
