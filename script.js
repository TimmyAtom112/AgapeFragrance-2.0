
// SUPABASE CLIENT
const client = window.agapeSupabase;

// CART STORAGE
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];

// ELEMENTS
const homeContainer = document.getElementById("home-products");
const cartCount = document.getElementById("cart-count");

// FORMAT PRICE
function formatPrice(price) {
  return "₦" + Number(price).toLocaleString("en-NG");
}

// ESCAPE HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// UPDATE CART COUNT
function updateCartCount() {
  if (cartCount) {
    cartCount.innerText = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0), 0
    );
  }
}

// SAVE CART
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// LOAD PRODUCTS FROM SUPABASE
async function loadHomeProducts() {

  if (!homeContainer) return;

  homeContainer.innerHTML = "<p>Loading featured fragrances...</p>";

  try {

    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;

    products = data || [];

    displayHomeProducts();

  } catch (error) {

    console.error("Homepage product loading error:", error);

    homeContainer.innerHTML =
      "<p>Unable to load products. Please refresh the page.</p>";

  }
}

// DISPLAY PRODUCTS
function displayHomeProducts() {

  if (!products.length) {
    homeContainer.innerHTML = "<p>No products available yet.</p>";
    return;
  }

  homeContainer.innerHTML = products.map(product => {

    const outOfStock = Number(product.stock) <= 0;

    return `
      <div class="product-card">

        <img
          src="${escapeHTML(product.image_url || "")}"
          alt="${escapeHTML(product.name)}"
          style="width:100%; height:250px; object-fit:cover; display:block;"
        >

        <h3>${escapeHTML(product.name)}</h3>

        <p>${formatPrice(product.price)}</p>

        <p style="color:${outOfStock ? '#d9534f' : '#228b22'}; font-weight:600;">
          ${outOfStock ? "Out of Stock" : "In Stock"}
        </p>

        <button
          class="add-cart-button"
          data-product-id="${escapeHTML(product.id)}"
          ${outOfStock ? "disabled" : ""}
          style="${outOfStock ? "opacity:0.5; cursor:not-allowed;" : ""}"
        >
          ${outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

      </div>
    `;

  }).join("");

  // ADD TO CART EVENTS
  homeContainer.querySelectorAll(".add-cart-button").forEach(button => {

    button.addEventListener("click", () => {

      const product = products.find(
        item => String(item.id) === button.dataset.productId
      );

      if (!product || Number(product.stock) <= 0) {
        alert("Sorry, this product is out of stock.");
        return;
      }

      const existing = cart.find(
        item => String(item.id) === String(product.id)
      );

      if (existing) {

        if (existing.quantity >= Number(product.stock)) {
          alert("Sorry, only " + product.stock + " item(s) available.");
          return;
        }

        existing.quantity += 1;

      } else {

        cart.push({
          id: product.id,
          name: product.name,
          price: formatPrice(product.price),
          image: product.image_url,
          quantity: 1,
          stock: Number(product.stock)
        });

      }

      saveCart();

      alert(product.name + " added to cart 🛒");

    });

  });

}

// MOBILE NAVIGATION
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

}

// INITIALIZE
updateCartCount();
loadHomeProducts();
