/* H4NDLE configurator: pattern styles. Plain vanilla JS, no modules. Registers window.H4Patterns. */
(function(){
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ---------- 1. Doodles (approved look, kept exactly as-is) ---------- */
  function doodleDef(uid){
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="66" height="66">'
      + '<g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M6 14c5-7 11 5 16-2"/><path d="M34 8c4 6 10 6 14 0"/><path d="M56 22c-6 3-6 10 0 13"/>'
      + '<path d="M8 40c6 4 12-4 18 0s10 4 14-2"/><circle cx="48" cy="52" r="4.5"/><path d="M22 58q5 5 10 0"/>'
      + '</g></pattern>';
  }

  /* ---------- 2. Ondas (approved look, kept exactly as-is) ---------- */
  function waveDef(uid){
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="30" height="32">'
      + '<g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M0 9C5 3 10 3 15 9S25 15 30 9"/><path d="M0 25C5 19 10 19 15 25S25 31 30 25"/>'
      + '</g></pattern>';
  }

  /* ---------- 3. Rayas: bold diagonal stripes ---------- */
  function stripesDef(uid){
    var period = 46, thick = 16;
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+period+'" height="'+period+'" patternTransform="rotate(45)">'
      + '<rect width="'+period+'" height="'+period+'" fill="none"/>'
      + '<rect x="0" y="0" width="'+period+'" height="'+thick+'" fill="rgba(255,255,255,.85)"/>'
      + '</pattern>';
  }

  /* ---------- 4. Puntos: offset polka dots ---------- */
  function dotsDef(uid){
    var t = 36, r = 5.4;
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+t+'" height="'+t+'">'
      + '<circle cx="'+(t*0.25)+'" cy="'+(t*0.25)+'" r="'+r+'" fill="rgba(255,255,255,.92)"/>'
      + '<circle cx="'+(t*0.75)+'" cy="'+(t*0.75)+'" r="'+r+'" fill="rgba(255,255,255,.92)"/>'
      + '</pattern>';
  }

  /* ---------- 5. Cuadros: picnic checkerboard ---------- */
  function checkerDef(uid){
    var c = 22, t = c*2;
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+t+'" height="'+t+'">'
      + '<rect x="0" y="0" width="'+c+'" height="'+c+'" fill="rgba(255,255,255,.18)"/>'
      + '<rect x="'+c+'" y="'+c+'" width="'+c+'" height="'+c+'" fill="rgba(255,255,255,.18)"/>'
      + '</pattern>';
  }

  /* ---------- 6. Zigzag: chevron lines ---------- */
  function zigzagDef(uid){
    var period = 16, w = period*2, h = 16;
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+w+'" height="'+h+'">'
      + '<path d="M-8 12L0 3L8 12L16 3L24 12L32 3L40 12" fill="none" stroke="rgba(255,255,255,.92)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
      + '</pattern>';
  }

  /* ---------- 7. Confeti: scattered marks ---------- */
  function confettiDef(uid){
    var t = 56;
    var parts = [
      '<circle cx="14" cy="10" r="2.6" fill="rgba(255,255,255,.95)"/>',
      '<circle cx="30" cy="46" r="1.9" fill="rgba(255,255,255,.85)"/>',
      '<line x1="35" y1="5" x2="43" y2="10" stroke="rgba(255,255,255,.9)" stroke-width="3" stroke-linecap="round"/>',
      '<g transform="rotate(-32 22 24)"><line x1="18" y1="24" x2="26" y2="24" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-linecap="round"/></g>',
      '<g transform="rotate(24 48 34)"><polygon points="44,31 52,31 48,38" fill="rgba(255,255,255,.85)"/></g>',
      '<g transform="rotate(-12 39 50)"><polygon points="35,47 43,47 39,54" fill="rgba(255,255,255,.7)"/></g>',
      '<g transform="rotate(16 10 40)"><path d="M5 40h10M10 35v10" stroke="rgba(255,255,255,.9)" stroke-width="2.6" stroke-linecap="round"/></g>',
      '<g transform="rotate(40 47 15)"><path d="M42 15h10M47 10v10" stroke="rgba(255,255,255,.7)" stroke-width="2.6" stroke-linecap="round"/></g>'
    ].join('');
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+t+'" height="'+t+'">'+parts+'</pattern>';
  }

  /* ---------- 8. Comida: minimal food line icons ---------- */
  function foodDef(uid){
    var S = 'fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
    var burger = '<g '+S+'><path d="M-10 0c0-6 4.5-9.5 10-9.5S10-6 10 0"/><path d="M-10.5 1h21"/><path d="M-10 5c3.5 2 17 2 20 0"/><path d="M-9 9.5h18"/></g>';
    var pizza = '<g '+S+'><path d="M0-10L-9 9Q0 13 9 9Z"/></g><circle cx="-2" cy="0" r="1.3" fill="#fff"/><circle cx="3" cy="4.5" r="1.3" fill="#fff"/>';
    var taco = '<g '+S+'><path d="M-11 3A11 9 0 0 0 11 3"/><path d="M-8 2l2.2-5 2.2 5 2.2-5 2.2 5 2.2-5 2.2 5"/></g>';
    var fries = '<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M-7 2L-5 11H5L7 2Z"/></g>'
      + '<g fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="butt"><path d="M-4.5 2V-6.5M-1.5 2V-9M1.5 2V-8M4.5 2V-5"/></g>';
    var drink = '<g '+S+'><path d="M-6-6L-4 10H4L6-6Z"/><path d="M-7-6H7"/><path d="M2-6L4-12"/></g>';
    var sushi = '<g '+S+'><circle cx="0" cy="0" r="9"/></g><circle cx="0" cy="0" r="3.4" fill="#fff"/>';
    var icecream = '<g '+S+'><path d="M-5 1L0 10L5 1"/><circle cx="0" cy="-2" r="6.2"/></g>';
    var icons = ''
      + '<g transform="translate(20,20)">'+burger+'</g>'
      + '<g transform="translate(78,16) rotate(6)">'+pizza+'</g>'
      + '<g transform="translate(97,58) rotate(-6)">'+taco+'</g>'
      + '<g transform="translate(58,52)">'+fries+'</g>'
      + '<g transform="translate(15,62) rotate(4)">'+drink+'</g>'
      + '<g transform="translate(42,93)">'+sushi+'</g>'
      + '<g transform="translate(90,98) rotate(-5)">'+icecream+'</g>';
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="115" height="115">'+icons+'</pattern>';
  }

  /* ---------- 9. Monograma: repeated kitchen name, staggered rows ---------- */
  function monoDef(uid, opts){
    var raw = (opts && opts.name) ? opts.name : 'TU MARCA';
    var text = esc(String(raw).toUpperCase());
    var fontSize = 13;
    var charW = fontSize * 0.72;
    var wordW = Math.max(46, text.length * charW);
    var gap = fontSize * 1.9;
    var tileW = wordW + gap;
    var rowH = fontSize * 2.3;
    var tileH = rowH * 2;
    var attrs = 'font-family="Archivo, Arial Black, Arial, sans-serif" font-weight="800" font-size="'+fontSize+'" fill="rgba(255,255,255,.55)"';
    var row1 = '<text x="'+(gap/2)+'" y="'+(rowH*0.72)+'" '+attrs+'>'+text+'</text>';
    var row2a = '<text x="'+(gap/2 - tileW/2)+'" y="'+(rowH*1.72)+'" '+attrs+'>'+text+'</text>';
    var row2b = '<text x="'+(gap/2 + tileW/2)+'" y="'+(rowH*1.72)+'" '+attrs+'>'+text+'</text>';
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+tileW+'" height="'+tileH+'" patternTransform="rotate(-12)">'
      + row1 + row2a + row2b + '</pattern>';
  }

  /* ---------- 10. Marco: sparse, elegant corner mark ---------- */
  function frameDef(uid){
    var t = 150;
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="'+t+'" height="'+t+'">'
      + '<path d="M14 36V14H36" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M21 36V21H36" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      + '</pattern>';
  }

  /* ---------- 11. Liso: no visible content ---------- */
  function plainDef(uid){
    return '<pattern id="pat-'+uid+'" patternUnits="userSpaceOnUse" width="10" height="10"></pattern>';
  }

  window.H4Patterns = [
    { id: 'doodle',   name: 'Doodles',   def: doodleDef },
    { id: 'wave',     name: 'Ondas',     def: waveDef },
    { id: 'stripes',  name: 'Rayas',     def: stripesDef },
    { id: 'dots',     name: 'Puntos',    def: dotsDef },
    { id: 'checker',  name: 'Cuadros',   def: checkerDef },
    { id: 'zigzag',   name: 'Zigzag',    def: zigzagDef },
    { id: 'confetti', name: 'Confeti',   def: confettiDef },
    { id: 'food',     name: 'Comida',    def: foodDef },
    { id: 'mono',     name: 'Monograma', def: monoDef },
    { id: 'frame',    name: 'Marco',     def: frameDef },
    { id: 'plain',    name: 'Liso',      def: plainDef }
  ];
})();
