import { useEffect, useRef, useState } from 'react';
import { Shirt, X, RotateCcw, Check, LoaderCircle } from 'lucide-react';
import { type Product } from './data';
import './try-on.css';

const modelPhotos: Record<string, string[]> = {
  'club-03-jersey': ['/images/try-on/pose-3/jersey.png', '/images/try-on/pose-3/jersey-ink.png'],
  'everyday-tee': ['/images/try-on/pose-3/tee.png', '/images/try-on/pose-3/tee-sand.png', '/images/try-on/pose-3/tee-charcoal.png'],
  'off-duty-hoodie': ['/images/try-on/pose-3/hoodie.png', '/images/try-on/pose-3/hoodie-moss.png', '/images/try-on/pose-3/hoodie-ink.png'],
};
const basePhoto = '/images/try-on/pose-3/model.png';
const loaded = new Set<string>();
function preload(src: string): Promise<void> {
  if (loaded.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => { image.onload = image.onerror = null; reject(new Error('Image timeout')); }, 15000);
    image.onload = async () => {
      clearTimeout(timeout);
      try { await image.decode(); loaded.add(src); resolve(); } catch { reject(new Error('Image decode failed')); }
    };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')); };
    image.src = src;
  });
}
type Variant = { product: Product; color: number };
type Flight = Variant & { id: number; left: number; top: number; width: number; height: number; dx: number; dy: number; scale: number };

export default function TryOn({ product, color }: { product: Product; color: number }) {
  const [open, setOpen] = useState(false);
  const [worn, setWorn] = useState<Variant | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLImageElement>(null);
  const model = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLImageElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0);
  const animation = useRef<Animation | null>(null);
  const revealTimer = useRef<number | undefined>(undefined);
  const isOpen = useRef(false);

  function cancelMotion() {
    clearTimeout(revealTimer.current);
    animation.current?.cancel();
    animation.current = null;
  }
  useEffect(() => () => { sequence.current++; cancelMotion(); }, []);
  useEffect(() => {
    if (open) closeButton.current?.focus({ preventScroll: true });
  }, [open]);

  // Restart only when the product variant changes, retaining focus on the swatch.
  useEffect(() => {
    if (isOpen.current) void tryGarment(product, color);
  }, [product, color]);

  async function tryGarment(next: Product, nextColor: number) {
    const id = ++sequence.current;
    cancelMotion();
    setFlight(null);
    setOpen(true);
    isOpen.current = true;
    setBusy(true);
    setFailed(false);
    setStatus('Preparing your look…');
    try {
      await Promise.all([preload(basePhoto), preload(modelPhotos[next.id][nextColor]), preload(next.image)]);
      if (sequence.current !== id || !isOpen.current) return;
      // Wait for the open layout and selected source image to be committed.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (sequence.current !== id || !isOpen.current) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setWorn({ product: next, color: nextColor }); setBusy(false); setStatus(`${next.colors[nextColor].name} ${next.name} is on the model.`); return;
      }
      const origin = source.current?.getBoundingClientRect();
      const destination = model.current?.getBoundingClientRect();
      const bounds = stage.current?.getBoundingClientRect();
      if (!origin || !destination || !bounds) throw new Error('Preview not ready');
      const targetWidth = destination.width * .56;
      const scale = targetWidth / origin.width;
      setStatus('Styling your look…');
      setFlight({ id, product: next, color: nextColor, left: origin.left - bounds.left, top: origin.top - bounds.top, width: origin.width, height: origin.height,
        dx: destination.left + destination.width / 2 - (origin.left + origin.width / 2),
        dy: destination.top + destination.height * .31 - (origin.top + origin.height / 2), scale });
    } catch {
      if (sequence.current !== id) return;
      setBusy(false); setFailed(true); setStatus('The model image couldn’t load. Please try again.');
    }
  }

  useEffect(() => {
    if (!flight || !ghost.current) return;
    const { dx, dy, scale, id, product: next, color: nextColor } = flight;
    const motion = ghost.current.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * .42}px, ${dy * .3 - 45}px) scale(${(1 + scale) / 2}) rotate(-14deg)`, opacity: 1, offset: .48 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)`, opacity: .95, offset: .8 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale * .96}) rotate(0deg)`, opacity: 0, offset: 1 },
    ], { duration: 1250, easing: 'cubic-bezier(.22,.65,.25,1)', fill: 'forwards' });
    animation.current = motion;
    revealTimer.current = window.setTimeout(() => {
      if (sequence.current === id) setWorn({ product: next, color: nextColor });
    }, 850);
    void motion.finished.then(() => {
      if (sequence.current !== id) return;
      setFlight(null); setBusy(false); setStatus(`${next.colors[nextColor].name} ${next.name} is on the model.`);
    }).catch(() => { /* Closing or changing the preview cancels the old animation. */ });
    return () => { clearTimeout(revealTimer.current); motion.cancel(); };
  }, [flight]);

  function close() {
    sequence.current++; isOpen.current = false; cancelMotion();
    setOpen(false); setFlight(null); setBusy(false); setWorn(null); setStatus('');
    toggle.current?.focus({ preventScroll: true });
  }
  const shownProduct = product;
  const shownColor = color;

  return <div ref={stage} className={`product-visual try-stage ${open ? 'try-open' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && open) { e.preventDefault(); close(); } }}>
    <div className="try-stage-header"><span className="eyebrow">{open ? 'YOUR PERSONAL FITTING ROOM' : product.tag}</span>
      <button ref={toggle} className={`try-toggle ${open ? 'is-active' : ''}`} aria-expanded={open} aria-controls="fitting-room" onClick={() => open ? close() : void tryGarment(product, color)} title="See this garment on a model"><Shirt size={17}/><span>{open ? 'Product view' : 'Try on'}</span></button>
    </div>
    <div className="try-content">
      {open && <section id="fitting-room" className="fitting-room" aria-label="Fitting room" aria-busy={busy}>
        <div className="fitting-heading"><div><span className="eyebrow">SEE IT ON</span><h2>Your next look.</h2></div><button ref={closeButton} className="icon-button" aria-label="Close fitting room" onClick={close}><X size={17}/></button></div>
        <div ref={model} className={`model-frame ${busy ? 'is-styling' : ''}`}>
          <img className="model-base" src={basePhoto} alt="Sample model in a neutral outfit" aria-hidden={!!worn}/>
          {product.colors.map((variant, index) => <img key={`${product.id}-${index}`} className={`model-outfit ${worn?.product.id === product.id && worn.color === index ? 'is-visible' : ''}`} src={modelPhotos[product.id][index]} alt={`Model wearing ${variant.name} ${product.name}`} aria-hidden={worn?.product.id !== product.id || worn.color !== index} loading="eager"/>)}
          <span className="model-label">FORM / FITTING ROOM</span>
          {busy && <span className="fitting-status"><LoaderCircle size={12}/> Styling</span>}
          {!busy && worn && <span className="fitting-status complete"><Check size={12}/> On the model</span>}
        </div>
        <div className="fitting-caption"><strong>{worn ? worn.product.name : 'Your look starts here'}</strong><span>{worn ? `${worn.product.colors[worn.color].name} · Model preview` : 'Preparing your selected garment.'}</span></div>
        <p className={`try-status-text ${failed ? 'try-error' : ''}`} role="status" aria-live="polite">{status}</p>
        <p className="try-disclaimer">Style preview on a sample model. Actual fit may vary.</p>
      </section>}
      <div className="try-product">
        <img ref={source} className={`garment try-source ${flight ? 'in-flight' : ''}`} src={shownProduct.image} alt={`${shownProduct.colors[shownColor].name} ${shownProduct.name}`} style={{filter:shownProduct.colors[shownColor].filter}} draggable={false}/>
        {open && <div className="try-product-details"><span className="eyebrow">THE PIECE</span><h3>{product.name}</h3><span>{product.colors[color].name}</span><button className="try-replay" disabled={busy} onClick={() => { setWorn(null); void tryGarment(product, color); }}>{busy ? <LoaderCircle size={14}/> : <RotateCcw size={14}/>} {failed ? 'Try again' : 'Replay try-on'}</button></div>}
      </div>
    </div>
    {!open && <div className="visual-caption"><span>FORM / 001</span><span>THE EVERYDAY EDIT</span></div>}
    {flight && <img ref={ghost} className="try-flight" src={flight.product.image} alt="" aria-hidden="true" style={{left:flight.left,top:flight.top,width:flight.width,height:flight.height,filter:flight.product.colors[flight.color].filter}}/>}
  </div>;
}

