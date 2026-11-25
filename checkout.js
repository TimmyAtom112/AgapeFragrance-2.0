
// ==========================
// SUPABASE
// ==========================
const client = window.agapeSupabase;

// ==========================
// CART DATA
// ==========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ==========================
// DOM ELEMENTS
// ==========================
const cartCount = document.getElementById("cart-count");
const checkoutForm = document.getElementById("checkout-form");
const orderSummary = document.getElementById("order-summary");

const payButton = document.getElementById("pay-now-btn");
const fallback = document.getElementById("payment-fallback");
const whatsappLink = document.getElementById("whatsapp-link");
const banner = document.getElementById("payment-banner");

// ==========================
// SETTINGS
// ==========================
let paystackAvailable = false;
const WHATSAPP_NUMBER = "2349025612751";

// ==========================
// ORDER ID GENERATOR
// ==========================
function generateOrderID() {
  const date = new Date();

  const formattedDate =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `AGP-${formattedDate}-${random}`;
}

// ==========================
// PRICE FORMAT
// ==========================
function formatPrice(price) {
  return "₦" + Number(price).toLocaleString("en-NG");
}

// ==========================
// UPDATE CART COUNT
// ==========================
function updateCartCount() {
  if (cartCount) {
    cartCount.innerText = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0), 0
    );
  }
}

// ==========================
// RENDER ORDER SUMMARY
// ==========================
function renderOrderSummary() {
  if (!orderSummary) return;

  if (cart.length === 0) {
    orderSummary.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  const html = cart.map(item => {
    const price = parseInt(
      String(item.price).replace(/[₦,]/g, ""), 10
    );

    const subtotal = price * Number(item.quantity);
    total += subtotal;

    return `<p>${item.name} x${item.quantity} - ${formatPrice(subtotal)}</p>`;
  }).join("");

  orderSummary.innerHTML =
    html + `<h3>Total: ${formatPrice(total)}</h3>`;
}

updateCartCount();
renderOrderSummary();

// ==========================
// BUILD WHATSAPP MESSAGE
// ==========================
function buildWhatsAppMessage(
  orderID, name, phone, address, total
) {
  const itemsText = cart.map(item =>
    `${item.name} x${item.quantity}`
  ).join(", ");

  return encodeURIComponent(
`Hello AgapeFragrance,
Order ID: ${orderID}
Name: ${name}
Phone: ${phone}
Address: ${address}
Items: ${itemsText}
Total: ${formatPrice(total)}`
  );
}

// ==========================
// UPDATE UI STATE
// ==========================
function updateUI() {
  if (paystackAvailable) {
    if (banner) banner.style.display = "none";
    if (payButton) payButton.style.display = "block";
    if (fallback) fallback.style.display = "none";
  } else {
    if (banner) banner.style.display = "block";
    if (payButton) payButton.style.display = "none";
    if (fallback) fallback.style.display = "block";
  }
}

updateUI();

// ==========================
// SHOW WHATSAPP FALLBACK
// ==========================
function showWhatsAppFallback(
  orderID, name, phone, address, total
) {
  if (payButton) payButton.style.display = "none";
  if (fallback) fallback.style.display = "block";

  const message = buildWhatsAppMessage(
    orderID, name, phone, address, total
  );

  if (whatsappLink) {
    whatsappLink.href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }
}

// ==========================
// SAVE ORDER TO SUPABASE
// ==========================
async function saveOrderToSupabase(
  orderID, name, phone, address
) {
  const orderItems = cart.map(item => ({
    product_id: Number(item.id),
    quantity: Number(item.quantity)
  }));

  const { data, error } = await client.rpc(
    "create_customer_order",
    {
      p_order_number: orderID,
      p_customer_name: name,
      p_phone: phone,
      p_delivery_address: address,
      p_items: orderItems
    }
  );

  if (error) throw error;

  return data;
}

// ==========================
// FORM SUBMIT
// ==========================
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!supabase) {
      alert("Unable to connect to our order system. Please try again later.");
      return;
    }

    const submitButton = this.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    const originalText = submitButton
      ? submitButton.innerText || submitButton.value
      : "";

    if (submitButton) {
      submitButton.disabled = true;
      if (submitButton.tagName === "INPUT") {
        submitButton.value = "Saving Order...";
      } else {
        submitButton.innerText = "Saving Order...";
      }
    }

    try {
      const name = this.querySelector(
        'input[placeholder="Full Name"]'
      ).value.trim();

      const phone = this.querySelector(
        'input[placeholder="Phone Number"]'
      ).value.trim();

      const address = this.querySelector(
        'input[placeholder="Delivery Address"]'
      ).value.trim();

      if (!name || !phone || !address) {
        throw new Error("Please complete all checkout fields.");
      }

      const orderID = generateOrderID();

      // Save and validate order in Supabase
      const savedOrder = await saveOrderToSupabase(
        orderID, name, phone, address
      );

      const total = Number(savedOrder.total);

      // Only show WhatsApp after successful saving
      showWhatsAppFallback(
        orderID, name, phone, address, total
      );

      alert(
        `Your order has been saved successfully!\nOrder ID: ${orderID}\n\nContinue to WhatsApp to complete your order.`
      );

    } catch (error) {
      console.error("Order submission error:", error);

      alert(
        error.message ||
        "We could not save your order. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "INPUT") {
          submitButton.value = originalText;
        } else {
          submitButton.innerText = originalText;
        }
      }
    }
  });
}

// ==========================
// MOBILE NAVIGATION
// ==========================
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}
