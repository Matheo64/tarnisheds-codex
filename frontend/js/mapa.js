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
          html: '<span class="pin ' + esc(r.pin) + (esSel ? ' sel' : '') + '">' + (multi ? '<span>' + (i + 1) + '</span>' : '') + '</span>'
        });
        var mk = L.marker(llng(capa, m.x, m.y), { icon: icon, title: r.nombre, zIndexOffset: esSel ? 1000 : 0 }).addTo(gPines);
        mk.bindPopup(popupHtml(r, m), { offset: [0, -22] });
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
