/* ══════════════════════════════════════════════════════
   PRODUCTS PAGE — Lil' Cocolates Admin
   ⚠️ This list mirrors MENU_DATA in the customer site's
   script.js. If you add/remove/rename a product there,
   update this list to match (same category/group/item names).
══════════════════════════════════════════════════════ */
const PRODUCT_LIST = [
  { id: "regulars|Nut collection|Nut bites", name: "Nut bites", category: "Regulars", group: "Nut collection" },
  { id: "regulars|Nut collection|Classic nut bar", name: "Classic nut bar", category: "Regulars", group: "Nut collection" },
  { id: "regulars|Nut collection|Duo nut slabs", name: "Duo nut slabs", category: "Regulars", group: "Nut collection" },
  { id: "regulars|Nut collection|Nut heart bites", name: "Nut heart bites", category: "Regulars", group: "Nut collection" },
  { id: "regulars|Nut collection|Nut heart bar", name: "Nut heart bar", category: "Regulars", group: "Nut collection" },
  { id: "regulars|Bonbon|Classic bonbon", name: "Classic bonbon", category: "Regulars", group: "Bonbon" },
  { id: "regulars|Bonbon|Bonbon blocks", name: "Bonbon blocks", category: "Regulars", group: "Bonbon" },
  { id: "regulars|Plain bar|Plain bar", name: "Plain bar", category: "Regulars", group: "Plain bar" },
  { id: "treat-boxes|Strawberry treat box|Classic — 9 pcs", name: "Classic — 9 pcs", category: "Treat boxes", group: "Strawberry treat box" },
  { id: "treat-boxes|Strawberry treat box|Petite — 4 pcs", name: "Petite — 4 pcs", category: "Treat boxes", group: "Strawberry treat box" },
  { id: "treat-boxes|Pomegranate treat box|Classic — 6 pcs", name: "Classic — 6 pcs", category: "Treat boxes", group: "Pomegranate treat box" },
  { id: "treat-boxes|Pomegranate treat box|Petite — 4 pcs", name: "Petite — 4 pcs", category: "Treat boxes", group: "Pomegranate treat box" },
  { id: "luxury|Crown royale|Iconic crown", name: "Iconic crown", category: "Luxury launch", group: "Crown royale" },
  { id: "luxury|Crown royale|Classic crown", name: "Classic crown", category: "Luxury launch", group: "Crown royale" },
  { id: "luxury|Crown royale|Signature crown", name: "Signature crown", category: "Luxury launch", group: "Crown royale" },
  { id: "luxury|Bouquet|Signature bouquet", name: "Signature bouquet", category: "Luxury launch", group: "Bouquet" },
  { id: "luxury|Bouquet|Classic bouquet", name: "Classic bouquet", category: "Luxury launch", group: "Bouquet" },
  { id: "luxury|Bouquet|Petite bouquet", name: "Petite bouquet", category: "Luxury launch", group: "Bouquet" },
  { id: "valentine|Gift box|Classic box", name: "Classic box", category: "Valentine's special", group: "Gift box" },
  { id: "valentine|Gift box|Blend box", name: "Blend box", category: "Valentine's special", group: "Gift box" },
  { id: "valentine|Gift box|Signature box", name: "Signature box", category: "Valentine's special", group: "Gift box" }
];

// Rose colours shown in the order form for Valentine's Special items
const ROSE_LIST = ["Red rose", "Baby Pink rose", "Blue rose", "White rose"];

let productAvailability = {}; // id → true/false, loaded from Firestore
let roseAvailability = {};    // rose name → true/false, loaded from Firestore

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
  const { onAuthStateChanged, collection, onSnapshot } = window.firebaseUtils;

  onAuthStateChanged(window.firebaseAuth, (user) => {
    if (!user) {
      window.location.href = "index.html"; // not logged in — send to login
      return;
    }

    document.getElementById("productsPageWrap").style.display = "block";

    const db = window.firebaseDb;
      onSnapshot(collection(db, "productAvailability"), (snapshot) => {
      productAvailability = {};
      snapshot.forEach(docSnap => {
        productAvailability[docSnap.id] = docSnap.data().available;
      });
      renderProducts();
      }, (err) => {
        console.error("Products failed to load:", err);
        document.getElementById("productsListContainer").innerHTML =
          "<p style='color:#B3261E'>Could not load products. Check Firestore rules.</p>";
      });

      onSnapshot(collection(db, "roseAvailability"), (snapshot) => {
        roseAvailability = {};
        snapshot.forEach(docSnap => {
          roseAvailability[docSnap.id] = docSnap.data().available;
        });
        renderProducts();
      }, (err) => {
        console.error("Rose availability failed to load:", err);
      });
  });
});

function renderProducts() {
  const container = document.getElementById("productsListContainer");

  // Group products by category, preserving PRODUCT_LIST order
  const categories = [];
  PRODUCT_LIST.forEach(p => {
    if (!categories.includes(p.category)) categories.push(p.category);
  });

  container.innerHTML = categories.map(cat => {
    const items = PRODUCT_LIST.filter(p => p.category === cat);
    const rows = items.map(p => {
      // Default to available (true) when no Firestore doc exists yet
      const isAvailable = productAvailability[p.id] !== false;
      return `
        <div class="product-row">
          <div>
            <div class="product-row-name">${p.name}</div>
            <div class="product-row-group">${p.group}</div>
          </div>
          <label class="availability-toggle">
            <input type="checkbox" data-product-id="${p.id}" ${isAvailable ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }).join("");

    return `
      <div class="products-category-block">
        <div class="products-category-title">${cat}</div>
        ${rows}
      </div>
    `;
    }).join("");

  // Append the Rose Colours section (used by all Valentine's Special items)
  container.innerHTML += `
    <div class="products-category-block">
      <div class="products-category-title">Rose Colours (Valentine's Special)</div>
      ${ROSE_LIST.map(rose => {
        const isAvailable = roseAvailability[rose] !== false;
        return `
          <div class="product-row">
            <div>
              <div class="product-row-name">${rose}</div>
            </div>
            <label class="availability-toggle">
              <input type="checkbox" data-rose-id="${rose}" ${isAvailable ? "checked" : ""}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Wire up PRODUCT toggle switches → write straight to Firestore
  container.querySelectorAll(".availability-toggle input[data-product-id]").forEach(checkbox => {
    checkbox.addEventListener("change", async (e) => {
      const { doc, setDoc } = window.firebaseUtils;
      const db = window.firebaseDb;
      const productId = e.target.dataset.productId;
      const newValue = e.target.checked;

      e.target.disabled = true;
      try {
        await setDoc(doc(db, "productAvailability", productId), { available: newValue }, { merge: true });
      } catch (err) {
        console.error("Failed to update availability:", err);
        alert("Could not update this product. Please try again.");
        e.target.checked = !newValue;
      } finally {
        e.target.disabled = false;
      }
    });
  });

  // Wire up ROSE toggle switches → write straight to Firestore
  container.querySelectorAll(".availability-toggle input[data-rose-id]").forEach(checkbox => {
    checkbox.addEventListener("change", async (e) => {
      const { doc, setDoc } = window.firebaseUtils;
      const db = window.firebaseDb;
      const roseId = e.target.dataset.roseId;
      const newValue = e.target.checked;

      e.target.disabled = true;
      try {
        await setDoc(doc(db, "roseAvailability", roseId), { available: newValue }, { merge: true });
      } catch (err) {
        console.error("Failed to update rose availability:", err);
        alert("Could not update this rose colour. Please try again.");
        e.target.checked = !newValue;
      } finally {
        e.target.disabled = false;
      }
    });
  });
}
