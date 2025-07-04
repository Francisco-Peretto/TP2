export const FAVORITES_KEY = "favoritePokemons";

// Obtener lista de favoritos
export function getFavorites() {
  const favorites = localStorage.getItem(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
}

// Alternar estado de favorito
export function toggleFavorite(pokemonId) {
  const id = pokemonId.toString();
  const favorites = getFavorites();
  const index = favorites.indexOf(id);

  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return index === -1;
}

// Verificar si es favorito
export function isFavorite(pokemonId) {
  return getFavorites().includes(pokemonId.toString());
}

// Actualizar icono de favoritos en el header
export function updateFavoritesIcon() {
  const icon = document.getElementById("favorites-toggle");
  if (!icon) return;

  const hasFavorites = getFavorites().length > 0;
  icon.innerHTML = hasFavorites
    ? '<i class="bi bi-star-fill text-warning"></i>'
    : '<i class="bi bi-star"></i>';
}

// Actualizar instancias de estrellas en las cards
export function updateAllFavoriteIcons() {
  document.querySelectorAll(".btn-favorite").forEach((btn) => {
    const pokemonId = btn.dataset.id;
    const icon = btn.querySelector("i");
    if (!icon) return;

    if (isFavorite(pokemonId)) {
      icon.classList.remove("bi-star", "text-secondary");
      icon.classList.add("bi-star-fill", "text-warning");
    } else {
      icon.classList.remove("bi-star-fill", "text-warning");
      icon.classList.add("bi-star", "text-secondary");
    }
  });
}

// Exportar la API
export default {
  getFavorites,
  toggleFavorite,
  isFavorite,
  updateFavoritesIcon,
  updateAllFavoriteIcons,
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  updateFavoritesIcon();
  const favoritesToggle = document.getElementById("favorites-toggle");
  if (favoritesToggle) {
    favoritesToggle.addEventListener("click", () => {
      if (window.toggleFavoritesFilter) {
        window.toggleFavoritesFilter();
      }
    });
  }
  updateAllFavoriteIcons();
});
