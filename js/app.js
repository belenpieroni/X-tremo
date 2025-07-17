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

                const btnAnalizar = document.getElementById("analizarBtn");
                if (btnAnalizar) {
                    btnAnalizar.addEventListener("click", function () {
                        analizarRelativos();
                    });
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

function formatearNumero(num) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(4);
}


/* CÁLCULO DE EXTREMOS RELATIVOS */
function analizarRelativos() {
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

/* Detectar raíces para f'(x) */
function encontrarCeros(f1) {
    const ceros = [];
    const precision = 1e-6;
    const maxIter = 100;

    for (let x = -10; x < 10; x += 0.1) {
        let a = x;
        let b = x + 0.1;
        let fa = f1.evaluate({ x: a });
        let fb = f1.evaluate({ x: b });

        if (fa * fb < 0) {
            let iter = 0;
            while (Math.abs(b - a) > precision && iter < maxIter) {
                let c = (a + b) / 2;
                let fc = f1.evaluate({ x: c });
                if (fa * fc < 0) {
                    b = c;
                    fb = fc;
                } else {
                    a = c;
                    fa = fc;
                }
                iter++;
            }
            let raiz = Number(((a + b) / 2).toFixed(6));
            if (!ceros.includes(raiz)) ceros.push(raiz);
        }
    }
    return ceros;
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
    const fStr = document.getElementById("fxy").value;
    const gStr = document.getElementById("gxy").value;
    const resultadosDiv = document.getElementById("resultados-lagrange");
    resultadosDiv.innerHTML = "<p>Calculando puntos críticos con Lagrange...</p>";

    try {
        // Derivadas parciales
        const fx = nerdamer(`diff(${fStr}, x)`).toString();
        const fy = nerdamer(`diff(${fStr}, y)`).toString();
        const gx = nerdamer(`diff(${gStr}, x)`).toString();
        const gy = nerdamer(`diff(${gStr}, y)`).toString();

        // Ecuación de Lagrange sin lambda
        const lagrangeEq = nerdamer(`${fx}*(${gy}) - (${fy})*(${gx})`).expand().toString();

        // Resolver respecto a y
        let ySolutions = [];
        try {
            const eq = nerdamer(`${lagrangeEq}=0`);
            const raw = nerdamer.solve(eq.text(), 'y');
            ySolutions = Array.isArray(raw) ? raw : [raw];
        } catch (e) {
            console.warn("Lagrange equation could not be solved:", e);
        }


        const puntos = [];

        ySolutions.forEach(yExprRaw => {
            try {
                const yExpr = nerdamer(yExprRaw); // mantener como expresión simbólica

                // Sustituir en g(x, y) = 0 → obtener expresión solo en x
                const gExpr = nerdamer(gStr); // expresión original
                const gSubY = gExpr.substitute("y", yExpr).expand().toString();

                // Resolver g(x, yExpr) = 0 → despejar x
                const xSolutionsRaw = nerdamer.solve(`${gSubY}=0`, 'x');
                const xSolutions = Array.isArray(xSolutionsRaw) ? xSolutionsRaw : [xSolutionsRaw];

                xSolutions.forEach(xExprRaw => {
                    try {
                        const xVal = parseFloat(nerdamer(xExprRaw).evaluate().text());
                        const yVal = parseFloat(yExpr.evaluate({ x: xVal }).text());
                        const fVal = parseFloat(nerdamer(fStr, { x: xVal, y: yVal }).evaluate().text());

                        if (isFinite(xVal) && isFinite(yVal) && isFinite(fVal)) {
                            puntos.push({ x: xVal, y: yVal, f: fVal });
                        }
                    } catch (e) {
                        console.warn("No se pudo evaluar un punto:", xExprRaw, yExpr.toString());
                    }
                });
            } catch (e) {
                console.warn("No se pudo procesar la solución de y:", yExprRaw);
            }
        });

        if (puntos.length === 0) {
            resultadosDiv.innerHTML = "<p>No se encontraron puntos críticos bajo la restricción.</p>";
            return;
        }

        const maxPunto = puntos.reduce((a, b) => (a.f > b.f ? a : b));
        const minPunto = puntos.reduce((a, b) => (a.f < b.f ? a : b));

        let html = `
            <p><strong>f(x,y):</strong> ${fStr}</p>
            <p><strong>Restricción g(x,y):</strong> ${gStr} = 0</p>
            <p><strong>Derivadas parciales:</strong><br>
            f<sub>x</sub> = ${fx}<br>
            f<sub>y</sub> = ${fy}<br>
            g<sub>x</sub> = ${gx}<br>
            g<sub>y</sub> = ${gy}</p>
            <p><strong>Puntos candidatos obtenidos:</strong></p>
            <ul>
        `;

        puntos.forEach(p => {
            const tipo = (p.x === maxPunto.x && p.y === maxPunto.y)
                ? "→ máximo absoluto"
                : (p.x === minPunto.x && p.y === minPunto.y)
                ? "→ mínimo absoluto"
                : "";

            html += `<li>(x, y) = (${formatearNumero(p.x)}, ${formatearNumero(p.y)}) → f = ${formatearNumero(p.f)} ${tipo}</li>`;
        });

        html += "</ul><p><em>Clasificación basada en el valor de f(x, y) evaluado sobre la restricción.</em></p>";

        resultadosDiv.innerHTML = html;

    } catch (error) {
        console.error("Error en cálculo Lagrange:", error);
        resultadosDiv.innerHTML = "<p>No se pudo calcular los puntos críticos. Verifica las expresiones ingresadas.</p>";
    }
}
