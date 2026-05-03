const DAILY_ASSET_PATH = '../../assets/pictuers/game_daily/';

const DAILY_PROFILES = {
    marcel: [
        {
            type: 'associate',
            label: 'Repere visuel',
            axis: 'Objet familier',
            instruction: 'Quel objet reste juste avec la tasse ?',
            helper: 'Regardez tranquillement ce qui accompagne le mieux ce moment.',
            reassurance: 'Une seule association simple suffit. MemoClair laisse le temps de regarder.',
            supportPoints: ['Memoire semantique ancienne', 'Repere visuel stable', 'Objet du quotidien'],
            visual: { type: 'image', src: 'consigne_tasse.png', alt: 'Une tasse blanche' },
            layout: 'choices--two',
            choices: [
                { label: 'Soucoupe', file: 'choix_soucoupe.png', isCorrect: true, feedback: 'Oui, la soucoupe accompagne naturellement la tasse.' },
                { label: 'Sous-plat', file: 'choix_sousplat.png', isCorrect: false, feedback: 'On peut regarder ensemble ce qui reste juste sous la tasse.' }
            ]
        },
        {
            type: 'context',
            label: 'Contexte',
            axis: 'Usage quotidien',
            instruction: 'Pour preparer le cafe, quel objet aide le mieux ?',
            helper: 'Choisissez l objet qui sert le plus naturellement dans cette scene.',
            reassurance: 'On cherche seulement le repere le plus utile pour ce moment du quotidien.',
            supportPoints: ['Contexte familier', 'Objet utile', 'Preparation simple'],
            visual: { type: 'image', src: 'choix_cafetiere.png', alt: 'Une cafetiere' },
            layout: 'choices--two',
            choices: [
                { label: 'Cafetiere', file: 'choix_cafetiere.png', isCorrect: true, feedback: 'Oui, la cafetiere sert a preparer la boisson avant de servir.' },
                { label: 'Verre', file: 'choix_verre.png', isCorrect: false, feedback: 'D accord. On peut s appuyer sur l objet qui prepare la boisson.' }
            ]
        },
        {
            type: 'sequence',
            label: 'Petite routine',
            axis: 'Ordre des gestes',
            instruction: 'Retrouvons doucement l ordre du petit service.',
            helper: 'Touchez les etapes une par une, comme si vous prepariez la boisson.',
            reassurance: 'Si un geste hesite, MemoClair remet doucement le prochain repere en avant.',
            supportPoints: ['Memoire procedurale', 'Organisation simple', 'Routine familiere'],
            visual: { type: 'routine', title: 'Servir une boisson chaude', note: 'Trois petits gestes du quotidien, dans un ordre tres simple.' },
            steps: [
                { id: 'prendre-tasse', label: 'Prendre la tasse' },
                { id: 'poser-soucoupe', label: 'Poser la soucoupe' },
                { id: 'verser-cafe', label: 'Verser la boisson' }
            ],
            successText: 'Tres bien. Le rituel se remet en place pas a pas.',
            wrongText: 'On peut commencer par le geste le plus simple du rituel.'
        }
    ],
    jean: [
        {
            type: 'associate',
            label: 'Repere concret',
            axis: 'Objet et contexte',
            instruction: 'Quel objet accompagne le mieux cette tasse ?',
            helper: 'Choisissez l objet qui semble le plus naturel dans ce moment.',
            reassurance: 'On reste sur des repers concrets, sans pression ni vitesse imposee.',
            supportPoints: ['Objet familier', 'Contexte naturel', 'Choix guide'],
            visual: { type: 'image', src: 'consigne_tasse.png', alt: 'Une tasse blanche' },
            layout: 'choices--three',
            choices: [
                { label: 'Soucoupe', file: 'choix_soucoupe.png', isCorrect: true, feedback: 'Oui, la soucoupe accompagne naturellement cette tasse.' },
                { label: 'Assiette', file: 'choix_assiette.png', isCorrect: false, feedback: 'On peut regarder plutot l objet qui reste habituellement avec la tasse.' },
                { label: 'Verre', file: 'choix_verre.png', isCorrect: false, feedback: 'On peut revenir vers l objet qui partage le meme usage de table.' }
            ]
        },
        {
            type: 'context',
            label: 'Preparation',
            axis: 'Planification simple',
            instruction: 'Lequel sert le mieux a preparer le cafe ?',
            helper: 'Reperez l objet qui intervient avant de servir la boisson.',
            reassurance: 'On s appuie ici sur la logique du quotidien, plus que sur la precision du mot.',
            supportPoints: ['Planification', 'Usage des objets', 'Routine connue'],
            visual: { type: 'image', src: 'choix_cafetiere.png', alt: 'Une cafetiere' },
            layout: 'choices--three',
            choices: [
                { label: 'Cafetiere', file: 'choix_cafetiere.png', isCorrect: true, feedback: 'Oui, la cafetiere vient naturellement au moment de preparer le cafe.' },
                { label: 'Bouilloire', file: 'choix_bouilloire.png', isCorrect: false, feedback: 'C est proche. Regardons l objet le plus specifique pour le cafe.' },
                { label: 'Assiette', file: 'choix_assiette.png', isCorrect: false, feedback: 'On peut plutot chercher l objet qui prepare la boisson.' }
            ]
        },
        {
            type: 'sequence',
            label: 'Routine',
            axis: 'Suite des gestes',
            instruction: 'Remettons en ordre une petite routine de service.',
            helper: 'Touchez les etapes dans l ordre qui vous semble le plus naturel.',
            reassurance: 'L ordre exact n a pas besoin d etre verbalise. Le geste suffit.',
            supportPoints: ['Memoire procedurale', 'Fonctions executives', 'Petit enchainement'],
            visual: { type: 'routine', title: 'Preparer puis servir', note: 'Une suite simple de gestes autour de la boisson chaude.' },
            steps: [
                { id: 'prendre-cafetiere', label: 'Prendre la cafetiere' },
                { id: 'poser-tasse', label: 'Poser la tasse' },
                { id: 'poser-soucoupe', label: 'Ajouter la soucoupe' },
                { id: 'servir', label: 'Verser la boisson' }
            ],
            successText: 'Oui, on retrouve bien la suite des gestes du quotidien.',
            wrongText: 'On peut repartir du premier geste le plus concret.'
        }
    ],
    paul: [
        {
            type: 'context',
            label: 'Contexte',
            axis: 'Choix adapte',
            instruction: 'Quel objet convient le mieux pour preparer le cafe ?',
            helper: 'Prenez celui qui semble le plus specifique pour cette boisson.',
            reassurance: 'Ici on peut aller un peu plus loin dans le choix, tout en gardant un contexte tres familier.',
            supportPoints: ['Memoire semantique', 'Tri entre objets', 'Preparation du quotidien'],
            visual: { type: 'image', src: 'choix_cafetiere.png', alt: 'Une cafetiere' },
            layout: 'choices--four',
            choices: [
                { label: 'Cafetiere', file: 'choix_cafetiere.png', isCorrect: true, feedback: 'Oui, la cafetiere correspond le mieux a cette preparation.' },
                { label: 'Bouilloire', file: 'choix_bouilloire.png', isCorrect: false, feedback: 'La bouilloire aide parfois, mais il existe ici un objet plus specifique.' },
                { label: 'Casserole', file: 'choix_casserole.png', isCorrect: false, feedback: 'On peut chercher l objet directement lie au cafe.' },
                { label: 'Poele', file: 'choix_poele.png', isCorrect: false, feedback: 'On reste sur le materiel qui sert vraiment a preparer la boisson.' }
            ]
        },
        {
            type: 'associate',
            label: 'Association',
            axis: 'Service de table',
            instruction: 'Quel objet accompagne le mieux ce moment de service ?',
            helper: 'Reperez ce qui va le plus naturellement avec la tasse.',
            reassurance: 'Le plus important est la logique du geste, pas la vitesse de reponse.',
            supportPoints: ['Association ecologique', 'Objet de table', 'Repere familier'],
            visual: { type: 'image', src: 'consigne_tasse.png', alt: 'Une tasse blanche' },
            layout: 'choices--four',
            choices: [
                { label: 'Soucoupe', file: 'choix_soucoupe.png', isCorrect: true, feedback: 'Oui, la soucoupe accompagne directement ce moment de service.' },
                { label: 'Assiette', file: 'choix_assiette.png', isCorrect: false, feedback: 'On peut aller vers l objet le plus proche de la tasse dans ce contexte.' },
                { label: 'Verre', file: 'choix_verre.png', isCorrect: false, feedback: 'Regardons plutot l objet qui reste avec la tasse elle-meme.' },
                { label: 'Sous-plat', file: 'choix_sousplat.png', isCorrect: false, feedback: 'On peut viser l association la plus courante dans le service.' }
            ]
        },
        {
            type: 'sequence',
            label: 'Sequence',
            axis: 'Rituel complet',
            instruction: 'Retrouvez l ordre d une petite routine du cafe.',
            helper: 'Touchez les etapes comme si vous prepariez le cafe pour quelqu un.',
            reassurance: 'Le jeu suit votre rythme et remet en avant l etape suivante si besoin.',
            supportPoints: ['Memoire procedurale', 'Planification', 'Rituel connu'],
            visual: { type: 'routine', title: 'Preparer un cafe complet', note: 'Un enchainement un peu plus riche, mais toujours ancre dans le quotidien.' },
            steps: [
                { id: 'prendre-cafetiere', label: 'Prendre la cafetiere' },
                { id: 'poser-tasse', label: 'Poser la tasse' },
                { id: 'poser-soucoupe', label: 'Ajouter la soucoupe' },
                { id: 'servir', label: 'Verser le cafe' }
            ],
            successText: 'Tres bien. La routine quotidienne retrouve sa logique complete.',
            wrongText: 'On peut repartir du tout premier geste du rituel.'
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const activePatientId = sessionStorage.getItem('activePatient') || 'marcel';
    const activePatientName = `${activePatientId.charAt(0).toUpperCase()}${activePatientId.slice(1)}`;
    const rounds = DAILY_PROFILES[activePatientId] || DAILY_PROFILES.marcel;

    localStorage.setItem('selectedPatient', activePatientName);
    sessionStorage.setItem('mc_lastSessionTitle', 'Associations du Quotidien');
    sessionStorage.setItem('mc_lastSessionNote', 'Repères concrets, contexte naturel et petite routine du quotidien.');
    if (!sessionStorage.getItem('mc_sessionStart')) {
        sessionStorage.setItem('mc_sessionStart', Date.now().toString());
    }

    const patientPill = document.getElementById('patient-pill');
    const counterEl = document.getElementById('question-counter');
    const activityTypeEl = document.getElementById('activity-type');
    const activityAxisEl = document.getElementById('activity-axis');
    const visualPanelEl = document.getElementById('visual-panel');
    const instructionEl = document.getElementById('game-instruction');
    const helperEl = document.getElementById('game-helper');
    const supportReassuranceEl = document.getElementById('support-reassurance');
    const supportPointsEl = document.getElementById('support-points');
    const choicesContainer = document.getElementById('choices-container');
    const feedbackEl = document.getElementById('feedback');
    const sequenceLane = document.getElementById('sequence-lane');
    const sequenceSlots = document.getElementById('sequence-slots');
    const skipButton = document.getElementById('btn-skip-round');

    let roundIndex = 0;
    let hintTimer = null;
    let resolveTimer = null;
    let activeSequence = [];
    let isLocked = false;

    if (patientPill) patientPill.textContent = activePatientName;

    function renderRound() {
        const round = rounds[roundIndex];
        isLocked = false;
        activeSequence = [];
        feedbackEl.hidden = true;

        counterEl.textContent = `Etape ${roundIndex + 1} / ${rounds.length}`;
        activityTypeEl.textContent = round.label;
        activityAxisEl.textContent = round.axis;
        instructionEl.textContent = round.instruction;
        helperEl.textContent = round.helper;
        supportReassuranceEl.textContent = round.reassurance;
        supportPointsEl.innerHTML = round.supportPoints.map((item) => `<li>${item}</li>`).join('');

        renderVisual(round.visual);
        renderChoices(round);
        startTimers();
    }

    function renderVisual(visual) {
        if (visual.type === 'image') {
            visualPanelEl.innerHTML = `
                <img
                    src="${DAILY_ASSET_PATH}${visual.src}"
                    alt="${visual.alt}"
                    class="focus-visual__image"
                >
            `;
            return;
        }

        visualPanelEl.innerHTML = `
            <div class="focus-visual__routine">
                <div class="focus-visual__icon" aria-hidden="true">☕</div>
                <h3 class="focus-visual__title">${visual.title}</h3>
                <p class="focus-visual__note">${visual.note}</p>
            </div>
        `;
    }

    function renderChoices(round) {
        choicesContainer.innerHTML = '';
        clearSequenceLane();

        if (round.type === 'sequence') {
            sequenceLane.hidden = false;
            sequenceSlots.innerHTML = round.steps
                .map(() => `<div class="sequence-slot">En attente</div>`)
                .join('');
            choicesContainer.className = 'choices choices--four';

            shuffle(round.steps).forEach((step) => {
                const button = document.createElement('button');
                button.className = 'choice-btn choice-btn--sequence';
                button.type = 'button';
                button.dataset.stepId = step.id;
                button.textContent = step.label;
                button.addEventListener('click', () => handleSequenceClick(step, button, round));
                choicesContainer.appendChild(button);
            });
            return;
        }

        sequenceLane.hidden = true;
        choicesContainer.className = `choices ${round.layout}`;

        shuffle(round.choices).forEach((choice) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.type = 'button';
            button.dataset.correct = choice.isCorrect ? 'true' : 'false';
            button.innerHTML = `
                <img src="${DAILY_ASSET_PATH}${choice.file}" alt="${choice.label}" class="choice-btn__img">
                <span class="choice-label">${choice.label}</span>
            `;
            button.addEventListener('click', () => handleChoice(choice, button));
            choicesContainer.appendChild(button);
        });
    }

    function clearSequenceLane() {
        sequenceSlots.innerHTML = '';
    }

    function handleChoice(choice, button) {
        if (isLocked) return;
        isLocked = true;
        stopTimers();

        const buttons = [...choicesContainer.querySelectorAll('.choice-btn')];
        buttons.forEach((node) => {
            node.disabled = true;
            node.classList.remove('hint-pulse');
        });

        if (choice.isCorrect) {
            button.classList.add('correct-highlight');
            showFeedback(choice.feedback);
        } else {
            const correctButton = buttons.find((node) => node.dataset.correct === 'true');
            if (correctButton) correctButton.classList.add('correct-highlight');
            button.classList.add('wrong-soft');
            showFeedback(choice.feedback);
        }

        window.setTimeout(nextRound, 2200);
    }

    function handleSequenceClick(step, button, round) {
        if (isLocked) return;

        const expectedStep = round.steps[activeSequence.length];
        button.classList.remove('hint-pulse');
        stopTimers();

        if (step.id === expectedStep.id) {
            activeSequence.push(step.id);
            button.disabled = true;
            button.classList.add('selected-step');
            updateSequenceLane(round.steps);

            if (activeSequence.length === round.steps.length) {
                isLocked = true;
                showFeedback(round.successText);
                window.setTimeout(nextRound, 2200);
                return;
            }

            showFeedback('Oui, ce geste vient naturellement a ce moment du rituel.');
            startTimers();
            return;
        }

        button.classList.add('wrong-soft');
        showFeedback(round.wrongText);
        isLocked = true;

        window.setTimeout(() => {
            const targetButton = choicesContainer.querySelector(`[data-step-id="${expectedStep.id}"]`);
            if (targetButton) {
                targetButton.disabled = true;
                targetButton.classList.add('selected-step');
            }
            activeSequence.push(expectedStep.id);
            updateSequenceLane(round.steps);
            isLocked = false;

            if (activeSequence.length === round.steps.length) {
                isLocked = true;
                showFeedback(round.successText);
                window.setTimeout(nextRound, 2200);
                return;
            }

            startTimers();
        }, 950);
    }

    function updateSequenceLane(steps) {
        sequenceSlots.innerHTML = steps.map((step, index) => {
            const isFilled = activeSequence[index];
            const label = isFilled
                ? steps.find((item) => item.id === activeSequence[index]).label
                : 'Etape a venir';

            return `
                <div class="sequence-slot${isFilled ? ' is-filled' : ''}">
                    ${label}
                </div>
            `;
        }).join('');
    }

    function showHint() {
        const round = rounds[roundIndex];

        if (round.type === 'sequence') {
            const expectedStep = round.steps[activeSequence.length];
            const targetButton = choicesContainer.querySelector(`[data-step-id="${expectedStep.id}"]`);
            if (targetButton) targetButton.classList.add('hint-pulse');
            showFeedback('On peut repartir du prochain geste le plus evident.');
            return;
        }

        const correctButton = choicesContainer.querySelector('[data-correct="true"]');
        if (correctButton) correctButton.classList.add('hint-pulse');
        showFeedback('Le repere le plus utile est doucement mis en avant.');
    }

    function autoSupport() {
        const round = rounds[roundIndex];
        if (isLocked) return;

        const buttons = [...choicesContainer.querySelectorAll('.choice-btn')];
        buttons.forEach((button) => {
            button.disabled = true;
            button.classList.remove('hint-pulse');
        });

        if (round.type === 'sequence') {
            activeSequence = round.steps.map((step) => step.id);
            updateSequenceLane(round.steps);
            showFeedback('MemoClair remet doucement l ordre en place pour poursuivre sans tension.');
        } else {
            const correctButton = buttons.find((button) => button.dataset.correct === 'true');
            if (correctButton) correctButton.classList.add('correct-highlight');
            showFeedback('MemoClair met le bon repere en avant pour continuer doucement.');
        }

        isLocked = true;
        window.setTimeout(nextRound, 2400);
    }

    function nextRound() {
        stopTimers();
        roundIndex += 1;

        if (roundIndex >= rounds.length) {
            window.location.href = 'game-end.html';
            return;
        }

        renderRound();
    }

    function startTimers() {
        stopTimers();
        hintTimer = window.setTimeout(showHint, 12000);
        resolveTimer = window.setTimeout(autoSupport, 23000);
    }

    function stopTimers() {
        window.clearTimeout(hintTimer);
        window.clearTimeout(resolveTimer);
    }

    function showFeedback(message) {
        feedbackEl.textContent = message;
        feedbackEl.hidden = false;
    }

    skipButton.addEventListener('click', () => {
        stopTimers();
        showFeedback('Tres bien. On laisse cette etape et on passe a la suivante sans insister.');
        window.setTimeout(nextRound, 1800);
    });

    renderRound();
});

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}
