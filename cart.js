/* =============================
   CART LOGIC (cart.js)
============================= */

// Runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  updateCartIcon();
  
  // This code only runs if we are on the cart.html page
  if (document.body.id === 'cart-page') {
    displayCartItems();
    setupCartForm();
  }
});

/**
 * Gets the cart from localStorage.
 * @returns {Array} The cart array.
 */
function getCart() {
  return JSON.parse(localStorage.getItem('jesseCart')) || [];
}

/**
 * Saves the cart to localStorage.
 * @param {Array} cart - The cart array to save.
 */
function saveCart(cart) {
  localStorage.setItem('jesseCart', JSON.stringify(cart));
}

/**
 * Updates the cart icon in the navbar.
 */
function updateCartIcon() {
  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartIcon = document.getElementById('cart-icon');
  
  if (cartIcon) {
    cartIcon.textContent = `Cart (${totalItems})`;
  }
}

/**
 * Adds an item to the cart.
 * (This is called from menu.html)
 * @param {Object} item - The item to add.
 */
function addToCart(item) {
  let cart = getCart();
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    existingItem.quantity += 1; // Increase quantity
  } else {
    // Add new item with quantity 1
    cart.push({ ...item, quantity: 1 });
  }
  
  saveCart(cart);
  updateCartIcon();
  
  // Show a simple confirmation
  alert(`${item.name} was added to your cart!`);
}

/**
 * Displays all cart items on the cart.html page.
 */
function displayCartItems() {
  const cart = getCart();
  const cartContainer = document.getElementById('cart-items-container');
  const cartTotalEl = document.getElementById('cart-total');
  
  if (!cartContainer) return;
  
  cartContainer.innerHTML = '';
  let total = 0;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-medium);">Your cart is empty.</p>';
    cartTotalEl.textContent = '0.00';
    document.getElementById('checkout-form').style.display = 'none';
    return;
  }
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const itemEl = document.createElement('div');
    itemEl.classList.add('cart-item');
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <span class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</span>
        <div class="cart-item-quantity">
          <label for="qty-${item.id}">Qty:</label>
          <input type="number" id="qty-${item.id}" class="cart-item-qty-input" value="${item.quantity}" min="1" data-id="${item.id}">
        </div>
      </div>
      <div class="cart-item-subtotal">
        <span>$${itemTotal.toFixed(2)}</span>
        <button class="cart-item-remove" data-id="${item.id}">&times; Remove</button>
      </div>
    `;
    cartContainer.appendChild(itemEl);
  });
  
  cartTotalEl.textContent = total.toFixed(2);
  
  // Add event listeners for remove/update
  addCartEventListeners();
}

/**
 * Adds event listeners for cart.html controls (remove, update qty).
 */
function addCartEventListeners() {
  // Remove item
  document.querySelectorAll('.cart-item-remove').forEach(button => {
    button.addEventListener('click', (e) => {
      const idToRemove = e.target.dataset.id;
      let cart = getCart();
      cart = cart.filter(item => item.id !== idToRemove);
      saveCart(cart);
      displayCartItems(); // Re-render the cart
      updateCartIcon();
    });
  });
  
  // Update quantity
  document.querySelectorAll('.cart-item-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idToUpdate = e.target.dataset.id;
      const newQuantity = parseInt(e.target.value);
      let cart = getCart();
      
      const item = cart.find(item => item.id === idToUpdate);
      if (item) {
        if (newQuantity > 0) {
          item.quantity = newQuantity;
        } else {
          // If qty is 0 or less, remove it
          cart = cart.filter(item => item.id !== idToUpdate);
        }
      }
      
      saveCart(cart);
      displayCartItems(); // Re-render the cart
      updateCartIcon();
    });
  });
}

/**
 * Sets up the checkout form on cart.html.
 */
function setupCartForm() {
  const form = document.getElementById('checkout-form');
  const cartDataInput = document.getElementById('cart-data');
  if (!form) return;

  form.addEventListener('submit', () => {
    // Before submitting, grab the current cart and put it in the hidden field
    const cart = getCart();
    let orderSummary = '';
    
    cart.forEach(item => {
      orderSummary += `Item: ${item.name} (ID: ${item.id}) - Qty: ${item.quantity} - Price: $${item.price}\n`;
    });
    
    const total = cart.reduce((t, item) => t + (item.price * item.quantity), 0);
    orderSummary += `\nTOTAL: $${total.toFixed(2)}`;
    
    cartDataInput.value = orderSummary;
    
    // Clear the cart from localStorage *after* submission is successful
    // Formspree will redirect, so this runs on the "thank you" page
    // For now, we'll clear it immediately.
    localStorage.removeItem('jesseCart');
  });
}