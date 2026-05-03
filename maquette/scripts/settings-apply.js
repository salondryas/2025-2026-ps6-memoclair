// scripts/settings-apply.js
// À inclure EN PREMIER dans chaque page HTML (avant tout autre script)
// Applique les préférences d'accessibilité sauvegardées sans flash visuel

(function () {
    var size     = localStorage.getItem('mc_fontSize') || 'normal';
    var contrast = localStorage.getItem('mc_contrast') === 'true';
    var html     = document.documentElement;

    html.setAttribute('data-font-size', size);
    if (contrast) html.setAttribute('data-contrast', 'high');
})();
