/* ══════════════════════════════════════════════════════
   ADMIN DASHBOARD LOGIC — Lil' Cocolates (Premium)
══════════════════════════════════════════════════════ */

const adminLoginWrap   = document.getElementById("adminLoginWrap");
const adminDashboard   = document.getElementById("adminDashboard");
const adminLoginForm   = document.getElementById("adminLoginForm");
const adminLoginBtn    = document.getElementById("adminLoginBtn");
const adminLoginError  = document.getElementById("adminLoginError");
const adminLogoutBtn   = document.getElementById("adminLogoutBtn");
const adminOrdersGrid  = document.getElementById("adminOrdersGrid");
const adminEmptyState  = document.getElementById("adminEmptyState");
const adminFilterTabs  = document.getElementById("adminFilterTabs");
const adminSearchInput = document.getElementById("adminSearchInput");
const adminLightbox    = document.getElementById("adminLightbox");
const adminLightboxImg = document.getElementById("adminLightboxImg");
const adminLightboxClose = document.getElementById("adminLightboxClose");

const adminEditOverlay = document.getElementById("adminEditOverlay");
const adminEditForm    = document.getElementById("adminEditForm");
const adminEditClose   = document.getElementById("adminEditClose");
const adminEditCancel  = document.getElementById("adminEditCancel");
const editOrderIdLabel = document.getElementById("editOrderIdLabel");

let allOrders = [];
let activeFilter = "All";
let searchTerm = "";
let unsubscribeOrders = null;
let currentEditOrderId = null;

/* ─────────────────────────────
   AUTH
───────────────────────────── */
adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { signInWithEmailAndPassword } = window.firebaseUtils;
  const auth = window.firebaseAuth;

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  adminLoginError.textContent = "";
  adminLoginBtn.disabled = true;
  adminLoginBtn.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("Login failed:", err);
    adminLoginError.textContent = "Incorrect email or password.";
  } finally {
    adminLoginBtn.disabled = false;
    adminLoginBtn.textContent = "Login";
  }
});

adminLogoutBtn.addEventListener("click", () => {
  const { signOut } = window.firebaseUtils;
  signOut(window.firebaseAuth);
});

function waitForFirebase() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firebaseAuth && window.firebaseUtils) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

waitForFirebase().then(() => {
  const { onAuthStateChanged } = window.firebaseUtils;
  onAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
      adminLoginWrap.style.display = "none";
      adminDashboard.style.display = "block";
      startOrdersListener();
    } else {
      adminDashboard.style.display = "none";
      adminLoginWrap.style.display = "flex";
      if (unsubscribeOrders) { unsubscribeOrders(); unsubscribeOrders = null; }
    }
  });
});

/* ─────────────────────────────
   REALTIME ORDERS LISTENER
───────────────────────────── */
function startOrdersListener() {
  const { collection, query, orderBy, onSnapshot } = window.firebaseUtils;
  const db = window.firebaseDb;
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
    allOrders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderStats();
    renderOrders();
  }, (err) => console.error("Failed to load orders:", err));
}

/* ─────────────────────────────
   STATS
───────────────────────────── */
function renderStats() {
  const total = allOrders.length;
  const pending = allOrders.filter(o => o.status === "Pending Verification").length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = allOrders.filter(o => {
    const t = o.createdAt?.toDate ? o.createdAt.toDate() : null;
    return t && t >= startOfToday;
  }).length;

  const revenue = allOrders
    .filter(o => ["Confirmed", "Preparing", "Dispatched"].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statToday").textContent = today;
  document.getElementById("statRevenue").textContent = "₹" + revenue.toLocaleString("en-IN");
}

/* ─────────────────────────────
   FILTER + SEARCH
───────────────────────────── */
adminFilterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".admin-filter-tab");
  if (!tab) return;
  adminFilterTabs.querySelectorAll(".admin-filter-tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  activeFilter = tab.dataset.filter;
  renderOrders();
});

adminSearchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderOrders();
});

/* ─────────────────────────────
   WHATSAPP MESSAGES (free, one-click via wa.me)
   ⚠️ Fill in your real links below
───────────────────────────── */

const INSTAGRAM_LINK = "https://instagram.com/lil.cocolates";
const CATALOGUE_LINK = "https://lil-cocolates.vercel.app/";

// Emoji + special characters as escape codes — this makes the message
// immune to any encoding corruption from servers, editors, or copy-paste,
// since these are pure ASCII in the source and JS resolves them at parse time.
const GIFT       = "\u{1F381}"; // 🎁
const HEART      = "\u{1F90E}"; // 🤎
const SPARKLES   = "\u{2728}";  // ✨
const STAR       = "\u{2B50}";  // ⭐
const PACKAGE    = "\u{1F4E6}"; // 📦
const CAMERA     = "\u{1F4F8}"; // 📸
const CHOCOLATE  = "\u{1F36B}"; // 🍫
const TWOHEARTS  = "\u{1F495}"; // 💕
const DIAMOND    = "\u{1F48E}"; // 💎
const VICTORY    = "\u{270C}\u{1F3FB}"; // ✌🏻
const RSQUOTE    = "\u{2019}";  // ’
const EMDASH     = "\u{2014}";  // —
const ENDASH     = "\u{2013}";  // –
const DIVIDER    = "\u{2500}".repeat(12); // ────────────
const RUPEE      = "\u{20B9}";  // ₹

// Shared closing line used by both Confirmed and Preparing messages
// (kept as its own piece so it's typed once, not duplicated)
function contactFooter() {
  return `If you have any questions or need any clarification, please feel free to reach out to Lil' Cocolates at 93630 31787. We${RSQUOTE}re always happy to assist you! ${VICTORY}${CHOCOLATE}`;
}

function buildConfirmationMessage(order) {
  return `ORDER CONFIRMED ${HEART}

Hi ${order.customerName}! ${HEART}

Your order ${order.orderId} has been confirmed. ${SPARKLES}

${order.itemName} ${EMDASH} ${RUPEE}${order.amount}

We${RSQUOTE}re delighted to have your order with us. It will now be carefully prepared with the attention and care it deserves.

Thank you for choosing Lil${RSQUOTE} Cocolates. ${HEART}

Crafted for memories, by memories. ${DIAMOND}

${contactFooter()}`;
}

function buildPreparingMessage(order) {
  return `ORDER BEING PREPARED ${SPARKLES}

Hi ${order.customerName}! ${HEART}

A little update on your order ${order.orderId} ${EMDASH}

Your order is now being carefully prepared and packed. ${SPARKLES}

Every detail is thoughtfully taken care of, ensuring it reaches you just as it should.

We${RSQUOTE}ll keep you updated when your order begins its journey. ${PACKAGE}

Lil${RSQUOTE} Cocolates
Crafted for memories, by memories. ${DIAMOND}

${contactFooter()}`;
}

function buildDispatchedMessage(order) {
  return `ORDER ON THE WAY ${GIFT}${SPARKLES}

Hi ${order.customerName}! ${HEART}

Your order ${order.orderId} has been carefully packed and handed over to our courier partner. ${PACKAGE}${SPARKLES}

Your order is now on its way and is expected to reach you within 1${ENDASH}2 days. We can${RSQUOTE}t wait for it to reach you! ${HEART}

Once it arrives, we hope it brings you a beautiful moment to savour ${EMDASH} and a memory worth keeping. ${SPARKLES}

Loved your experience with Lil${RSQUOTE} Cocolates?

${CAMERA} Share your Lil${RSQUOTE} Cocolates moment with us: ${INSTAGRAM_LINK}

Crafted for memories, by memories. ${DIAMOND}

${DIVIDER}

A Little Note From Us

Hi ${order.customerName}! ${HEART}

Just a little note from all of us at Lil${RSQUOTE} Cocolates ${EMDASH}

Thank you for letting our creations be a part of your moment. ${SPARKLES}

Whether it was a gift, a celebration, or simply something special for yourself, we hope it gives you a memory worth savouring. ${HEART}

${DIVIDER}

${SPARKLES} Looking for your next indulgence?

Explore our collection: ${CATALOGUE_LINK}

${DIVIDER}

Until the next one. ${HEART}

Lil${RSQUOTE} Cocolates
Crafted for memories, by memories. ${DIAMOND}`;
}

// ⚠️ Draft wording — edit this to match your exact tone before going live
function buildRejectedMessage(order) {
  return `ORDER UPDATE

Hi ${order.customerName},

We${RSQUOTE}re really sorry, but we weren${RSQUOTE}t able to confirm your order ${order.orderId} at this time ${EMDASH} this is usually due to a payment verification issue.

Please reach out to us at 93630 31787 and we${RSQUOTE}ll sort this out together. ${HEART}

Lil${RSQUOTE} Cocolates`;
}

// One entry per status that should trigger an automatic WhatsApp message.
// Statuses NOT listed here (Pending Verification) never send anything.
const WHATSAPP_MESSAGE_BUILDERS = {
  "Confirmed": buildConfirmationMessage,
  "Preparing": buildPreparingMessage,
  "Dispatched": buildDispatchedMessage,
  "Rejected": buildRejectedMessage
};

// Cleans whatever format the customer typed (spaces, dashes, +91, leading 0...)
// into a plain 12-digit number WhatsApp accepts: 91XXXXXXXXXX
function normalizeIndianPhone(rawPhone) {
  let digits = String(rawPhone || "").replace(/\D/g, ""); // strip everything but digits

  if (digits.length === 10) {
    digits = "91" + digits;                    // plain 10-digit number
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.slice(1);            // leading 0 + 10 digits
  } else if (digits.length === 12 && digits.startsWith("91")) {
    // already has country code — leave as is
  } else if (digits.length === 13 && digits.startsWith("091")) {
    digits = digits.slice(1);                    // stray leading 0 before 91
  }

  return digits;
}

// Opens WhatsApp reliably. The blank tab is opened FIRST (synchronously, inside
// the click) so popup blockers never block it — only its destination URL is
// filled in afterwards, once we're sure the phone number is valid.
function openWhatsAppMessage(order, message, preOpenedWindow) {
  const phone = normalizeIndianPhone(order.customerPhone);

  if (phone.length !== 12) {
    if (preOpenedWindow) preOpenedWindow.close();
    alert(`Could not open WhatsApp — "${order.customerPhone}" doesn't look like a valid 10-digit number. Please fix the phone number (Edit) and try again.`);
    return;
  }

  // Using api.whatsapp.com/send directly (wa.me just redirects to this same
  // endpoint) — skips one redirect hop that may have been mangling emoji.
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = url;
  } else {
    // Fallback for callers that didn't pre-open a window
    const win = window.open(url, "_blank");
    if (!win) alert("Your browser blocked the WhatsApp popup. Please allow popups for this site and try again.");
  }
}

/* ─────────────────────────────
   CUSTOM STATUS DROPDOWN
───────────────────────────── */
function closeAllStatusDropdowns() {
  document.querySelectorAll(".admin-status-dropdown.open").forEach(d => d.classList.remove("open"));
}

// Closes any open dropdown when clicking anywhere else on the page
document.addEventListener("click", closeAllStatusDropdowns);

// preOpenedWindow: pass the result of a window.open() called synchronously
// inside the original click handler, so WhatsApp never gets popup-blocked.
async function updateOrderStatus(orderId, newStatus, preOpenedWindow) {
  const { doc, updateDoc } = window.firebaseUtils;
  const db = window.firebaseDb;

  const order = allOrders.find(o => o.id === orderId);
  const statusIsActuallyChanging = order?.status !== newStatus;
  const messageBuilder = WHATSAPP_MESSAGE_BUILDERS[newStatus];

  try {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });

    // Only auto-send WhatsApp when the status is CHANGING to one that has a
    // message configured — never resend if it's already at that status.
    if (messageBuilder && statusIsActuallyChanging && order) {
      const updatedOrder = { ...order, status: newStatus };
      openWhatsAppMessage(updatedOrder, messageBuilder(updatedOrder), preOpenedWindow);
    } else if (preOpenedWindow) {
      preOpenedWindow.close(); // no message needed — close the blank tab we pre-opened
    }
  } catch (err) {
    console.error("Status update failed:", err);
    if (preOpenedWindow) preOpenedWindow.close();
    alert("Could not update status. Please check your connection and try again.");
  }
}

/* ─────────────────────────────
   RENDER ORDER CARDS
───────────────────────────── */
const STATUS_CLASS = {
  "Pending Verification": "status-pending",
  "Confirmed": "status-confirmed",
  "Preparing": "status-preparing",
  "Dispatched": "status-delivered",
  "Rejected": "status-rejected"
};

const STATUS_ACCENT = {
  "Pending Verification": "card-status-pending",
  "Confirmed": "card-status-confirmed",
  "Preparing": "card-status-preparing",
  "Dispatched": "card-status-delivered",
  "Rejected": "card-status-rejected"
};

function getFilteredOrders() {
  let list = activeFilter === "All" ? allOrders : allOrders.filter(o => o.status === activeFilter);

  if (searchTerm) {
    list = list.filter(o =>
      (o.orderId || "").toLowerCase().includes(searchTerm) ||
      (o.customerName || "").toLowerCase().includes(searchTerm) ||
      (o.customerPhone || "").toLowerCase().includes(searchTerm)
    );
  }
  return list;
}

function renderOrders() {
  const filtered = getFilteredOrders();
  adminOrdersGrid.innerHTML = "";

  if (filtered.length === 0) {
    adminEmptyState.style.display = "block";
    return;
  }
  adminEmptyState.style.display = "none";

  filtered.forEach((order) => {
    const card = document.createElement("div");
    card.className = "admin-order-card " + (STATUS_ACCENT[order.status] || "card-status-pending");

    const statusClass = STATUS_CLASS[order.status] || "status-pending";
    const timeLabel = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleString("en-IN")
      : "Just now";

    let customizationHtml = "";
    if (order.nameplateDesign) {
      customizationHtml = `<span class="admin-order-custom">🎂 ${order.nameplateDesign}</span>`;
    } else if (order.roseColour) {
      customizationHtml = `<span class="admin-order-custom">🌹 ${order.roseColour}</span>`;
    } else if (order.nutChoice) {
      customizationHtml = `<span class="admin-order-custom">🌰 ${order.nutChoice}</span>`;
    }

    card.innerHTML = `
      <div class="admin-order-top">
        <div>
          <div class="admin-order-id">${order.orderId}</div>
          <div class="admin-order-time">${timeLabel}</div>
        </div>
        <span class="admin-status-badge ${statusClass}">${order.status}</span>
      </div>

      <div class="admin-order-item-row">
        <div class="admin-order-item">${order.itemName} (${order.pcsLabel}${order.flavour ? ", " + order.flavour : ""})</div>
        <div class="admin-order-amount">₹${Number(order.amount).toLocaleString("en-IN")}</div>
      </div>
      <div class="admin-order-meta">${customizationHtml}</div>

      <hr class="admin-order-divider">

      <div class="admin-order-customer">
        <span class="cust-name">${order.customerName}</span>
        <div class="cust-line"><i class="bi bi-telephone"></i> ${order.customerPhone}</div>
        <div class="cust-line"><i class="bi bi-geo-alt"></i> ${order.customerAddress}, ${order.customerPincode}</div>
      </div>

      <div class="admin-order-footer-row">
        ${order.screenshotBase64
          ? `<div class="admin-screenshot-thumb-wrap" data-full="${order.screenshotBase64}"><img src="${order.screenshotBase64}" alt="Payment screenshot"></div>`
          : `<div class="admin-no-screenshot" title="No screenshot"><i class="bi bi-image"></i></div>`
        }

        <div class="admin-status-dropdown" data-order-id="${order.id}">
          <button type="button" class="admin-status-trigger">
            <span class="admin-status-trigger-label">${order.status}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <div class="admin-status-menu">
            <div class="admin-status-option ${order.status === "Pending Verification" ? "active" : ""}" data-value="Pending Verification">Pending Verification</div>
            <div class="admin-status-option ${order.status === "Confirmed" ? "active" : ""}" data-value="Confirmed">Confirmed</div>
            <div class="admin-status-option ${order.status === "Preparing" ? "active" : ""}" data-value="Preparing">Preparing</div>
            <div class="admin-status-option ${order.status === "Dispatched" ? "active" : ""}" data-value="Dispatched">Dispatched</div>
            <div class="admin-status-option ${order.status === "Rejected" ? "active" : ""}" data-value="Rejected">Rejected</div>
          </div>
        </div>
      </div>

      <div class="admin-card-actions">
        <button type="button" class="admin-icon-btn admin-edit-btn" data-order-id="${order.id}">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button type="button" class="admin-icon-btn danger admin-delete-btn" data-order-id="${order.id}">
          <i class="bi bi-trash3"></i> Delete
        </button>
      </div>
    `;

    adminOrdersGrid.appendChild(card);
  });

  attachCardListeners();
}

function attachCardListeners() {
  // Screenshot thumbnail → lightbox (shows full, uncropped image)
  adminOrdersGrid.querySelectorAll(".admin-screenshot-thumb-wrap").forEach(wrap => {
    wrap.addEventListener("click", () => {
      adminLightboxImg.src = wrap.dataset.full;
      adminLightbox.classList.add("open");
    });
  });

  // Status dropdown → open/close + select option
  adminOrdersGrid.querySelectorAll(".admin-status-trigger").forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = trigger.closest(".admin-status-dropdown");
      const isOpen = dropdown.classList.contains("open");
      closeAllStatusDropdowns();
      if (!isOpen) dropdown.classList.add("open");
    });
  });

  adminOrdersGrid.querySelectorAll(".admin-status-option").forEach(option => {
    option.addEventListener("click", async (e) => {
      e.stopPropagation();
      const dropdown = option.closest(".admin-status-dropdown");
      const orderId = dropdown.dataset.orderId;
      const newStatus = option.dataset.value;
      closeAllStatusDropdowns();

      // Open the tab NOW (synchronously, inside the click) — before the
      // await below — so browser popup blockers never intercept it.
      const preOpenedWindow = WHATSAPP_MESSAGE_BUILDERS[newStatus] ? window.open("", "_blank") : null;

      await updateOrderStatus(orderId, newStatus, preOpenedWindow);
    });
  });

  // Edit button → open edit modal
  adminOrdersGrid.querySelectorAll(".admin-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.orderId));
  });

  // Delete button → confirm + delete from Firestore
  adminOrdersGrid.querySelectorAll(".admin-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteOrder(btn.dataset.orderId));
  });
}

/* ─────────────────────────────
   EDIT ORDER (direct Firestore update)
───────────────────────────── */
function openEditModal(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  currentEditOrderId = orderId;
  editOrderIdLabel.textContent = order.orderId;

  document.getElementById("editItemName").value = order.itemName || "";
  document.getElementById("editPcsLabel").value = order.pcsLabel || "";
  document.getElementById("editAmount").value = order.amount || 0;
  document.getElementById("editStatus").value = order.status || "Pending Verification";
  document.getElementById("editCustomerName").value = order.customerName || "";
  document.getElementById("editCustomerPhone").value = order.customerPhone || "";
  document.getElementById("editCustomerAddress").value = order.customerAddress || "";
  document.getElementById("editCustomerPincode").value = order.customerPincode || "";

  adminEditOverlay.classList.add("open");
}

function closeEditModal() {
  adminEditOverlay.classList.remove("open");
  currentEditOrderId = null;
}

adminEditClose.addEventListener("click", closeEditModal);
adminEditCancel.addEventListener("click", closeEditModal);
adminEditOverlay.addEventListener("click", (e) => {
  if (e.target === adminEditOverlay) closeEditModal();
});

adminEditForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentEditOrderId) return;

  const { doc, updateDoc } = window.firebaseUtils;
  const db = window.firebaseDb;

  const previousOrder = allOrders.find(o => o.id === currentEditOrderId);
  const newStatus = document.getElementById("editStatus").value;
  const messageBuilder = WHATSAPP_MESSAGE_BUILDERS[newStatus];
  const willSendMessage = messageBuilder && previousOrder?.status !== newStatus;

  // Open the tab NOW (synchronously, inside the submit event) so popup
  // blockers never intercept it — filled in with the real URL after saving.
  const preOpenedWindow = willSendMessage ? window.open("", "_blank") : null;

  const updatedFields = {
    itemName: document.getElementById("editItemName").value.trim(),
    pcsLabel: document.getElementById("editPcsLabel").value.trim(),
    amount: Number(document.getElementById("editAmount").value),
    status: newStatus,
    customerName: document.getElementById("editCustomerName").value.trim(),
    customerPhone: document.getElementById("editCustomerPhone").value.trim(),
    customerAddress: document.getElementById("editCustomerAddress").value.trim(),
    customerPincode: document.getElementById("editCustomerPincode").value.trim()
  };

  const saveBtn = document.getElementById("adminEditSaveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    await updateDoc(doc(db, "orders", currentEditOrderId), updatedFields);

    if (willSendMessage) {
      const updatedOrder = { ...previousOrder, ...updatedFields };
      openWhatsAppMessage(updatedOrder, messageBuilder(updatedOrder), preOpenedWindow);
    } else if (preOpenedWindow) {
      preOpenedWindow.close();
    }

    closeEditModal();
  } catch (err) {
    console.error("Edit save failed:", err);
    if (preOpenedWindow) preOpenedWindow.close();
    alert("Could not save changes. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
});

/* ─────────────────────────────
   DELETE ORDER (direct Firestore delete)
───────────────────────────── */
async function deleteOrder(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  const label = order ? order.orderId : orderId;

  const confirmed = confirm(`Delete order ${label}? This cannot be undone.`);
  if (!confirmed) return;

  const { doc, deleteDoc } = window.firebaseUtils;
  const db = window.firebaseDb;

  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Could not delete this order. Please try again.");
  }
}

/* ─────────────────────────────
   LIGHTBOX CLOSE
───────────────────────────── */
adminLightboxClose.addEventListener("click", () => adminLightbox.classList.remove("open"));
adminLightbox.addEventListener("click", (e) => {
  if (e.target === adminLightbox) adminLightbox.classList.remove("open");
});
