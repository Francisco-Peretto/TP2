import { getStat } from "./utils.js";
import Favorites from './favorites.js';

const pokemonPerPage = 30;
const total = 151;
let allPokemon = [];
let currentPage = 1;
let selectedTypes = [];
let currentSort = "id";
let pokemonGrid, searchInput, suggestionsList, pagination;
let showFavoritesOnly = false;

async function fetchAllPokemon() {
  let savedPokemon = localStorage.getItem("pokemonData");
  if (savedPokemon) {
    return JSON.parse(savedPokemon);
  }

  let pokemonList = [];
  for (let id = 1; id <= total; id++) {
    const pokemon = await fetchPokemon(id);
    if (pokemon) pokemonList.push(pokemon);
  }

  const pokemonToStore = pokemonList.map((p) => ({
    id: p.id,
    name: p.name,
    types: p.types,
    stats: p.stats,
    height: p.height,
    weight: p.weight,
  }));

  localStorage.setItem("pokemonData", JSON.stringify(pokemonToStore));
  return pokemonList;
}

async function fetchPokemon(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error(`Pokémon #${id} no encontrado`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function getPokemonSprite(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    return data.sprites.front_default;
  } catch (error) {
    return "fallback-sprite.png";
  }
}

function getAllUniqueTypes(pokemonList) {
  const types = new Set();
  pokemonList.forEach((pokemon) => {
    pokemon.types.forEach((type) => {
      types.add(type.type.name);
    });
  });
  return Array.from(types).sort();
}

function renderTypeFilters(types) {
  const container = document.getElementById("type-checkboxes");
  container.innerHTML = "";

  types.forEach((type) => {
    const filterId = `type-${type}`;
    const filterElement = document.createElement("div");
    filterElement.className = "type-filter-item form-check";
    filterElement.classList.add(`type-${type}`);
    filterElement.innerHTML = `<input type="checkbox" class="form-check-input" id="${filterId}" value="${type}">
      <label class="form-check-label text-capitalize" for="${filterId}">
        ${type}
      </label>`;
    container.appendChild(filterElement);
  });

  addTypeStyles(types);

  document.querySelectorAll('#type-checkboxes input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedTypes.push(e.target.value);
      } else {
        selectedTypes = selectedTypes.filter((t) => t !== e.target.value);
      }
      applyFilters();
    });
  });
}

function addTypeStyles(types) {
  const oStyles = document.querySelectorAll("style[data-type-styles]");
  oStyles.forEach((style) => style.remove());
  types.forEach((type) => {
    const color = getTypeColor(type);
    const style = document.createElement("style");
    style.setAttribute("data-type-styles", "true");

    style.textContent = `.type-${type} {
        border-color: ${color};
      }
      .type-${type} .form-check-input {
        border-color: ${color};
      }
      .type-${type} .form-check-input:checked {
        background-color: ${color};
        border-color: ${color};
      }`;
    document.head.appendChild(style);
  });
}

function getTypeColor(type) {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return typeColors[type.toLowerCase()] || "#777";
}

function sortPokemon(list, stat) {
  return [...list].sort((a, b) => {
    switch (stat) {
      case "name":
        return a.name.localeCompare(b.name);
      case "attack":
        return getStat(b, "attack") - getStat(a, "attack");
      case "defense":
        return getStat(b, "defense") - getStat(a, "defense");
      case "speed":
        return getStat(b, "speed") - getStat(a, "speed");
      default:
        return a.id - b.id;
    }
  });
}

function applyFilters(forcePageReset = false) {
  const searchTerm = searchInput.value.toLowerCase();
  let filteredPokemon = allPokemon;

  if (searchTerm.length > 0) {
    filteredPokemon = filteredPokemon.filter((p) =>
      p.name.toLowerCase().includes(searchTerm)
    );
  }

  if (selectedTypes.length > 0) {
    filteredPokemon = filteredPokemon.filter((p) =>
      p.types.some((t) => selectedTypes.includes(t.type.name))
    );
  }

  if (showFavoritesOnly) {
    const favorites = Favorites.getFavorites();
    filteredPokemon = filteredPokemon.filter(p => 
      favorites.includes(p.id.toString())
    );
  }

  filteredPokemon = sortPokemon(filteredPokemon, currentSort);

  const maxPage = Math.ceil(filteredPokemon.length / pokemonPerPage) || 1;
  if (currentPage > maxPage || forcePageReset) {
    currentPage = 1;
  }

  updateActivePage();
  renderPokemonGrid(filteredPokemon, currentPage);
}

async function renderPokemonGrid(pokemonList, page = 1) {
  if (!pokemonGrid) return;

  const newGrid = pokemonGrid.cloneNode(false);
  pokemonGrid.parentNode.replaceChild(newGrid, pokemonGrid);
  pokemonGrid = newGrid;

  if (pokemonList.length === 0) {
    pokemonGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <h4>No se encontraron Pokémon</h4>
        <p>Intenta ajustar tus filtros</p>
      </div>`;
    return;
  }

  let start = (page - 1) * pokemonPerPage;
  let end = page * pokemonPerPage;
  let pokemonToShow = pokemonList.slice(start, end);

  let cardsHTML = "";
  for (const pokemon of pokemonToShow) {
    cardsHTML += await createPokemonCard(pokemon);
  }

  pokemonGrid.innerHTML = cardsHTML || `
    <div class="col-12 text-center py-5">
      <h4>No hay resultados para esta página</h4>
    </div>`;
}

function handleFavoriteClick(e, btn) {
  e.preventDefault();
  e.stopPropagation();

  const id = btn.dataset.id;
  const isNowFavorite = Favorites.toggleFavorite(id);

  // Actualizar solo el botón afectado
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = isNowFavorite 
      ? "bi bi-star-fill text-warning" 
      : "bi bi-star text-secondary";
  }

  // Re-filtrar favoritos
  if (showFavoritesOnly) {
    currentPage = 1;
    applyFilters(true);
  }

  Favorites.updateFavoritesIcon();
}

async function createPokemonCard(pokemon) {
  const spriteUrl = await getPokemonSprite(pokemon.id);
  const isFav = Favorites.isFavorite(pokemon.id.toString());

  return `<div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-4">
    <div class="pokemon-card-container h-100">
      <div class="pokemon-card">
        <div class="pokemon-card-img-container">
          <img src="${spriteUrl}" class="card-img-top" alt="${pokemon.name}">
        </div>
        <div class="card-body text-center">
          <h5 class="card-title text-capitalize">${pokemon.name}</h5>
          <p class="text-muted mb-2">#${pokemon.id.toString().padStart(3, '0')}</p>
          <div class="mt-auto">
            <a href="pokemon.html?id=${pokemon.id}" class="btn btn-sm btn-outline-primary mb-2">Ver detalles</a>
            <button class="btn btn-favorite" data-id="${pokemon.id}">
              <i class="bi ${isFav ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function setupSearch() {
  searchInput.addEventListener("input", () => {
    applyFilters();
  });
}

function showSuggestions(matches) {
  suggestionsList.innerHTML = "";

  if (matches.length === 0) {
    suggestionsList.classList.add("d-none");
    return;
  }

  matches.forEach((pokemon) => {
    const button = document.createElement("button");
    button.className = "list-group-item list-group-item-action text-capitalize";
    button.textContent = `${pokemon.name} (#${pokemon.id})`;

    button.addEventListener("click", () => {
      window.location.href = `pokemon.html?id=${pokemon.id}`;
    });

    suggestionsList.appendChild(button);
  });

  suggestionsList.classList.remove("d-none");
}

function setupPagination() {
  pagination.addEventListener("click", (e) => {
    e.preventDefault();

    const isDisabled = e.target.classList.contains("disabled") || 
                      e.target.parentElement.classList.contains("disabled");
    if (isDisabled) {
      return;
    }

    const pageLink = e.target.closest(".page-link");
    if (!pageLink) {
      return;
    }

    if (pageLink.id === "prev") {
      currentPage = Math.max(1, currentPage - 1);
    } else if (pageLink.id === "next") {
      currentPage = Math.min(6, currentPage + 1);
    } else if (pageLink.dataset.page) {
      currentPage = parseInt(pageLink.dataset.page);
    }

    applyFilters();
  });
}

function updateActivePage() {
  document.querySelectorAll(".page-item").forEach((item) => {
    item.classList.remove("active");
    const pageLink = item.querySelector(".page-link");
    if (pageLink && pageLink.dataset.page == currentPage) {
      item.classList.add("active");
    }
  });

  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const prevListItem = prevBtn.closest(".page-item");
  const nextListItem = nextBtn.closest(".page-item");

  prevListItem.classList.toggle("disabled", currentPage === 1);
  nextListItem.classList.toggle("disabled", currentPage === 6);
}

function setupSorting() {
  const sortButton = document.querySelector(".dropdown-toggle");
  sortButton.textContent = `Ordenar por ${currentSort === "id" ? "ID" : currentSort}`;

  document.querySelectorAll(".dropdown-item[data-sort]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      currentSort = e.target.dataset.sort;
      sortButton.textContent = `Ordenar por ${currentSort === "id" ? "ID" : currentSort}`;
      applyFilters();
    });
  });
}

async function init() {
  try {
    // DOM
    pokemonGrid = document.getElementById("pokemon-grid");
    searchInput = document.getElementById("search");
    suggestionsList = document.getElementById("suggestions");
    pagination = document.querySelector(".pagination");

    if (!pokemonGrid || !searchInput || !suggestionsList || !pagination) {
      throw new Error("Elementos del DOM no encontrados");
    }

    // event listeners
    document.addEventListener('click', (e) => {
      const favoriteBtn = e.target.closest('.btn-favorite');
      if (favoriteBtn) {
        handleFavoriteClick(e, favoriteBtn);
      }
    });

    const typeFilters = document.getElementById("type-filters");
    const collapseInstance = new bootstrap.Collapse(typeFilters, { 
      toggle: false
    });

    document.getElementById("toggle-type-filter").addEventListener("click", (e) => {
      e.preventDefault();
      collapseInstance.toggle();
      updateFilterArrow();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".filter-container")) {
        collapseInstance.hide();
        updateFilterArrow();
      }
    });

    function updateFilterArrow() {
      const arrow = document.getElementById("toggle-type-filter");
      if (arrow) {
        arrow.innerHTML = typeFilters.classList.contains("show") 
          ? "Filtrar por tipo ▲" 
          : "Filtrar por tipo ▼";
      }
    }

    // Configurar toggle de favoritos
    document.getElementById("favorites-toggle").addEventListener("click", () => {
      showFavoritesOnly = !showFavoritesOnly;
      applyFilters(true);
      Favorites.updateFavoritesIcon();
    });

    // Cargar Pokémon
    allPokemon = await fetchAllPokemon();

    if (!Array.isArray(allPokemon)) {
      localStorage.removeItem("pokemonData");
      allPokemon = await fetchAllPokemon();
    }

    // Filtros de tipo
    const uniqueTypes = getAllUniqueTypes(allPokemon);
    renderTypeFilters(uniqueTypes);

    // Ordenamiento
    setupSorting();

    // Configurar búsqueda y paginación
    setupSearch();
    setupPagination();

    // Renderizar grid inicial
    renderPokemonGrid(allPokemon, 1);

    // Actualizar iconos de favoritos
    Favorites.updateFavoritesIcon();
    Favorites.updateAllFavoriteIcons();

  } catch (error) {
    console.error("Error en init:", error);
    if (pokemonGrid) {
      pokemonGrid.innerHTML = `
        <div class="col-12 text-center text-danger py-5">
          <h3>Error al cargar los Pokémon</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()">Reintentar</button>
        </div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", init);