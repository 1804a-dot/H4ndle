/* H4NDLE configurator - shapes-b.js
   Products: caja-sushi, caja-postres, cono-helado, bolsa-asa
   Plain script, registers onto window.H4Shapes. No modules, no deps.
*/
(function(){
  window.H4Shapes = window.H4Shapes || {};

  /* ============================================================
     1) caja-sushi - "Caja para sushi"
     Open rectangular paperboard sushi box, printed inside and out,
     hinged lid open behind it.
     ============================================================ */
  window.H4Shapes['caja-sushi'] = {
    label: 'Caja para sushi',
    draw(ctx){
      const uid = ctx.uid, pf = ctx.patFill;

      /* 3D projection helper (contract axes): width down-right (.866,.5), depth
         up-right (.866,-.5), height up. Every corner is built from P(w,d,h). */
      const ox=46, oy=276;
      const P=(w,d,h)=>{
        const x=ox+.866*w+.866*d, y=oy+.5*w-.5*d-h;
        return [Math.round(x*100)/100, Math.round(y*100)/100];
      };
      const wAx=[.866,.5], dAx=[.866,-.5], vAx=[0,1]; // vAx = 1 local unit of height, downward on a face
      const R=Math.PI/180;

      const W=196, DEP=110, HW=50; // box width, depth, wall height

      /* box corners: ground (h=0) and rim (h=HW) */
      const A=P(0,0,0), B=P(W,0,0), C=P(W,DEP,0), Dg=P(0,DEP,0);
      const Ar=P(0,0,HW), Br=P(W,0,HW), Cr=P(W,DEP,HW), Dr=P(0,DEP,HW);

      /* lid: hinged along Dr-Cr (back top edge), opened leanDeg past vertical
         so its printed inner face reads toward the viewer */
      const leanDeg=14, th=(90+leanDeg)*R;
      const dirD=-Math.cos(th), dirH=Math.sin(th); // unit open-direction in (depth,height)
      const Llid=DEP;
      const lidV=[Math.round(.866*dirD*1e4)/1e4, Math.round((-.5*dirD-dirH)*1e4)/1e4];
      const D2=P(0, DEP+Llid*dirD, HW+Llid*dirH), C2=P(W, DEP+Llid*dirD, HW+Llid*dirH);

      /* narrow tuck flap off the lid's free edge, folded toward the viewer */
      const flapDeg=18, thf=flapDeg*R, flapLen=17;
      const fdD=-Math.cos(thf), fdH=Math.sin(thf);
      const flapV=[Math.round(.866*fdD*1e4)/1e4, Math.round((-.5*fdD-fdH)*1e4)/1e4];
      const D3=P(0, DEP+Llid*dirD+flapLen*fdD, HW+Llid*dirH+flapLen*fdH);
      const C3=P(W, DEP+Llid*dirD+flapLen*fdD, HW+Llid*dirH+flapLen*fdH);

      const mtx=(u,v,o)=>`matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`;
      const pth=(...pts)=>'M'+pts.map(p=>p[0]+' '+p[1]).join('L')+'Z';

      /* faces as screen paths (all true parallelograms, so no clipPath needed) */
      const floorPath = pth(A,B,C,Dg);
      const backPath   = pth(Dr,Cr,C,Dg);   // inner face of the back wall
      const leftPath   = pth(Ar,Dr,Dg,A);   // inner face of the left end wall
      const frontPath  = pth(Ar,Br,B,A);    // exterior front wall
      const rightPath  = pth(Br,Cr,C,B);    // exterior right end wall
      const lidPath    = pth(Dr,Cr,C2,D2);  // inner face of the open lid
      const flapPath   = pth(D2,C2,C3,D3);  // tuck flap

      /* matrices mapping each face's local (width|depth) x height rect onto its screen quad */
      const floorM = mtx(wAx,dAx,A);
      const backM  = mtx(wAx,vAx,Dr);
      const leftM  = mtx(dAx,vAx,Ar);
      const frontM = mtx(wAx,vAx,Ar);
      const rightM = mtx(dAx,vAx,Br);
      const lidM   = mtx(wAx,lidV,Dr);
      const flapM  = mtx(wAx,flapV,D2);

      /* food: grid of maki rolls + a line of nigiri, sitting on the floor */
      const rollR=14, rollH=16, noriDark='#262C1F', riceW='#F6F1E4';
      function roll(w,d,salmon){
        const top=P(w,d,rollH), base=P(w,d,0);
        const fill = salmon ? '#EF8B5C' : '#8FC46A';
        return `<g transform="matrix(.866 .5 .866 -.5 ${base[0]} ${base[1]})"><circle r="${rollR}" fill="${noriDark}"/></g>`
          +`<g transform="matrix(.866 .5 .866 -.5 ${top[0]} ${top[1]})">`
          +`<circle r="${rollR}" fill="${noriDark}"/>`
          +`<circle r="${(rollR*0.8).toFixed(1)}" fill="${riceW}"/>`
          +`<circle r="${(rollR*0.42).toFixed(1)}" fill="${fill}"/>`
          +`<circle r="${(rollR*0.15).toFixed(1)}" cx="${(-rollR*0.16).toFixed(1)}" cy="${(-rollR*0.16).toFixed(1)}" fill="#fff" opacity=".4"/>`
          +`</g>`;
      }
      const rw=15, rh=10, riceH=15, salmonFill='#F0805A';
      function nigiri(w,d){
        const base=P(w,d,0), top=P(w,d,riceH);
        return `<g transform="matrix(.866 .5 .866 -.5 ${base[0]} ${base[1]})"><ellipse rx="${rw}" ry="${rh}" fill="#E8DEC6"/></g>`
          +`<g transform="translate(${top[0]} ${top[1]})">`
          +`<ellipse cy="${(rh*0.1).toFixed(1)}" rx="${(rw*0.9).toFixed(1)}" ry="${(rh*0.8).toFixed(1)}" fill="#F7F1E3"/>`
          +`<path d="M${-rw} ${(-rh*0.15).toFixed(1)}Q0 ${(-rh*2.1).toFixed(1)} ${rw} ${(-rh*0.15).toFixed(1)}Q${(rw*0.72).toFixed(1)} ${(rh*0.55).toFixed(1)} 0 ${(rh*0.62).toFixed(1)}Q${(-rw*0.72).toFixed(1)} ${(rh*0.55).toFixed(1)} ${-rw} ${(-rh*0.15).toFixed(1)}Z" fill="${salmonFill}"/>`
          +`<path d="M${(-rw*0.55).toFixed(1)} ${(-rh*0.55).toFixed(1)}Q0 ${(-rh*1.7).toFixed(1)} ${(rw*0.55).toFixed(1)} ${(-rh*0.55).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".4"/>`
          +`</g>`;
      }
      /* the front row's tops rise above the front wall (painted later), so the wall only
         crops their lower part; rows are drawn back-to-front so nearer ones paint over */
      const cols=[0.12,0.31,0.50,0.68].map(f=>+(W*f).toFixed(1));
      const rows=[0.364,0.636,0.891].map(f=>+(DEP*f).toFixed(1));
      let rolls='';
      [...rows].reverse().forEach((d,ri)=>cols.forEach((w,ci)=>{ rolls+=roll(w,d,(ci+ri)%2===0); }));
      const nigW=+(W*0.704).toFixed(1); // clear of the right wall
      const nigiris=[0.327,0.527,0.727,0.927].slice().reverse().map(f=>nigiri(nigW,+(DEP*f).toFixed(1))).join('');
      const foodG = `<g class="food">${rolls}${nigiris}</g>`;

      /* pattern rects fit each face exactly (every face is a true parallelogram) */
      const patFloor = `<g transform="${floorM}"><rect width="${W}" height="${DEP}" fill="${pf}"/></g>`;
      const patBack  = `<g transform="${backM}"><rect width="${W}" height="${HW}" fill="${pf}"/></g>`;
      const patLeft  = `<g transform="${leftM}"><rect width="${DEP}" height="${HW}" fill="${pf}"/></g>`;
      const patFront = `<g transform="${frontM}"><rect width="${W}" height="${HW}" fill="${pf}"/></g>`;
      const patRight = `<g transform="${rightM}"><rect width="${DEP}" height="${HW}" fill="${pf}"/></g>`;
      const patLid   = `<g transform="${lidM}"><rect width="${W}" height="${Llid}" fill="${pf}"/></g>`;
      const patFlap  = `<g transform="${flapM}"><rect width="${W}" height="${flapLen}" fill="${pf}"/></g>`;

      const shadow = `<ellipse class="shadow" cx="192" cy="371" rx="126" ry="16"/>`;

      /* visible edges only (the outline is drawn over everything): outer walls, rim,
         the inner back-left corner down to just above the food, lid and flap */
      const outline = `${frontPath} ${rightPath} M${Ar[0]} ${Ar[1]}L${Dr[0]} ${Dr[1]}L${Cr[0]} ${Cr[1]} `+
        `M${Dr[0]} ${Dr[1]}L${Dg[0]} ${Dg[1]-rollH-4} ${lidPath} ${flapPath}`;

      /* brand zone on the front wall: 152 x 40 local units, centered on the face */
      const bzW=152, bzH=40, bzX=((W-bzW)/2).toFixed(1), bzY=((HW-bzH)/2).toFixed(1);

      return `
      ${shadow}
      <g class="paint">
        <path class="f" d="${floorPath}"/>
        <path class="f" d="${backPath}"/>
        <path class="f" d="${leftPath}"/>
        <path class="f" d="${lidPath}"/>
        <path class="f" d="${flapPath}"/>
      </g>
      <g class="pat-all">
        ${patFloor}${patBack}${patLeft}${patLid}${patFlap}
      </g>
      <g class="paint">
        <path class="sh-d" d="${floorPath}" opacity=".16"/>
        <path class="sh-dd" d="${backPath}"/>
        <path class="sh-dd" d="${leftPath}"/>
        <path class="sh-d" d="${lidPath}"/>
        <path class="sh-l" d="${flapPath}"/>
      </g>
      ${foodG}
      <g class="paint">
        <path class="f" d="${frontPath}"/>
        <path class="f" d="${rightPath}"/>
      </g>
      <g class="pat-all">
        ${patFront}${patRight}
      </g>
      <g class="paint">
        <path class="sh-d" d="${rightPath}"/>
      </g>
      <g class="brand-g" transform="${frontM}" data-x="${bzX}" data-y="${bzY}" data-w="${bzW}" data-h="${bzH}"></g>
      <path class="outline" pathLength="1" d="${outline}"/>
      `;
    }
  };

  /* ============================================================
     2) caja-postres - "Caja para postres"
     Closed square pastry box with a clear window on the top face.
     ============================================================ */
  window.H4Shapes['caja-postres'] = {
    label: 'Caja para postres',
    draw(ctx){
      const uid = ctx.uid, pf = ctx.patFill;
      const x0=100, y0=176, W=160, D=140, H=88;

      const wAx=[.866,.5], dAx=[.866,-.5];
      const add=(p,ax,k)=>[p[0]+ax[0]*k, p[1]+ax[1]*k];

      const pTL=[x0,y0];
      const pTR=add(pTL,wAx,W);
      const pBL=add(pTL,[0,1],H);
      const pBR=add(pTR,[0,1],H);
      const tBL=add(pTL,dAx,D); // top-back-left
      const tBR=add(pTR,dAx,D); // top-back-right
      const rBR=add(tBR,[0,1],H); // right-bottom-back

      const topM   = `matrix(.866 .5 .866 -.5 ${pTL[0]} ${pTL[1]})`;
      const frontM = `matrix(.866 .5 0 1 ${pTL[0]} ${pTL[1]})`;
      const rightM = `matrix(.866 -.5 0 1 ${pTR[0]} ${pTR[1]})`;

      const topPath   = `M${pTL}L${pTR}L${tBR}L${tBL}Z`;
      const frontPath = `M${pTL}L${pTR}L${pBR}L${pBL}Z`;
      const rightPath = `M${pTR}L${tBR}L${rBR}L${pBR}Z`;

      /* window cut into the top face, local coords within topM (0..W x 0..D) */
      const winX=26, winY=22, winW=104, winH=94, winR=20;
      const rimX=winX-5, rimY=winY-5, rimW=winW+10, rimH=winH+10, rimR=winR+5;
      const clipId = `postres-top-${uid}`;

      /* food: donut + concha inside the window, local to topM */
      const donut = `<g transform="translate(58 62)">
        <circle r="27" fill="#E7B37B"/>
        <path d="M-27 -4A27 27 0 0 0 25 12 A21 21 0 0 1 -21 0Z" fill="#E85D9A"/>
        <circle r="27" fill="none" stroke="#00000022" stroke-width="1.5"/>
        <circle r="10" fill="#D9CFC0"/>
        <circle cx="-6" cy="-14" r="2.6" fill="#F4E7A1"/>
        <circle cx="6" cy="-12" r="2.4" fill="#8FD1A6"/>
        <circle cx="0" cy="-19" r="2.4" fill="#F4E7A1"/>
        <circle cx="12" cy="-4" r="2.2" fill="#8FBFE8"/>
      </g>`;
      const concha = `<g transform="translate(106 84)">
        <circle r="25" fill="#E9C77E"/>
        <path d="M-24 -3A24 24 0 0 1 24 -3A25 25 0 0 1 -24 -3Z" fill="#F1D9A0"/>
        <g stroke="#D8B15F" stroke-width="1.6" fill="none" stroke-linecap="round">
          <path d="M-16 -12Q-14 4 -18 16"/>
          <path d="M-4 -15Q-2 3 -6 18"/>
          <path d="M8 -14Q10 3 6 18"/>
          <path d="M18 -9Q20 5 16 15"/>
        </g>
      </g>`;

      const patTop = `<g transform="${topM}"><rect x="0" y="0" width="${W}" height="${D}" fill="${pf}" clip-path="url(#${clipId})"/></g>`;
      const patFront = `<g transform="${frontM}"><rect width="${W}" height="${H}" fill="${pf}"/></g>`;
      const patRight = `<g transform="${rightM}"><rect width="${D}" height="${H}" fill="${pf}"/></g>`;

      const shadow = `<ellipse class="shadow" cx="198" cy="368" rx="128" ry="17"/>`;

      /* build the window rim outline in screen coords via the top face's mapping */
      function toScreen(u,v){ return [pTL[0]+u*.866+v*.866, pTL[1]+u*.5-v*.5]; }
      const rimPathScreen = (()=>{
        const r=rimR, X=rimX, Y=rimY, Wd=rimW, Hd=rimH;
        // approximate rounded rect with straight corners cut (simple octagon) built in local space then mapped
        const pts = [
          [X+r,Y],[X+Wd-r,Y],[X+Wd,Y+r],[X+Wd,Y+Hd-r],[X+Wd-r,Y+Hd],[X+r,Y+Hd],[X,Y+Hd-r],[X,Y+r]
        ].map(p=>toScreen(p[0],p[1]));
        return 'M'+pts.map(p=>p.join(' ')).join('L')+'Z';
      })();

      const fullOutline = `${topPath} ${frontPath} ${rightPath} ${rimPathScreen}`;

      return `
      ${shadow}
      <defs>
        <clipPath id="${clipId}">
          <path fill-rule="evenodd" d="M0 0H${W}V${D}H0Z M${rimX} ${rimY}H${rimX+rimW}V${rimY+rimH}H${rimX}Z"/>
        </clipPath>
      </defs>
      <g class="paint">
        <path class="f" d="${topPath}"/>
        <path class="f" d="${frontPath}"/>
        <path class="f" d="${rightPath}"/>
      </g>
      <g class="pat-all">
        ${patTop}
        ${patFront}
        ${patRight}
      </g>
      <g class="paint">
        <path class="sh-l" d="${topPath}" clip-path="url(#${clipId})"/>
        <path class="sh-d" d="${rightPath}"/>
      </g>
      <g transform="${topM}">
        <rect class="in" x="${rimX}" y="${rimY}" width="${rimW}" height="${rimH}" rx="${rimR}"/>
        <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${winR}" fill="#CFC4B2"/>
        <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${winR}" fill="#000" opacity=".08"/>
        <g class="food">${donut}${concha}</g>
        <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${winR}" fill="rgba(255,255,255,.12)"/>
        <path d="M${winX} ${winY+winH*.62}L${winX+winW*.4} ${winY}L${winX+winW*.62} ${winY}L${winX} ${winY+winH*.84}Z" fill="rgba(255,255,255,.22)"/>
      </g>
      <g class="brand-g" transform="${frontM}" data-x="13" data-y="30" data-w="134" data-h="34"></g>
      <path class="outline" pathLength="1" d="${fullOutline}"/>
      `;
    }
  };

  /* ============================================================
     3) cono-helado - "Cono para helado"
     Paper cone sleeve with soft-serve swirl, standing in a round stand.
     ============================================================ */
  window.H4Shapes['cono-helado'] = {
    label: 'Cono para helado',
    draw(ctx){
      const uid = ctx.uid, pf = ctx.patFill;
      const coneId=`cone-${uid}`, standFId=`standf-${uid}`, standTId=`standt-${uid}`;

      /* cone: wide rim at top, sharp tip at bottom, centered at cx. The rim is
         170 units wide so the brand plate fits a 14-letter name, and the tip
         lands exactly at the centre of the stand's top disc. */
      const cx=190, rimY=148, rimRx=85, rimRy=26, tipY=333;

      /* stand: flat disc (top ellipse + front band). Drawing the top before the
         cone makes the tip meet the surface cleanly, with no hole to fake. */
      const standTopY=333, standBotY=378, standRx=98, standRy=25;

      /* cone exterior: front (near) rim arc dipping down + two straight sides meeting at the tip */
      const conePath = `M${cx-rimRx} ${rimY}A${rimRx} ${rimRy} 0 0 0 ${cx+rimRx} ${rimY}L${cx} ${tipY}Z`;
      /* right ~50% of the cone, used for sh-d shading */
      const rightHalfPath = `M${cx-rimRx*0.05} ${rimY+2}A${rimRx} ${rimRy} 0 0 0 ${cx+rimRx} ${rimY}L${cx} ${tipY}Z`;

      /* full rim ellipse = the visible inside of the cone opening (same sweep flag on
         both arcs, so the second arc completes the ellipse instead of retracing the first) */
      const rimInPath = `M${cx-rimRx} ${rimY}A${rimRx} ${rimRy} 0 1 0 ${cx+rimRx} ${rimY}A${rimRx} ${rimRy} 0 1 0 ${cx-rimRx} ${rimY}Z`;
      /* soft shadow crescent hugging the back (far) arc of the opening */
      const rimShadowPath = `M${cx-rimRx} ${rimY}A${rimRx} ${rimRy} 0 0 1 ${cx+rimRx} ${rimY}Q${cx} ${rimY-rimRy*0.4} ${cx-rimRx} ${rimY}Z`;

      const standTopPath = `M${cx-standRx} ${standTopY}A${standRx} ${standRy} 0 1 0 ${cx+standRx} ${standTopY}A${standRx} ${standRy} 0 1 0 ${cx-standRx} ${standTopY}Z`;
      const standFrontPath = `M${cx-standRx} ${standTopY}A${standRx} ${standRy} 0 0 0 ${cx+standRx} ${standTopY}L${cx+standRx} ${standBotY}A${standRx} ${standRy} 0 0 1 ${cx-standRx} ${standBotY}Z`;

      /* soft-serve swirl: 3 stacked, offset tiers + curled tip. The base tier
         covers the rim opening and dips over the front rim edge. */
      const tA = {cy:142, rx:78, ry:38, tilt:0};   // base: top=104 bottom=180 (overlaps rim dip 174)
      const tB = {cy:88,  rx:54, ry:26, tilt:-8};  // middle: top=62 bottom=114 (overlaps tA top 104)
      const tC = {cy:48,  rx:36, ry:20, tilt:8};   // top: top=28 bottom=68 (overlaps tB top 62)
      const tierPath=(t)=>`M${cx+t.tilt-t.rx} ${t.cy}A${t.rx} ${t.ry} 0 1 1 ${cx+t.tilt+t.rx} ${t.cy}A${t.rx} ${t.ry} 0 1 1 ${cx+t.tilt-t.rx} ${t.cy}Z`;
      const curl = `M${cx+4} 42C${cx+16} 39 ${cx+18} 26 ${cx+6} 23C${cx-4} 21 ${cx-9} 32 ${cx-1} 37C${cx+1} 38.5 ${cx+2.5} 40 ${cx+4} 42Z`;

      const swirl = `<g class="food">
        <path d="${tierPath(tA)}" fill="#FFF6E6"/>
        <path d="${tierPath(tB)}" fill="#FFF8EC"/>
        <path d="${tierPath(tC)}" fill="#FFFAF1"/>
        <path d="${curl}" fill="#FFFAF1"/>
        <path d="M${cx-48} ${132}Q${cx-26} ${104} ${cx-4} ${118}" fill="none" stroke="#EADFC4" stroke-width="3" stroke-linecap="round" opacity=".7"/>
        <path d="M${cx-2} ${118}Q${cx+22} ${90} ${cx+42} ${112}" fill="none" stroke="#EADFC4" stroke-width="3" stroke-linecap="round" opacity=".7"/>
        <path d="M${cx-28} ${86}Q${cx-12} ${64} ${cx+6} ${76}" fill="none" stroke="#E3D7BB" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <path d="M${cx+2} ${76}Q${cx+16} ${56} ${cx+30} ${70}" fill="none" stroke="#E3D7BB" stroke-width="2.4" stroke-linecap="round" opacity=".65"/>
        <path d="M${cx-14} ${46}Q${cx-2} ${32} ${cx+9} ${40}" fill="none" stroke="#DCCFAE" stroke-width="2" stroke-linecap="round" opacity=".65"/>
        <ellipse cx="${cx-18}" cy="${86}" rx="7" ry="4.5" fill="#fff" opacity=".4"/>
      </g>`;

      /* pattern on the curved cone + stand (clipPath, since none are rectangles) */
      const patCone = `<g><rect x="${cx-rimRx}" y="${rimY-4}" width="${rimRx*2}" height="${tipY-rimY+8}" fill="${pf}" clip-path="url(#${coneId})"/></g>`;
      const patStandTop = `<g><rect x="${cx-standRx}" y="${standTopY-standRy}" width="${standRx*2}" height="${standRy*2}" fill="${pf}" clip-path="url(#${standTId})"/></g>`;
      const patStandFront = `<g><rect x="${cx-standRx}" y="${standTopY}" width="${standRx*2}" height="${standBotY-standTopY}" fill="${pf}" clip-path="url(#${standFId})"/></g>`;

      const shadow = `<ellipse class="shadow" cx="${cx}" cy="388" rx="114" ry="14"/>`;

      const outline = `${conePath} `+
        `M${cx-rimRx} ${rimY}A${rimRx} ${rimRy} 0 0 1 ${cx+rimRx} ${rimY} `+
        `${standTopPath} `+
        `M${cx-standRx} ${standTopY}L${cx-standRx} ${standBotY} M${cx+standRx} ${standTopY}L${cx+standRx} ${standBotY} `+
        `M${cx-standRx} ${standBotY}A${standRx} ${standRy} 0 0 0 ${cx+standRx} ${standBotY}`;

      /* brand zone: plain translate, big enough for a 14-letter name plus a logo,
         just below the front rim arc and inside the cone's taper at all 4 plate corners */
      const bzW=96, bzH=38, bzX=cx-bzW/2, bzY=rimY+30;

      return `
      ${shadow}
      <defs>
        <clipPath id="${coneId}"><path d="${conePath}"/></clipPath>
        <clipPath id="${standFId}"><path d="${standFrontPath}"/></clipPath>
        <clipPath id="${standTId}"><path d="${standTopPath}"/></clipPath>
      </defs>
      <g class="paint">
        <path class="f" d="${standFrontPath}"/>
        <path class="f" d="${standTopPath}"/>
        <path class="f" d="${conePath}"/>
      </g>
      <path class="in" d="${rimInPath}"/>
      <path class="sh-d" d="${rimShadowPath}" opacity=".55"/>
      ${swirl}
      <g class="pat-all">
        ${patStandTop}
        ${patStandFront}
        ${patCone}
      </g>
      <g class="paint">
        <path class="sh-d" d="${standFrontPath}" opacity=".4"/>
        <path class="sh-l" d="${standTopPath}" opacity=".4"/>
        <path class="sh-d" d="${rightHalfPath}" clip-path="url(#${coneId})"/>
      </g>
      <g class="brand-g" transform="translate(${bzX} ${bzY})" data-x="0" data-y="0" data-w="${bzW}" data-h="${bzH}"></g>
      <path class="outline" pathLength="1" d="${outline}"/>
      `;
    }
  };

  /* ============================================================
     4) bolsa-asa - "Bolsa con asa"
     Paper carry bag, three-quarter view, with twisted rope handles.
     ============================================================ */
  window.H4Shapes['bolsa-asa'] = {
    label: 'Bolsa con asa',
    draw(ctx){
      const uid = ctx.uid, pf = ctx.patFill;
      const wAx=[.866,.5], dAx=[.866,-.5];
      const add=(p,ax,k)=>[p[0]+ax[0]*k, p[1]+ax[1]*k];

      const x0=88, y0=108, W=170, H=196, D=78;
      const pTL=[x0,y0];
      const pTR=add(pTL,wAx,W);
      const pBL=add(pTL,[0,1],H);
      const pBR=add(pTR,[0,1],H);
      const tBL=add(pTL,dAx,D);   // top-back-left (far corner of the mouth)
      const tBR=add(pTR,dAx,D);   // top-back-right
      const sBR=add(tBR,[0,1],H);

      const frontM = `matrix(.866 .5 0 1 ${pTL[0]} ${pTL[1]})`;
      const sideM  = `matrix(.866 -.5 0 1 ${pTR[0]} ${pTR[1]})`;

      const frontPath = `M${pTL}L${pTR}L${pBR}L${pBL}Z`;
      const sidePath  = `M${pTR}L${tBR}L${sBR}L${pBR}Z`;
      /* right (back) half of the gusset, for the vertical center fold */
      const foldPath  = `M${add(pTR,dAx,D*0.5)}L${tBR}L${sBR}L${add(pBR,dAx,D*0.5)}Z`;

      /* open mouth: lit back-wall band + lit left-gusset band, the rest of the
         opening in shadow, with a shallow inward fold where the gusset tops crease */
      const bandD=18, gussetD=18;
      const foldPt = add(add(tBL,wAx,11),dAx,-9);
      const mouthPath = `M${pTL}L${pTR}L${tBR}L${tBL}Z`;
      const backBandPath = `M${tBL}L${tBR}L${add(tBR,dAx,-bandD)}L${foldPt}Z`;
      const leftBandPath = `M${tBL}L${pTL}L${add(pTL,wAx,gussetD)}L${foldPt}Z`;

      /* handle anchor points on the bag opening. The back handle belongs to the back
         panel: its legs dip INTO the mouth and the front panel covers their lower ends. */
      const hf1 = add(pTL,wAx,W*0.27), hf2 = add(pTL,wAx,W*0.73);
      const hb1 = add(hf1,dAx,16), hb2 = add(hf2,dAx,16);
      const hb1e = add(hb1,[0,1],24), hb2e = add(hb2,[0,1],24);

      const frontHandle = `M${hf1[0]} ${hf1[1]} C${hf1[0]-16} ${hf1[1]-102} ${hf2[0]+16} ${hf2[1]-102} ${hf2[0]} ${hf2[1]}`;
      const backArch = `M${hb1[0]} ${hb1[1]} C${hb1[0]-22} ${hb1[1]-116} ${hb2[0]+22} ${hb2[1]-116} ${hb2[0]} ${hb2[1]}`;
      const backHandle = `M${hb1e[0]} ${hb1e[1]} L${hb1[0]} ${hb1[1]} C${hb1[0]-22} ${hb1[1]-116} ${hb2[0]+22} ${hb2[1]-116} ${hb2[0]} ${hb2[1]} L${hb2e[0]} ${hb2e[1]}`;

      const patFront = `<g transform="${frontM}"><rect width="${W}" height="${H}" fill="${pf}"/></g>`;
      const patSide  = `<g transform="${sideM}"><rect width="${D}" height="${H}" fill="${pf}"/></g>`;

      const shadow = `<ellipse class="shadow" cx="196" cy="378" rx="120" ry="16"/>`;

      /* outline takes only the back handle's arch: its legs are hidden behind the front panel */
      const outline = `${frontPath} ${sidePath} `+
        `${frontHandle} ${backArch} `+
        `${mouthPath} `+
        `M${add(tBR,dAx,-bandD)[0]} ${add(tBR,dAx,-bandD)[1]}L${foldPt[0]} ${foldPt[1]}L${add(pTL,wAx,gussetD)[0]} ${add(pTL,wAx,gussetD)[1]} `+
        `M${pTL[0]} ${pTL[1]+14}L${pTR[0]} ${pTR[1]+14} M${pTR[0]} ${pTR[1]+14}L${tBR[0]} ${tBR[1]+14} `+
        `M${add(pTR,dAx,D*0.5)[0]} ${add(pTR,dAx,D*0.5)[1]}L${add(pBR,dAx,D*0.5)[0]} ${add(pBR,dAx,D*0.5)[1]}`;

      return `
      ${shadow}
      <path class="in" d="${mouthPath}"/>
      <path class="sh-dd" d="${mouthPath}"/>
      <path class="in" d="${leftBandPath}"/>
      <path class="sh-d" d="${leftBandPath}" opacity=".65"/>
      <path class="in" d="${backBandPath}"/>
      <path d="${backHandle}" fill="none" stroke="#B98D5E" stroke-width="10" stroke-linecap="round"/>
      <path d="${backHandle}" fill="none" stroke="#C9A27A" stroke-width="7" stroke-linecap="round"/>
      <g class="paint">
        <path class="f" d="${frontPath}"/>
        <path class="f" d="${sidePath}"/>
      </g>
      <g class="pat-all">
        ${patFront}
        ${patSide}
      </g>
      <g class="paint">
        <path class="sh-d" d="${sidePath}"/>
        <path class="sh-d" d="${foldPath}" opacity=".55"/>
        <path class="sh-l" d="M${pTL}L${pTR}L${add(pTR,[0,1],14)}L${add(pTL,[0,1],14)}Z"/>
        <path class="sh-l" d="M${pTR}L${tBR}L${add(tBR,[0,1],14)}L${add(pTR,[0,1],14)}Z" opacity=".5"/>
      </g>
      <g class="brand-g" transform="${frontM}" data-x="20" data-y="78" data-w="130" data-h="66"></g>
      <path d="${frontHandle}" fill="none" stroke="#B98D5E" stroke-width="10" stroke-linecap="round"/>
      <path d="${frontHandle}" fill="none" stroke="#C9A27A" stroke-width="7" stroke-linecap="round"/>
      <path class="outline" pathLength="1" d="${outline}"/>
      `;
    }
  };

})();
