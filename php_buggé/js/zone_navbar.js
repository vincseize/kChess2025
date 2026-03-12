document.addEventListener("DOMContentLoaded", function () {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const dropdownToggle = document.getElementById("categoriesDropdown"); // Le bouton principal du dropdown

    // Récupérer la zone actuelle depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentZone = urlParams.get("zone");

    // Liste des zones valides
    const zonesAutorisees = ["mqt", "glp"];

    // Vérifie si la zone actuelle est valide et met à jour le texte du bouton dropdown
    if (currentZone && zonesAutorisees.includes(currentZone) && dropdownToggle) {
        const selectedItem = dropdownMenu.querySelector(`[data-zone="${currentZone}"]`);
        if (selectedItem) {
            dropdownToggle.textContent = selectedItem.textContent; // Met à jour le texte affiché
        }
    }

    if (dropdownMenu) {
        dropdownMenu.addEventListener("click", function (event) {
            const clickedItem = event.target.closest(".dropdown-item"); // Vérifie si un élément `.dropdown-item` a été cliqué
            
            if (clickedItem) {
                event.preventDefault(); // Empêche le lien de recharger la page immédiatement
                
                const zone = clickedItem.getAttribute("data-zone"); // Récupère la valeur de data-zone

                // Vérification de sécurité : s'assurer que data-zone existe et est une valeur autorisée
                if (zone && zonesAutorisees.includes(zone)) {
                    // Construit une nouvelle URL propre avec uniquement le paramètre `zone`
                    const newUrl = window.location.origin + window.location.pathname + "?zone=" + encodeURIComponent(zone);

                    window.location.href = newUrl; // Recharge la page avec la nouvelle URL sécurisée
                } else {
                    console.warn("Zone invalide ou absente : " + zone);
                }
            }
        });
    }
});
