// H4NDLE configurator - shapes set A
// caja-asa, caja-hamburguesa, charola-hotdog, caja-pizza
window.H4Shapes = window.H4Shapes || {};

window.H4Shapes['caja-asa'] = {
  label: 'Caja con asa',
  draw(ctx) {
    const u = ctx.uid, pf = ctx.patFill;
    return `
<ellipse class="shadow" cx="196" cy="382" rx="138" ry="18"/>
<g class="paint">
  <path class="f" d="M70 150L208.6 230L208.6 380L70 300Z"/>
  <path class="f" d="M208.6 230L303.9 175L303.9 325L208.6 380Z"/>
  <path class="f" d="M70 150L208.6 230L256.25 142.5L117.65 62.5Z"/>
  <path class="f" d="M208.6 230L303.9 175L256.25 142.5Z"/>
  <path class="f" fill-rule="evenodd" d="M145.37 78.5L228.53 126.5L228.53 80.5L145.37 32.5Z M166.16 76.5L207.74 100.5L207.74 84.5L166.16 60.5Z"/>
</g>
<g class="pat-all">
  <defs>
    <clipPath id="asa-tab-${u}"><path fill-rule="evenodd" d="M145.37 78.5L228.53 126.5L228.53 80.5L145.37 32.5Z M166.16 76.5L207.74 100.5L207.74 84.5L166.16 60.5Z"/></clipPath>
  </defs>
  <g transform="matrix(.866 .5 0 1 70 150)"><rect width="160" height="150" fill="${pf}"/></g>
  <g transform="matrix(.866 -.5 0 1 208.6 230)"><rect width="110" height="150" fill="${pf}"/></g>
  <g transform="matrix(.866 .5 .4784 -.8785 70 150)"><rect width="160" height="99.6" fill="${pf}"/></g>
  <g clip-path="url(#asa-tab-${u})"><g transform="matrix(.866 .5 0 -1 145.37 78.5)"><rect width="96" height="46" fill="${pf}"/></g></g>
</g>
<g class="paint">
  <path class="sh-d" d="M208.6 230L303.9 175L303.9 325L208.6 380Z"/>
  <path class="sh-dd" d="M208.6 230L303.9 175L256.25 142.5Z"/>
  <path class="sh-l" d="M70 150L208.6 230L256.25 142.5L117.65 62.5Z"/>
</g>
<g class="brand-g" transform="matrix(.866 .5 0 1 70 150)" data-x="14" data-y="56" data-w="132" data-h="50"></g>
<path class="outline" pathLength="1" d="M70 150L208.6 230L208.6 380L70 300Z M208.6 230L303.9 175L303.9 325L208.6 380 M70 150L117.65 62.5L256.25 142.5L208.6 230 M256.25 142.5L303.9 175 M145.37 78.5L145.37 32.5L228.53 80.5L228.53 126.5 M166.16 76.5L207.74 100.5L207.74 84.5L166.16 60.5Z"/>`;
  }
};

// closed clamshell, P(w,d,h) = [190+.866*(w+d), 306+.5*(w-d)-h]: base flares out (half-size 64 -> 75, h 0..40),
// lid rim overhangs it by 3, lid tapers in to a flat top (78 -> 56, h 40..94), lock tabs at the seam corners
window.H4Shapes['caja-hamburguesa'] = {
  label: 'Caja para hamburguesa',
  draw(ctx) {
    const u = ctx.uid, pf = ctx.patFill;
    return `
<ellipse class="shadow" cx="190" cy="372" rx="130" ry="16"/>
<g class="paint">
  <path class="f" d="M79.15 306L190 370L190 341L60.1 266Z"/>
  <path class="f" d="M190 370L300.85 306L319.9 266L190 341Z"/>
  <path class="f" d="M54.9 266L190 344L190 268L93.01 212Z"/>
  <path class="f" d="M190 344L325.1 266L286.99 212L190 268Z"/>
  <path class="f" d="M93.01 212L190 268L286.99 212L190 156Z"/>
  <path class="f" d="M54.9 262L41.05 266L54.9 266Z"/>
  <path class="f" d="M325.1 262L338.95 266L325.1 266Z"/>
</g>
<path class="in" d="M54.9 266L41.05 266L54.9 270Z"/>
<path class="in" d="M325.1 266L338.95 266L325.1 270Z"/>
<g class="pat-all">
  <defs>
    <clipPath id="hb-bf-${u}"><path d="M79.15 306L190 370L190 341L60.1 266Z"/></clipPath>
    <clipPath id="hb-br-${u}"><path d="M190 370L300.85 306L319.9 266L190 341Z"/></clipPath>
    <clipPath id="hb-lf-${u}"><path d="M54.9 266L190 344L190 268L93.01 212Z"/></clipPath>
    <clipPath id="hb-lr-${u}"><path d="M190 344L325.1 266L286.99 212L190 268Z"/></clipPath>
    <clipPath id="hb-lt-${u}"><path d="M93.01 212L190 268L286.99 212L190 156Z"/></clipPath>
  </defs>
  <g clip-path="url(#hb-bf-${u})"><g transform="matrix(.866 .5 -.4763 -1 79.15 306)"><rect width="150" height="40" fill="${pf}"/></g></g>
  <g clip-path="url(#hb-br-${u})"><g transform="matrix(.866 -.5 0 -.725 190 370)"><rect width="150" height="40" fill="${pf}"/></g></g>
  <g clip-path="url(#hb-lf-${u})"><g transform="matrix(.866 .5 .7057 -1 54.9 266)"><rect width="156" height="54" fill="${pf}"/></g></g>
  <g clip-path="url(#hb-lr-${u})"><g transform="matrix(.866 -.5 0 -1.4074 190 344)"><rect width="156" height="54" fill="${pf}"/></g></g>
  <g clip-path="url(#hb-lt-${u})"><g transform="matrix(.866 .5 .866 -.5 93.01 212)"><rect width="112" height="112" fill="${pf}"/></g></g>
</g>
<g class="paint">
  <path class="sh-d" d="M190 370L300.85 306L319.9 266L190 341Z"/>
  <path class="sh-d" d="M190 370L300.85 306L319.9 266L190 341Z"/>
  <path class="sh-d" d="M79.15 306L190 370L190 341L60.1 266Z"/>
  <path class="sh-d" d="M190 344L325.1 266L286.99 212L190 268Z"/>
  <path class="sh-l" d="M93.01 212L190 268L286.99 212L190 156Z"/>
  <path class="sh-dd" d="M60.1 266L190 341L190 344L54.9 269Z"/>
  <path class="sh-dd" d="M190 341L319.9 266L325.1 269L190 344Z"/>
</g>
<g class="brand-g" transform="matrix(.866 .5 -.3266 1.1149 93.01 212)" data-x="1" data-y="9" data-w="110" data-h="40"></g>
<path class="outline" pathLength="1" d="M79.15 306L190 370L190 341L60.1 266Z M190 370L300.85 306L319.9 266L190 341Z M54.9 266L190 344L190 268L93.01 212Z M190 344L325.1 266L286.99 212L190 268Z M93.01 212L190 268L286.99 212L190 156Z M54.9 262L41.05 266L54.9 270 M325.1 262L338.95 266L325.1 270"/>`;
  }
};

window.H4Shapes['charola-hotdog'] = {
  label: 'Charola para hot dog',
  draw(ctx) {
    const u = ctx.uid, pf = ctx.patFill;
    // 3D helper: w = long axis (down-right), d = depth (up-right), h = up
    const W = 248, DEP = 78, HF = 58, HB = 64; // footprint; front wall height; back wall a bit taller
    const P = (w, d, h) => [+(55 + .866 * (w + d)).toFixed(2), +(250 + .5 * (w - d) - h).toFixed(2)];
    const pth = (...pts) => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';

    const A = P(0, 0, 0), B = P(W, 0, 0), Cg = P(0, DEP, 0), Dg = P(W, DEP, 0);
    const A2 = P(0, 0, HF), B2 = P(W, 0, HF), C2 = P(0, DEP, HB), D2 = P(W, DEP, HB);
    const floorD = pth(A, B, Dg, Cg);
    const backInD = pth(C2, D2, Dg, Cg);  // back wall, inner face
    const leftInD = pth(A2, C2, Cg, A);   // left end wall, inner face
    const frontD = pth(A2, B2, B, A);     // front wall, exterior
    const rightD = pth(B2, D2, Dg, B);    // right end wall, exterior (HF at the front, HB at the back)
    const dh = HB - HF;                   // right-wall pattern is anchored at the taller back corner, then clipped

    // food: pills lying in the horizontal plane; a darker copy t units lower gives each one its rounded side
    const rr = (x, y, w, h, r) => `M${x + r} ${y}L${x + w - r} ${y}A${r} ${r} 0 0 1 ${x + w} ${y + r}L${x + w} ${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}L${x + r} ${y + h}A${r} ${r} 0 0 1 ${x} ${y + h - r}L${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    const flat = (w0, d0, h, inner) => { const o = P(w0, d0, h); return `<g transform="matrix(.866 .5 .866 -.5 ${o[0]} ${o[1]})">${inner}</g>`; };
    const pill = (w0, d0, len, wid, h, fill) => flat(w0, d0, h, `<path d="${rr(0, 0, len, wid, wid / 2)}" fill="${fill}"/>`);
    const bun = (d0, h, t) => pill(16, d0, 216, 26, h - t, '#C98040') + pill(16, d0, 216, 26, h, '#EFA75C') + pill(34, d0 + 9, 180, 8, h, '#F7C88C');
    let mus = 'M14 9', mx = 14, up = true; // mustard zigzag in the sausage's top plane
    while (mx < 222) { const nx = Math.min(mx + 22, 222); mus += `Q${(mx + nx) / 2} ${up ? 1 : 17} ${nx} 9`; mx = nx; up = !up; }
    const sausage = pill(6, 28, 236, 18, 50, '#A84A2E') + pill(6, 28, 236, 18, 64, '#D0693F') + pill(22, 37, 204, 4, 64, '#E99070')
      + flat(6, 28, 64, `<path d="${mus}" fill="none" stroke="#F2B705" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
    // back bun half, sausage, front bun half: the front wall (drawn next) hides their lower parts
    const food = bun(46, 60, 14) + sausage + bun(8, 60, 16);

    return `
<ellipse class="shadow" cx="196" cy="368" rx="147" ry="16"/>
<path class="in" d="${floorD}"/>
<path class="in" d="${backInD}"/>
<path class="in" d="${leftInD}"/>
<path class="sh-d" d="${leftInD}" opacity=".5"/>
<g class="food">${food}</g>
<g class="paint">
  <path class="f" d="${frontD}"/>
  <path class="f" d="${rightD}"/>
</g>
<g class="pat-all">
  <defs>
    <clipPath id="ht-rw-${u}"><path d="${rightD}"/></clipPath>
  </defs>
  <g transform="matrix(.866 .5 0 1 ${A2[0]} ${A2[1]})"><rect width="${W}" height="${HF}" fill="${pf}"/></g>
  <g clip-path="url(#ht-rw-${u})"><g transform="matrix(.866 -.5 0 1 ${B2[0]} ${B2[1] - dh})"><rect width="${DEP}" height="${HB + dh + 12}" fill="${pf}"/></g></g>
</g>
<g class="paint">
  <path class="sh-d" d="${rightD}"/>
</g>
<g class="brand-g" transform="matrix(.866 .5 0 1 ${A2[0]} ${A2[1]})" data-x="29" data-y="8" data-w="190" data-h="42"></g>
<path class="outline" pathLength="1" d="${frontD} ${rightD} M${A2.join(' ')}L${C2.join(' ')}L${D2.join(' ')} M${C2.join(' ')}L${C2[0]} ${C2[1] + 14}"/>`;
  }
};

window.H4Shapes['caja-pizza'] = {
  label: 'Caja para pizza',
  draw(ctx) {
    const u = ctx.uid, pf = ctx.patFill;
    return `
<ellipse class="shadow" cx="190" cy="355" rx="145" ry="16"/>
<g class="paint">
  <path class="f" d="M42.8 223L190 308L190 340L42.8 255Z"/>
  <path class="f" d="M190 308L337.2 223L337.2 255L190 340Z"/>
  <path class="f" d="M42.8 223L190 138L337.2 223L190 308Z"/>
</g>
<g class="pat-all">
  <g transform="matrix(.866 .5 0 1 42.8 223)"><rect width="170" height="32" fill="${pf}"/></g>
  <g transform="matrix(.866 -.5 0 1 190 308)"><rect width="170" height="32" fill="${pf}"/></g>
  <g transform="matrix(.866 .5 .866 -.5 42.8 223)"><rect width="170" height="170" fill="${pf}"/></g>
</g>
<g class="paint">
  <path class="sh-d" d="M190 308L337.2 223L337.2 255L190 340Z"/>
  <path class="sh-l" d="M42.8 223L190 138L337.2 223L190 308Z"/>
</g>
<g class="brand-g" transform="matrix(.866 -.5 .866 .5 42.8 223)" data-x="22.5" data-y="22.5" data-w="125" data-h="125"></g>
<path class="outline" pathLength="1" d="M42.8 223L190 308L190 340L42.8 255Z M190 308L337.2 223L337.2 255L190 340Z M42.8 223L190 138L337.2 223L190 308Z"/>`;
  }
};
