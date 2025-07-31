// XtremoUtils.js
export function personalizarHeader() {
    const contenedor = document.getElementById("header-dinamico");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const path = window.location.pathname;
    const isIndex = path.endsWith("index.html") || path === "/" || path === "/index";
    const isTeoria = path.endsWith("teoria.html");
    const isAyuda = path.endsWith("ayuda.html");

    if (isIndex) {
        contenedor.innerHTML = `
            <a href="teoria.html" class="teoria-link">
                <img src="imagenes/gorrito.png" alt="Teoría">
                <span>Teoría</span>
            </a>
            <a href="ayuda.html" class="ayuda-link">
                <img src="imagenes/ayuda.png" alt="Ayuda">
                <span>Ayuda</span>
            </a>`;
    } else if (isTeoria) {
        contenedor.innerHTML = `
            <a href="index.html" class="inicio-link">
                <img src="imagenes/calculadora.png" alt="Inicio">
                <span>Inicio</span>
            </a>
            <a href="ayuda.html" class="ayuda-link">
                <img src="imagenes/ayuda.png" alt="Ayuda">
                <span>Ayuda</span>
            </a>`;
    } else if (isAyuda) {
        contenedor.innerHTML = `
            <a href="index.html" class="inicio-link">
                <img src="imagenes/calculadora.png" alt="Inicio">
                <span>Inicio</span>
            </a>
            <a href="teoria.html" class="teoria-link">
                <img src="imagenes/gorrito.png" alt="Teoría">
                <span>Teoría</span>
            </a>`;
    }
}

export function clasificarPunto(fxx, fyy, fxy, x, y) {
    const d = fxx.evaluate({ x, y }) * fyy.evaluate({ x, y }) - Math.pow(fxy.evaluate({ x, y }), 2);
    const fxxVal = fxx.evaluate({ x, y });

    let tipo = "";
    let clasificacion = "";

    if (Math.abs(d) < 1e-6) {
        tipo = "indefinido";
        clasificacion = "g ≈ 0 ⇒ Criterio no concluyente";
    } else if (d < 0) {
        tipo = "silla";
        clasificacion = "g < 0 ⇒ Punto de silla";
    } else {
        if (fxxVal > 0) {
            tipo = "mínimo";
            clasificacion = `g > 0 y fxx > 0 ⇒ Mínimo relativo`;
        } else if (fxxVal < 0) {
            tipo = "máximo";
            clasificacion = `g > 0 y fxx < 0 ⇒ Máximo relativo`;
        } else {
            tipo = "indefinido";
            clasificacion = "fxx = 0 ⇒ Criterio no concluyente";
        }
    }

    return { tipo, clasificacion, d, fxxVal };
}

export function formatearNumero(num) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(4);
}

export function encontrarCeros(f1) {
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

export function sanitizarFuncion(str) {
  if (str.includes('=')) {
    str = str.split('=')[1]?.trim() ?? str;
  }

  str = str.replace(/\b(sen)\b/g, 'sin');
  str = str.replace(/\b(tg)\b/g, 'tan');
  str = str.replace(/([a-zA-Z])\s*([a-zA-Z])/g, '$1*$2');  // x y → x*y (en general)

  // Solo combinaciones entre x, y, z
  str = str.replace(/\b([x|y|z])\s*([x|y|z])\b/g, '$1*$2');
  str = str.replace(/\b([xyz]{2,3})\b/g, match => match.split('').join('*'));
  str = str.replace(/([x|y|z])\s*(\()/g, '$1*$2');

  // Limpieza de caracteres no válidos
  str = str.replace(/[^\w+\-*/^().]/g, '');

  // Validación con math.js
  try {
    math.parse(str);
  } catch (error) {
    throw new Error(`⚠️ Error en la función: ${error.message}`);
  }

  return str;
}

export function graficarFuncion(f, label, puntosCriticos = []) {
    const divGrafico = document.getElementById("grafico-funcion");
    if (!divGrafico) {
        console.warn("No se encontró el contenedor de gráfico.");
        return;
    }

    divGrafico.classList.add("activo");

    const xs = [];
    const ys = [];

    for (let x = -10; x <= 10; x += 0.1) {
        xs.push(x);
        try {
        const y = f.evaluate({ x });
        ys.push(Number.isFinite(y) ? y : null);
        } catch {
        ys.push(null);
        }
    }

    const traceFuncion = {
        x: xs,
        y: ys,
        mode: "lines",
        type: "scatter",
        name: label || "f(x)",
        line: {
        color: "#deaa1aff",
        width: 2
        }
    };

    const traceMaximos = {
        x: puntosCriticos.filter(p => p.tipo === "máximo").map(p => p.x),
        y: puntosCriticos.filter(p => p.tipo === "máximo").map(p => p.y),
        mode: "markers",
        type: "scatter",
        name: "Máximo local",
        marker: {
        size: 8,
        color: "#be0c0cff",
        line: { width: 1, color: "#333" }
        },
        hoverinfo: "x+y"
    };

    const traceMinimos = {
        x: puntosCriticos.filter(p => p.tipo === "mínimo").map(p => p.x),
        y: puntosCriticos.filter(p => p.tipo === "mínimo").map(p => p.y),
        mode: "markers",
        type: "scatter",
        name: "Mínimo local",
        marker: {
        size: 8,
        color: "#1951d6ff",
        line: { width: 1, color: "#333" }
        },
        hoverinfo: "x+y"
    };

    const layout = {
        title: label || "Gráfico de f(x)",
        xaxis: { title: "x" },
        yaxis: { title: "f(x)" },
        margin: { t: 50, b: 50, l: 60, r: 30 },
        plot_bgcolor: "rgba(0,0,0,0)",
        paper_bgcolor: "rgba(0,0,0,0)",
        font: { family: "Poppins, sans-serif" },
        responsive: true,
        legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
        font: { size: 12, color: "#333" }
        }
    };

    const trazas = [traceFuncion];
    if (puntosCriticos.length > 0) {
        trazas.push(traceMaximos, traceMinimos);
    }

    Plotly.newPlot(divGrafico, trazas, layout, { responsive: true });
}

export function graficar2Var(funcionStr, puntosCriticos = [], restriccionStr = null) {
    const graficoDiv = document.getElementById("grafico-3d");
    if (!graficoDiv) {
        console.error("Falta <div id='grafico-3d'> para renderizar el gráfico.");
        return;
    }

    let fCompiled;
    try {
        const fExpr = math.parse(funcionStr);
        fCompiled = fExpr.compile();
    } catch (err) {
        graficoDiv.innerHTML = "<p style='color:red'>❌ Error al compilar la función f(x,y). Revisá sintaxis y variables.</p>";
        console.warn("Compilación fallida:", funcionStr);
        return;
    }

    const rango = 10;
    const paso = 0.2;

    const xValues = [];
    const yValues = [];
    for (let x = -rango; x <= rango; x += paso) xValues.push(x);
    for (let y = -rango; y <= rango; y += paso) yValues.push(y);

    const zValues = [];
    for (let i = 0; i < xValues.length; i++) {
        const fila = [];
        for (let j = 0; j < yValues.length; j++) {
        try {
            const z = fCompiled.evaluate({ x: xValues[i], y: yValues[j] });
            fila.push(typeof z === "number" && isFinite(z) ? z : null);
        } catch {
            fila.push(null);
        }
        }
        zValues.push(fila);
    }

    const matrizValida = zValues.flat().some(v => Number.isFinite(v));
    if (!matrizValida) {
        graficoDiv.innerHTML = "<p style='color:red'>⚠️ La función ingresada no pudo ser evaluada. Verificá que solo use x e y, y que esté bien escrita.</p>";
        console.warn("Todos los valores de Z son inválidos.");
        return;
    }

    // Puntos críticos
    const puntosX = puntosCriticos.map(p => p.x);
    const puntosY = puntosCriticos.map(p => p.y);
    const puntosZ = puntosCriticos.map(p => {
        try {
        return fCompiled.evaluate({ x: p.x, y: p.y });
        } catch {
        return null;
        }
    });

    const colores = puntosCriticos.map(p =>
        p.tipo?.includes("mínimo") ? "blue" :
        p.tipo?.includes("máximo") ? "red" :
        "gray"
    );

    const traceSurface = {
        z: zValues,
        x: xValues,
        y: yValues,
        type: "surface",
        colorscale: "Viridis",
        opacity: 0.9,
        contours: {
        z: {
            show: true,
            usecolormap: true,
            highlightcolor: "#42f462",
            project: { z: true }
        }
        }
    };

    const tracePoints = {
        x: puntosX,
        y: puntosY,
        z: puntosZ,
        mode: "markers+text",
        type: "scatter3d",
        marker: {
        color: colores,
        size: 6,
        symbol: "circle"
        },
        text: puntosCriticos.map(p => `(${p.x}, ${p.y})`),
        textposition: "top center",
        name: "Puntos críticos"
    };

    let traceRestriccion = null;
    if (restriccionStr) {
        try {
        const gExpr = math.parse(restriccionStr);
        const gCompiled = gExpr.compile();

        const puntosRestriccion = [];
        for (let x of xValues) {
            for (let y of yValues) {
            try {
                const gVal = gCompiled.evaluate({ x, y });
                if (Math.abs(gVal) < 0.05) {
                const zVal = fCompiled.evaluate({ x, y });
                if (Number.isFinite(zVal)) {
                    puntosRestriccion.push({ x, y, z: zVal });
                }
                }
            } catch {}
            }
        }

        traceRestriccion = {
            x: puntosRestriccion.map(p => p.x),
            y: puntosRestriccion.map(p => p.y),
            z: puntosRestriccion.map(p => p.z),
            mode: "lines",
            type: "scatter3d",
            name: "g(x,y)=0",
            line: {
            color: "rgba(170, 3, 3, 0.6)",
            width: 4
            }
        };
        } catch (err) {
        console.warn("No se pudo compilar la restricción:", restriccionStr);
        }
    }

    const trazas = [traceSurface, tracePoints];
    if (traceRestriccion && traceRestriccion.x.length > 0) {
        trazas.push(traceRestriccion);
    }

    const layout = {
        title: "Superficie f(x,y) y puntos críticos",
        autosize: true,
        scene: {
            xaxis: { title: "x" },
            yaxis: { title: "y" },
            zaxis: { title: "f(x,y)" },
            aspectmode: "auto"
        }
    };
    Plotly.newPlot(graficoDiv, trazas, layout);
}
