import {
  getStat,
  convertHeight,
  convertWeight,
  getTypeColor,
} from "./utils.js";
import Favorites from './favorites.js';


const urlParams = new URLSearchParams(window.location.search);
const pokemonId = urlParams.get("id");
const nameText = document.getElementById("name-text");
const pokemonImage = document.getElementById("pokemon-image");
const pokemonIdElement = document.getElementById("pokemon-id");
const pokemonTypes = document.getElementById("pokemon-types");
const pokemonStats = document.getElementById("pokemon-stats");
const pokemonHeight = document.getElementById("pokemon-height");
const pokemonWeight = document.getElementById("pokemon-weight");
const favoriteBtn = document.getElementById("detail-favorite");

// Fetch de pokémon por ID
async function fetchPokemonDetails(id) {
  try {
    const savedPokemon = JSON.parse(localStorage.getItem("pokemonData"));
    const localPokemon = savedPokemon?.find((p) => p.id === parseInt(id));

    if (localPokemon) {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) throw new Error("Pokémon no encontrado");
      const apiData = await response.json();
      return {
        ...localPokemon,
        sprites: apiData.sprites,
      };
    }

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error("Pokémon no encontrado");
    return await response.json();
  } catch (error) {
    console.error(`Error al cargar Pokémon #${id}:`, error);
    showError();
    return null;
  }
}

// Detalles del Pokémon
function renderPokemonDetails(pokemon) {
  // Color de fondo según el tipo
  const typeColors = pokemon.types.map(t => getTypeColor(t.type.name));
  const detailCard = document.querySelector('.card');

  detailCard.classList.add('pokemon-detail-card');
  if (pokemon.types.length === 1) {
    detailCard.classList.add('single-type');
  }

  detailCard.style.setProperty('--type-color-1', typeColors[0]);
  detailCard.style.setProperty('--type-color-2', typeColors[1] || typeColors[0]);

  nameText.textContent = pokemon.name.toUpperCase();
  pokemonIdElement.textContent = `#${pokemon.id.toString().padStart(3, "0")}`;

  pokemonImage.src =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  pokemonTypes.innerHTML = pokemon.types
    .map((type) => {
      const color = getTypeColor(type.type.name);
      return `<span class="badge p-2 me-2" style="background-color: ${color}">${type.type.name.toUpperCase()}</span>`;
    })
    .join("");

  const statsToShow = [
    { name: "hp", label: "HP" },
    { name: "attack", label: "ATAQUE" },
    { name: "defense", label: "DEFENSA" },
    { name: "special-attack", label: "ATAQUE ESP." },
    { name: "special-defense", label: "DEFENSA ESP." },
    { name: "speed", label: "VELOCIDAD" },
  ];

  pokemonStats.innerHTML = statsToShow
    .map((stat) => {
      const value = getStat(pokemon, stat.name);
      return `
        <div class="mb-2">
          <p class="mb-1"><strong>${stat.label}:</strong> ${value}</p>
          <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: ${Math.min(
              100,
              value
            )}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  pokemonHeight.textContent = convertHeight(pokemon.height);
  pokemonWeight.textContent = convertWeight(pokemon.weight);

  setupFavoriteButton(pokemon.id);
  setupIdNavigation();
}

// Configurar botón de favoritos
function setupFavoriteButton(pokemonId) {
  if (!favoriteBtn) {
    console.error("Botón de favoritos no encontrado");
    return;
  }

  favoriteBtn.dataset.id = pokemonId;
  updateFavoriteIcon();

  favoriteBtn.addEventListener("click", function() {
    const id = this.dataset.id;
    const isNowFavorite = Favorites.toggleFavorite(id);
    updateFavoriteIcon();
    Favorites.updateFavoritesIcon();
  });

  function updateFavoriteIcon() {
    const icon = favoriteBtn.querySelector("i");
    if (!icon) return;

    const isFav = Favorites.isFavorite(pokemonId);
    icon.className = isFav 
      ? "bi bi-star-fill text-warning fs-3" 
      : "bi bi-star text-secondary fs-3";
  }
}

// Mostrar error
function showError() {
  if (nameText) nameText.textContent = "¡Error!";
  if (pokemonTypes) {
    pokemonTypes.innerHTML =
      '<p class="text-danger">No se pudo cargar el Pokémon.</p>';
  }
}

// Configurar navegación por ID
function setupIdNavigation() {
  document.getElementById("prev-id")?.addEventListener("click", () => {
    const prevId = Math.max(1, parseInt(pokemonId) - 1);
    window.location.href = `pokemon.html?id=${prevId}`;
  });

  document.getElementById("next-id")?.addEventListener("click", () => {
    const nextId = Math.min(151, parseInt(pokemonId) + 1);
    window.location.href = `pokemon.html?id=${nextId}`;
  });
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  if (!pokemonId) {
    showError();
    return;
  }

  const pokemon = await fetchPokemonDetails(pokemonId);
  if (pokemon) {
    renderPokemonDetails(pokemon);
  }
});