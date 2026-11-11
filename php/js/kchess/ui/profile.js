/**
 * js/ui/profile.js
 * Bootstrap : dispatch de l'init selon window.PROFILE_VIEW.
 */

document.addEventListener('DOMContentLoaded', () => {
    const view = window.PROFILE_VIEW || 'me';

    if (view === 'me' && typeof ProfilePage.initMeView === 'function') {
        ProfilePage.initMeView();
    } else if (view === 'players') {
        // ★ Si on a un ID FIDE dans l'URL, on affiche le profil direct
        if (window.PROFILE_TARGET_ID) {
            if (typeof ProfilePage.initDirectPlayerView === 'function') {
                ProfilePage.initDirectPlayerView(window.PROFILE_TARGET_ID);
            }
        } else {
            // Sinon, vue de recherche normale
            if (typeof ProfilePage.bindSearch === 'function') ProfilePage.bindSearch();
            if (typeof ProfilePage.renderHistory === 'function') ProfilePage.renderHistory();
            if (typeof ProfilePage.initGames === 'function') ProfilePage.initGames();
            if (typeof ProfilePage.initAddGame === 'function') ProfilePage.initAddGame();
            if (typeof ProfilePage.restoreLastPlayer === 'function') ProfilePage.restoreLastPlayer();
        }
    } else if (view === 'clubs' && typeof ProfilePage.initClubsView === 'function') {
        ProfilePage.initClubsView();
    }

    console.log(`👤 ProfilePage initialisée (vue: ${view})`);
});