
"use strict";

var API_URL = 'http://localhost:8080/api';
var UPDATE_INTERVAL  = 10000;
var CLOCK_INTERVAL   = 1000;
var WARNING_INTERVAL = 6000;
var MAX_CARDS        = 8;

var TYPE_TO_CLASS = {
    'ptMetro':    null,
    'ptTram':     'tram',
    'ptTramWLB':  'tram',
    'ptBusCity':  'bus',
    'ptBusNight': 'night',
    'ptTrainS':   'sbahn'
};

var state = {
    departures:      [],
    warnings:        [],
    last_update:     null,
    current_warning: 0,
    source_status:   'loading'
};


function getMockData() {
    var now = Date.now();
    var m = function (offset) { return new Date(now + offset * 60000).toISOString(); };
    return {
        status: 'ok',
        departures: [
            { stop: 'Rathaus',             line: 'U2', type: 'ptMetro',   towards: 'Seestadt',            barrierFree: true,  time: m(2),  walkDuration: 180 },
            { stop: 'Rathaus',             line: 'U2', type: 'ptMetro',   towards: 'Seestadt',            barrierFree: true,  time: m(8),  walkDuration: 180 },
            { stop: 'Rathaus',             line: 'U2', type: 'ptMetro',   towards: 'Karlsplatz',          barrierFree: true,  time: m(3),  walkDuration: 180 },
            { stop: 'Rathaus',             line: 'U2', type: 'ptMetro',   towards: 'Karlsplatz',          barrierFree: false, time: m(9),  walkDuration: 180 },
            { stop: 'Schottentor',         line: '41', type: 'ptTram',    towards: 'Pötzleinsdorf',       barrierFree: false, time: m(4),  walkDuration: 240 },
            { stop: 'Schottentor',         line: '41', type: 'ptTram',    towards: 'Pötzleinsdorf',       barrierFree: false, time: m(11), walkDuration: 240 },
            { stop: 'Schottentor',         line: '41', type: 'ptTram',    towards: 'Schottentor',         barrierFree: true,  time: m(5),  walkDuration: 240 },
            { stop: 'Landesgerichtsstraße',line: '43', type: 'ptTram',    towards: 'Neuwaldegg',          barrierFree: true,  time: m(6),  walkDuration: 300 },
            { stop: 'Landesgerichtsstraße',line: '43', type: 'ptTram',    towards: 'Neuwaldegg',          barrierFree: false, time: m(14), walkDuration: 300 },
            { stop: 'Rathausplatz',        line: '1',  type: 'ptTram',    towards: 'Prater Hauptallee',   barrierFree: true,  time: m(3),  walkDuration: 120 },
            { stop: 'Rathausplatz',        line: '1',  type: 'ptTram',    towards: 'Prater Hauptallee',   barrierFree: false, time: m(12), walkDuration: 120 },
        ],
        warnings: [
            { title: 'U2 Betriebsstörung', description: 'Eingeschränkter Betrieb zwischen Schottentor und Karlsplatz.' }
        ]
    };
}



function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}

function capitalize(str) {
    if (!str) return '';
    return str.replace(/\w[^- ]*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function classForLine(type, line) {
    if (type === 'ptMetro') {
        var num = (line || '').toLowerCase();
        if (num === 'u1' || num === 'u2' || num === 'u3' ||
            num === 'u4' || num === 'u6') {
            return num;
        }
        return 'u1';
    }
    return TYPE_TO_CLASS[type] || 'tram';
}

function isReachable(dep) {
    var now = Date.now();
    var depTime = new Date(dep.time).getTime();
    var diff = (depTime - now) / 1000;
    var walk = dep.walkDuration || 0;
    if (diff < 0) return false;
    if (walk * 0.9 > diff) return false;
    return true;
}

function countdownMinutes(dep) {
    var now = Date.now();
    var depTime = new Date(dep.time).getTime();
    var diff = Math.floor((depTime - now) / 1000 / 60);
    return Math.max(0, diff);
}


function groupDepartures(departures) {
    var groups = {};

    departures.forEach(function (dep) {
        if (!isReachable(dep)) return;

        var key = dep.stop + '|' + dep.line;
        if (!groups[key]) {
            groups[key] = {
                stop:         dep.stop,
                line:         dep.line,
                type:         dep.type,
                walkDuration: dep.walkDuration || 0,
                byTowards:    {}
            };
        }
        var g = groups[key];
        var towards = capitalize(dep.towards || '');
        if (!g.byTowards[towards]) {
            g.byTowards[towards] = {
                towards:     towards,
                barrierFree: !!dep.barrierFree,
                deps:        []
            };
        }
        g.byTowards[towards].deps.push(dep);
        if (dep.barrierFree) g.byTowards[towards].barrierFree = true;
    });

    var cards = [];
    Object.keys(groups).forEach(function (key) {
        var g = groups[key];
        var directions = Object.keys(g.byTowards).map(function (t) {
            var d = g.byTowards[t];
            d.deps.sort(function (a, b) {
                return new Date(a.time) - new Date(b.time);
            });
            return {
                towards:     d.towards,
                barrierFree: d.barrierFree,
                times:       d.deps.slice(0, 4).map(countdownMinutes)
            };
        });
        directions.sort(function (a, b) {
            return (a.times[0] || 999) - (b.times[0] || 999);
        });
        cards.push({
            stop:         g.stop,
            line:         g.line,
            type:         g.type,
            walkDuration: g.walkDuration,
            directions:   directions
        });
    });

    cards.sort(function (a, b) {
        var ta = (a.directions[0] && a.directions[0].times[0]) || 999;
        var tb = (b.directions[0] && b.directions[0].times[0]) || 999;
        return ta - tb;
    });

    return cards.slice(0, MAX_CARDS);
}
function renderSide(dir, isRight) {
    var sideClass = 'side' + (isRight ? ' side-right' : '');

    if (!dir) {
        return (
            '<div class="' + sideClass + '">' +
                '<span class="dest">-</span>' +
            '</div>' +
            '<div class="circle empty"><span class="num">-</span></div>'
        );
    }

    var first = dir.times[0];
    var rest  = dir.times.slice(1);

    var circleClass = 'circle';
    if (first <= 1) circleClass += ' imminent';
    if (dir.times.length === 1) circleClass += ' last';

    var bf = dir.barrierFree
        ? ' <span class="badge-icon" title="Barrierefrei">♿</span>'
        : '';

    var nextStr = rest.length
        ? 'danach in ' + rest.join(', ') + ' Minuten'
        : '';

    var nextWarn = (rest[0] !== undefined && rest[0] <= 2) ? ' warn' : '';

    var circleHtml =
        '<div class="' + circleClass + '">' +
            '<span class="num">' + first + '</span>' +
        '</div>';

    var sideHtml =
        '<div class="' + sideClass + '">' +
            '<span class="label">Nächste Abfahrt nach</span>' +
            '<span class="dest">' + dir.towards + bf + '</span>' +
            (nextStr
                ? '<span class="next' + nextWarn + '">' + nextStr + '</span>'
                : '') +
        '</div>';

    return isRight ? (sideHtml + circleHtml) : (circleHtml + sideHtml);
}

function renderCard(card) {
    var li = document.createElement('li');
    li.className = 'dep ' + classForLine(card.type, card.line);

    var walkMin = Math.round((card.walkDuration || 0) / 60);
    var walkStr = walkMin > 0
        ? 'Gehzeit ~' + walkMin + ' Minuten'
        : '';

    var left  = card.directions[0] || null;
    var right = card.directions[1] || null;

    li.innerHTML =
        '<div class="stop-name">' + card.stop + '</div>' +
        renderSide(left, false) +
        '<div class="center">' +
            '<span class="line-name">' + card.line + '</span>' +
            (walkStr ? '<span class="walk">' + walkStr + '</span>' : '') +
        '</div>' +
        renderSide(right, true);

    return li;
}

function renderAll() {
    var ul = document.getElementById('departures');
    var empty = document.getElementById('empty-state');
    if (!ul) return;

    var cards = groupDepartures(state.departures);

    ul.innerHTML = '';
    if (cards.length === 0) {
        ul.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
    } else {
        ul.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');
        cards.forEach(function (c) {
            ul.appendChild(renderCard(c));
        });
    }
}

function renderStatusbar() {
    var badge = document.getElementById('source-badge');
    var warn  = document.getElementById('warnings');
    if (!badge || !warn) return;

    badge.className = 'source-badge source-' + state.source_status;
    if      (state.source_status === 'live')    badge.textContent = 'LIVE';
    else if (state.source_status === 'mock')    badge.textContent = 'MOCK';
    else if (state.source_status === 'error')   badge.textContent = 'ERROR';
    else if (state.source_status === 'loading') badge.textContent = '...';
    else                                        badge.textContent = state.source_status.toUpperCase();

    if (state.warnings && state.warnings.length > 0) {
        var w = state.warnings[state.current_warning % state.warnings.length];
        warn.textContent =
            '(' + ((state.current_warning % state.warnings.length) + 1) +
            '/' + state.warnings.length + ') ' +
            (w.title || '') + ' — ' + (w.description || '');
        warn.style.color = '';
    } else if (state.last_update) {
        var d = new Date(state.last_update);
        warn.textContent = 'UPDATED ' +
            pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
        warn.style.color = 'var(--fg-dim)';
    } else {
        warn.textContent = '';
    }
}

function clock() {
    var now = document.getElementById('clock-time');
    var dt  = document.getElementById('clock-date');
    var d   = new Date();
    if (now) {
        now.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    }
    if (dt) {
        var weekday  = d.toLocaleDateString('de-AT', { weekday: 'short' });
        var datePart = d.toLocaleDateString('de-AT', { day: 'numeric', month: 'long' });
        dt.textContent = weekday + ' ' + datePart;
    }
}

function tickWarnings() {
    if (!state.warnings || state.warnings.length === 0) return;
    state.current_warning = (state.current_warning + 1) % state.warnings.length;
    renderStatusbar();
}

function tickCountdown() {
    if (state.departures && state.departures.length > 0) {
        renderAll();
    }
}



function useMockData() {
    var json = getMockData();
    state.departures     = json.departures;
    state.warnings       = json.warnings;
    state.last_update    = new Date();
    state.current_warning = 0;
    state.source_status  = 'mock';
    renderAll();
    renderStatusbar();
}

function update() {
    var req = new XMLHttpRequest();
    req.open('GET', API_URL);
    req.timeout = 3000;
    req.ontimeout = useMockData;
    req.onreadystatechange = function () {
        if (req.readyState !== 4) return;

        if (req.status !== 200) {
            useMockData();
            return;
        }

        try {
            var json = JSON.parse(req.responseText);
            if (json.status && json.status === 'error') {
                throw new Error(json.error || 'API error');
            }
            state.departures     = json.departures || [];
            state.warnings       = json.warnings   || [];
            state.last_update    = new Date();
            state.current_warning = 0;
            state.source_status  = 'live';
            renderAll();
            renderStatusbar();
        } catch (e) {
            useMockData();
            console.log('Öffimonitor: ' + (e.message || e));
        }
    };
    try { req.send(); } catch (e) { useMockData(); }
}

//Bootstrap

window.onload = function () {
    clock();
    renderStatusbar();
    update();

    setInterval(clock,         CLOCK_INTERVAL);
    setInterval(update,        UPDATE_INTERVAL);
    setInterval(tickCountdown, 30000);
    setInterval(tickWarnings,  WARNING_INTERVAL);
};
