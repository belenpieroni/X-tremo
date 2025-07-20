import {
    clasificarExtremo,
    clasificarPunto,
    personalizarHeader,
    formatearNumero,
    graficarRelativos2Var,
    encontrarCeros
} from './XtremoUtils.js';

document.addEventListener("DOMContentLoaded", function () {
    // Header
    fetch("./componentes/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-placeholder").innerHTML = data;
            personalizarHeader();
        })
        .catch(error => {
            console.error("Error al cargar el header:", error);
        });

    // Sidebar Botones y contenido principal
    const btnRelativos = document.getElementById("btn-relativos");
    const btnAbsolutos = document.getElementById("btn-absolutos");
    const contenido = document.getElementById("contenido-principal");

    function cargarContenido(ruta) {
        fetch(ruta)
            .then(response => {
                if (!response.ok) throw new Error("No se pudo cargar el contenido.");
                return response.text();
            })
            .then(data => {
                contenido.innerHTML = data;
                window.scrollTo({ top: 0, behavior: "smooth" });

                // Listener botón Analizar
                const btnAnalizar = document.getElementById("analizarBtn");
                if (btnAnalizar) {
                    btnAnalizar.addEventListener("click", function () {
                        const modo2vars = document.getElementById("modo2vars")?.checked ?? false;
                        if (modo2vars) {
                            analizarRelativos2Var();
                        } else {
                            analizarRelativos1Var();
                        }
                    });
                }

                // Listener para checkbox modo2vars que cambia texto del botón
                const checkbox = document.getElementById('modo2vars');
                const toggleBtn = checkbox?.parentElement; // el label.toggle-btn
                const btnText = toggleBtn?.querySelector('.btn-text');

                if (checkbox && toggleBtn && btnText) {
                // Cambia el texto según el estado
                const updateToggleBtn = () => {
                    if (checkbox.checked) {
                    btnText.textContent = '2 variables';
                    toggleBtn.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-secundario').trim();
                    } else {
                    btnText.textContent = '1 variable';
                    toggleBtn.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-primario').trim();
                    }
                };

                checkbox.addEventListener('change', updateToggleBtn);

                // Inicializa el botón con el estado actual
                updateToggleBtn();
                }

                const formLagrange = document.getElementById("form-lagrange");
                if (formLagrange) {
                    formLagrange.addEventListener("submit", function (e) {
                        e.preventDefault();
                        analizarAbsolutos();
                    });
                }
            })
            .catch(error => {
                contenido.innerHTML = "<p>Error al cargar el contenido.</p>";
                console.error(error);
            });
    }

    // Ahora conectamos los botones
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

    // Controlador del botón hamburguesa para sidebar responsive
    const toggleBtn = document.getElementById("toggle-sidebar");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }
});

/* CÁLCULO DE EXTREMOS RELATIVOS 1 VARIABLE*/
function analizarRelativos1Var() {
    const funcionStr = document.getElementById("funcion-input").value;
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = "<p>Calculando...</p>";

    try {
        const expr = math.parse(funcionStr);
        const f = expr.compile();

        // Derivada primera
        const derivada1 = math.derivative(expr, 'x').toString();
        const derivada1Expr = math.parse(derivada1);
        const f1 = derivada1Expr.compile();

        // Derivada segunda
        const derivada2 = math.derivative(derivada1Expr, 'x').toString();
        const derivada2Expr = math.parse(derivada2);
        const f2 = derivada2Expr.compile();

        // Calcular puntos críticos (donde f'(x)=0)
        const puntosCriticos = encontrarCeros(f1);

        // Analizar máximos/mínimos usando segunda derivada
        let analisis = "";
        let explicacion = "";
        const puntosGraficar = [];

        if (puntosCriticos.length === 0) {
            explicacion = "No hay puntos críticos puesto que la derivada nunca se anula.";
        } else {
            puntosCriticos.forEach(x => {
                const valorSegunda = f2.evaluate({ x });
                const fx = f.evaluate({ x });
                let tipo = "";
                if (valorSegunda > 0) {
                    tipo = "mínimo";
                    explicacion += `Como la segunda derivada es positiva en x = ${formatearNumero(x)}, se trata de un mínimo.<br>`;
                } else if (valorSegunda < 0) {
                    tipo = "máximo";
                    explicacion += `Como la segunda derivada es negativa en x = ${formatearNumero(x)}, se trata de un máximo.<br>`;
                } else {
                    tipo = "punto de inflexión";
                    explicacion += `Como la segunda derivada es cero en x = ${formatearNumero(x)}, puede ser un punto de inflexión.<br>`;
                }

                analisis += `<li>${tipo} en (${formatearNumero(x)}, ${formatearNumero(fx)}) [f''(${formatearNumero(x)}) = ${formatearNumero(valorSegunda)}]</li>`;
                puntosGraficar.push({ x, y: fx, tipo });
            });

            // Resumen corto para máximos y mínimos
            const maximos = puntosGraficar.filter(p => p.tipo === "máximo").map(p => formatearNumero(p.x)).join(" y ");
            const minimos = puntosGraficar.filter(p => p.tipo === "mínimo").map(p => formatearNumero(p.x)).join(" y ");

            if (minimos) explicacion += `La función tiene un mínimo en x = ${minimos}.<br>`;
            if (maximos) explicacion += `La función tiene un máximo en x = ${maximos}.<br>`;
        }

        // MOSTRAR RESULTADOS
        resultadosDiv.innerHTML = `
            <p><strong>Función:</strong> f(x) = ${funcionStr}</p>
            <p><strong>Primera derivada:</strong> ${derivada1}</p>
            <p><strong>Segunda derivada:</strong> ${derivada2}</p>
            <p><strong>Análisis:</strong><br>${explicacion}</p>
            <p><strong>Puntos críticos:</strong> ${puntosCriticos.length > 0 ? "<ul>" + analisis + "</ul>" : "No se encontraron puntos críticos."}</p>
        `;

        graficarFuncion(f, funcionStr, puntosGraficar);

    } catch (error) {
        console.error(error);
        resultadosDiv.innerHTML = "<p>Error al analizar la función. Verifica la expresión ingresada.</p>";
    }
}

/* CÁLCULO DE EXTREMOS RELATIVOS 2 VARIABLES */
function analizarRelativos2Var() {
    const funcionStr = document.getElementById("funcion-input").value;
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = "<p>Calculando...</p>";

    try {
        const fExpr = math.parse(funcionStr);

        // Derivadas parciales y segundas
        const fxExpr = math.derivative(fExpr, 'x');
        const fyExpr = math.derivative(fExpr, 'y');
        const fxxExpr = math.derivative(fxExpr, 'x');
        const fyyExpr = math.derivative(fyExpr, 'y');
        const fxyExpr = math.derivative(fxExpr, 'y');

        const fx = fxExpr.compile();
        const fy = fyExpr.compile();
        const fxx = fxxExpr.compile();
        const fyy = fyyExpr.compile();
        const fxy = fxyExpr.compile();
        const f = math.compile(funcionStr);

        const puntosCriticos = [];

        // Escaneo de grilla
        for (let x = -3; x <= 3; x += 0.1) {
            for (let y = -3; y <= 3; y += 0.1) {
                try {
                    const fxVal = fx.evaluate({ x, y });
                    const fyVal = fy.evaluate({ x, y });
                    if (Math.abs(fxVal) < 1e-2 && Math.abs(fyVal) < 1e-2) {
                        const xR = Number(x.toFixed(3));
                        const yR = Number(y.toFixed(3));
                        if (!puntosCriticos.some(p => Math.abs(p.x - xR) < 1e-3 && Math.abs(p.y - yR) < 1e-3)) {
                            puntosCriticos.push({ x: xR, y: yR });
                        }
                    }
                } catch { /* ignorar errores */ }
            }
        }

        // Construcción de salida
        let html = `<p><strong>Función:</strong> f(x, y) = ${funcionStr}</p>`;
        html += `<p><strong>Primera derivada respecto a x:</strong> ${fxExpr.toString()} = 0</p>`;
        html += `<p><strong>Primera derivada respecto a y:</strong> ${fyExpr.toString()} = 0</p>`;

        if (puntosCriticos.length === 0) {
            html += `<p>No se encontraron puntos críticos.</p>`;
            resultadosDiv.innerHTML = html;
            return;
        }

        html += `<h4>Puntos encontrados:</h4><ul>`;
        puntosCriticos.forEach(p => {
            html += `<li>(x, y) = (${p.x}, ${p.y})</li>`;
        });
        html += `</ul>`;

        html += `<h4>Construcción de g(x, y)</h4>`;
        html += `<p>g(x, y) = f<sub>xx</sub> · f<sub>yy</sub> − (f<sub>xy</sub>)²</p>`;
        html += `<p>f<sub>xx</sub> = ${fxxExpr.toString()}</p>`;
        html += `<p>f<sub>yy</sub> = ${fyyExpr.toString()}</p>`;
        html += `<p>f<sub>xy</sub> = ${fxyExpr.toString()}</p>`;
        html += `<p>g(x, y) = ${fxxExpr.toString()} · ${fyyExpr.toString()} − (${fxyExpr.toString()})²</p>`;

        html += `<h4>Evaluación en cada punto:</h4><ul>`;
        puntosCriticos.forEach(p => {
            const { tipo, clasificacion, d, fxxVal } = clasificarPunto(fxx, fyy, fxy, p.x, p.y);
            html += `<li>
                <strong>Punto:</strong> (${p.x}, ${p.y})<br>
                g = ${formatearNumero(d)} ⇒ ${tipo}<br>
                ${clasificacion ? clasificacion : ""}
            </li>`;
        });
        html += `</ul>`;

        resultadosDiv.innerHTML = html;
        graficarRelativos2Var(funcionStr, puntosCriticos.map(p => ({
            x: p.x,
            y: p.y,
            tipo: "punto crítico"
        })));
    } catch (error) {
        resultadosDiv.innerHTML = `<p>⚠️ Error al calcular: ${error.message}</p>`;
    }
}

/* Realizar gráfico */
let grafico;
function graficarFuncion(f, label, puntosCriticos = []) {
    const ctx = document.getElementById("grafico-funcion").getContext("2d");
    const xs = [];
    const ys = [];

    for (let x = -10; x <= 10; x += 0.1) {
        xs.push(x);
        try {
            const y = f.evaluate({ x });
            ys.push(typeof y === 'number' && isFinite(y) ? y : NaN);
        } catch {
            ys.push(NaN);
        }
    }
    const puntosDataset = puntosCriticos.map((p, idx) => ({
        x: p.x,
        y: p.y,
        tipo: p.tipo,
        etiqueta: `${p.tipo} en (${formatearNumero(p.x)}, ${formatearNumero(p.y)})`
    }));

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: label,
                    type: 'line',
                    data: xs.map((x, i) => ({ x, y: ys[i] })),
                    borderColor: "#d85e00",
                    backgroundColor: "rgba(216,94,0,0.1)",
                    pointRadius: 0,
                    borderWidth: 2,
                    spanGaps: true,
                    showLine: true
                },
                {
                    label: "Puntos críticos",
                    data: puntosDataset,
                    pointRadius: 6,
                    backgroundColor: puntosDataset.map(p =>
                        p.tipo === "mínimo" ? "#15b7c0" :
                        p.tipo === "máximo" ? "#d85e00" :
                        "#777777"
                    ),
                    borderColor: puntosDataset.map(p =>
                        p.tipo === "mínimo" ? "#15b7c0" :
                        p.tipo === "máximo" ? "#d85e00" :
                        "#777777"
                    ),
                    borderWidth: 1,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (context.dataset.label === "Puntos críticos") {
                                const punto = context.raw;
                                return punto.etiqueta;
                            } else {
                                return `f(${formatearNumero(context.parsed.x)}) = ${formatearNumero(context.parsed.y)}`;
                            }
                        }
                    }
                },
                legend: {
                    labels: {
                        filter: function(item) {
                            return item.text !== undefined;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "x"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "f(x)"
                    }
                }
            }
        }
    });
}



/* CÁLCULO EXTREMOS ABSOLUTOS */
function analizarAbsolutos() {
    const fStrRaw = document.getElementById("fxy").value;
    const gStrRaw = document.getElementById("gxy").value;
    const resultadosDiv = document.getElementById("resultados-lagrange");

    resultadosDiv.innerHTML = "<p>Calculando gradientes con math.js...</p>";

    try {
        // Normalizar expresión para evitar errores de parsing
        const fExpr = math.parse(fStrRaw);
        const gExpr = math.parse(gStrRaw);

        // Derivadas parciales
        const fx = math.derivative(fExpr, 'x').toString();
        const fy = math.derivative(fExpr, 'y').toString();
        const gx = math.derivative(gExpr, 'x').toString();
        const gy = math.derivative(gExpr, 'y').toString();

        // Mostrar resultados
        let html = `
            <p><strong>f(x,y):</strong> ${fStrRaw}</p>
            <p><strong>g(x,y):</strong> ${gStrRaw} = 0</p>
            <p><strong>Gradiente de f:</strong><br>
            ∇f = (${fx}) i + (${fy}) j</p>
            <p><strong>Gradiente de g:</strong><br>
            ∇g = (${gx}) i + (${gy}) j</p>
        `;
        resultadosDiv.innerHTML = html;

    } catch (error) {
        console.error("Error al calcular gradientes:", error);
        resultadosDiv.innerHTML = "<p> Error al calcular gradientes. Verifica las expresiones ingresadas.</p>";
    }
}
