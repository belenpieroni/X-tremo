import {
    clasificarPunto,
    personalizarHeader,
    formatearNumero,
    graficar2Var, 
    sanitizarFuncion,
    graficarFuncion,
    encontrarCeros
} from './XtremoUtils.js';
import {
  ref,
  get,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { db } from "./firebase-init.js";

// Referencia al contador de visitas
const visitasRef = ref(db, "contador/visitas");

get(visitasRef).then((snapshot) => {
  if (snapshot.exists()) {
    const actual = snapshot.val();
    set(visitasRef, actual + 1); 
  } else {
    set(visitasRef, 1);
  }
});
onValue(visitasRef, (snapshot) => {
  const total = snapshot.val();
  const el = document.getElementById("contador-visitas-numero");
  if (el) el.innerText = `${total}`;
});

function limpiarRelativo1Var() {
    const campo = document.getElementById("funcionx");
    if (campo?.setValue) campo.setValue("");

    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";

    const graficoFuncion = document.getElementById("grafico-funcion");
    if (graficoFuncion) {
        try {
        Plotly.purge(graficoFuncion);
        } catch (err) {
        console.warn("No se pudo purgar el gráfico 2D:", err);
        }
        graficoFuncion.innerHTML = "";
    }
}

function limpiarRelativo2Var() {
    const campoXY = document.getElementById("funcionxy");
    if (campoXY?.setValue) campoXY.setValue("");

    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";

    const grafico3D = document.getElementById("grafico-3d");
    if (grafico3D) {
        try {
        Plotly.purge(grafico3D);
        } catch (err) {
        console.warn("No se pudo purgar el gráfico 3D:", err);
        }
        grafico3D.innerHTML = "";
    }
}

function limpiarAbsoluto2Var() {
    ["fxy", "gxy"].forEach(id => {
        const input = document.getElementById(id);
        if (input?.value !== undefined) input.value = "";
    });

    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";

    const grafico3D = document.getElementById("grafico-3d");
    if (grafico3D) {
        try {
        Plotly.purge(grafico3D);
        } catch (err) {
        console.warn("No se pudo purgar el gráfico 3D:", err);
        }
        grafico3D.innerHTML = "";
    }
}

function limpiarAbsoluto3Var() {
    ["fxyz", "gxyz", "hxyz"].forEach(id => {
        const input = document.getElementById(id);
        if (input?.value !== undefined) input.value = "";
    });

    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";

    const grafico3D = document.getElementById("grafico-3d");
    if (grafico3D) {
        try {
        Plotly.purge(grafico3D);
        } catch (err) {
        console.warn("No se pudo purgar el gráfico 3D:", err);
        }
        grafico3D.innerHTML = "";
    }
}

let grafico

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
            // Asignar el listener al botón de exportar PDF (si existe)
            const btnExportarPDF = document.getElementById("btnExportarPDF");
            if (btnExportarPDF) {
                btnExportarPDF.addEventListener("click", exportarPDF);
            }
            // Botones de limpieza
            const limpiarRelativosBtnX = document.getElementById("limpiar-relativo-x");
            if (limpiarRelativosBtnX) {
                limpiarRelativosBtnX.addEventListener("click", limpiarRelativo1Var);
            }

            const limpiarRelativosBtnXY = document.getElementById("limpiar-relativo-xy");
            if (limpiarRelativosBtnXY) {
                limpiarRelativosBtnXY.addEventListener("click", limpiarRelativo2Var);
            }

            const limpiarBtn2v = document.getElementById("limpiar-absoluto-2v");
            if (limpiarBtn2v) {
                limpiarBtn2v.addEventListener("click", limpiarAbsoluto2Var);
            }

            const limpiarBtn3v = document.getElementById("limpiar-absoluto-3v");
            if (limpiarBtn3v) {
                limpiarBtn3v.addEventListener("click", limpiarAbsoluto3Var);
            }

            // Checkbox y campos para análisis absoluto
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

                        limpiarAbsoluto3Var();  // <-- Limpiar formulario 3 vars aquí

                    } else {
                        // Modo 2 variables
                        btnTextAbs.textContent = '2 variables';
                        toggleAbs.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--absoluto-primario').trim();
                        form2vars.style.display = 'block';
                        form3vars.style.display = 'none';

                        // Habilitar inputs de 2 vars, deshabilitar de 3 vars
                        form2vars.querySelectorAll("input").forEach(input => input.disabled = false);
                        form3vars.querySelectorAll("input").forEach(input => input.disabled = true);

                        limpiarAbsoluto2Var();  // <-- Limpiar formulario 2 vars aquí
                    }
                };

                checkboxAbs.addEventListener('change', updateAbsToggle);
                updateAbsToggle();
            }

            // Escucha de análisis Absolutos según modo
            const formLagrange = document.getElementById("form-lagrange");
            if (formLagrange) {
                formLagrange.addEventListener("submit", function (e) {
                e.preventDefault();
                const modo3vars = document.getElementById("modoAbs2vars")?.checked ?? false;
                if (modo3vars) {
                    analizarAbsolutos3Vars2Restricciones();
                } else {
                    analizarAbsolutos2Vars1Restriccion();
                }
                });
            }

            // Toggle visual en relativos (2 forms)
            const checkboxRel = document.getElementById('modoRel2vars');
            const toggleRel = checkboxRel?.parentElement;
            const btnTextRel = toggleRel?.querySelector('.btn-text');
            const formXRel = document.getElementById('form-funcionx');
            const formXYRel = document.getElementById('form-funcionxy');

            if (checkboxRel && toggleRel && btnTextRel && formXRel && formXYRel) {
                const updateRelToggle = () => {
                    const graficoFuncion = document.getElementById("grafico-funcion");
                    const grafico3D = document.getElementById("grafico-3d");  // <- nuevo

                    if (checkboxRel.checked) {
                        // Modo 2 variables
                        btnTextRel.textContent = '2 variables';
                        toggleRel.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-secundario').trim();
                        formXRel.style.display = 'none';
                        formXYRel.style.display = 'block';
                        if (graficoFuncion) graficoFuncion.style.display = 'none';

                        limpiarRelativo2Var();  // Limpiamos formulario 2 variables
                    } else {
                        // Modo 1 variable
                        btnTextRel.textContent = '1 variable';
                        toggleRel.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--relativo-primario').trim();
                        formXRel.style.display = 'block';
                        formXYRel.style.display = 'none';
                        if (graficoFuncion) graficoFuncion.style.display = 'block';

                        limpiarRelativo1Var();  // Limpiamos formulario 1 variable
                    }

                    // Limpieza común: gráfico 3D
                    if (grafico3D) {
                        try {
                            Plotly.purge(grafico3D);  // Evita que se acumulen trazas
                        } catch (e) {
                            console.warn("No se pudo purgar el gráfico 3D:", e);
                        }
                        grafico3D.innerHTML = "";
                    }
                };

                checkboxRel.addEventListener('change', updateRelToggle);
                updateRelToggle();
            }

            // Botón de análisis Relativos funcional por modo
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

        // Cierre automático al hacer clic fuera del sidebar
        document.addEventListener("click", (event) => {
            const clickedInside = sidebar.contains(event.target) || toggleBtn.contains(event.target);
            if (!clickedInside && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
            }
        });
    }
    
    // Función para exportar resultados en PDF
    async function exportarPDF() {
        const btnExportarPDF = document.getElementById("btnExportarPDF");
        const contenedorTexto = document.getElementById("resultados");

        // Detección de módulo activo
        const moduloRelativo = document.querySelector(".modulo-relativos");
        const moduloAbsoluto = document.querySelector(".modulo-absolutos");

        const graficoRel = document.getElementById("grafico-funcion");
        const graficoAbs = document.getElementById("grafico-3d");

        const divGrafico =
            (moduloRelativo?.offsetParent !== null && graficoRel) ? graficoRel :
            (moduloAbsoluto?.offsetParent !== null && graficoAbs) ? graficoAbs :
            null;

        let tituloPDF = "grafico.pdf";
        if (divGrafico === graficoRel) tituloPDF = "extremos-relativos.pdf";
        if (divGrafico === graficoAbs) tituloPDF = "extremos-absolutos.pdf";

        if (!contenedorTexto) {
            alert("No se encontró el contenido para exportar.");
            return;
        }

        try {
            btnExportarPDF.textContent = "Exportando...";
            btnExportarPDF.disabled = true;

            // Captura de texto (resultados)
            const canvasTexto = await html2canvas(contenedorTexto, { scale: 2 });
            const imgTexto = canvasTexto.toDataURL("image/png");

            // Captura de gráfico (si existe)
            let imgGrafico = null;
            if (divGrafico && divGrafico.offsetWidth > 0 && divGrafico.offsetHeight > 0) {
            divGrafico.scrollIntoView({ behavior: "instant", block: "center" });
            divGrafico.style.visibility = "visible";
            await new Promise(r => setTimeout(r, 500));
            const canvasGrafico = await html2canvas(divGrafico, { scale: 2 });
            imgGrafico = canvasGrafico.toDataURL("image/png");
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");

            // Página 1: resultados
            pdf.addImage(imgTexto, "PNG", 10, 20, 190, 0);
            pdf.setFontSize(16);
            pdf.text(tituloPDF.replace(".pdf", "").replace("extremos-", "Extremos "), 10, 10);

            // Página 2: gráfico (si existe)
            if (imgGrafico) {
            pdf.addPage();
            pdf.addImage(imgGrafico, "PNG", 10, 10, 190, 0);
            }

            pdf.save(tituloPDF);

        } catch (err) {
            console.error("Error al generar el PDF:", err);
            alert("Hubo un error al generar el PDF.");
        } finally {
            btnExportarPDF.textContent = "📄 Descargar análisis";
            btnExportarPDF.disabled = false;
        }
    }

});

/* CÁLCULO DE EXTREMOS RELATIVOS 1 VARIABLE*/
function analizarRelativos1Var() {
    const mathField = document.getElementById("funcionx");
    const funcionStr = mathField?.getValue()?.trim() ?? "";

    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = `
        <p>Analizando...</p>
        <div class="spinner"></div>
    `;
    setTimeout(() => {
        ejecutarRelativos(funcionStr, resultadosDiv);
    }, 50);

    if (!funcionStr) {
        resultadosDiv.innerHTML = "<p>⚠️ No se ingresó ninguna función</p>";
        return;
    }
    function ejecutarRelativos(funcionStr, resultadosDiv){
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
}

/* CÁLCULO DE EXTREMOS RELATIVOS 2 VARIABLES */
function analizarRelativos2Var() {
    const fStrRaw = document.getElementById("funcionxy").getValue().trim().replace("=0", "");
    const funcionStr = sanitizarFuncion(fStrRaw);
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = `
        <p>Analizando...</p>
        <div class="spinner"></div>
    `;
    setTimeout(() => {
        ejecutarRelativos2(funcionStr, resultadosDiv);
    }, 50);

    if (!funcionStr) {
        resultadosDiv.innerHTML = "<p>⚠️ No se ingresó ninguna función</p>";
        return;
    }

    function ejecutarRelativos2 (funcionStr, resultadosDiv){
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
            for (let x = -50; x <= 50; x += 0.1) {
                for (let y = -50; y <= 50; y += 0.1) {
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
            if (puntosCriticos.length === 0) {
                html += `
                <div class="resultado-bloque">
                    <p>No se encontraron puntos críticos.</p>
                </div>`;
                resultadosDiv.innerHTML = html;
                return;
            }

            // Construcción de salida
            let html = `
            <div class="resultado-bloque">
                <h3>Función</h3>
                <p>f(x, y) = ${funcionStr}</p>
            </div>
            `;

            html += `
                <div class="resultado-bloque">
                <h3>Derivadas parciales</h3>
                <p>Primeras derivadas:</p>
                <p>fx = <code>${fxExpr.toString()}</code></p>
                <p>fy = <code>${fyExpr.toString()}</code></p>

                <p>Segundas derivadas:</p>
                <p>f<sub>xx</sub> = <code>${fxxExpr.toString()}</code></p>
                <p>f<sub>yy</sub> = <code>${fyyExpr.toString()}</code></p>
                <p>f<sub>xy</sub> = <code>${fxyExpr.toString()}</code></p>
                </div>
            `;

            html += `
                <div class="resultado-bloque">
                <h3>Puntos críticos encontrados</h3>
                <p>Se ha encontrado <trong>${puntosCriticos.length} punto(s)</trong> donde fx = 0 y fy = 0:</p>
                <ul class="puntos-lista">
                    ${puntosCriticos.map(p => `<li>(x, y) = (${p.x}, ${p.y})</li>`).join("")}
                </ul>
                </div>
            `;
            html += `
                <div class="resultado-bloque">
                <h3>Clasificación teórica</h3>
                <p>Se analiza el signo:</p>
                <p><strong>g(x, y) = f<sub>xx</sub> · f<sub>yy</sub> − (f<sub>xy</sub>)²</strong></p>
                </div>
            `;

           html += `
            <div class="resultado-bloque">
                <h3>Evaluación en cada punto</h3>
                <ul class="puntos-lista">
                    ${puntosCriticos.map(p => {
                    const { tipo, d } = clasificarPunto(fxx, fyy, fxy, p.x, p.y);
                    const color = tipo.includes("mínimo") ? "blue" :
                                    tipo.includes("máximo") ? "red" :
                                    tipo.includes("silla") ? "black" : "gray";
                    const emoji = tipo.includes("mínimo") ? "🟦" :
                                    tipo.includes("máximo") ? "🟥" :
                                    tipo.includes("silla") ? "⚫" : "⚪";

                    return `
                    <li>
                        <strong>Punto:</strong> (${p.x}, ${p.y})<br>
                        f<sub>xx</sub>(${p.x}, ${p.y}) = ${formatearNumero(fxx.evaluate(p))}<br>
                        f<sub>yy</sub>(${p.x}, ${p.y}) = ${formatearNumero(fyy.evaluate(p))}<br>
                        f<sub>xy</sub>(${p.x}, ${p.y}) = ${formatearNumero(fxy.evaluate(p))}<br>
                        g = ${formatearNumero(d)} ⇒ <span style="color:${color}; font-weight: bold;">${emoji} ${tipo}</span>
                    </li>
                    `;
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
}

/* CÁLCULO EXTREMOS ABSOLUTOS */
function analizarAbsolutos2Vars1Restriccion() {
    const fStrRaw = document.getElementById("fxy").getValue().trim().replace("=0", "");
    const gStrRaw = document.getElementById("gxy").getValue().trim().replace("=0", "");
    const fStr = sanitizarFuncion(fStrRaw);
    const gStr = sanitizarFuncion(gStrRaw);
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = `
        <p>Analizando...</p>
        <div class="spinner"></div>
    `;

    setTimeout(() => {
        ejecutarAnalisis(fStr, gStr, resultadosDiv);
    }, 50);

    if (!fStr) {
        resultadosDiv.innerHTML = "<p> ⚠️ No se ingresó ninguna función.</p>"
        return;
    }
    if (!gStr) {
        resultadosDiv.innerHTML = "<p> ⚠️ No se ingresó ninguna restricción.</p>"
        return;
    }
    function ejecutarAnalisis(fStr, gStr, resultadosDiv) {
        try {
            const fExpr = math.parse(fStr);
            const gExpr = math.parse(gStr);

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

            for (let x = -50; x <= 50; x += 0.1) {
                for (let y = -50; y <= 50; y += 0.1) {
                    try {
                        const scope = { x, y };
                        const gxVal = gx.evaluate(scope);
                        const gyVal = gy.evaluate(scope);
                        if (Math.abs(gxVal) < 1e-3 && Math.abs(gyVal) < 1e-3) continue;

                        const fxVal = fx.evaluate(scope);
                        const fyVal = fy.evaluate(scope);
                        if (Math.abs(gxVal) < 1e-5 || Math.abs(gyVal) < 1e-5) continue;

                        const lambdaX = fxVal / gxVal;
                        const lambdaY = fyVal / gyVal;
                        const gVal = g.evaluate(scope);

                        if (Math.abs(lambdaX - lambdaY) < 0.05 && Math.abs(gVal) < 0.05) {
                            const valorF = f.evaluate(scope);
                            puntosCriticos.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), fval: valorF });
                        }
                    } catch {
                        continue;
                    }
                }
            }

            let html = `
                <div class="absolutos-bloque">
                    <h3>Funciones</h3>
                    <p><strong>Función: f(x,y):</strong> <code>${fStr}</code></p>
                    <p><strong>Restricción: g(x,y):</strong> <code>${gStr} = 0</code></p>
                </div>

                <div class="absolutos-bloque">
                    <h3>Gradientes</h3>
                    <p><strong>∇f:</strong> <code>(${fxExpr.toString()}) i + (${fyExpr.toString()}) j</code></p>
                    <p><strong>∇g:</strong> <code>(${gxExpr.toString()}) i + (${gyExpr.toString()}) j</code></p>
                </div>
            `;

            if (puntosCriticos.length === 0) {
                html += `
                    <div class="absolutos-bloque">
                        <p>No se encontraron puntos que cumplan el sistema de Lagrange en el rango analizado.</p>
                    </div>`;
                resultadosDiv.innerHTML = html;
                return;
            }

            const fvals = puntosCriticos.map(p => p.fval);
            const minVal = Math.min(...fvals);
            const maxVal = Math.max(...fvals);

            html += `
                <div class="absolutos-bloque">
                    <h3>Puntos críticos encontrados</h3>
                    <ul>
            `;

            puntosCriticos.forEach(p => {
                let tipo = "";
                let tipoColor = "";
                if (Math.abs(p.fval - maxVal) < 1e-2) {
                    tipo = "🟥 Máximo absoluto";
                    tipoColor = "color: red;";
                }
                if (Math.abs(p.fval - minVal) < 1e-2) {
                    tipo = "🟦 Mínimo absoluto";
                    tipoColor = "color: blue;";
                }
                html += `
                    <li>
                        <strong>(x, y)</strong> = (${p.x}, ${p.y}) &nbsp; → &nbsp; 
                        <strong>f(x, y) = ${formatearNumero(p.fval)}</strong> 
                        ${tipo ? `<span style="${tipoColor} font-weight: bold;">${tipo}</span>` : ""}
                    </li>`;
            });

            html += `
                    </ul>
                </div>
            `;

            resultadosDiv.innerHTML = html;

            graficar2Var(
                fStr,
                puntosCriticos.map(p => ({
                    x: p.x,
                    y: p.y,
                    tipo: (Math.abs(p.fval - minVal) < 1e-2) ? "mínimo" :
                        (Math.abs(p.fval - maxVal) < 1e-2) ? "máximo" : "crítico",
                    valor: p.fval
                })),
                gStr
            );

        } catch (error) {
            console.error("Error en Lagrange:", error);
            resultadosDiv.innerHTML = "<p>Error al analizar los extremos absolutos. Verificá la sintaxis.</p>";
        }
    }
}

function analizarAbsolutos3Vars2Restricciones() {
    const fRaw = document.getElementById("fxyz").getValue()?.trim() ?? "";
    const gRaw = document.getElementById("gxyz").getValue()?.trim() ?? "";
    const hRaw = document.getElementById("hxyz").getValue()?.trim() ?? "";
    const fStr = sanitizarFuncion(fRaw);
    const gStr = sanitizarFuncion(gRaw);
    const hStr = sanitizarFuncion(hRaw);
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = `
        <p>Analizando...</p>
        <div class="spinner"></div>
    `;
    setTimeout(() => {
        ejecutarAnalisis3Vars(fStr, gStr, hStr, resultadosDiv);
    }, 50);

    if (!fStr || !gStr || !hStr) {
        resultadosDiv.innerHTML = `
            <p> ⚠️ ${!fStr ? "No se ingresó ninguna función." : !gStr ? "No se ingresó la primera restricción." : "No se ingresó la segunda restricción."}</p>
        `;
        return;
    }
    function ejecutarAnalisis3Vars(fStr, gStr, hStr, resultadosDiv) {
        try {
            const fExpr = math.parse(fStr);
            const gExpr = math.parse(gStr);
            const hExpr = math.parse(hStr);

            const fxExpr = math.derivative(fExpr, "x");
            const fyExpr = math.derivative(fExpr, "y");
            const fzExpr = math.derivative(fExpr, "z");

            const gxExpr = math.derivative(gExpr, "x");
            const gyExpr = math.derivative(gExpr, "y");
            const gzExpr = math.derivative(gExpr, "z");

            const hxExpr = math.derivative(hExpr, "x");
            const hyExpr = math.derivative(hExpr, "y");
            const hzExpr = math.derivative(hExpr, "z");

            // Definimos el sistema de ecuaciones
            function sistema(vars) {
                const [x, y, z, mu, lambda] = vars;
                return [
                    fxExpr.evaluate({x, y, z}) - mu * gxExpr.evaluate({x, y, z}) - lambda * hxExpr.evaluate({x, y, z}),
                    fyExpr.evaluate({x, y, z}) - mu * gyExpr.evaluate({x, y, z}) - lambda * hyExpr.evaluate({x, y, z}),
                    fzExpr.evaluate({x, y, z}) - mu * gzExpr.evaluate({x, y, z}) - lambda * hzExpr.evaluate({x, y, z}),
                    gExpr.evaluate({x, y, z}),
                    hExpr.evaluate({x, y, z})
                ];
            }

            // Método Newton-Raphson multivariable
            function newtonRaphsonSystem(f, x0, tol = 1e-8, maxIter = 100) {
                let x = x0;
                for (let iter = 0; iter < maxIter; iter++) {
                    const fx = f(x);
                    const norm = Math.sqrt(fx.reduce((sum, val) => sum + val*val, 0));
                    if (norm < tol) return x;

                    // Aproximamos la Jacobiana numéricamente
                    const J = [];
                    const h = 1e-6;
                    for (let i = 0; i < x.length; i++) {
                        const xh1 = x.slice();
                        const xh2 = x.slice();
                        xh1[i] += h;
                        xh2[i] -= h;
                        const df = f(xh1).map((val, idx) => (val - f(xh2)[idx]) / (2*h));
                        J.push(df);
                    }

                    const JT = math.transpose(J);
                    const delta = math.lusolve(JT, math.multiply(-1, fx));

                    x = x.map((xi, idx) => xi + delta[idx][0]);
                }
                throw new Error("No converge");
            }

            // Intentamos con un guess razonable
            const guess = [8, 16, 8, 1, 1];
            const sol = newtonRaphsonSystem(sistema, guess);

            const [x, y, z, mu, lambda] = sol;
            const valorF = fExpr.evaluate({ x, y, z });
            const teoremaHtml = `
            <div class="absolutos-bloque">
                <h3>Teorema de los Multiplicadores de Lagrange</h3>
                <p style="text-align:center; font-size: 1.1em;">
                    <strong>∇f = μ ∇g + λ ∇h</strong>
                </p>
                <p>
                    El gradiente de <code>f</code> debe ser combinación lineal de los gradientes de las restricciones.
                </p>
            </div>
            `;
            const sistemaSimbolicoHtml = `
            <div class="absolutos-bloque">
                <h3>Sistema de Ecuaciones (Simbólico)</h3>
                <ul>
                    <li><code>fx = μ·gx + λ·hx</code></li>
                    <li><code>fy = μ·gy + λ·hy</code></li>
                    <li><code>fz = μ·gz + λ·hz</code></li>
                    <li><code>g(x, y, z) = 0</code> (primera restricción)</li>
                    <li><code>h(x, y, z) = 0</code> (segunda restricción)</li>
                </ul>
            </div>
            `;
            const derivadasHtml = `
            <div class="absolutos-bloque">
                <h3>Derivadas Parciales</h3>
                <p>f(x,y,z)= <code>${fExpr.toString()}</code></p>
                <ul>
                    <li><strong>fx:</strong> <code>${fxExpr.toString()}</code></li>
                    <li><strong>fy:</strong> <code>${fyExpr.toString()}</code></li>
                    <li><strong>fz:</strong> <code>${fzExpr.toString()}</code></li>
                </ul>
                <p>g(x,y,z)=<code>${gExpr.toString()}</code></p>
                <ul>
                    <li><strong>gx:</strong> <code>${gxExpr.toString()}</code></li>
                    <li><strong>gy:</strong> <code>${gyExpr.toString()}</code></li>
                    <li><strong>gz:</strong> <code>${gzExpr.toString()}</code></li>
                </ul>
                <p>h(x,y,z)=<code>${hExpr.toString()}</code></p>
                <ul>
                    <li><strong>hx:</strong> <code>${hxExpr.toString()}</code></li>
                    <li><strong>hy:</strong> <code>${hyExpr.toString()}</code></li>
                    <li><strong>hz:</strong> <code>${hzExpr.toString()}</code></li>
                </ul>
            </div>
            `;
            const sistemaHtml = `
            <div class="absolutos-bloque">
                <h3>Sistema de Ecuaciones (Reemplazo)</h3>
                <ul>
                    <li><code>${fxExpr.toString()} = μ · ${gxExpr.toString()} + λ · ${hxExpr.toString()}</code></li>
                    <li><code>${fyExpr.toString()}  = μ · ${gyExpr.toString()} + λ · ${hyExpr.toString()}</code></li>
                    <li><code>${fzExpr.toString()} = μ · ${gzExpr.toString()} + λ · ${hzExpr.toString()}</code></li>
                    <li><code>${gExpr.toString()} = 0</code></li>
                    <li><code>${hExpr.toString()} = 0</code></li>
                </ul>
            </div>
            `;

            const resultadoHtml = `
            <div class="absolutos-bloque">
                <h3>Resultado del Análisis</h3>
                <p><strong>Punto:</strong> <code>(x, y, z) = (${formatearNumero(x)}, ${formatearNumero(y)}, ${formatearNumero(z)})</code></p>
                <h3><strong>Multiplicadores de Lagrange:</strong></h3>
                <p>μ = <span style="color: var(--relativo-primario); font-weight: 600;">${formatearNumero(mu)}</span>, 
                λ = <span style="color: var(--relativo-primario); font-weight: 600;">${formatearNumero(lambda)}</span></p>
                <p><strong>Valor de la función:</strong> f(x, y, z) = ${formatearNumero(valorF)}</p>
            </div>
            `;  
            resultadosDiv.innerHTML = teoremaHtml + sistemaSimbolicoHtml + derivadasHtml + sistemaHtml + resultadoHtml;

        } catch (error) {
            console.error(error);
            resultadosDiv.innerHTML = "<p>Error al resolver. Verificá la sintaxis de entrada.</p>";
        }
    }
}
