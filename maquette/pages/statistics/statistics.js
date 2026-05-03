// pages/statistics/statistics.js

const PATIENTS = {
    marcel: {
        sessions: [
            {
                date: '28/03/2026',
                time: '10h15',
                duration: 12,
                game: 'Memoire & Reminiscence',
                latency: 8,
                hints: 1,
                touchProfile: 'touches hesitantes mais ciblees',
                stopMoment: 'jusqu au bout',
                supportLevel: 'modere',
                emotionalState: 'apaise',
                nextStep: 'rester sur les souvenirs familiaux simples'
            },
            {
                date: '26/03/2026',
                time: '14h30',
                duration: 6,
                game: 'Associations du Quotidien',
                latency: 11,
                hints: 2,
                touchProfile: 'double appui et besoin de recentrage',
                stopMoment: 'arret au milieu',
                supportLevel: 'important',
                emotionalState: 'fatigue apres quelques minutes',
                nextStep: 'raccourcir la prochaine seance a 5 minutes'
            },
            {
                date: '24/03/2026',
                time: '10h00',
                duration: 15,
                game: 'Memoire & Reminiscence',
                latency: 6,
                hints: 0,
                touchProfile: 'regard stable et choix apaises',
                stopMoment: 'jusqu au bout',
                supportLevel: 'leger',
                emotionalState: 'souriant et disponible',
                nextStep: 'reprendre les photos de mariage et les chansons connues'
            }
        ]
    },
    jean: {
        sessions: [
            {
                date: '28/03/2026',
                time: '09h00',
                duration: 18,
                game: 'Associations du Quotidien',
                latency: 5,
                hints: 0,
                touchProfile: 'gestes assures',
                stopMoment: 'jusqu au bout',
                supportLevel: 'leger',
                emotionalState: 'calme',
                nextStep: 'augmenter legerement la variete des scenes'
            },
            {
                date: '25/03/2026',
                time: '09h30',
                duration: 14,
                game: 'Memoire & Reminiscence',
                latency: 7,
                hints: 1,
                touchProfile: 'hesitation au demarrage puis engagement',
                stopMoment: 'jusqu au bout',
                supportLevel: 'modere',
                emotionalState: 'curieux mais prudent',
                nextStep: 'rester sur des supports personnels tres lisibles'
            },
            {
                date: '22/03/2026',
                time: '10h00',
                duration: 9,
                game: 'Associations du Quotidien',
                latency: 9,
                hints: 1,
                touchProfile: 'glissement du doigt sur les bords',
                stopMoment: 'arret en fin de seance',
                supportLevel: 'modere',
                emotionalState: 'fatigue legere en fin de parcours',
                nextStep: 'conserver les grands boutons et reduire la densite'
            }
        ]
    },
    paul: {
        sessions: [
            {
                date: '27/03/2026',
                time: '16h00',
                duration: 24,
                game: 'Memoire & Reminiscence',
                latency: 4,
                hints: 0,
                touchProfile: 'navigation fluide',
                stopMoment: 'jusqu au bout',
                supportLevel: 'leger',
                emotionalState: 'tres engage',
                nextStep: 'proposer davantage de souvenirs autobiographiques'
            },
            {
                date: '24/03/2026',
                time: '15h30',
                duration: 21,
                game: 'Associations du Quotidien',
                latency: 5,
                hints: 0,
                touchProfile: 'touches precises et rythme stable',
                stopMoment: 'jusqu au bout',
                supportLevel: 'leger',
                emotionalState: 'concentre',
                nextStep: 'introduire des sequences de routine plus longues'
            }
        ]
    }
};

const R   = 50;
const C   = 2 * Math.PI * R;

document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('patient-select');
    const initialPatient = getCurrentPatientId();

    sel.value = initialPatient;
    sel.addEventListener('change', (event) => {
        syncPatientStorage(event.target.value);
        loadPatient(event.target.value);
    });
    loadPatient(initialPatient);
});

function getCurrentPatientId() {
    const selectedPatient = (localStorage.getItem('selectedPatient') || '').toLowerCase();
    const activePatient = (sessionStorage.getItem('activePatient') || '').toLowerCase();
    return PATIENTS[selectedPatient] ? selectedPatient : PATIENTS[activePatient] ? activePatient : 'marcel';
}

function syncPatientStorage(patientId) {
    const patientName = `${patientId.charAt(0).toUpperCase()}${patientId.slice(1)}`;
    localStorage.setItem('selectedPatient', patientName);
    sessionStorage.setItem('activePatient', patientId);
}

function loadPatient(id) {
    const { sessions } = PATIENTS[id];
    renderDonuts(sessions);
    renderSessions(sessions);
}

function renderDonuts(sessions) {
    const totalSessions = sessions.length || 1;
    const finishedSessions = sessions.filter((session) => session.stopMoment === 'jusqu au bout').length;
    const completionPct = Math.round((finishedSessions / totalSessions) * 100);

    setDonut('donut-success-fill', completionPct, '#6B8F71');
    document.getElementById('donut-success-pct').textContent = completionPct;
    document.getElementById('donut-success-sub').textContent =
        `${finishedSessions} seances sur ${totalSessions}`;

    const hintSignals = sessions.reduce((sum, session) => sum + session.hints, 0);
    const guidanceSignals = sessions.filter((session) => session.supportLevel !== 'leger').length;
    const earlyStops = sessions.filter((session) => session.stopMoment !== 'jusqu au bout').length;
    const supportTotal = hintSignals + guidanceSignals + earlyStops || 1;

    const pFaces = Math.round((hintSignals / supportTotal) * 100);
    const pObj = Math.round((guidanceSignals / supportTotal) * 100);
    const pSouv = Math.round((earlyStops / supportTotal) * 100);

    setMultiDonut([
        { id: 'donut-err-faces',     pct: pFaces, color: '#E07070' },
        { id: 'donut-err-objects',   pct: pObj,   color: '#D4A96A' },
        { id: 'donut-err-souvenirs', pct: pSouv,  color: '#7B9FD4' }
    ]);
    document.getElementById('donut-err-total').textContent = hintSignals + guidanceSignals + earlyStops;
    document.getElementById('leg-faces').textContent = `Indices ${pFaces} %`;
    document.getElementById('leg-objects').textContent = `Guidage verbal ${pObj} %`;
    document.getElementById('leg-souvenirs').textContent = `Arrets precoces ${pSouv} %`;

    const sessA = sessions.filter((session) => session.game === 'Associations du Quotidien').length;
    const sessB = sessions.filter((session) => session.game === 'Memoire & Reminiscence').length;
    const pA = Math.round((sessA / totalSessions) * 100);
    const pB = Math.round((sessB / totalSessions) * 100);

    setMultiDonut([
        { id: 'donut-game-a', pct: pA, color: '#D4A96A' },
        { id: 'donut-game-b', pct: pB, color: '#6B8F71'  }
    ]);
    document.getElementById('donut-sessions-total').textContent = totalSessions;
    document.getElementById('leg-gameA').textContent = `Associations ${pA} %`;
    document.getElementById('leg-gameB').textContent = `Reminiscence ${pB} %`;
}

function setDonut(id, pct, color) {
    const el  = document.getElementById(id);
    const arc = (pct / 100) * C;
    el.style.stroke           = color;
    el.style.strokeDasharray  = `${arc} ${C}`;
    el.style.strokeDashoffset = C * 0.25;
}

function setMultiDonut(segments) {
    let offset = C * 0.25;
    segments.forEach((segment) => {
        const el  = document.getElementById(segment.id);
        const arc = (segment.pct / 100) * C;
        el.style.stroke = segment.color;
        el.style.strokeDasharray  = `${arc} ${C}`;
        el.style.strokeDashoffset = -offset + C * 0.25;
        offset += arc;
    });
}

function renderSessions(sessions) {
    const list = document.getElementById('sessions-list');
    const count = document.getElementById('sessions-count');
    list.innerHTML = '';
    count.textContent = `(${sessions.length})`;

    sessions.forEach((session) => {
        const supportClass = session.supportLevel === 'leger'
            ? 'support-soft'
            : session.supportLevel === 'modere'
                ? 'support-mid'
                : 'support-high';

        const indicatorsHtml = [
            `Temps moyen avant reponse : ${session.latency} s`,
            `Indices declenches : ${session.hints}`,
            `Interactions tactiles : ${session.touchProfile}`,
            `Moment d'arret : ${session.stopMoment}`
        ].map((label) => `
            <li class="indicator-item">
                <span class="indicator-dot"></span>
                ${label}
            </li>
        `).join('');

        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <div class="session-card-header">
                <div class="session-meta">
                    <span class="session-date">${session.date} a ${session.time}</span>
                    <span class="session-game">${session.game}</span>
                </div>
                <div class="session-badges">
                    <span class="badge-duration">${session.duration} min</span>
                    <span class="badge-support ${supportClass}">Accompagnement ${session.supportLevel}</span>
                </div>
            </div>

            <div class="session-card-body">
                <div class="session-col">
                    <h4 class="col-title">Repères observes</h4>
                    <ul class="indicator-list">${indicatorsHtml}</ul>
                </div>
                <div class="session-col">
                    <h4 class="col-title">Pour la prochaine seance</h4>
                    <p class="support-reading">Etat observe : ${session.emotionalState}</p>
                    <p class="next-step">${session.nextStep}</p>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}
