const client = window.agapeSupabase;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];

const shopContainer = document.getElementById("shop-products");
const categoryFilter = document.getElementById("category-filter");

// Format prices
function formatPrice(price) {
  return "₦" + Number(price).toLocaleString("en-NG");
}

// Escape HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Update cart count
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");

  if (cartCount) {
    cartCount.innerText = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0), 0
    );
  }
}

// Fetch products from Supabase
async function loadProducts() {
  shopContainer.innerHTML = "<p>Loading products...</p>";

  try {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];

    displayProducts();

  } catch (error) {
    shopContainer.innerHTML =
      "<p>Could not load products. Please refresh the page.</p>";

    console.error("Product loading error:", error);
  }
}

// Display products
function displayProducts(filter = "All") {
  const filtered = products.filter(product =>
    filter === "All" || product.category === filter
  );

  if (!filtered.length) {
    shopContainer.innerHTML = "<p>No products available in this category.</p>";
    return;
  }

  shopContainer.innerHTML = filtered.map(product => {
    const outOfStock = Number(product.stock) <= 0;

    return `
      <div class="product-card">

      <img
  src="${product.image_url}"
  alt="${product.name}"
  style="width:100%; height:250px; object-fit:cover; display:block;"
>

        <h3>${escapeHTML(product.name)}</h3>

        <p>${formatPrice(product.price)}</p>

        <p style="color:${outOfStock ? '#d9534f' : '#228b22'}; font-weight:600;">
          ${outOfStock ? "Out of Stock" : "In Stock"}
        </p>

        <button
          class="add-cart-button"
          data-product-id="${product.id}"
          ${outOfStock ? "disabled" : ""}
          style="${outOfStock ? "opacity:0.5; cursor:not-allowed;" : ""}"
        >
          ${outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

      </div>
    `;
  }).join("");

  // Add to cart
  shopContainer.querySelectorAll(".add-cart-button").forEach(button => {

    button.addEventListener("click", () => {

      const product = filtered.find(
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

      localStorage.setItem("cart", JSON.stringify(cart));

      updateCartCount();

      alert(product.name + " added to cart 🛒");

    });

  });
}

// Category filter
categoryFilter.addEventListener("change", () => {
  displayProducts(categoryFilter.value);
});

// Mobile menu
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Start
updateCartCount();
loadProducts();