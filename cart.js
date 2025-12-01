/* =============================
   CART LOGIC (cart.js)
   (Built for Formspree with Fees & INLINE Calendar)
============================= */

const PROCESSING_FEE = 1.99; 
const DELIVERY_FEE = 4.99;   
let selectedDateTime = null; 

document.addEventListener('DOMContentLoaded', () => {
  updateCartIcon();
  
  if (document.body.id === 'cart-page') {
    displayCartItems();
    setupBookingSystem();
    
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

/**
 * === UPDATED: Adds/removes 'cart-active' class ===
 */
function updateCartIcon() {
  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartIcon = document.getElementById('cart-icon');
  const mobileCartIcon = document.getElementById('mobile-cart-icon');

  if (cartIcon) {
    cartIcon.textContent = `Cart (${totalItems})`;
    
    if (totalItems > 0) {
      cartIcon.classList.add('cart-active');
    } else {
      cartIcon.classList.remove('cart-active');
    }
  }
  
  if (mobileCartIcon) {
    mobileCartIcon.textContent = `Cart (${totalItems})`;
    if (totalItems > 0) {
      mobileCartIcon.classList.add('cart-active');
    } else {
      mobileCartIcon.classList.remove('cart-active');
    }
  }
}

function addToCart(item) {
  let cart = getCart();
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    existingItem.quantity += 1; 
  } else {
    cart.push({ ...item, quantity: 1 }); 
  }
  
  saveCart(cart);
  updateCartIcon();
  alert(`${item.name} (${item.tray_size}) was added to your cart!`);
}

function displayCartItems() {
  const cart = getCart();
  const cartContainer = document.getElementById('cart-items-container');
  
  if (!cartContainer) return;
  
  cartContainer.innerHTML = '';
  let subtotal = 0;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-medium);">Your cart is empty.</p>';
    document.getElementById('checkout-form').style.display = 'none';
    document.querySelector('.booking-container').style.display = 'none';
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

function setupCartForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', () => {
    // 1. Get the item summary
    const cart = getCart();
    let orderSummary = '';
    cart.forEach(item => {
      orderSummary += `Item: ${item.name} (${item.tray_size}) (Qty: ${item.quantity}) - $${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
    });
    
    // 2. Get the totals
    const subtotal = document.getElementById('cart-subtotal').textContent;
    const processingFee = document.getElementById('cart-processing-fee').textContent;
    const deliveryFee = document.getElementById('cart-delivery-fee').textContent;
    const grandTotal = document.getElementById('cart-grand-total').textContent;
    const deliveryOption = document.getElementById('delivery-radio').checked ? 'Delivery' : 'Pickup';
    
    // 3. Get the date/time
    const pickupDateTime = document.getElementById('pickup-datetime').value;

    // 4. Populate hidden fields
    document.getElementById('order-items').value = orderSummary;
    document.getElementById('order-subtotal').value = subtotal;
    document.getElementById('order-fees').value = (parseFloat(processingFee) + parseFloat(deliveryFee)).toFixed(2);
    document.getElementById('order-grand-total').value = grandTotal;
    document.getElementById('order-delivery-option').value = deliveryOption;
    document.getElementById('order-pickup-time').value = pickupDateTime; 
    
    localStorage.removeItem('jesseCart');
  });
}

// === NEW: CALENDAR & BOOKING SYSTEM ===
function setupBookingSystem() {
  const timeslotContainer = document.getElementById('timeslot-container');
  const checkoutForm = document.getElementById('checkout-form');
  
  // --- MANUALLY BLOCK DATES HERE ---
  const blockedDates = [
    "2025-11-27", 
    "2025-11-28", 
    "2025-12-24",
    "2025-12-25"
  ];
  
  // 1. Initialize the Calendar
  flatpickr("#calendar-container", {
    inline: true, 
    // === FIX: Allows booking today or any day in the future ===
    minDate: "today", 
    
    // === FIX: Removed the day-of-week blocking logic ===
    disable: [
      // Only keep the manual blocks (e.g., holidays)
      ...blockedDates 
    ],
    
    locale: {
      firstDayOfWeek: 0 
    },
    
    // Time Rules
    enableTime: true,
    time_24hr: false,
    minuteIncrement: 60, // Hourly slots
    minTime: "12:00",    // Starts at 12 PM
    maxTime: "20:00",    // Ends at 8 PM
    
    onChange: function(selectedDates, dateStr, instance) {
      if (selectedDates.length === 0) return;
      
      selectedDateTime = { date: dateStr, time: null }; 
      
      checkoutForm.style.display = 'none'; 
      
      generateTimeSlots(timeslotContainer);
    }
  });
  
  // 2. Generate the hourly time slot buttons
  function generateTimeSlots(container) {
    container.innerHTML = ''; 
    const startTime = 12; // 12 PM
    const endTime = 20; // 8 PM
    
    for (let hour = startTime; hour <= endTime; hour++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('btn', 'time-slot-btn');
      
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      button.textContent = `${displayHour}:00 ${ampm}`;
      
      button.dataset.time = `${hour}:00`; 
      
      container.appendChild(button);
    }
    
    // Add click listeners to the new buttons
    addTimeslotListeners();
  }

  // 3. Add click listeners to all time slot buttons
  function addTimeslotListeners() {
    document.querySelectorAll('.time-slot-btn').forEach(button => {
      button.addEventListener('click', () => {
        // Remove 'selected' from all other buttons
        document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
        // Add 'selected' to the clicked one
        button.classList.add('selected');
        
        // Store the selected time
        selectedDateTime.time = button.textContent;
        
        // Show the checkout form
        checkoutForm.style.display = 'block';
        window.scrollTo({ top: checkoutForm.offsetTop - 100, behavior: 'smooth' });
      });
    });
  }
}