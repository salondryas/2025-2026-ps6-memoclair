// pages/games/game-b.js

document.addEventListener('DOMContentLoaded', () => {

    // On récupère le patient actif pour adapter les choix personnels
    let activePatientId = sessionStorage.getItem('activePatient') || 'marcel';
    const activePatientName = activePatientId.charAt(0).toUpperCase() + activePatientId.slice(1);

    // --- 1. BASE DE DONNÉES (Images .png) ---
    const questions = [
        {
            imageSrc: "../../assets/pictuers/memory/photo_chien.png",
            question: "Quel est cet animal familier ?",
            choices: [
                { label: "Un chien", isCorrect: true },
                { label: "Un chat", isCorrect: false }
            ]
        },
        {
            imageSrc: "../../assets/pictuers/memory/photo_radio.png",
            question: "Avec quoi écoutiez-vous les nouvelles autrefois ?",
            choices: [
                { label: "Une radio", isCorrect: true },
                { label: "Une télévision", isCorrect: false }
            ]
        },
        {
            imageSrc: "../../assets/pictuers/memory/photo_mariage.png",
            question: "C'est le mariage de qui ?",
            choices: [
                { label: `Moi (${activePatientName})`, isCorrect: true },
                { label: "Ma fille Isabelle", isCorrect: false }
            ]
        }
    ];

    const TOTAL_QUESTIONS = questions.length;
    let currentQuestionIndex = 0;

    // --- 2. SÉLECTION DES ÉLÉMENTS HTML ---
    const photoFrame = document.querySelector('.photo-frame');
    const questionEl = document.querySelector('.game-question');
    const choicesContainer = document.querySelector('.choices');
    const feedbackEl = document.getElementById('feedback');
    const counterEl = document.getElementById('counter');
    const btnPass = document.getElementById('btn-passer');

    // GESTION DU MODE DUO (Interface Codex)
    const params       = new URLSearchParams(window.location.search);
    const isDuo        = params.get('duo') === '1' || sessionStorage.getItem('duoMode') === 'true';
    const duoBadge     = document.getElementById('duo-badge');
    const caregiverBar = document.getElementById('caregiver-strip');

    if (isDuo) {
        if (duoBadge) duoBadge.hidden = false;
        if (caregiverBar) caregiverBar.hidden = false;
    }

    // Rotation des conseils aidant
    const hints = [
        '"Laissez-lui le temps de se souvenir…"',
        '"Montrez la photo de plus près si besoin."',
        '"Souriez, votre calme l\'aide à se concentrer."',
        '"Vous pouvez répéter la question doucement."',
    ];
    const hintEl = document.getElementById('caregiver-hint');
    if (hintEl) hintEl.textContent = hints[Math.floor(Math.random() * hints.length)];

    // --- 3. GESTION DES MINUTEURS (10s Indice / 20s Résolution) ---
    let hintTimer;
    let autoResolveTimer;

    function startTimers() {
        clearTimeout(hintTimer);
        clearTimeout(autoResolveTimer);

        // Indice visuel après 10 secondes
        hintTimer = setTimeout(() => { showHint(); }, 10000);

        // Auto-résolution après 20 secondes
        autoResolveTimer = setTimeout(() => { handleTimeOut(); }, 20000);
    }

    function showHint() {
        const correctBtn = document.querySelector('.choice-btn[data-correct="true"]');
        if (correctBtn) correctBtn.classList.add('hint-pulse');
        showFeedback("Indice : un petit effort, regardez bien... 💡");
    }

    function handleTimeOut() {
        const allBtns = document.querySelectorAll('.choice-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');

        const correctBtn = document.querySelector('.choice-btn[data-correct="true"]');
        if (correctBtn) {
            correctBtn.classList.remove('hint-pulse');
            correctBtn.classList.add('correct');
        }

        showFeedback("Prenons notre temps... c'était cette réponse. 🌿");
        setTimeout(nextQuestion, 3000);
    }

    // --- 4. LOGIQUE DU JEU ---
    function loadQuestion(index) {
        const data = questions[index];

        if (feedbackEl) feedbackEl.hidden = true;

        // Remplacement dynamique de l'image
        if (photoFrame) photoFrame.innerHTML = `<img src="${data.imageSrc}" alt="Souvenir" style="width: 100%; height: 100%; object-fit: contain;">`;

        if (questionEl) questionEl.textContent = data.question;
        if (counterEl) counterEl.textContent = `Question ${index + 1} / ${TOTAL_QUESTIONS}`;

        if (choicesContainer) choicesContainer.innerHTML = '';

        const shuffledChoices = data.choices.sort(() => Math.random() - 0.5);

        shuffledChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.setAttribute('data-correct', choice.isCorrect);
            btn.textContent = choice.label;

            btn.addEventListener('click', function() {
                if (document.querySelector('.choice-btn.correct')) return;

                clearTimeout(hintTimer);
                clearTimeout(autoResolveTimer);
                this.classList.remove('hint-pulse');

                const isCorrect = this.getAttribute('data-correct') === 'true';

                if (isCorrect) {
                    this.classList.add('correct');
                    showFeedback("Très bien ! C'est la bonne réponse. 🌿");
                } else {
                    this.classList.add('wrong');
                    const correctBtn = document.querySelector('.choice-btn[data-correct="true"]');
                    if(correctBtn) {
                        correctBtn.classList.remove('hint-pulse');
                        correctBtn.classList.add('correct');
                    }
                    showFeedback("D'accord, regardons ensemble : c'était plutôt ceci. 🌿");
                }

                setTimeout(nextQuestion, 3000);
            });

            if (choicesContainer) choicesContainer.appendChild(btn);
        });

        startTimers();
    }

    function showFeedback(msg) {
        if (feedbackEl) {
            feedbackEl.textContent = msg;
            feedbackEl.hidden = false;
        }
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= TOTAL_QUESTIONS) {
            window.location.href = 'game-end.html';
        } else {
            loadQuestion(currentQuestionIndex);
        }
    }

    if (btnPass) {
        btnPass.addEventListener('click', () => {
            clearTimeout(hintTimer);
            clearTimeout(autoResolveTimer);
            nextQuestion();
        });
    }

    // Lancement
    loadQuestion(0);
});