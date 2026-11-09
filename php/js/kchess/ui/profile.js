/**
 * js/ui/profile.js
 * Bootstrap : dispatch de l'init selon window.PROFILE_VIEW.
 * Dépend de profile-core.js, profile-me.js, profile-players.js, profile-clubs.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const view = window.PROFILE_VIEW || 'me';

    // Badges des levels + historique : visibles dans toutes les vues
    if (typeof ProfilePage.renderHeroBadges === 'function') ProfilePage.renderHeroBadges();
    if (view !== 'players' && typeof ProfilePage.renderHistory === 'function') ProfilePage.renderHistory();

    if (view === 'me' && typeof ProfilePage.initMeView === 'function') {
        ProfilePage.initMeView();
    } else if (view === 'players') {
        if (typeof ProfilePage.bindSearch === 'function') ProfilePage.bindSearch();
        if (typeof ProfilePage.renderHistory === 'function') ProfilePage.renderHistory();
        if (typeof ProfilePage.initKnownPlayers === 'function') ProfilePage.initKnownPlayers();
        if (typeof ProfilePage.initGames === 'function') ProfilePage.initGames();
        if (typeof ProfilePage.initAddGame === 'function') ProfilePage.initAddGame();
        if (typeof ProfilePage.restoreLastPlayer === 'function') ProfilePage.restoreLastPlayer();

        const params = new URLSearchParams(window.location.search);
        const fide = params.get('fide');
        if (fide && /^\d{4,10}$/.test(fide)) {
            const input = document.getElementById('profileSearchInput');
            if (input) { input.value = fide; input.dispatchEvent(new Event('input')); }
            if (typeof ProfilePage.loadPlayer === 'function') ProfilePage.loadPlayer(fide);
        }
    } else if (view === 'clubs' && typeof ProfilePage.initClubsView === 'function') {
        ProfilePage.initClubsView();
    }

    console.log(`👤 ProfilePage initialisée (vue: ${view})`);
});