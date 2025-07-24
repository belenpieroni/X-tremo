import {
    clasificarExtremo,
    clasificarPunto,
    personalizarHeader,
    formatearNumero,
    graficar2Var,
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
        if (grafico) {
                grafico.destroy();
                grafico = null;
        }       
        fetch(ruta)
            .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el contenido.");
            return response.text();
            })
            .then(data => {
            contenido.innerHTML = data;
            window.scrollTo({ top: 0, behavior: "smooth" });
            // Botón Limpiar Relativos
            const limpiarRelativosBtn = document.getElementById("limpiarRelativosBtn");
            if (limpiarRelativosBtn) {
                limpiarRelativosBtn.addEventListener("click", function () {
                    const funcionInput = document.getElementById("funcion-input");
                    if (funcionInput) funcionInput.value = "";
                    const resultadosDiv = document.getElementById("resultados");
                    if (resultadosDiv) resultadosDiv.innerHTML = "";
                    if (grafico) {
                        grafico.destroy();
                        grafico = null;
                    }

                    const grafico3D = document.getElementById("grafico-3d");
                    if (grafico3D) grafico3D.innerHTML = "";
                });
            }

            // Botón Limpiar Absolutos
            const limpiarAbsolutosBtn = document.getElementById("limpiarAbsolutosBtn");
            if (limpiarAbsolutosBtn) {
                limpiarAbsolutosBtn.addEventListener("click", function () {
                    ["fxy", "gxy", "fxyz", "g1xyz", "g2xyz"].forEach(id => {
                        const input = document.getElementById(id);
                        if (input) input.value = "";
                    });
                    const resultadosDiv = document.getElementById("resultados-lagrange");
                    if (resultadosDiv) resultadosDiv.innerHTML = "";
                    if (grafico) {
                        const ctx = grafico.getContext("2d");
                        ctx.clearRect(0, 0, grafico.width, grafico.height);
                    }
                });
            }

            // 🔄 Checkbox y campos para análisis absoluto
            const checkboxAbs = document.getElementById('modoAbs2vars');
            const toggleAbs = checkboxAbs?.parentElement;
            const btnTextAbs = toggleAbs?.querySelector('.btn-text');
            const form2vars = document.getElementById('form-2vars');
            const form3vars = document.getElementById('form-3vars');

            if (checkboxAbs && toggleAbs && btnTextAbs && form2vars && form3vars) {
                const updateAbsToggle = () => {
                    if (checkboxAbs.checked) {
                        // Modo 3 variables
                        btnTextAbs.textContent = '3 variables';
                        toggleAbs.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--absoluto-secundario').trim();
                        form2vars.style.display = 'none';
                        form3vars.style.display = 'block';

                        // Deshabilitar inputs de 2 vars, habilitar de 3 vars
                        form2vars.querySelectorAll("input").forEach(input => input.disabled = true);
                        form3vars.querySelectorAll("input").forEach(input => input.disabled = false);

                    } else {
                        // Modo 2 variables
                        btnTextAbs.textContent = '2 variables';
                        toggleAbs.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--absoluto-primario').trim();
                        form2vars.style.display = 'block';
                        form3vars.style.display = 'none';

                        // Habilitar inputs de 2 vars, deshabilitar de 3 vars
                        form2vars.querySelectorAll("input").forEach(input => input.disabled = false);
                        form3vars.querySelectorAll("input").forEach(input => input.disabled = true);
                    }
                };

                checkboxAbs.addEventListener('change', updateAbsToggle);
                updateAbsToggle();
            }

            // ✅ Escucha de análisis Absolutos según modo
            const formLagrange = document.getElementById("form-lagrange");
            if (formLagrange) {
                formLagrange.addEventListener("submit", function (e) {
                e.preventDefault();
                const modo3vars = document.getElementById("modoAbs2vars")?.checked ?? false;
                if (modo3vars) {
                    alert("El análisis para 3 variables aún no está implementado.");
                } else {
                    analizarAbsolutos2Vars1Restriccion();
                }
                });
            }

            // ✅ Toggle visual en relativos (2 forms)
            const checkboxRel = document.getElementById('modoRel2vars');
            const toggleRel = checkboxRel?.parentElement;
            const btnTextRel = toggleRel?.querySelector('.btn-text');
            const formXRel = document.getElementById('form-funcionx');
            const formXYRel = document.getElementById('form-funcionxy');

            if (checkboxRel && toggleRel && btnTextRel && formXRel && formXYRel) {
                const updateRelToggle = () => {
                    const graficoFuncion = document.getElementById("grafico-funcion");
                    if (checkboxRel.checked) {
                        // Modo 2 variables
                        btnTextRel.textContent = '2 variables';
                        toggleRel.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-secundario').trim();
                        formXRel.style.display = 'none';
                        formXYRel.style.display = 'block';
                        if (graficoFuncion) graficoFuncion.style.display = 'none';
                    } else {
                        // Modo 1 variable
                        btnTextRel.textContent = '1 variable';
                        toggleRel.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-primario').trim();
                        formXRel.style.display = 'block';
                        formXYRel.style.display = 'none';
                        if (graficoFuncion) graficoFuncion.style.display = 'block';
                    }
                };

                checkboxRel.addEventListener('change', updateRelToggle);
                updateRelToggle();
            }

            // ✅ Botones de limpieza Relativos por modo
            const limpiarRelativosBtnX = document.getElementById("limpiarRelativosBtnX");
            if (limpiarRelativosBtnX) {
                limpiarRelativosBtnX.addEventListener("click", function () {
                    document.getElementById("funcion-input-x").value = "";
                    const resultadosDiv = document.getElementById("resultados");
                    if (resultadosDiv) resultadosDiv.innerHTML = "";
                    if (grafico) {
                        grafico.destroy();
                        grafico = null;
                    }
                });
            }

            const limpiarRelativosBtnXY = document.getElementById("limpiarRelativosBtnXY");
            if (limpiarRelativosBtnXY) {
                limpiarRelativosBtnXY.addEventListener("click", function () {
                    document.getElementById("funcion-input-xy").value = "";
                    const resultadosDiv = document.getElementById("resultados");
                    if (resultadosDiv) resultadosDiv.innerHTML = "";
                    const grafico3D = document.querySelector("#grafico-3d");
                    if (grafico3D) grafico3D.innerHTML = "";
                });
            }

            // ✅ Botón de análisis Relativos funcional por modo
            const btnAnalizar = document.getElementById("analizarBtn");
            if (btnAnalizar) {
                btnAnalizar.addEventListener("click", function () {
                    const modo2vars = document.getElementById("modoRel2vars")?.checked ?? false;
                    if (modo2vars) {
                        analizarRelativos2Var();
                    } else {
                        analizarRelativos1Var();
                    }
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
    const funcionStr = document.getElementById("funcion-input-x").value;
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
            <div class="resultado-bloque">
                <h3>Función</h3>
                <p><code>f(x) = ${funcionStr}</code></p>
            </div>

            <div class="resultado-bloque">
                <h3>Derivadas</h3>
                <p><strong>Primera derivada:</strong> <code>${derivada1}</code></p>
                <p><strong>Segunda derivada:</strong> <code>${derivada2}</code></p>
            </div>

            <div class="resultado-bloque">
                <h3>Análisis</h3>
                <p>${explicacion}</p>
            </div>

            <div class="resultado-bloque">
                <h3>Puntos críticos</h3>
                ${puntosCriticos.length > 0 ? "<ul class='puntos-lista'>" + analisis + "</ul>" : "<p>No se encontraron puntos críticos.</p>"}
            </div>
        `;

        graficarFuncion(f, funcionStr, puntosGraficar);

    } catch (error) {
        console.error(error);
        resultadosDiv.innerHTML = "<p>Error al analizar la función. Verifica la expresión ingresada.</p>";
    }
}

/* Realizar gráfico */
let grafico;
function graficarFuncion(f, label, puntosCriticos = []) {
    const canvas = document.getElementById("grafico-funcion");
    canvas.classList.add("activo");
    const ctx = canvas.getContext("2d");

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

/* CÁLCULO DE EXTREMOS RELATIVOS 2 VARIABLES */
function analizarRelativos2Var() {
    const funcionStr = document.getElementById("funcion-input-xy").value;
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
        let html = `
        <div class="resultado-bloque">
        <h3>Función</h3>
        <p>f(x, y) = ${funcionStr}</p>
        </div>

        <div class="resultado-bloque">
        <h3>Primeras Derivadas</h3>
        <p>∂f/∂x = ${fxExpr.toString()} = 0</p>
        <p>∂f/∂y = ${fyExpr.toString()} = 0</p>
        </div>
        `;

        if (puntosCriticos.length === 0) {
            html += `
            <div class="resultado-bloque">
            <p>No se encontraron puntos críticos.</p>
            </div>`;
            resultadosDiv.innerHTML = html;
            return;
        }

        html += `
        <div class="resultado-bloque">
        <h3>Puntos críticos encontrados</h3>
        <ul class="puntos-lista">
            ${puntosCriticos.map(p => `<li>(x, y) = (${p.x}, ${p.y})</li>`).join("")}
        </ul>
        </div>

        <div class="resultado-bloque">
        <h3>Construcción de g(x, y)</h3>
        <p>g(x, y) = f<sub>xx</sub> · f<sub>yy</sub> − (f<sub>xy</sub>)²</p>
        <p>f<sub>xx</sub> = ${fxxExpr.toString()}</p>
        <p>f<sub>yy</sub> = ${fyyExpr.toString()}</p>
        <p>f<sub>xy</sub> = ${fxyExpr.toString()}</p>
        <p>g(x, y) = ${fxxExpr.toString()} · ${fyyExpr.toString()} − (${fxyExpr.toString()})²</p>
        </div>

        <div class="resultado-bloque">
        <h3>Clasificación de cada punto</h3>
        <ul class="puntos-lista">
            ${puntosCriticos.map(p => {
                const { tipo, clasificacion, d, fxxVal } = clasificarPunto(fxx, fyy, fxy, p.x, p.y);
                return `
                <li>
                <strong>Punto:</strong> (${p.x}, ${p.y})<br>
                g = ${formatearNumero(d)} ⇒ ${tipo}<br>
                ${clasificacion ? clasificacion : ""}
                </li>`;
            }).join("")}
        </ul>
        </div>
        `;

        resultadosDiv.innerHTML = html;
        graficar2Var(funcionStr, puntosCriticos.map(p => ({
            x: p.x,
            y: p.y,
            tipo: "punto crítico"
        })));
    } catch (error) {
        resultadosDiv.innerHTML = `<p> Error al calcular: ${error.message}</p>`;
    }
}

/* CÁLCULO EXTREMOS ABSOLUTOS */
function analizarAbsolutos2Vars1Restriccion() {
  const fStrRaw = document.getElementById("fxy").value;
  const gStrRaw = document.getElementById("gxy").value;
  const resultadosDiv = document.getElementById("resultados-lagrange");
  resultadosDiv.innerHTML = "<p>Calculando...</p>";

  try {
    const fExpr = math.parse(fStrRaw);
    const gExpr = math.parse(gStrRaw);

    const fxExpr = math.derivative(fExpr, 'x');
    const fyExpr = math.derivative(fExpr, 'y');
    const gxExpr = math.derivative(gExpr, 'x');
    const gyExpr = math.derivative(gExpr, 'y');

    const fx = fxExpr.compile();
    const fy = fyExpr.compile();
    const gx = gxExpr.compile();
    const gy = gyExpr.compile();
    const g = gExpr.compile();
    const f = fExpr.compile();

    const puntosCriticos = [];

    for (let x = -5; x <= 5; x += 0.1) {
      for (let y = -5; y <= 5; y += 0.1) {
        try {
          const scope = { x, y };
          const gxVal = gx.evaluate(scope);
          const gyVal = gy.evaluate(scope);
          console.log({ x, y, fxVal, fyVal, gxVal, gyVal, lambdaX, lambdaY, gVal });
          // evitamos división por cero en gradiente g
          if (Math.abs(gxVal) < 1e-3 && Math.abs(gyVal) < 1e-3) continue;

          const fxVal = fx.evaluate(scope);
          const fyVal = fy.evaluate(scope);

          if (Math.abs(gxVal) < 1e-5 || Math.abs(gyVal) < 1e-5) {
             continue;
          }
          const lambdaX = fxVal / gxVal;
          const lambdaY = fyVal / gyVal;

          const gVal = g.evaluate(scope);

          // validamos si cumple g ≈ 0 y λs parecidos
          if (Math.abs(lambdaX - lambdaY) < 1e-2 && Math.abs(gVal) < 1e-2) {
            const valorF = f.evaluate(scope);
            puntosCriticos.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), fval: valorF });
          }
        } catch {
          continue;
        }
      }
    }

    let html = `
      <p><strong>f(x,y):</strong> ${fStrRaw}</p>
      <p><strong>g(x,y):</strong> ${gStrRaw} = 0</p>
      <p><strong>∇f:</strong><br>(${fxExpr.toString()}) i + (${fyExpr.toString()}) j</p>
      <p><strong>∇g:</strong><br>(${gxExpr.toString()}) i + (${gyExpr.toString()}) j</p>
    `;

    if (puntosCriticos.length === 0) {
      html += `<p>No se encontraron puntos que cumplan el sistema de Lagrange.</p>`;
    } else {
      const fvals = puntosCriticos.map(p => p.fval);
      const minVal = Math.min(...fvals);
      const maxVal = Math.max(...fvals);

      html += `<h3>Puntos críticos encontrados</h3><ul>`;
      puntosCriticos.forEach(p => {
        let tipo = "";
        if (Math.abs(p.fval - maxVal) < 1e-2) tipo = "Máximo absoluto";
        if (Math.abs(p.fval - minVal) < 1e-2) tipo = "Mínimo absoluto";
        html += `<li>(x, y) = (${p.x}, ${p.y}) → f = ${p.fval.toFixed(3)} <strong>${tipo}</strong></li>`;
      });
      html += `</ul>`;
    }

    resultadosDiv.innerHTML = html;

    if (puntosCriticos.length > 0) {
      graficarRelativos2Var(fStrRaw, puntosCriticos.map(p => ({
        x: p.x,
        y: p.y,
        tipo: "crítico",
        valor: p.fval
      })));
    }

  } catch (error) {
    console.error("Error en Lagrange:", error);
    resultadosDiv.innerHTML = "<p>Error al analizar los extremos absolutos. Verificá la sintaxis.</p>";
  }
}

function analizarAbsolutos3Vars2Restricciones() {
  const fStrRaw = document.getElementById("fxyz").value;
  const g1StrRaw = document.getElementById("g1xyz").value;
  const g2StrRaw = document.getElementById("g2xyz").value;
  const resultadosDiv = document.getElementById("resultados-lagrange");

  resultadosDiv.innerHTML = "<p>Calculando gradientes con math.js...</p>";

  try {
    const fExpr = math.parse(fStrRaw);
    const g1Expr = math.parse(g1StrRaw);
    const g2Expr = math.parse(g2StrRaw);

    const fx = math.derivative(fExpr, 'x').toString();
    const fy = math.derivative(fExpr, 'y').toString();
    const fz = math.derivative(fExpr, 'z').toString();

    const g1x = math.derivative(g1Expr, 'x').toString();
    const g1y = math.derivative(g1Expr, 'y').toString();
    const g1z = math.derivative(g1Expr, 'z').toString();

    const g2x = math.derivative(g2Expr, 'x').toString();
    const g2y = math.derivative(g2Expr, 'y').toString();
    const g2z = math.derivative(g2Expr, 'z').toString();

    let html = `
      <p><strong>f(x,y,z):</strong> ${fStrRaw}</p>
      <p><strong>g₁(x,y,z):</strong> ${g1StrRaw} = 0</p>
      <p><strong>g₂(x,y,z):</strong> ${g2StrRaw} = 0</p>
      <p><strong>Gradiente de f:</strong><br>∇f = (${fx}) i + (${fy}) j + (${fz}) k</p>
      <p><strong>Gradiente de g₁:</strong><br>∇g₁ = (${g1x}) i + (${g1y}) j + (${g1z}) k</p>
      <p><strong>Gradiente de g₂:</strong><br>∇g₂ = (${g2x}) i + (${g2y}) j + (${g2z}) k</p>
    `;
    resultadosDiv.innerHTML = html;

  } catch (error) {
    console.error("Error en gradientes 3 variables:", error);
    resultadosDiv.innerHTML = "<p>Error al calcular. Verificá las expresiones de f, g₁ y g₂.</p>";
  }
}

