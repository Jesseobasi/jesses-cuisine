/* =============================
   CART LOGIC (cart.js)
   (Built for Formspree with Fees)
============================= */

const PROCESSING_FEE = 1.99; // A flat $1.99 processing fee
const DELIVERY_FEE = 4.99;   // A flat $4.99 delivery fee

document.addEventListener('DOMContentLoaded', () => {
  updateCartIcon();
  
  if (document.body.id === 'cart-page') {
    displayCartItems();
    setupCartForm();
    
    document.querySelectorAll('input[name="delivery-option"]').forEach(radio => {
      radio.addEventListener('change', updateGrandTotal);
    });
  }
});

function getCart() {
  return JSON.parse(localStorage.getItem('jesseCart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('jesseCart', JSON.stringify(cart));
}

function updateCartIcon() {
  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartIcon = document.getElementById('cart-icon');
  
  if (cartIcon) {
    cartIcon.textContent = `Cart (${totalItems})`;
    const mobileCartIcon = document.getElementById('mobile-cart-icon');
    if (mobileCartIcon) {
      mobileCartIcon.textContent = `Cart (${totalItems})`;
    }
  }
}

/**
 * === UPDATED: Now receives a complete item object ===
 */
function addToCart(item) {
  let cart = getCart();
  // The ID is now unique (e.g., "rnp004-small"), so we check it directly.
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    existingItem.quantity += 1; // Increase quantity
  } else {
    cart.push({ ...item, quantity: 1 }); // Add new item
  }
  
  saveCart(cart);
  updateCartIcon();
  alert(`${item.name} (${item.tray_size}) was added to your cart!`);
}

/**
 * === UPDATED: Now displays tray_size ===
 */
function displayCartItems() {
  const cart = getCart();
  const cartContainer = document.getElementById('cart-items-container');
  
  if (!cartContainer) return;
  
  cartContainer.innerHTML = '';
  let subtotal = 0;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-medium);">Your cart is empty.</p>';
    document.getElementById('checkout-form').style.display = 'none';
  } else {
     cart.forEach(item => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      subtotal += itemTotal;
      
      const itemEl = document.createElement('div');
      itemEl.classList.add('cart-item');
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <span class="cart-item-tray-size">${item.tray_size || ''}</span>
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
  }
  
  document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);
  addCartEventListeners();
  updateGrandTotal();
}

function updateGrandTotal() {
  const subtotal = parseFloat(document.getElementById('cart-subtotal').textContent) || 0;
  
  const isDelivery = document.getElementById('delivery-radio').checked;
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  
  const grandTotal = subtotal + PROCESSING_FEE + deliveryFee;
  
  document.getElementById('cart-processing-fee').textContent = PROCESSING_FEE.toFixed(2);
  document.getElementById('cart-delivery-fee').textContent = deliveryFee.toFixed(2);
  document.getElementById('cart-grand-total').textContent = grandTotal.toFixed(2);
}

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
 * === UPDATED: Now sends tray_size in the email ===
 */
function setupCartForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', () => {
    const cart = getCart();
    let orderSummary = '';
    
    cart.forEach(item => {
      // NEW: Added tray_size to the summary
      orderSummary += `Item: ${item.name} (${item.tray_size}) (Qty: ${item.quantity}) - $${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
    });
    
    const subtotal = document.getElementById('cart-subtotal').textContent;
    const processingFee = document.getElementById('cart-processing-fee').textContent;
    const deliveryFee = document.getElementById('cart-delivery-fee').textContent;
    const grandTotal = document.getElementById('cart-grand-total').textContent;
    const deliveryOption = document.getElementById('delivery-radio').checked ? 'Delivery' : 'Pickup';
    
    document.getElementById('order-items').value = orderSummary;
    document.getElementById('order-subtotal').value = subtotal;
    document.getElementById('order-fees').value = (parseFloat(processingFee) + parseFloat(deliveryFee)).toFixed(2);
    document.getElementById('order-grand-total').value = grandTotal;
    document.getElementById('order-delivery-option').value = deliveryOption;
    
    localStorage.removeItem('jesseCart');
  });
}