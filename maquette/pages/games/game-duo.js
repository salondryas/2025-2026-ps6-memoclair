// pages/games/game-duo.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION DES 3 MANCHES (Vraies images .jpg) ---
    const rounds = [
        {
            // Manche 1 : NOUVELLE Photo de famille (photo_famille_duo.jpg)
            mediaHtml: `<img src="../../assets/game-daily/photo_famille_duo.jpg" alt="Photo de famille" class="shared-photo">`,
            question: "Qui est sur cette photo avec vous ?",
            choicesAidant: ["Isabelle (Moi) et Papa", "Isabelle (Moi) et mon oncle"],
            choicesAccueilli: ["Isabelle et moi", "Isabelle et mon frère"],
            feedbackAgree: "C'est bien Isabelle et vous sur cette belle photo !"
        },
        {
            // Manche 2 : Audio (Charles Aznavour - La Bohème)
            mediaHtml: `
                <div class="audio-container">
                    <span style="font-size: 4rem;" aria-hidden="true">🎵</span>
                    <audio controls src="../../assets/audio/la-boheme.mp3"></audio>
                    <p class="audio-hint">(Extrait : Charles Aznavour - La Bohème)</p>
                </div>`,
            question: "C'est la musique préférée de qui ?",
            choicesAidant: ["Ma musique (Isabelle)", "La musique de papa"],
            choicesAccueilli: ["La musique d'Isabelle", "Ma musique"],
            feedbackAgree: "Exactement ! Vous l'écoutiez tout le temps."
        },
        {
            // Manche 3 : Photo de MARIAGE ANCIENNE 60s
            mediaHtml: `<img src="../../assets/game-daily/photo_mariage.jpg" alt="Photo de mariage vintage" class="shared-photo">`,
            question: "C'est le mariage de qui ?",
            choicesAidant: ["Ton mariage, papa", "Mon mariage (Isabelle)"],
            choicesAccueilli: ["Mon mariage", "Le mariage d'Isabelle"],
            feedbackAgree: "Quel beau souvenir ! C'était une journée magnifique."
        }
    ];

    // --- 2. LOGIQUE DU JEU ---
    let currentRoundIndex = 0;
    let aidantChoice = null;
    let accueilliChoice = null;

    const mediaContainer = document.getElementById('media-container');
    const questionText = document.getElementById('question-text');
    const aidantButtons = document.querySelectorAll('#choices-aidant .choice-btn');
    const accueilliButtons = document.querySelectorAll('#choices-accueilli .choice-btn');
    const feedbackOverlay = document.getElementById('duo-feedback');
    const btnNext = document.getElementById('btn-next');

    function loadRound(index) {
        const roundData = rounds[index];

        if (mediaContainer) mediaContainer.innerHTML = roundData.mediaHtml;
        if (questionText) questionText.textContent = roundData.question;

        if (aidantButtons.length >= 2) {
            aidantButtons[0].textContent = roundData.choicesAidant[0];
            aidantButtons[1].textContent = roundData.choicesAidant[1];
        }

        if (accueilliButtons.length >= 2) {
            accueilliButtons[0].textContent = roundData.choicesAccueilli[0];
            accueilliButtons[1].textContent = roundData.choicesAccueilli[1];
        }

        aidantChoice = null;
        accueilliChoice = null;
        document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.waiting-msg').forEach(msg => msg.classList.add('hidden'));
        if (feedbackOverlay) feedbackOverlay.classList.add('hidden');
    }

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (feedbackOverlay && feedbackOverlay.classList.contains('hidden') === false) return;

            const player = this.getAttribute('data-player');
            const choiceIndex = this.getAttribute('data-index');

            document.querySelectorAll(`.choice-btn[data-player="${player}"]`).forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            if (player === 'aidant') {
                aidantChoice = choiceIndex;
                document.getElementById('wait-aidant').classList.remove('hidden');
            } else {
                accueilliChoice = choiceIndex;
                document.getElementById('wait-accueilli').classList.remove('hidden');
            }

            if (aidantChoice !== null && accueilliChoice !== null) {
                setTimeout(showFeedback, 600);
            }
        });
    });

    function showFeedback() {
        const roundData = rounds[currentRoundIndex];

        if (aidantChoice === accueilliChoice) {
            document.getElementById('feedback-icon').textContent = "🎉";
            document.getElementById('feedback-message').textContent = "On est d'accord !";
            document.getElementById('feedback-submessage').textContent = roundData.feedbackAgree;
        } else {
            document.getElementById('feedback-icon').textContent = "💬";
            document.getElementById('feedback-message').textContent = "Ah ! On en discute ?";
            document.getElementById('feedback-submessage').textContent = "Vous avez des souvenirs différents, profitez-en pour en parler !";
        }

        if (currentRoundIndex === rounds.length - 1) {
            btnNext.textContent = "Terminer le jeu";
        } else {
            btnNext.textContent = "Passer au souvenir suivant";
        }

        feedbackOverlay.classList.remove('hidden');
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            currentRoundIndex++;
            if (currentRoundIndex < rounds.length) {
                loadRound(currentRoundIndex);
            } else {
                window.location.href = 'game-end.html';
            }
        });
    }

    loadRound(0);
});