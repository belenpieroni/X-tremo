// CARGA HEADER
document.addEventListener("DOMContentLoaded", function () {
    fetch("./componentes/header.html")
        .then(response => response.text())
        .then(data => {
            const headerWrapper = document.createElement("div");
            headerWrapper.innerHTML = data;

            // Insertar en el DOM
            document.body.insertAdjacentElement("afterbegin", headerWrapper);

            // Solo agregar hamburger en pantallas pequeñas
            if (window.innerWidth <= 768) {
                const hamburger = document.createElement("button");
                hamburger.id = "desplegable";
                hamburger.classList.add("hamburger");
                hamburger.innerHTML = "&#9776;";

                const headerElement = headerWrapper.querySelector("#header .container");
                if (headerElement) {
                    headerElement.appendChild(hamburger);
                }
            }

            personalizarHeader();
            inicializarHamburger(); // separado para claridad
        })
        .catch(error => console.error("Error al cargar el header:", error));
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
        enlaces = [
            { texto: "Teoría", href: "teoria.html" },
            { texto: "Características", href: "#info" },
        ];
    } else if (isTeoria) {
        enlaces = [
            { texto: "Inicio", href: "index.html" },
        ];
    }

    enlaces.forEach(enlace => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${enlace.href}">${enlace.texto}</a>`;
        navList.appendChild(li);
    });
}

// INICIALIZAR FUNCIONALIDAD HAMBURGER
function inicializarHamburger() {
    const toggleBtn = document.getElementById("desplegable");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }
}

// BOTÓN TEORÍA (con validación)
const btnTeoria = document.getElementById("btn-teoria");
if (btnTeoria) {
    btnTeoria.addEventListener("click", () => {
        document.getElementById("contenido-principal").innerHTML = `
            <h2>📖 Teoría de Extremos</h2>
            <p>Los extremos relativos se encuentran analizando los puntos críticos...</p>
        `;
    });
}
