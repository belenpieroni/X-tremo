// XtremoUtils.js
let grafico = null;

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

export function graficar2Var(funcionStr, puntosCriticos = [], restriccionStr = null) {
    const graficoDiv = document.getElementById("grafico-3d");
    if (!graficoDiv) {
        console.error("Falta <div id='grafico-3d'> para renderizar el gráfico.");
        return;
    }

    const fExpr = math.parse(funcionStr);
    const fCompiled = fExpr.compile();

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

    // Plano de restricción si se especifica
    let traceRestriccion = null;
        if (restriccionStr) {
        try {
            const gExpr = math.parse(restriccionStr);
            const gCompiled = gExpr.compile();

            const puntosRestriccion = [];
            for (let x = -rango; x <= rango; x += paso) {
            for (let y = -rango; y <= rango; y += paso) {
                try {
                const gVal = gCompiled.evaluate({ x, y });
                if (Math.abs(gVal) < 0.05) {
                    const zVal = fCompiled.evaluate({ x, y });
                    puntosRestriccion.push({ x, y, z: zVal });
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
                color: "rgba(150,150,150,0.6)",
                width: 4
            }
            };
        } catch (err) {
            console.warn("No se pudo compilar restricción:", restriccionStr);
        }
        }
    const trazas = [traceSurface, tracePoints];

    if (traceRestriccion && traceRestriccion.x.length > 0) {
        trazas.push(traceRestriccion);
    }

    const layout = {
        title: "Superficie f(x,y) y puntos críticos",
        scene: {
        xaxis: { title: "x" },
        yaxis: { title: "y" },
        zaxis: { title: "f(x,y)" }
        },
        autosize: true,
        height: 500
    };

    if (traceRestriccion && traceRestriccion.x.length > 0) {
        trazas.push(traceRestriccion);
    }


    Plotly.newPlot(graficoDiv, trazas, layout);
}
