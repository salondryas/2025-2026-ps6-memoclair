// pages/games/games.js

document.addEventListener('DOMContentLoaded', () => {
    const duoToggle = document.getElementById('duo-mode-toggle');
    const btnJouerB = document.getElementById('btn-jouer-b');
    const duoBadge = document.getElementById('duo-badge');
    const patientName = localStorage.getItem('selectedPatient') || 'Marcel';
    const patientProfile = getPatientProfile(patientName);
    const nameEl = document.getElementById('games-patient-name');
    const subtitleEl = document.getElementById('games-subtitle');
    const stagePill = document.getElementById('games-stage-pill');
    const attentionPill = document.getElementById('games-attention-pill');
    const themePill = document.getElementById('games-theme-pill');
    const briefList = document.getElementById('games-brief-list');
    const recoTitle = document.getElementById('games-recommendation-title');
    const recoText = document.getElementById('games-recommendation-text');

    if (nameEl) nameEl.textContent = patientName;
    if (subtitleEl) subtitleEl.textContent = patientProfile.subtitle;
    if (stagePill) stagePill.textContent = patientProfile.stageLabel;
    if (attentionPill) attentionPill.textContent = `${patientProfile.attention} min max`;
    if (themePill) themePill.textContent = patientProfile.themeLabel;
    if (briefList) {
        briefList.innerHTML = patientProfile.briefPoints
            .map((item) => `<li>${item}</li>`)
            .join('');
    }
    if (recoTitle) recoTitle.textContent = patientProfile.recommendation.title;
    if (recoText) recoText.textContent = patientProfile.recommendation.text;

    const cards = document.querySelectorAll('mc-game-card');
    cards.forEach((card) => {
        const title = card.getAttribute('card-title') || '';
        const shouldRecommend = patientProfile.recommendedGame === 'memoire'
            ? title.includes('Réminiscence')
            : title.includes('Associations');
        card.toggleAttribute('recommended', shouldRecommend);
    });

    if (duoToggle && btnJouerB) {
        duoBadge.style.display = 'none';

        duoToggle.addEventListener('change', (e) => {
            const isDuoActive = e.target.checked;
            sessionStorage.setItem('mc_duoMode', isDuoActive ? 'true' : 'false');

            if (isDuoActive) {
                btnJouerB.href = 'game-duo.html';
                btnJouerB.textContent = 'Démarrer à deux';
                duoBadge.textContent = 'Mode duo actif';
                duoBadge.style.display = 'inline-block';
                btnJouerB.style.backgroundColor = '#D7A857';
            } else {
                btnJouerB.href = 'game-b.html';
                btnJouerB.textContent = 'Démarrer la séance';
                duoBadge.style.display = 'none';
                btnJouerB.style.backgroundColor = '';
            }
        });
    }
});

function getPatientProfile(patientName) {
    const rawProfile = localStorage.getItem(`mc_profile_${patientName}`);

    try {
        const profile = rawProfile ? JSON.parse(rawProfile) : null;
        const themes = profile?.themes?.length ? profile.themes : ['famille', 'quotidien'];
        const stageMap = {
            leger: 'Exploration plus riche',
            modere: 'Repères concrets et guidés',
            avance: 'Rythme très doux et repères forts'
        };

        const stage = profile?.stage || (patientName === 'Paul' ? 'leger' : patientName === 'Jean' ? 'modere' : 'avance');
        const attention = profile?.attention || (patientName === 'Paul' ? '15' : patientName === 'Jean' ? '10' : '5');
        const themeLabel = themes.map((theme) => ({
            famille: 'famille',
            quotidien: 'quotidien',
            musique: 'musique',
            enfance: 'enfance',
            metier: 'métier',
            lieux: 'lieux connus'
        })[theme] || theme).join(', ');

        const memoryThemes = ['famille', 'musique', 'enfance', 'lieux'];
        const recommendedGame = themes.some((theme) => memoryThemes.includes(theme)) ? 'memoire' : 'associations';

        return {
            stageLabel: stageMap[stage],
            attention,
            themeLabel,
            recommendedGame,
            subtitle: recommendedGame === 'memoire'
                ? `Une séance de réminiscence accompagnée peut bien fonctionner aujourd'hui avec ${patientName}, en gardant des relances très douces.`
                : `Une séance très concrète autour des repères du quotidien semble particulièrement adaptée pour ${patientName} aujourd'hui.`,
            briefPoints: [
                `Durée conseillée : ${attention} minutes maximum`,
                recommendedGame === 'memoire'
                    ? 'Privilégier les souvenirs connus, les lieux familiers et les ambiances rassurantes'
                    : 'Commencer par des objets familiers, puis aller vers une petite séquence de routine',
                stage === 'avance'
                    ? 'Conserver peu de choix à la fois et laisser plus de temps entre deux gestes'
                    : 'Laisser venir la réponse sans reformuler trop vite'
            ],
            recommendation: recommendedGame === 'memoire'
                ? {
                    title: 'Commencer par Mémoire & Réminiscence',
                    text: 'Les thèmes enregistrés aujourd’hui sont porteurs pour ouvrir une conversation simple, personnelle et apaisée.'
                }
                : {
                    title: 'Commencer par Associations du Quotidien',
                    text: 'Une entrée très concrète peut rassurer, installer le rythme et préparer ensuite une séance de réminiscence si besoin.'
                }
        };
    } catch (error) {
        return {
            stageLabel: 'Repères concrets',
            attention: '5',
            themeLabel: 'famille, quotidien',
            recommendedGame: 'associations',
            subtitle: `Choisissez une séance courte et rassurante pour ${patientName}.`,
            briefPoints: [
                'Commencer par un repère du quotidien très simple',
                'Laisser plus de temps entre deux interactions',
                'Éviter tout commentaire correctif'
            ],
            recommendation: {
                title: 'Commencer par Associations du Quotidien',
                text: 'C est souvent la meilleure entrée lorsqu on veut installer la séance sans pression.'
            }
        };
    }
}
