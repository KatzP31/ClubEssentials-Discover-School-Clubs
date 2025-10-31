// ===== DOM ELEMENTS =====
const clubGrid = document.getElementById("clubGrid");
const pageNumbersSpan = document.getElementById("pageNumbers");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const favoritesContainer = document.getElementById("favoritesContainer");
const favToggle = document.getElementById("favToggle");
const favoritesDrawer = document.getElementById("favoritesDrawer");
const closeDrawer = document.getElementById("closeDrawer");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

// ===== GLOBAL STATE =====
let clubs = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let notes = JSON.parse(localStorage.getItem("notes")) || {};
let currentPage = 1;
const clubsPerPage = 6;

// ===== LOAD CLUBS =====
async function loadClubs() {
    try {
        const res = await fetch("clubs.json", { cache: "force-cache" });
        if (!res.ok) throw new Error("Failed to load clubs");
        clubs = await res.json();

        if ("requestIdleCallback" in window) {
            requestIdleCallback(() => preloadImages(clubs));
        } else {
            setTimeout(() => preloadImages(clubs), 100);
        }

        displayPage(currentPage, clubs);
    } catch (err) {
        console.error(err);
        clubGrid.innerHTML = "<p style='color:red;'>Failed to load clubs.</p>";
    }
}

// ===== PRELOAD IMAGES =====
function preloadImages(data) {
    data.forEach(club => {
        const img = new Image();
        img.src = club.image;
        img.loading = "lazy";
        img.decoding = "async";
    });
}

// ===== DISPLAY PAGE =====
function displayPage(page, list) {
    const start = (page - 1) * clubsPerPage;
    const end = start + clubsPerPage;
    const visible = list.slice(start, end);

    const fragment = document.createDocumentFragment();

    visible.forEach(club => {
        const isFav = favorites.includes(club.name);
        const noteText = notes[club.name] || "";

        const card = document.createElement("article");
        card.classList.add("card");
        card.innerHTML = `
      <img src="${club.image}" alt="${club.name}" loading="lazy" decoding="async">
      <div class="card-content">
        <h3>${club.name}</h3>
        <p>${club.description}</p>
        <div class="card-buttons">
          <button class="favorite-btn ${isFav ? "active" : ""}" data-name="${club.name}">
            ${isFav ? "❤️ Favorited" : "♡ Add to Favorites"}
          </button>
          <button class="note-btn" data-name="${club.name}">
            📝 ${noteText ? "Edit Note" : "Add Note"}
          </button>
          ${noteText ? `<button class="delete-note-btn" data-name="${club.name}">🗑️ Delete Note</button>` : ""}
        </div>
      </div>
    `;
        fragment.appendChild(card);
    });

    clubGrid.innerHTML = "";
    clubGrid.appendChild(fragment);

    document.querySelectorAll(".favorite-btn").forEach(btn =>
        btn.addEventListener("click", toggleFavorite)
    );
    document.querySelectorAll(".note-btn").forEach(btn =>
        btn.addEventListener("click", addNote)
    );
    document.querySelectorAll(".delete-note-btn").forEach(btn =>
        btn.addEventListener("click", deleteNote)
    );

    renderPagination(list);
    updateFavoritesDrawer();
}

// ===== FAVORITES =====
function toggleFavorite(e) {
    const name = e.target.dataset.name;
    if (favorites.includes(name)) {
        favorites = favorites.filter(n => n !== name);
    } else {
        favorites.push(name);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayPage(currentPage, clubs);
}

function updateFavoritesDrawer() {
    favoritesContainer.innerHTML = favorites.length
        ? favorites
            .map(name => {
                const club = clubs.find(c => c.name === name);
                if (!club) return "";
                const note = notes[name] ? `<p class="note">📝 ${notes[name]}</p>` : "";
                return `
            <div class="fav-card">
              <img src="${club.image}" alt="${club.name}" loading="lazy" decoding="async">
              <div class="fav-info">
                <p class="fav-name">${club.name}</p>
                ${note}
                <div class="fav-actions">
                  <button class="edit-fav-btn" data-name="${name}">✏️ Edit Note</button>
                  <button class="delete-fav-btn" data-name="${name}">🗑️ Remove</button>
                </div>
              </div>
            </div>
          `;
            })
            .join("")
        : "<p>No favorites yet.</p>";

    document.querySelectorAll(".edit-fav-btn").forEach(btn =>
        btn.addEventListener("click", editNoteFromDrawer)
    );
    document.querySelectorAll(".delete-fav-btn").forEach(btn =>
        btn.addEventListener("click", deleteFavorite)
    );
}

// ===== NOTES =====
function addNote(e) {
    const name = e.target.dataset.name;
    const note = prompt(`Add a note for ${name}:`, notes[name] || "");
    if (note !== null) {
        notes[name] = note.trim();
        localStorage.setItem("notes", JSON.stringify(notes));
        displayPage(currentPage, clubs);
    }
}

function editNoteFromDrawer(e) {
    const name = e.target.dataset.name;
    const newNote = prompt(`Edit your note for ${name}:`, notes[name] || "");
    if (newNote !== null) {
        notes[name] = newNote.trim();
        localStorage.setItem("notes", JSON.stringify(notes));
        updateFavoritesDrawer();
        displayPage(currentPage, clubs);
    }
}

function deleteNote(e) {
    const name = e.target.dataset.name;
    if (confirm(`Delete your note for ${name}?`)) {
        delete notes[name];
        localStorage.setItem("notes", JSON.stringify(notes));
        displayPage(currentPage, clubs);
    }
}

// ===== DELETE FAVORITE =====
function deleteFavorite(e) {
    const name = e.target.dataset.name;
    if (confirm(`Remove ${name} from favorites?`)) {
        favorites = favorites.filter(f => f !== name);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        updateFavoritesDrawer();
        displayPage(currentPage, clubs);
    }
}

// ===== PAGINATION =====
function renderPagination(list) {
    const totalPages = Math.ceil(list.length / clubsPerPage);
    const fragment = document.createDocumentFragment();
    pageNumbersSpan.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
            currentPage = i;
            displayPage(currentPage, list);
        });
        fragment.appendChild(btn);
    }

    pageNumbersSpan.appendChild(fragment);
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage, clubs);
    }
});

nextPageBtn.addEventListener("click", () => {
    if (currentPage < Math.ceil(clubs.length / clubsPerPage)) {
        currentPage++;
        displayPage(currentPage, clubs);
    }
});

// ===== SEARCH =====
let searchTimeout;
function handleSearch() {
    const q = searchInput.value.trim().toLowerCase();
    const results = clubs.filter(c => c.name.toLowerCase().includes(q));
    displayPage(1, results);
}

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 250);
});

searchBtn.addEventListener("click", handleSearch);

// ===== DRAWER =====
favToggle.addEventListener("click", () => {
    favoritesDrawer.classList.add("open");
    favToggle.setAttribute("aria-expanded", "true");
});

closeDrawer.addEventListener("click", () => {
    favoritesDrawer.classList.remove("open");
    favToggle.setAttribute("aria-expanded", "false");
});

// ===== MENU TOGGLE =====
menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", loadClubs);
