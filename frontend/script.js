const API_URL = 'https://coleccion-musical-backend.onrender.com';
let currentView = 'artists';
let currentArtist = null;
let allArtists = [];
let allAlbums = [];

// Cargar artistas al inicio
loadArtists();

// Botón para agregar artista o álbum
document.getElementById('addBtn').addEventListener('click', () => {
    if (currentView === 'artists') {
        openArtistModal();
    } else {
        openAlbumModal();
    }
});

// Botón para volver a la vista de artistas
document.getElementById('backBtn').addEventListener('click', () => {
    currentView = 'artists';
    currentArtist = null;
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('artistName').style.display = 'none';
    loadArtists();
});

// Referencias a elementos del document
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const content = document.getElementById("content");
const artistNameDiv = document.getElementById("artistName");

// Búsqueda de álbumes por nombre de artista
searchBtn.addEventListener("click", async () => {
    const nombre = searchInput.value.trim();
    if (!nombre) {
        content.innerHTML = '<div class="loading">Por favor ingrese un nombre de artista</div>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/artistas/nombre/${encodeURIComponent(nombre)}/albumes`);
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.data || !data.data.artista || !data.data.albumes) {
            throw new Error("Respuesta API inesperada");
        }

        displayAlbums(data.data.artista, data.data.albumes);

    } catch (err) {
        content.innerHTML = '<div class="loading">No se pueden cargar los álbumes.</div>';
        artistNameDiv.textContent = '';
    }
});

// Event listeners para botones de cancelar
document.getElementById('cancelArtistBtn').addEventListener('click', closeArtistModal);
document.getElementById('cancelAlbumBtn').addEventListener('click', closeAlbumModal);

// Envío del formulario de artista
document.getElementById("artistForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = document.getElementById("artistId").value;
    const nombre = document.getElementById("artistNombre").value.trim();
    const genero_musica = document.getElementById("artistGenre").value.trim();

    const payload = {};
    if (nombre) payload.nombre = nombre;
    if (genero_musica) payload.genero_musica = genero_musica;

    try {
        let response;
        if (id) {
            // Actualizar artista existente
            response = await fetch(`${API_URL}/api/artistas/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Crear nuevo artista
            response = await fetch(`${API_URL}/api/agregar_artista`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            alert(`Error: ${data.message || JSON.stringify(data)}`);
            return;
        }

        // Actualizar la lista de artistas
        if (id) {
            const idx = allArtists.findIndex(a => a.id_artista === parseInt(id));
            if (idx !== -1) {
                allArtists[idx] = data.data.artista;
            }
        } else {
            allArtists.push(data.data.artista);
        }

        // Recargar la vista
        displayArtists(allArtists);
        document.getElementById("artistModal").classList.remove("active");
    } catch (err) {
        console.error("Error de red:", err);
        alert("No se puede guardar el artista.");
    }
});

// Envío del formulario de álbum
document.getElementById('albumForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('albumId').value;
    const data = {
        titulo_album: document.getElementById('albumTitulo').value,
        anio_album: parseInt(document.getElementById('albumAnio').value),
        id_artista: parseInt(document.getElementById('albumArtista').value)
    };

    try {
        if (id) {
            // Actualizar álbum existente
            await fetch(`${API_URL}/api/albumes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Crear nuevo álbum
            await fetch(`${API_URL}/api/agregar_album`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        closeAlbumModal();
        if (currentArtist) {
            loadAlbums(currentArtist);
        }
    } catch (err) {
        alert('Error al guardar');
    }
});

// Cargar todos los artistas
async function loadArtists() {
    try {
        const res = await fetch(`${API_URL}/api/artistas`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Error HTTP! estado: ${res.status}`);
        }

        const json = await res.json();
        allArtists = json.data?.artistas || [];
        displayArtists(allArtists);
    } catch (err) {
        console.error(err);
        showError('Error al cargar los artistas');
    }
}

// Cargar álbumes de un artista específico
async function loadAlbums(artist) {
    try {
        const res = await fetch(`${API_URL}/api/artistas/nombre/${encodeURIComponent(artist.nombre)}/albumes`);
        const json = await res.json();
        allAlbums = json.data.albumes;
        displayAlbums(artist, allAlbums);
    } catch (err) {
        showError('Error al cargar los álbumes');
    }
}

// Mostrar lista de artistas en cartas
function displayArtists(artists) {
    const content = document.getElementById('content');
    if (artists.length === 0) {
        content.innerHTML = '<div class="loading">No se encontraron artistas</div>';
        return;
    }

    const html = `
                <div class="grid">
                    ${artists.map(a => `
                        <div class="card" onclick="viewArtist(${a.id_artista})">
                            <div class="card-title">${a.nombre}</div>
                            <div class="card-subtitle">${a.genero_musica}</div>
                            <div class="card-actions">
                                <button class="icon-btn edit-btn" onclick="event.stopPropagation(); editArtist(${a.id_artista})">  <img src="icons/edit.png" alt="edit" width="16" height="16"></button>
                                <button class="icon-btn delete-btn" onclick="event.stopPropagation(); deleteArtist(${a.id_artista})"> <img src="icons/trash.png" alt="delete" width="16" height="16"></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
    content.innerHTML = html;
}

// Mostrar lista de álbumes de un artista
function displayAlbums(artist, albums) {
    if (!albums || albums.length === 0) {
        content.innerHTML = '<div class="loading">No se encontraron álbumes</div>';
        return;
    }

    const html = `
        <button class="back-btn" id="backBtn">← Volver a artistas</button>
        <div class="grid">
            ${albums.map(a => `
                <div class="card">
                    <div class="card-title">${a.titulo_album}</div>
                    <div class="card-subtitle">${a.anio_album}</div>
                    <div class="card-actions">
                        <button class="icon-btn edit-btn" onclick="editAlbum(${a.id_album})"> <img src="icons/edit.png" alt="edit" width="16" height="16">️</button>
                        <button class="icon-btn delete-btn" onclick="deleteAlbum(${a.id_album})"> <img src="icons/trash.png" alt="edit" width="16" height="16"></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    content.innerHTML = html;
}

// Ver álbumes de un artista
function viewArtist(id) {
    const artist = allArtists.find(a => a.id_artista === id);
    if (artist) {
        currentView = 'albums';
        currentArtist = artist;
        document.getElementById('backBtn').style.display = 'block';
        loadAlbums(artist);
    }
}

// Abrir modal para editar artista
function editArtist(id) {
    const artist = allArtists.find(a => a.id_artista === id);
    if (artist) {
        document.getElementById('artistModalTitle').textContent = 'Modificar artista';
        document.getElementById('artistId').value = artist.id_artista;
        document.getElementById('artistNombre').value = artist.nombre;
        document.getElementById('artistGenre').value = artist.genero_musica;
        document.getElementById('artistModal').classList.add('active');
    }
}

// Eliminar artista
async function deleteArtist(id) {
    if (!confirm('¿Está seguro de que desea eliminar este artista?')) return;

    try {
        const res = await fetch(`${API_URL}/api/artistas/${id}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });

        let data;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            console.error("🔍 Status:", res.status);
            console.error("🔍 Respuesta API:", data);
            alert(`Error al eliminar: ${data?.message || res.statusText}`);
            return;
        }

        // Actualizar lista local y recargar vista
        allArtists = allArtists.filter(a => a.id_artista !== id);
        loadArtists();
    } catch (err) {
        console.error("Error deleteArtist:", err);
        alert("No se puede eliminar el artista (error de red).");
    }
}

// Abrir modal para editar álbum
function editAlbum(id) {
    const album = allAlbums.find(a => a.id_album === id);
    if (album) {
        document.getElementById('albumModalTitle').textContent = 'Modificar álbum';
        document.getElementById('albumId').value = album.id_album;
        document.getElementById('albumTitulo').value = album.titulo_album;
        document.getElementById('albumAnio').value = album.anio_album;
        loadArtistsForSelect(album.id_artista);
        document.getElementById('albumModal').classList.add('active');
    }
}

// Eliminar álbum
async function deleteAlbum(id) {
    if (!confirm('¿Está seguro de que desea eliminar este álbum?')) return;

    try {
        const res = await fetch(`${API_URL}/api/albumes/${id}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });

        let data;
        try {
            data = await res.json();
        } catch {
            data = null; // Si la respuesta no es JSON
        }

        if (!res.ok) {
            alert(`Error al eliminar: ${data?.message || res.statusText}`);
            return;
        }

        // Eliminar del cache local y actualizar vista
        allAlbums = allAlbums.filter(a => a.id_album !== id);
        displayAlbums(currentArtist, allAlbums);
    } catch (err) {
        console.error("Error deleteAlbum:", err);
        alert("No se puede eliminar el álbum (error de red).");
    }
}

// Abrir modal para agregar artista
function openArtistModal() {
    document.getElementById('artistModalTitle').textContent = 'Agregar artista';
    document.getElementById('artistForm').reset();
    document.getElementById('artistId').value = '';
    document.getElementById('artistModal').classList.add('active');
}

// Cerrar modal de artista
function closeArtistModal() {
    document.getElementById('artistModal').classList.remove('active');
}

// Abrir modal para agregar álbum
async function openAlbumModal() {
    document.getElementById('albumModalTitle').textContent = 'Agregar álbum';
    document.getElementById('albumForm').reset();
    document.getElementById('albumId').value = '';
    await loadArtistsForSelect(currentArtist ? currentArtist.id_artista : null);
    document.getElementById('albumModal').classList.add('active');
}

// Cerrar modal de álbum
function closeAlbumModal() {
    document.getElementById('albumModal').classList.remove('active');
}

// Cargar artistas en el selector del formulario de álbum
async function loadArtistsForSelect(selectedId = null) {
    try {
        const res = await fetch(`${API_URL}/api/artistas`);
        const json = await res.json();
        const select = document.getElementById('albumArtista');
        select.innerHTML = json.data.artistas.map(a =>
            `<option value="${a.id_artista}" ${a.id_artista === selectedId ? 'selected' : ''}>${a.nombre}</option>`
        ).join('');
    } catch (err) {
        console.error('Error al cargar los artistas');
    }
}

// Mostrar mensaje de error
function showError(message) {
    document.getElementById('content').innerHTML = `<div class="error">${message}</div>`;
}
