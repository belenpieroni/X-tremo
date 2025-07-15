document.addEventListener("DOMContentLoaded", function () {
    // Header
    fetch("./componentes/header.html")
        .then(response => response.text())
        .then(data => {
            const headerWrapper = document.createElement("div");
            headerWrapper.innerHTML = data;
            document.body.insertAdjacentElement("afterbegin", headerWrapper);
            personalizarHeader();
        })
        .catch(error => console.error("Error al cargar el header:", error));

    // Sidebar Botones
    const btnRelativos = document.getElementById("btn-relativos");
    const btnAbsolutos = document.getElementById("btn-absolutos");
    const contenido = document.getElementById("contenido-principal");

    if (btnRelativos) {
        btnRelativos.addEventListener("click", function () {
            cargarContenido("componentes/relativos.html");
        });
    }

    if (btnAbsolutos) {
        btnAbsolutos.addEventListener("click", function () {
            cargarContenido("componentes/absolutos.html");
        });
    }

    function cargarContenido(ruta) {
        fetch(ruta)
            .then(response => {
                if (!response.ok) throw new Error("No se pudo cargar el contenido.");
                return response.text();
            })
            .then(data => {
                contenido.innerHTML = data;
                window.scrollTo({ top: 0, behavior: "smooth" });
            })
            .catch(error => {
                contenido.innerHTML = "<p>Error al cargar el contenido.</p>";
                console.error(error);
            });
    }
});

// PERSONALIZAR HEADER
function personalizarHeader() {
    const navList = document.getElementById("nav-list");
    if (!navList) return;

    navList.innerHTML = "";
    const path = window.location.pathname;
    const isIndex = path.endsWith("/") || path.endsWith("index.html");
    const isTeoria = path.includes("teoria.html");

    let enlaces = [];

    if (isIndex) {
        enlaces = [{ texto: "Teoría", href: "teoria.html" }];
    } else if (isTeoria) {
        enlaces = [{ texto: "Inicio", href: "index.html" }];
    }

    enlaces.forEach(enlace => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${enlace.href}">${enlace.texto}</a>`;
        navList.appendChild(li);
    });
}
