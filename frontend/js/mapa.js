/* Tarnished’s Codex — mapa interactivo (Leaflet CRS.Simple sobre imágenes) */
(function () {
  'use strict';
  function falla(msg) {
    var a = document.getElementById('aviso');
    if (a) { a.hidden = false; a.className = 'aviso error'; a.textContent = msg; }
  }
  if (typeof L === 'undefined') {
    falla('No se pudo cargar Leaflet (necesita internet). Revisa la consola del navegador (F12).');
    return;
  }
  var D = JSON.parse(document.getElementById('datos').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

  /* ---------- Iconos de los pines (SVG propios, sin dependencias) ---------- */
  var ICONOS = {
    jefes: 'M12 3C7.6 3 4.5 6 4.5 10c0 2.4 1.1 4 2.5 5v3.5h2.5V17h1.5v1.5h3V17h1.5v1.5H17V15c1.4-1 2.5-2.6 2.5-5C19.5 6 16.4 3 12 3zM8.8 9a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM15.2 9a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8z',
    npcs: 'M12 4a3.6 3.6 0 100 7.2A3.6 3.6 0 0012 4zM5 20.5c0-4.2 3.1-6.8 7-6.8s7 2.6 7 6.8z',
    armas: 'M12 2l2.2 2.2V14h-4.4V4.2zM6.5 14.5h11v2h-11zM11 16.5h2V20h-2zM9.8 20h4.4v1.8H9.8z',
    armaduras: 'M12 3C7.5 3 4.5 6.3 4.5 10.5V16c0 1.1.9 2 2 2H9v-4.2c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3V18h2.5c1.1 0 2-.9 2-2v-5.5C19.5 6.3 16.5 3 12 3zM8 20h8v1.5H8z',
    escudos: 'M12 2.5l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10v-6z',
    talismanes: 'M12 8.2a6 6 0 100 12 6 6 0 000-12zM12 10.8a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8zM12 2l3 3.2-3 3.3-3-3.3z',
    'cenizas-de-guerra': 'M12 2c1 3.5 5.5 6 5.5 11a5.5 5.5 0 11-11 0c0-2.2 1-3.6 2-4.6.2 1.6.8 2.4 1.7 2.8C10 8 10.8 4.5 12 2z',
    invocaciones: 'M12 3a6.5 6.5 0 00-6.5 6.5V21l2.17-2 2.17 2 2.17-2 2.17 2 2.17-2 2.17 2V9.5A6.5 6.5 0 0012 3zM9.6 9.4a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zM14.4 9.4a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6z',
    hechicerias: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z',
    conjuros: 'M5 5a2 2 0 012-2h11.5v15H8a1.5 1.5 0 000 3h10.5v1.5H8A3 3 0 015 19z',
    objetos: 'M12 2c3.5 4.5 6 7.7 6 11a6 6 0 11-12 0c0-3.3 2.5-6.5 6-11z',
    localizaciones: 'M6 21V9l2-1V5h2v2h1V5h2v2h1V5h2v3l2 1v12h-4v-5a2 2 0 00-4 0v5z',
    criaturas: 'M12 12c-3 0-5 2.3-5 4.6 0 1.7 1.3 2.4 2.7 2.4.9 0 1.5-.4 2.3-.4s1.4.4 2.3.4c1.4 0 2.7-.7 2.7-2.4C17 14.3 15 12 12 12zM6.5 8.3a1.7 2.2 0 100 4.4 1.7 2.2 0 000-4.4zM10 4.8a1.7 2.2 0 100 4.4 1.7 2.2 0 000-4.4zM14 4.8a1.7 2.2 0 100 4.4 1.7 2.2 0 000-4.4zM17.5 8.3a1.7 2.2 0 100 4.4 1.7 2.2 0 000-4.4z',
    municion: 'M12 2l4.5 5H13v10.5h-2V7H7.5zM8 19h8v2H8z',
    equipo: 'M12 2l2.2 2.2V14h-4.4V4.2zM6.5 14.5h11v2h-11zM11 16.5h2V20h-2zM9.8 20h4.4v1.8H9.8z',
    magia: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z'
  };
  function claveIcono(r) { return ICONOS[r.categoria] ? r.categoria : (ICONOS[r.grupo] ? r.grupo : 'objetos'); }
  function tipoPin(r) { return r.grupo === 'magia' ? 'magic' : r.pin; }
  function svgIcono(clave) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + (ICONOS[clave] || ICONOS.objetos) + '"/></svg>';
  }
  function dibujarLeyenda() {
    var el = $('leyenda');
    if (!el) return;
    var items = [['Jefes', 'jefes', 'boss'], ['NPCs', 'npcs', 'npc'], ['Armas', 'armas', 'weapon'], ['Armaduras', 'armaduras', 'weapon'],
      ['Escudos', 'escudos', 'weapon'], ['Talismanes', 'talismanes', 'talisman'], ['Cenizas de guerra', 'cenizas-de-guerra', 'weapon'],
      ['Invocaciones', 'invocaciones', 'weapon'], ['Hechicerías', 'hechicerias', 'magic'], ['Conjuros', 'conjuros', 'magic'], ['Otros', 'objetos', 'item']];
    el.innerHTML = items.map(function (i) {
      return '<div><span class="mini ' + i[2] + '">' + svgIcono(i[1]) + '</span>' + i[0] + '</div>';
    }).join('');
  }

  var capaBy = {}, catBy = {}, regBy = {};
  D.capas.forEach(function (c) { capaBy[c.slug] = c; });
  D.categorias.forEach(function (c) { catBy[c.slug] = c; });
  D.registros.forEach(function (r) {
    r.marcadores.sort(function (a, b) { return a.orden - b.orden; });
    regBy[r.slug] = r;
  });

  var st = { capa: D.capas[0].slug, cat: null, q: '', sel: null, fase: 0, abiertos: {}, colocando: null, borrarArmado: false };

  /* ---------- Mapa ---------- */
  var map = L.map('mapa', { crs: L.CRS.Simple, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: -10, maxZoom: 3, attributionControl: false });
  window.codexMap = map;
  var gBase = L.layerGroup().addTo(map), gPines = L.layerGroup().addTo(map);

  function llng(capa, x, y) { return [capa.alto * (1 - y / 100), capa.ancho * x / 100]; }
  function bounds(capa) { return [[0, 0], [capa.alto, capa.ancho]]; }

  function mostrarCapa(slug, centro) {
    var capa = capaBy[slug];
    st.capa = slug;
    gBase.clearLayers();
    var ov = L.imageOverlay(capa.url, bounds(capa));
    ov.on('error', function () { falla('No se encontró la imagen del mapa: ' + capa.url); });
    ov.addTo(gBase);
    var fit = map.getBoundsZoom(bounds(capa), true);
    map.setMinZoom(fit - 1);
    map.setMaxBounds(L.latLngBounds(bounds(capa)).pad(0.25));
    if (centro) map.setView(llng(capa, centro.x, centro.y), Math.min(fit + 1.5, map.getMaxZoom()), { animate: false });
    else map.fitBounds(bounds(capa), { animate: false });
    $('badge').hidden = !capa.subterranea;
    $('badge').textContent = 'Subterráneo · ' + capa.nombre;
    dibujarPines();
    renderCapas();
  }

  function popupHtml(r, m) {
    return '<span class="pill">' + esc(r.categoria_nombre) + '</span><h3>' + esc(r.nombre) + '</h3>' +
      (m.fase ? '<div>' + esc(m.fase) + '</div>' : '') +
      '<a class="btn sm" href="/registro/' + encodeURIComponent(r.slug) + '/">Ver detalle</a>';
  }

  function dibujarPines() {
    gPines.clearLayers();
    var capa = capaBy[st.capa];
    var visibles = filtrados();
    if (st.sel && visibles.indexOf(regBy[st.sel]) < 0) visibles.push(regBy[st.sel]);
    visibles.forEach(function (r) {
      var multi = r.marcadores.length > 1;
      r.marcadores.forEach(function (m, i) {
        if (m.capa !== st.capa) return;
        var esSel = st.sel === r.slug && (!multi || i === st.fase);
        var icon = L.divIcon({
          className: 'pin-wrap', iconSize: [0, 0],
          html: '<span class="pin ' + esc(tipoPin(r)) + (esSel ? ' sel' : '') + '">' + svgIcono(claveIcono(r)) + '</span>' +
            (multi ? '<b class="pn' + (esSel ? ' sel' : '') + '">' + (i + 1) + '</b>' : '')
        });
        var mk = L.marker(llng(capa, m.x, m.y), { icon: icon, title: r.nombre, zIndexOffset: esSel ? 1000 : 0 }).addTo(gPines);
        mk.bindPopup(popupHtml(r, m), { offset: [0, -34] });
        mk.on('click', function () { seleccionar(r.slug, i, true); });
        if (esSel && !mk.isPopupOpen()) setTimeout(function () { mk.openPopup(); }, 0);
      });
      // Línea discontinua entre fases consecutivas de la misma capa
      if (st.sel === r.slug && multi) {
        for (var k = 0; k < r.marcadores.length - 1; k++) {
          var a = r.marcadores[k], b = r.marcadores[k + 1];
          if (a.capa === st.capa && b.capa === st.capa)
            L.polyline([llng(capa, a.x, a.y), llng(capa, b.x, b.y)], { color: '#c19d53', weight: 2, dashArray: '6 6', opacity: 0.8 }).addTo(gPines);
        }
      }
    });
  }

  /* ---------- Selección ---------- */
  function seleccionar(slug, fase, desdePin) {
    var r = regBy[slug];
    cancelarColocar(); st.borrarArmado = false;
    st.sel = slug; st.fase = Math.max(0, Math.min(fase || 0, r.marcadores.length - 1));
    var m = r.marcadores[st.fase];
    if (m && !desdePin) {
      if (m.capa !== st.capa) mostrarCapa(m.capa, { x: m.x, y: m.y });
      else { map.setView(llng(capaBy[m.capa], m.x, m.y), Math.max(map.getZoom(), map.getBoundsZoom(bounds(capaBy[m.capa]), true) + 1.5), { animate: true }); dibujarPines(); }
    } else dibujarPines();
    renderPanel();
  }

  /* ---------- Filtros ---------- */
  function coincideCat(r) { return !st.cat || r.categoria === st.cat || r.grupo === st.cat; }
  function filtrados() {
    var q = norm(st.q);
    return D.registros.filter(function (r) { return coincideCat(r) && (!q || norm(r.nombre).indexOf(q) >= 0); });
  }

  /* ---------- Panel ---------- */
  function renderCapas() {
    $('capas').innerHTML = D.capas.map(function (c) {
      return '<button type="button" class="ly' + (c.slug === st.capa ? ' on' : '') + '" data-capa="' + esc(c.slug) + '"><i style="background-image:url(' + esc(c.url) + ')"></i><span>' + esc(c.nombre) + '<small>' + (c.subterranea ? 'Subterráneo' : 'Tierras Intermedias') + '</small></span></button>';
    }).join('');
  }

  function renderCrumbs() {
    var h = '';
    if (st.cat) {
      var c = catBy[st.cat];
      if (c.padre) h += '<span class="chip" data-clear="cat">' + esc(catBy[c.padre].nombre) + '</span><span style="color:var(--gold)">›</span>';
      h += '<span class="chip" data-clear="cat">' + esc(c.nombre) + ' ✕</span>';
    } else h = '<span class="chip" style="cursor:default">Todas las categorías</span>';
    $('crumbs').innerHTML = h;
  }

  function thumb(r) { return '<span class="thumb"' + (r.imagen ? ' style="background-image:url(' + esc(r.imagen) + ')"' : '') + '></span>'; }

  function renderDetalle() {
    if (!st.sel) return '';
    var r = regBy[st.sel], h = '<div class="detalle"><span class="pill">' + esc(r.categoria_nombre) + '</span><h3>' + esc(r.nombre) + '</h3>';
    if (r.descripcion) h += '<p>' + esc(r.descripcion) + '</p>';
    if (r.ubicacion) h += '<div class="lbl">Ubicación (según la API)</div><p>' + esc(r.ubicacion) + '</p>';
    if (!r.marcadores.length) h += '<p style="margin-top:8px"><i>Todavía no tiene ubicación en el mapa.</i></p>';
    else if (r.marcadores.length > 1) {
      h += '<div class="lbl">Fases de la misión</div>' + r.marcadores.map(function (m, i) {
        return '<button type="button" class="fase' + (i === st.fase ? ' on' : '') + '" data-fase="' + i + '"><b>' + (i + 1) + '</b>' + esc(m.fase || 'Ubicación') + '<small>' + esc(capaBy[m.capa].nombre) + '</small></button>';
      }).join('');
    } else h += '<p style="margin-top:8px"><i>' + esc(capaBy[r.marcadores[0].capa].nombre) + '</i></p>';
    if (D.es_admin) h += renderAdmin(r);
    h += '<a class="btn sm" style="margin-top:10px" href="/registro/' + encodeURIComponent(r.slug) + '/">Ver detalle</a> ';
    h += '<button type="button" class="back" data-quitar="1">Quitar selección</button></div>';
    return h;
  }

  function renderAdmin(r) {
    var h = '<div class="admin"><div class="lbl">Administrador</div>';
    if (!r.marcadores.length) {
      h += '<input id="adm-fase" placeholder="Fase (opcional)" maxlength="160"><button type="button" class="btn sm" data-adm="crear">Colocar pin en el mapa</button>';
    } else {
      var m = r.marcadores[st.fase];
      h += '<button type="button" class="btn sm" data-adm="mover">Mover el pin' + (r.marcadores.length > 1 ? ' ' + (st.fase + 1) : '') + '</button>' +
        '<input id="adm-fase" placeholder="Nombre de la nueva fase" maxlength="160"><button type="button" class="btn sm ghost" data-adm="crear">Añadir otra ubicación</button>' +
        '<button type="button" class="btn sm ghost peligro' + (st.borrarArmado ? ' armado' : '') + '" data-adm="borrar">' + (st.borrarArmado ? '¿Seguro? Pulsa otra vez' : 'Eliminar este pin') + '</button>';
    }
    return h + '</div>';
  }

  /* ---------- Colocar pines (superusuario) ---------- */
  function aviso(html, error) {
    var a = $('aviso'); a.hidden = !html; a.className = 'aviso' + (error ? ' error' : ''); a.innerHTML = html || '';
  }
  function csrf() { var i = document.querySelector('input[name=csrfmiddlewaretoken]'); return i ? i.value : ''; }
  function cancelarColocar() { st.colocando = null; document.body.classList.remove('colocando'); aviso(''); }

  function empezarColocar(modo) {
    var r = regBy[st.sel], f = $('adm-fase');
    st.colocando = { modo: modo, fase: f ? f.value.trim() : '', id: modo === 'mover' ? r.marcadores[st.fase].id : null };
    document.body.classList.add('colocando');
    aviso('Haz clic en el mapa para ' + (modo === 'mover' ? 'mover' : 'colocar') + ' «' + esc(r.nombre) + '» <button type="button" class="btn sm" id="aviso-cancelar">Cancelar</button>');
  }

  function enviarMarcador(cuerpo) {
    return fetch('/api/marcador/', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() }, body: JSON.stringify(cuerpo) })
      .then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j.error || 'Error ' + res.status); return j; }); });
  }

  function aplicarRespuesta(r, j, fase) {
    r.marcadores = j.marcadores.sort(function (a, b) { return a.orden - b.orden; });
    st.fase = Math.max(0, Math.min(fase, r.marcadores.length - 1));
    st.borrarArmado = false;
    dibujarPines(); renderPanel();
  }

  map.on('click', function (e) {
    if (!st.colocando || !st.sel) return;
    var capa = capaBy[st.capa], c = st.colocando, r = regBy[st.sel];
    var x = e.latlng[1] != null ? e.latlng[1] / capa.ancho * 100 : e.latlng.lng / capa.ancho * 100;
    var lat = Array.isArray(e.latlng) ? e.latlng[0] : e.latlng.lat;
    var y = (1 - lat / capa.alto) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) { aviso('Haz clic dentro de la imagen del mapa', true); return; }
    var cuerpo = { accion: c.modo, registro: r.slug, capa: st.capa, x: x, y: y, fase: c.fase, id: c.id };
    cancelarColocar();
    enviarMarcador(cuerpo).then(function (j) {
      var nueva = c.modo === 'crear' ? j.marcadores.length - 1 : st.fase;
      aplicarRespuesta(r, j, nueva);
      aviso('Pin guardado', false); setTimeout(function () { aviso(''); }, 1800);
    }).catch(function (err) { aviso(esc(err.message), true); setTimeout(function () { aviso(''); }, 3500); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.colocando) cancelarColocar(); });
  $('aviso').addEventListener('click', function (e) { if (e.target.id === 'aviso-cancelar') cancelarColocar(); });

  function borrarMarcador() {
    var r = regBy[st.sel];
    if (!st.borrarArmado) { st.borrarArmado = true; renderPanel(); return; }
    var id = r.marcadores[st.fase].id;
    enviarMarcador({ accion: 'borrar', registro: r.slug, id: id }).then(function (j) { aplicarRespuesta(r, j, 0); })
      .catch(function (err) { st.borrarArmado = false; renderPanel(); aviso(esc(err.message), true); setTimeout(function () { aviso(''); }, 3500); });
  }

  function renderArbol() {
    var grupos = D.categorias.filter(function (c) { return !c.padre; });
    return grupos.map(function (g) {
      var subs = D.categorias.filter(function (c) { return c.padre === g.slug; });
      var n = D.registros.filter(function (r) { return r.grupo === g.slug; }).length;
      var abierto = st.abiertos[g.slug];
      var h = '<button type="button" class="grp' + (abierto ? ' open' : '') + '" data-grupo="' + esc(g.slug) + '">' + esc(g.nombre) + '<em>' + n + ' ' + (abierto ? '▾' : '▸') + '</em></button>';
      if (abierto) {
        h += '<div class="subs"><button type="button" class="sub" data-cat="' + esc(g.slug) + '">Todo en ' + esc(g.nombre) + '<i>' + n + '</i></button>';
        h += subs.map(function (s) {
          var k = D.registros.filter(function (r) { return r.categoria === s.slug; }).length;
          return '<button type="button" class="sub" data-cat="' + esc(s.slug) + '">' + esc(s.nombre) + '<i>' + k + ' ›</i></button>';
        }).join('') + '</div>';
      }
      return h;
    }).join('');
  }

  function renderLista(lista) {
    if (!lista.length) return '<div class="vacio">No hay objetos que coincidan.</div>';
    return lista.map(function (r) {
      var donde = r.marcadores.length ? Array.from(new Set(r.marcadores.map(function (m) { return capaBy[m.capa].nombre; }))).join(' · ') : 'Sin ubicar';
      return '<button type="button" class="row' + (r.slug === st.sel ? ' on' : '') + '" data-reg="' + esc(r.slug) + '">' + thumb(r) + '<span><span class="nm">' + esc(r.nombre) + '</span><small>' + esc(r.categoria_nombre) + ' · ' + esc(donde) + '</small></span></button>';
    }).join('');
  }

  function renderPanel() {
    var lista = filtrados(), buscando = st.cat || st.q.trim();
    renderCrumbs();
    $('pcount').textContent = buscando ? lista.length + (lista.length === 1 ? ' resultado' : ' resultados') : D.registros.length + ' objetos';
    $('pbody').innerHTML = renderDetalle() + (buscando ? renderLista(lista) : renderArbol());
  }

  /* ---------- Eventos ---------- */
  $('pbody').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.grupo) { st.abiertos[t.dataset.grupo] = !st.abiertos[t.dataset.grupo]; renderPanel(); }
    else if (t.dataset.cat) { st.cat = t.dataset.cat; renderPanel(); dibujarPines(); }
    else if (t.dataset.reg) seleccionar(t.dataset.reg, 0, false);
    else if (t.dataset.fase) seleccionar(st.sel, parseInt(t.dataset.fase, 10), false);
    else if (t.dataset.adm) {
      if (t.dataset.adm === 'borrar') borrarMarcador(); else empezarColocar(t.dataset.adm);
    }
    else if (t.dataset.quitar) { st.sel = null; map.closePopup(); dibujarPines(); renderPanel(); }
  });
  $('crumbs').addEventListener('click', function (e) {
    if (e.target.dataset.clear) { st.cat = null; renderPanel(); dibujarPines(); }
  });
  $('capas').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (t && t.dataset.capa !== st.capa) mostrarCapa(t.dataset.capa);
  });
  $('q').addEventListener('input', function (e) { st.q = e.target.value; renderPanel(); dibujarPines(); });
  $('ptab').addEventListener('click', function () {
    var p = $('panel'), plegado = p.classList.toggle('plegado');
    $('ptab').textContent = plegado ? '◂ Códice' : 'Códice ▸';
    $('ptab').setAttribute('aria-expanded', String(!plegado));
  });

  /* ---------- Inicio ---------- */
  var params = new URLSearchParams(location.search);
  var inicial = params.get('registro');
  try {
    dibujarLeyenda();
    mostrarCapa(st.capa);
    renderPanel();
    if (inicial && regBy[inicial]) {
      st.abiertos[regBy[inicial].grupo] = true;
      seleccionar(inicial, Math.max(0, (parseInt(params.get('fase'), 10) || 1) - 1), false);
    }
  } catch (err) {
    falla('Error al iniciar el mapa: ' + err.message + ' (consola: F12)');
    throw err;
  }
})();
