let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contenedorProductos = document.getElementById("contenedor-productos");
const contenedorCarrito = document.getElementById("contenedor-carrito");
const mensajeEstado = document.getElementById("mensajeEstado");
const mensajeTotal = document.getElementById("mensajeTotal");
const mensajeFeedback = document.getElementById("mensajeFeedback");
const inputBuscar = document.getElementById("inputBuscar");
const btnOrdenar = document.getElementById("btnOrdenar");
const btnVaciar = document.getElementById("btnVaciar");
const btnFinalizar = document.getElementById("btnFinalizar");

async function cargarProductos() {
  try {
    mensajeEstado.textContent = "Cargando productos...";

    const respuesta = await fetch("productos.json");

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los productos.");
    }

    productos = await respuesta.json();
    renderizarProductos(productos);
  } catch (error) {
    mensajeEstado.textContent = "No fue posible cargar el catálogo.";
    Swal.fire("Error", error.message, "error");
  } finally {
    setTimeout(() => {
      mensajeEstado.textContent = "";
    }, 1500);
  }
}

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarFeedback(mensaje) {
  mensajeFeedback.textContent = mensaje;
  setTimeout(() => {
    mensajeFeedback.textContent = "";
  }, 2500);
}

function renderizarProductos(lista) {
  contenedorProductos.innerHTML = "";

  lista.length === 0
    ? (contenedorProductos.innerHTML = "<p>No se encontraron productos.</p>")
    : lista.forEach((producto) => {
        const { id, nombre, categoria, precio, stock } = producto;
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-usuario");

        tarjeta.innerHTML = `
          <div>
            <h3>${nombre}</h3>
            <p>Categoría: ${categoria}</p>
            <p>Precio: $${precio.toLocaleString("es-AR")}</p>
            <p>Stock: ${stock}</p>
          </div>
          <button class="btn-agregar" data-id="${id}" ${stock === 0 ? "disabled" : ""}>
            Agregar al carrito
          </button>
        `;

        contenedorProductos.appendChild(tarjeta);
      });

  activarBotonesAgregar();
}

function renderizarCarrito() {
  contenedorCarrito.innerHTML = "";

  carrito.length === 0
    ? (contenedorCarrito.innerHTML = "<p>El carrito está vacío.</p>")
    : carrito.forEach((item) => {
        const { id, nombre, precio, cantidad } = item;
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-usuario");

        tarjeta.innerHTML = `
          <div>
            <h3>${nombre}</h3>
            <p>Precio unitario: $${precio.toLocaleString("es-AR")}</p>
            <p>Cantidad: ${cantidad}</p>
            <p>Subtotal: $${(precio * cantidad).toLocaleString("es-AR")}</p>
          </div>
          <div>
            <button class="btn-restar" data-id="${id}">-</button>
            <button class="btn-sumar" data-id="${id}">+</button>
            <button class="btn-eliminar" data-id="${id}">Eliminar</button>
          </div>
        `;

        contenedorCarrito.appendChild(tarjeta);
      });

  actualizarTotal();
  activarBotonesCarrito();
}

function actualizarTotal() {
  const total = carrito.reduce((acumulador, item) => acumulador + item.precio * item.cantidad, 0);
  const cantidadProductos = carrito.reduce((acumulador, item) => acumulador + item.cantidad, 0);

  mensajeTotal.textContent = carrito.length > 0
    ? `Productos: ${cantidadProductos} | Total: $${total.toLocaleString("es-AR")}`
    : "No hay productos en el carrito.";
}

function activarBotonesAgregar() {
  const botones = document.querySelectorAll(".btn-agregar");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const idProducto = Number(boton.dataset.id);
      const producto = productos.find((item) => item.id === idProducto);
      const productoCarrito = carrito.find((item) => item.id === idProducto);

      if (!producto) return;

      if (productoCarrito) {
        productoCarrito.cantidad += 1;
      } else {
        carrito.push({ ...producto, cantidad: 1 });
      }

      guardarCarrito();
      renderizarCarrito();
      mostrarFeedback(`${producto.nombre} agregado al carrito.`);
    });
  });
}

function activarBotonesCarrito() {
  document.querySelectorAll(".btn-sumar").forEach((boton) => {
    boton.addEventListener("click", () => modificarCantidad(Number(boton.dataset.id), 1));
  });

  document.querySelectorAll(".btn-restar").forEach((boton) => {
    boton.addEventListener("click", () => modificarCantidad(Number(boton.dataset.id), -1));
  });

  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idProducto = Number(boton.dataset.id);
      carrito = carrito.filter((item) => item.id !== idProducto);
      guardarCarrito();
      renderizarCarrito();
      mostrarFeedback("Producto eliminado del carrito.");
    });
  });
}

function modificarCantidad(idProducto, cambio) {
  const producto = carrito.find((item) => item.id === idProducto);
  if (!producto) return;

  producto.cantidad += cambio;

  producto.cantidad <= 0
    ? (carrito = carrito.filter((item) => item.id !== idProducto))
    : null;

  guardarCarrito();
  renderizarCarrito();
}

inputBuscar.addEventListener("input", () => {
  const texto = inputBuscar.value.toLowerCase().trim();
  const filtrados = productos.filter(({ nombre, categoria }) =>
    nombre.toLowerCase().includes(texto) || categoria.toLowerCase().includes(texto)
  );

  renderizarProductos(filtrados);
});

btnOrdenar.addEventListener("click", () => {
  productos.sort((a, b) => a.precio - b.precio);
  renderizarProductos(productos);
  mostrarFeedback("Productos ordenados por precio.");
});

btnVaciar.addEventListener("click", () => {
  if (carrito.length === 0) {
    Swal.fire("Carrito vacío", "No hay productos para eliminar.", "info");
    return;
  }

  Swal.fire({
    title: "¿Vaciar carrito?",
    text: "Se eliminarán todos los productos seleccionados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar"
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      carrito = [];
      guardarCarrito();
      renderizarCarrito();
      mostrarFeedback("Carrito vaciado correctamente.");
    }
  });
});

btnFinalizar.addEventListener("click", () => {
  if (carrito.length === 0) {
    Swal.fire("Carrito vacío", "Agregá al menos un producto para continuar.", "info");
    return;
  }

  const total = carrito.reduce((acumulador, item) => acumulador + item.precio * item.cantidad, 0);

  Swal.fire({
    title: "Compra realizada",
    text: `El total de tu compra es $${total.toLocaleString("es-AR")}.`,
    icon: "success",
    confirmButtonText: "Aceptar"
  }).then(() => {
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
  });
});

cargarProductos();
renderizarCarrito();
