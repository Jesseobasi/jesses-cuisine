/* =============================
   CART LOGIC (cart.js)
   (Firebase + Strict Validation + CUSTOM CALENDAR)
============================= */

const PROCESSING_FEE = 1.99; 
const DELIVERY_FEE = 4.99;
const ORDER_LIMIT_PER_DAY = 2;

let selectedDateTime = null; 
let currentCalendarDate = new Date(); // Tracks the month we are looking at

// === BALTIMORE AREA ZIP CODES ===
const ALLOWED_ZIPS = [
  "21201", "21202", "21205", "21206", "21207", "21208", "21209", "21210", 
  "21211", "21212", "21213", "21214", "21215", "21216", "21217", "21218", 
  "21219", "21220", "21221", "21222", "21223", "21224", "21225", "21226", 
  "21227", "21228", "21229", "21230", "21231", "21234", "21236", "21237", 
  "21239", "21204", "21286", "21244", "21133", "21117", "21093", "21061",
  "21060", "21090", "21286", "21122", "21144", "21075", "21044", "21045"
];

// Wait for Firebase to load from HTML
document.addEventListener('firebase-ready', () => {
  initializePage();
});

// Fallback
document.addEventListener('DOMContentLoaded', () => {
  if(document.body.id !== 'cart-page') {
     updateCartIcon();
  }
});

function initializePage() {
  updateCartIcon();
  
  if (document.body.id === 'cart-page') {
    displayCartItems();
    
    // Fetch booked dates then render calendar
    fetchBlockedDatesFromFirebase().then(serverBlockedDates => {
        setupCustomCalendar(serverBlockedDates);
    });
    
    const deliveryRadios = document.querySelectorAll('input[name="delivery-option"]');
    deliveryRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        toggleAddressField(e.target.value);
        updateGrandTotal();
      });
    });
    
    const submitBtn = document.getElementById('submit-btn');
    if(submitBtn) {
        submitBtn.addEventListener('click', handleOrderSubmit);
    }
  }
}

// --- FIREBASE HELPER FUNCTIONS ---
async function fetchBlockedDatesFromFirebase() {
  const { collection, getDocs } = window.dbFunctions;
  const db = window.db;
  const fullDates = [];
  try {
    const querySnapshot = await getDocs(collection(db, "daily_counts"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.count >= ORDER_LIMIT_PER_DAY) {
        fullDates.push(doc.id); 
      }
    });
  } catch (error) { console.error(error); }
  return fullDates;
}

async function incrementDateCountInFirebase(dateStr) {
  const { doc, getDoc, setDoc, updateDoc, increment } = window.dbFunctions;
  const db = window.db;
  const dayRef = doc(db, "daily_counts", dateStr);
  try {
    const daySnap = await getDoc(dayRef);
    if (daySnap.exists()) { await updateDoc(dayRef, { count: increment(1) }); } 
    else { await setDoc(dayRef, { count: 1 }); }
  } catch (e) { console.error(e); }
}

// --- UI FUNCTIONS ---
function toggleAddressField(value) {
  const addressSection = document.getElementById('delivery-address-section');
  const inputs = addressSection.querySelectorAll('input');
  const zipError = document.getElementById('zip-error');
  if (value === 'delivery') {
    addressSection.style.display = 'block';
  } else {
    addressSection.style.display = 'none';
    if(zipError) zipError.style.display = 'none';
  }
}

function getCart() { return JSON.parse(localStorage.getItem('jesseCart')) || []; }
function saveCart(cart) { localStorage.setItem('jesseCart', JSON.stringify(cart)); }

function updateCartIcon() {
  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartIcon = document.getElementById('cart-icon');
  const mobileCartIcon = document.getElementById('mobile-cart-icon');

  if (cartIcon) {
    cartIcon.textContent = `Cart (${totalItems})`;
    if (totalItems > 0) cartIcon.classList.add('cart-active');
    else cartIcon.classList.remove('cart-active');
  }
  if (mobileCartIcon) {
    mobileCartIcon.textContent = `Cart (${totalItems})`;
    if (totalItems > 0) mobileCartIcon.classList.add('cart-active');
    else mobileCartIcon.classList.remove('cart-active');
  }
}

function addToCart(item) {
  let cart = getCart();
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  if (existingItem) { existingItem.quantity += 1; } 
  else { cart.push({ ...item, quantity: 1 }); }
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
            <label>Qty:</label>
            <input type="number" class="cart-item-qty-input" value="${item.quantity}" min="1" data-id="${item.id}">
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
  document.querySelectorAll('.cart-item-remove').forEach(button => {
    button.addEventListener('click', (e) => {
      const idToRemove = e.target.dataset.id;
      let cart = getCart();
      cart = cart.filter(item => item.id !== idToRemove);
      saveCart(cart);
      displayCartItems();
      updateCartIcon();
    });
  });
  document.querySelectorAll('.cart-item-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idToUpdate = e.target.dataset.id;
      const newQuantity = parseInt(e.target.value);
      let cart = getCart();
      const item = cart.find(item => item.id === idToUpdate);
      if (item) {
        if (newQuantity > 0) item.quantity = newQuantity;
        else cart = cart.filter(item => item.id !== idToUpdate);
      }
      saveCart(cart);
      displayCartItems();
      updateCartIcon();
    });
  });
}

function setupCartForm() {} 

// === MAIN SUBMISSION LOGIC ===
async function handleOrderSubmit(e) {
  e.preventDefault(); 
  
  const form = document.getElementById('checkout-form');
  const zipError = document.getElementById('zip-error');
  const isDelivery = document.getElementById('delivery-radio').checked;
  const submitBtn = document.getElementById('submit-btn');

  if (!form.checkValidity()) { form.reportValidity(); return; }

  if (isDelivery) {
      const userZip = document.getElementById('zip').value.trim();
      if (!ALLOWED_ZIPS.includes(userZip)) {
          if(zipError) {
              zipError.style.display = 'block';
              zipError.scrollIntoView({ behavior: "smooth", block: "center" });
          } else alert("Sorry! We do not deliver to this zip code.");
          return; 
      } else if(zipError) zipError.style.display = 'none';
  }
  
  if(!selectedDateTime || !selectedDateTime.time) {
      alert("Please select a time slot from the calendar.");
      return;
  }

  // --- FIREBASE CHECK ---
  const { doc, getDoc } = window.dbFunctions;
  const db = window.db;
  const dateStr = selectedDateTime.date;
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing...";

  try {
      const daySnap = await getDoc(doc(db, "daily_counts", dateStr));
      if (daySnap.exists() && daySnap.data().count >= ORDER_LIMIT_PER_DAY) {
          alert("We apologize! This date just filled up.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Order Inquiry";
          initializePage(); 
          return; 
      }
      await incrementDateCountInFirebase(dateStr);
  } catch(err) { console.error("DB Check Failed", err); }

  const cart = getCart();
  let orderSummary = '';
  if (isDelivery) {
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;
    orderSummary += `--- DELIVERY ADDRESS ---\n${address}\n${city}, ${state} ${zip}\n------------------------\n\n`;
  } else {
    orderSummary += `--- PICKUP ORDER ---\n\n`;
  }

  cart.forEach(item => {
    orderSummary += `Item: ${item.name} (${item.tray_size}) (Qty: ${item.quantity}) - $${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
  });
  
  const subtotal = document.getElementById('cart-subtotal').textContent;
  const grandTotal = document.getElementById('cart-grand-total').textContent;
  const deliveryOption = isDelivery ? 'Delivery' : 'Pickup';
  
  document.getElementById('order-items').value = orderSummary;
  document.getElementById('order-subtotal').value = subtotal;
  document.getElementById('order-fees').value = (parseFloat(PROCESSING_FEE) + parseFloat(isDelivery ? DELIVERY_FEE : 0)).toFixed(2);
  document.getElementById('order-grand-total').value = grandTotal;
  document.getElementById('order-delivery-option').value = deliveryOption;
  document.getElementById('order-pickup-time').value = `${selectedDateTime.date} at ${selectedDateTime.time}`;
  
  localStorage.removeItem('jesseCart');
  form.submit(); 
}

// === CUSTOM CSS GRID CALENDAR SYSTEM ===
function setupCustomCalendar(serverBlockedDates = []) {
  const daysContainer = document.getElementById('calendar-days');
  const monthYearEl = document.getElementById('month-year');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const checkoutForm = document.getElementById('checkout-form');
  const timeslotContainer = document.getElementById('timeslot-container');

  // Manually blocked holidays
  const manualHolidays = ["2025-11-27", "2025-11-28", "2025-12-24", "2025-12-25", "2026-01-01"];
  const allBlocked = [...serverBlockedDates, ...manualHolidays];

  function render() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();
    // Lead time: 3 days from now
    const minDate = new Date();
    minDate.setDate(today.getDate() + 3);
    minDate.setHours(0,0,0,0);

    monthYearEl.textContent = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    daysContainer.innerHTML = "";

    // Days in current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Empty slots for prev month
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyDiv = document.createElement('div');
      emptyDiv.classList.add('calendar-day', 'empty');
      daysContainer.appendChild(emptyDiv);
    }

    // Days
    for (let i = 1; i <= lastDay; i++) {
      const dayEl = document.createElement('div');
      dayEl.textContent = i;
      dayEl.classList.add('calendar-day');
      
      const thisDate = new Date(year, month, i);
      const dateString = thisDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // BLOCKS: Past dates, Lead time, Fridays (5), Manually blocked
      if (
        thisDate < minDate || 
        thisDate.getDay() === 5 || 
        allBlocked.includes(dateString)
      ) {
        dayEl.classList.add('disabled');
      } else {
        dayEl.addEventListener('click', () => {
           // Visual select
           document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
           dayEl.classList.add('selected');
           
           // Logic
           selectedDateTime = { date: dateString, time: null };
           checkoutForm.style.display = 'none';
           generateTimeSlots(timeslotContainer);
        });
      }
      daysContainer.appendChild(dayEl);
    }
  }

  prevBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    render();
  });
  nextBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    render();
  });

  render();
}

function generateTimeSlots(container) {
    container.innerHTML = ''; 
    const startTime = 12; 
    const endTime = 20; 
    for (let hour = startTime; hour <= endTime; hour++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('btn', 'time-slot-btn');
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      button.textContent = `${displayHour}:00 ${ampm}`;
      container.appendChild(button);
    }
    
    document.querySelectorAll('.time-slot-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedDateTime.time = button.textContent;
        document.getElementById('checkout-form').style.display = 'block';
        window.scrollTo({ top: document.getElementById('checkout-form').offsetTop - 100, behavior: 'smooth' });
      });
    });
}