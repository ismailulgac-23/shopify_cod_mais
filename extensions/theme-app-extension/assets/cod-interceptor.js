/**
 * COD Interceptor - Fotoğrafa Birebir Uygun Tasarım
 * Büyük fontlar, mobilde tam sayfa
 */

(function () {
  "use strict";

  let isPopupOpen = false;
  let isProcessing = false;
  let selectedPaymentMethod = "online";
  let selectedCodPaymentType = null; // null, "cash" veya "card"
  let verificationCode = null;

  const turkishCities = [
    "Adana",
    "Adıyaman",
    "Afyonkarahisar",
    "Ağrı",
    "Aksaray",
    "Amasya",
    "Ankara",
    "Antalya",
    "Ardahan",
    "Artvin",
    "Aydın",
    "Balıkesir",
    "Bartın",
    "Batman",
    "Bayburt",
    "Bilecik",
    "Bingöl",
    "Bitlis",
    "Bolu",
    "Burdur",
    "Bursa",
    "Çanakkale",
    "Çankırı",
    "Çorum",
    "Denizli",
    "Diyarbakır",
    "Düzce",
    "Edirne",
    "Elazığ",
    "Erzincan",
    "Erzurum",
    "Eskişehir",
    "Gaziantep",
    "Giresun",
    "Gümüşhane",
    "Hakkari",
    "Hatay",
    "Iğdır",
    "Isparta",
    "İstanbul",
    "İzmir",
    "Kahramanmaraş",
    "Karabük",
    "Karaman",
    "Kars",
    "Kastamonu",
    "Kayseri",
    "Kilis",
    "Kırıkkale",
    "Kırklareli",
    "Kırşehir",
    "Kocaeli",
    "Konya",
    "Kütahya",
    "Malatya",
    "Manisa",
    "Mardin",
    "Mersin",
    "Muğla",
    "Muş",
    "Nevşehir",
    "Niğde",
    "Ordu",
    "Osmaniye",
    "Rize",
    "Sakarya",
    "Samsun",
    "Şanlıurfa",
    "Siirt",
    "Sinop",
    "Şırnak",
    "Sivas",
    "Tekirdağ",
    "Tokat",
    "Trabzon",
    "Tunceli",
    "Uşak",
    "Van",
    "Yalova",
    "Yozgat",
    "Zonguldak",
  ];

  console.log("🚀 COD Interceptor v3 yüklendi");

  function isAppEnabled() {
    const appBlock = document.getElementById("cod-interceptor-active");
    return appBlock && appBlock.dataset.enabled === "true";
  }

  function isCheckoutUrl(url) {
    if (!url) return false;
    const urlStr = url.toString().toLowerCase();
    return (
      urlStr.includes("/checkouts/") ||
      urlStr.includes("/checkout") ||
      urlStr.includes("checkout.shopify.com")
    );
  }

  function openCODPopup(event) {
    if (isPopupOpen || isProcessing) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      return;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    isProcessing = true;
    console.log("📦 COD Popup açılıyor...");

    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        createPopup(cart);
        isProcessing = false;
      })
      .catch((err) => {
        console.error("Cart yükleme hatası:", err);
        createPopup(null);
        isProcessing = false;
      });
  }

  // Tailwind temizleme fonksiyonu
  function removeTailwindScripts() {
    const tailwindCdn = document.getElementById("cod-tailwind-cdn");
    if (tailwindCdn) {
      tailwindCdn.remove();
    }
    
    const tailwindConfig = document.getElementById("cod-tailwind-config");
    if (tailwindConfig) {
      tailwindConfig.remove();
    }
  }

  function createPopup(cartData) {
    if (document.getElementById("cod-popup-overlay")) {
      return;
    }

    isPopupOpen = true;
    window.codCartData = cartData;

    // Tailwind CSS CDN ekle
    if (!document.getElementById("cod-tailwind-cdn")) {
      const tailwindScript = document.createElement("script");
      tailwindScript.id = "cod-tailwind-cdn";
      tailwindScript.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(tailwindScript);

      // Tailwind Config ekle
      const tailwindConfig = document.createElement("script");
      tailwindConfig.id = "cod-tailwind-config";
      tailwindConfig.textContent = `
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                orange: {
                  50: '#fff7ed',
                  100: '#ffedd5',
                  200: '#fed7aa',
                  300: '#fdba74',
                  400: '#fb923c',
                  500: '#f97316',
                  600: '#ea580c',
                  700: '#c2410c',
                  800: '#9a3412',
                  900: '#7c2d12',
                }
              }
            }
          }
        }
      `;
      document.head.appendChild(tailwindConfig);
    }

    // MutationObserver ile overlay kaldırılmasını izle
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.removedNodes.forEach(function(node) {
          if (node.id === "cod-popup-overlay") {
            removeTailwindScripts();
            observer.disconnect();
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true });

    // Sayfa görünür olduğunda butonu sıfırla (geri tuşu için)
    const resetButtonOnReturn = function () {
      setTimeout(() => {
        const btn = document.getElementById("payment-action-btn");
        const finalTotalEl = document.getElementById("final-total");
        if (btn && finalTotalEl && btn.disabled) {
          btn.disabled = false;
          btn.innerHTML = `Siparişi Tamamla - ${finalTotalEl.textContent}`;
        }
      }, 100);
    };

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        resetButtonOnReturn();
      }
    });

    window.addEventListener("focus", resetButtonOnReturn);

    const overlay = document.createElement("div");
    overlay.id = "cod-popup-overlay";
    overlay.className =
      "fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-0 md:p-4";
    overlay.style.fontFamily =
      "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    overlay.innerHTML = `
      <style>
        /* Sadece popup içindeki elementlere özel stiller */
        #cod-popup-overlay * {
          font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        /* Radio button renkleri */
        #cod-popup-overlay input[type="radio"] {
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          width: 15px !important;
          height: 15px !important;
          border: 2px solid #d1d5db !important;
          border-radius: 50% !important;
          outline: none !important;
          cursor: pointer !important;
          position: relative !important;
          background-color: white !important;
        }
        
        #cod-popup-overlay input[type="radio"]:checked {
          border-color: #7cca00 !important;
          background-color: #7cca00 !important;
        }
        
        #cod-popup-overlay input[type="radio"]:checked::before {
          content: '' !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: white !important;
        }
        
        #cod-popup-overlay input[type="radio"]:focus {
          box-shadow: 0 0 0 3px rgba(124, 202, 0, 0.2) !important;
        }
        
        /* Kırmızı border animasyonu */
        @keyframes errorShake {
          0%, 100% {
            border-color: #ef4444;
          }
          50% {
            border-color: #dc2626;
          }
        }
        
        .payment-type-error {
          animation: errorShake 0.5s ease-in-out 8;
          border-color: #ef4444 !important;
        }
        
        /* Toast Notification Animasyonları */
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .toast-enter {
          animation: slideInRight 0.3s ease-out forwards;
        }
        
        .toast-exit {
          animation: slideOutRight 0.3s ease-in forwards;
        }
        
        /* Kod girişi alanı animasyonu */
        @keyframes expandDown {
          from {
            max-height: 0;
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            max-height: 200px;
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .code-input-enter {
          animation: expandDown 0.3s ease-out forwards;
        }
        
        /* Form fade out/in animasyonları */
        @keyframes fadeOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
            max-height: 2000px;
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 2000px;
          }
        }
        
        .form-fade-out {
          animation: fadeOutUp 0.4s ease-out forwards;
        }
        
        .form-fade-in {
          animation: fadeInDown 0.4s ease-out forwards;
        }
      </style>
      
      <!-- Toast Container -->
      <div id="toast-container" class="fixed top-4 right-4 z-[1000000] flex flex-col gap-3" style="pointer-events: none;">
      </div>
      <div class="bg-white w-full h-full md:h-auto md:rounded-2xl md:shadow-2xl md:max-w-6xl md:max-h-[95vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div>
            <h2 class="text-3xl font-medium text-gray-900">wallGecko Ödeme</h2>
            <p class="text-lg text-gray-500 mt-1">Siparişinizi saniyeler içinde tamamlayın</p>
          </div>
          <button onclick="window.closeCODPopup()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <!-- Sol Panel - Sipariş Özeti -->
            <div style="background-color: #f8f8f8;" class="p-6 lg:border-r border-gray-200">
              <h3 class="text-2xl font-medium text-gray-900 mb-5">Sipariş Özeti</h3>
              
              <div id="cart-items-container" class="space-y-4 mb-6">
                <!-- Ürünler buraya yüklenecek -->
              </div>

              <div class="flex justify-between items-center pt-5 mt-5 border-t border-gray-300">
                <span class="text-2xl font-medium text-gray-900">Toplam</span>
                <span class="text-2xl font-semibold text-[#7cca00]" id="total-amount"></span>
              </div>
            </div>

            <!-- Sağ Panel - Ödeme Yöntemi ve Form -->
            <div class="p-6">
              <h3 class="text-2xl font-medium text-gray-900 mb-5">Ödeme Yöntemi</h3>

              <div class="space-y-3 mb-6">
                <!-- Online Ödeme -->
                <label class="flex items-center gap-4 p-4 border border-[#7cca00] bg-green-50 rounded-xl cursor-pointer transition-all payment-option payment-option-selected">
                  <input type="radio" name="payment-method" value="online" checked class="mt-1 w-5 h-5 text-[#7cca00] focus:ring-[#7cca00]">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                      <span class="text-xl font-bold text-gray-900">Online Ödeme</span>
                    </div>
                    <p class="text-base text-gray-500">Kart veya cüzdan ile online ödeme yapın - Doğrulama gerekli değil</p>
                  </div>

                  <span class="ml-auto px-2.5 py-1 bg-green-100 text-green-700 text-base font-medium rounded-full">Popüler</span>
                </label>

                <label class="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer payment-option">
                  <input type="radio" name="payment-method" value="cod" class="mt-1 w-5 h-5 text-[#7cca00] focus:ring-[#7cca00]">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <span class="text-xl font-bold text-gray-900">Kapıda Ödeme</span>
                    </div>
                    <p class="text-base text-gray-600">Ürünü teslim alırken ödeyin - Doğrulama gerekli</p>
                  </div>
                </label>
              </div>

              <!-- Form Container -->
              <div id="cod-form-container" class="space-y-5 transition-all duration-300" style="display: none;">
                <!-- WhatsApp Numarası -->
                <div>
                  <label class="flex items-center gap-2 text-xl font-bold text-gray-900 mb-3">
                    WhatsApp Numarası
                    <span class="text-red-500">*</span>
                  </label>
                  
                  <!-- Success Banner (Hidden by default) -->
                  <div id="verification-success-banner" class="hidden mb-3 bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3">
                    <svg class="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="flex-1">
                      <p class="text-green-900 font-medium">Doğrulanmış WhatsApp: <span id="verified-phone-display"></span></p>
                    </div>
                    <button onclick="window.changePhoneNumber()" class="text-green-700 hover:text-green-900 font-medium text-xl underline">
                      Değiştir
                    </button>
                  </div>
                  
                  <div id="phone-input-container" class="flex gap-2">
                    <div class="relative flex-1">
                      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 301 201"><g fill="none"><path fill="#e30a17" d="M.5.5h300v200H.5z"/><circle cx="106.75" cy="100.5" r="50" fill="#fff"/><circle cx="119.25" cy="100.5" r="40" fill="#e30a17"/><path fill="#fff" d="m146.334 100.5l45.225 14.695l-27.951-38.472v47.553l27.951-38.471z"/></g></svg>
                      </div>

                      <button onclick="window.sendVerificationCode()" id="send-code-btn" disabled
                      class="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-transparent text-[#7cca00] rounded-lg transition-colors flex items-center justify-center cursor-not-allowed border border-[#7cca00]">
                      Kod Gönder
                    </button>
                      <input type="tel" id="whatsapp-phone" placeholder="(501) 098 XXXX"
                        class="w-full pl-14 pr-48 py-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-1 focus:ring-[#7cca00] focus:border-transparent">
                    </div>
                  </div>
                  <p id="verification-warning-text" class="text-base text-red-500 mt-2">Sahte siparişleri önlemek için telefon numaranızı doğrulamanızı rica ederiz.</p>
                </div>
                
                <!-- Kod Girişi Alanı (Dinamik) -->
                <div id="verification-code-container" class="hidden overflow-hidden">
                </div>

                <!-- Ad Soyad -->
                <div>
                  <label class="text-xl font-bold text-gray-900 mb-3 block">
                    Ad Soyad
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <input type="text" id="customer-name" placeholder="Adınız ve Soyadınız"
                      class="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-1 focus:ring-[#7cca00] focus:border-transparent">
                  </div>
                </div>

                <!-- Şehir -->
                <div>
                  <label class="text-xl font-bold text-gray-900 mb-3 block">
                    Şehir
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <select id="customer-city"
                      class="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-1 focus:ring-[#7cca00] focus:border-transparent bg-white appearance-none">
                      <option value="">Şehir seçin</option>
                      ${turkishCities.map((city) => `<option value="${city}">${city}</option>`).join("")}
                    </select>
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Adres -->
                <div>
                  <label class="text-xl font-bold text-gray-900 mb-3 block">
                    Adres
                    <span class="text-red-500">*</span>
                  </label>
                    <textarea
                    rows="6"
                    type="text" id="customer-address" placeholder="Daire no, Kat, Bina no, Sokak" class="w-full p-4 border border-gray-300 rounded-lg text-xl focus:outline-none focus:ring-1 focus:ring-[#7cca00] focus:border-transparent"></textarea>
                </div>

                <!-- Kapıda Ödeme Şekli -->
                <div>
                  <label class="text-xl font-bold text-gray-900 mb-3 block">
                    Kapıda Ödeme Şeklinizi Seçin
                    <span class="text-red-500">*</span>
                  </label>
                  
                  <div class="grid grid-cols-2 gap-3" id="cod-payment-type-container">
                    <!-- Kapıda Nakit -->
                    <label class="cod-payment-type-option flex flex-col items-center gap-3 p-4 border-2 border-gray-200 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md">
                      <input type="radio" name="cod-payment-type" value="cash" class="hidden">
                      <div class="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                        <svg class="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                      </div>
                      <span class="text-lg font-semibold text-gray-900 text-center">Kapıda Nakit</span>
                    </label>

                    <!-- Kapıda Kredi Kartı -->
                    <label class="cod-payment-type-option flex flex-col items-center gap-3 p-4 border-2 border-gray-200 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md">
                      <input type="radio" name="cod-payment-type" value="card" class="hidden">
                      <div class="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                        <svg class="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                        </svg>
                      </div>
                      <span class="text-lg font-semibold text-gray-900 text-center">Kapıda Kredi Kartı</span>
                    </label>
                  </div>
                </div>

              </div>
              
              <!-- Tek Buton - Hem COD hem Online için (Form dışında) -->
              <button onclick="window.handlePaymentAction()" id="payment-action-btn"
                class="w-full py-5 bg-[#7cca00] text-white rounded-lg text-2xl font-bold hover:bg-[#6bb300] transition-colors mt-6">
                Siparişi Tamamla - <span id="final-total"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    loadCartItems(cartData);
    setupPaymentMethodListeners();
    setupPhoneFormatting();
    setupCodPaymentTypeListeners();

    console.log("✅ Popup açıldı");
  }

  function setupCodPaymentTypeListeners() {
    const paymentTypeOptions = document.querySelectorAll(
      ".cod-payment-type-option",
    );
    const radios = document.querySelectorAll('input[name="cod-payment-type"]');

    radios.forEach((radio) => {
      radio.addEventListener("change", function () {
        selectedCodPaymentType = this.value;

        // Tüm seçenekleri sıfırla
        paymentTypeOptions.forEach((opt) => {
          opt.classList.remove(
            "border-[#7cca00]",
            "bg-green-50",
            "cod-payment-selected",
          );
          opt.classList.add("border-gray-200", "bg-white");

          // Icon container'ı güncelle
          const iconContainer = opt.querySelector("div");
          iconContainer.classList.remove("bg-white");
          iconContainer.classList.add("bg-gray-100");

          // Icon rengini güncelle
          const icon = opt.querySelector("svg");
          icon.classList.remove("text-[#7cca00]");
          icon.classList.add("text-gray-600");
        });

        // Seçili olanı vurgula
        const selectedOption = this.closest(".cod-payment-type-option");
        selectedOption.classList.remove("border-gray-200", "bg-white");
        selectedOption.classList.add(
          "border-[#7cca00]",
          "bg-green-50",
          "cod-payment-selected",
        );

        // Icon container'ı güncelle
        const iconContainer = selectedOption.querySelector("div");
        iconContainer.classList.remove("bg-gray-100");
        iconContainer.classList.add("bg-white");

        // Icon rengini güncelle
        const icon = selectedOption.querySelector("svg");
        icon.classList.remove("text-gray-600");
        icon.classList.add("text-[#7cca00]");

        console.log("💳 Kapıda ödeme şekli seçildi:", this.value);
      });
    });
  }

  function loadCartItems(cartData) {
    const container = document.getElementById("cart-items-container");
    const subtotalEl = document.getElementById("subtotal-amount");
    const totalEl = document.getElementById("total-amount");
    const finalTotalEl = document.getElementById("final-total");

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      container.innerHTML =
        '<p class="text-base text-gray-500">Sepetiniz boş</p>';
      return;
    }

    container.innerHTML = cartData.items
      .map((item) => {
        console.log("item", item);

        // İndirim kontrolü: original_line_price > line_price
        const hasDiscount =
          item.original_line_price >
          item.line_price
            .toString()
            .substr(0, item.line_price.toString().length - 1);
        const discount = hasDiscount
          ? Math.round(
              ((item.original_line_price - item.line_price) /
                item.original_line_price) *
                100,
            )
          : 0;

        return `
        <div class="relative bg-white p-4 rounded-lg border border-gray-200" data-item-key="${item.key}">
          ${discount > 0 ? `<div class="absolute top-2 right-2 px-2.5 py-1 bg-red-600 text-white text-sm font-semibold rounded shadow-sm z-10">-${discount}%</div>` : ""}
          
            <div class="flex gap-4 items-center">
              ${item.image ? `<img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">` : ""}
              
              <div class="flex-1 min-w-0">
                <h4 class="text-xl font-semibold text-gray-900 mb-1">${item.title}</h4>
                <p class="text-base text-gray-500">${item.variant_title || ""}</p>
              </div>
            
            </div>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-3 mt-3 p-1 bg-[#f8f8f8] rounded">
                <button onclick="window.updateCartQuantity('${item.key}', ${item.quantity - 1})" class="bg-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${item.quantity <= 1 ? "opacity-50 cursor-not-allowed" : ""}" ${item.quantity <= 1 ? "disabled" : ""}>
                  <span class="text-lg font-medium">
                    -
                  </span>
                </button>
                <span class="text-lg font-medium min-w-[2rem] text-center">${item.quantity}</span>
                <button onclick="window.updateCartQuantity('${item.key}', ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-gray-100 transition-colors">
                  <span class="text-lg font-medium">+</span>
                </button>
              </div>
            <div class="flex items-center gap-1.5 shrink-0">
              ${
                hasDiscount
                  ? `<p class="text-lg text-gray-400 line-through">${formatMoney(item.original_price)}</p>`
                  : ""
              }
              <p class="text-2xl font-medium text-gray-900">${formatMoney(item.line_price)}</p>
            </div>
            </div>
        </div>
      `;
      })
      .join("");

    const total = formatMoney(cartData.total_price);
    if (totalEl) totalEl.textContent = total;
    if (finalTotalEl) finalTotalEl.textContent = total;
  }

  function setupPaymentMethodListeners() {
    const paymentOptions = document.querySelectorAll(".payment-option");
    const radios = document.querySelectorAll('input[name="payment-method"]');

    radios.forEach((radio) => {
      radio.addEventListener("change", function () {
        selectedPaymentMethod = this.value;

        paymentOptions.forEach((opt) => {
          opt.classList.remove(
            "border-[#7cca00]",
            "bg-green-50",
            "payment-option-selected",
          );
          opt.classList.add("border-gray-200");
        });

        const selectedOption = this.closest(".payment-option");
        selectedOption.classList.remove("border-gray-200");
        selectedOption.classList.add(
          "border-[#7cca00]",
          "bg-green-50",
          "payment-option-selected",
        );

        updatePaymentUI(this.value);
        updatePaymentButton(this.value);
      });
    });
  }

  function updatePaymentUI(method) {
    const codForm = document.getElementById("cod-form-container");

    if (method === "online") {
      // Form'u animasyonlu şekilde gizle
      codForm.classList.remove("form-fade-in");
      codForm.classList.add("form-fade-out");

      setTimeout(() => {
        codForm.style.display = "none";
      }, 400);
    } else {
      // Form'u animasyonlu şekilde göster
      codForm.style.display = "block";
      codForm.classList.remove("form-fade-out");
      codForm.classList.add("form-fade-in");
    }
  }

  function updatePaymentButton(method) {
    const btn = document.getElementById("payment-action-btn");
    const finalTotalEl = document.getElementById("final-total");

    if (!btn || !finalTotalEl) return;

    const finalTotal = finalTotalEl.textContent;

    // Buton her zaman aynı görünüm ve metin
    btn.innerHTML = `Siparişi Tamamla - ${finalTotal}`;
    btn.className =
      "w-full py-5 bg-[#7cca00] text-white rounded-lg text-2xl font-bold hover:bg-[#6bb300] transition-colors mt-6";

    // Sadece onclick event değişiyor
    if (method === "online") {
      btn.onclick = window.proceedToOnlinePayment;
    } else {
      btn.onclick = window.completeOrder;
    }
  }

  function setupPhoneFormatting() {
    const phoneInput = document.getElementById("whatsapp-phone");
    const sendBtn = document.getElementById("send-code-btn");

    let lastValue = "";

    phoneInput.addEventListener("input", function (e) {
      // Sadece rakamları al
      let value = e.target.value.replace(/\D/g, "");

      // Maksimum 10 hane
      if (value.length > 10) {
        value = value.substring(0, 10);
      }

      // Formatla
      let formatted = "";
      if (value.length > 0) {
        formatted = "(" + value.substring(0, 3);
        if (value.length >= 4) {
          formatted += ") " + value.substring(3, 6);
          if (value.length >= 7) {
            formatted += " " + value.substring(6, 10);
          }
        } else if (value.length === 3) {
          formatted += ")";
        }
      }

      e.target.value = formatted;
      lastValue = value;

      // Kod gönder butonunu aktif/pasif yap
      if (value.length === 10) {
        sendBtn.disabled = false;
        sendBtn.className =
          "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#7cca00] text-white rounded-lg hover:bg-[#6bb300] transition-colors flex items-center justify-center cursor-pointer";
      } else {
        sendBtn.disabled = true;
        sendBtn.className =
          "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-transparent text-[#7cca00] rounded-lg transition-colors flex items-center justify-center cursor-not-allowed border border-[#7cca00]";
      }
    });

    // Backspace ve Delete tuşlarını dinle
    phoneInput.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();

        const currentValue = e.target.value.replace(/\D/g, "");

        if (e.key === "Backspace" && currentValue.length > 0) {
          // Son rakamı sil
          const newValue = currentValue.substring(0, currentValue.length - 1);

          // Yeni formatlanmış değeri oluştur
          let formatted = "";
          if (newValue.length > 0) {
            formatted = "(" + newValue.substring(0, 3);
            if (newValue.length >= 4) {
              formatted += ") " + newValue.substring(3, 6);
              if (newValue.length >= 7) {
                formatted += " " + newValue.substring(6, 10);
              }
            } else if (newValue.length === 3) {
              formatted += ")";
            }
          }

          e.target.value = formatted;
          lastValue = newValue;

          // Buton durumunu güncelle
          if (newValue.length === 10) {
            sendBtn.disabled = false;
            sendBtn.className =
              "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#7cca00] text-white rounded-lg hover:bg-[#6bb300] transition-colors flex items-center justify-center cursor-pointer";
          } else {
            sendBtn.disabled = true;
            sendBtn.className =
              "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-transparent text-[#7cca00] rounded-lg transition-colors flex items-center justify-center cursor-not-allowed border border-[#7cca00]";
          }
        } else if (e.key === "Delete") {
          // Delete tuşu için tüm içeriği temizle
          e.target.value = "";
          lastValue = "";
          sendBtn.disabled = true;
          sendBtn.className =
            "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-transparent text-[#7cca00] rounded-lg transition-colors flex items-center justify-center cursor-not-allowed border border-[#7cca00]";
        }
      }
    });
  }

  window.changePhoneNumber = function () {
    // Success banner'ı gizle
    document
      .getElementById("verification-success-banner")
      .classList.add("hidden");

    // Input container'ı göster
    document.getElementById("phone-input-container").classList.remove("hidden");

    // Input'ları temizle ve aktif et
    const phoneInput = document.getElementById("whatsapp-phone");
    phoneInput.value = "";
    phoneInput.disabled = false;

    // Kod gönder butonunu sıfırla
    const sendBtn = document.getElementById("send-code-btn");
    sendBtn.disabled = true;
    sendBtn.className =
      "absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-transparent text-[#7cca00] rounded-lg transition-colors flex items-center justify-center cursor-not-allowed border border-[#7cca00]";
    sendBtn.innerHTML = "Kod Gönder";

    // Uyarı metnini göster
    const warningText = document.getElementById("verification-warning-text");
    if (warningText) {
      warningText.classList.remove("hidden");
    }

    // Doğrulama durumunu sıfırla
    window.codVerifiedPhone = null;

    // Kod girişi alanını kaldır
    const codeContainer = document.getElementById(
      "verification-code-container",
    );
    if (codeContainer) {
      codeContainer.classList.add("hidden");
      codeContainer.innerHTML = "";
    }

    phoneInput.focus();
  };

  window.handlePaymentAction = function () {
    if (selectedPaymentMethod === "online") {
      window.proceedToOnlinePayment();
    } else {
      window.completeOrder();
    }
  };

  window.proceedToOnlinePayment = function () {
    const btn = document.getElementById("payment-action-btn");
    if (!btn) return;

    const shop = window.location.hostname;
    window.location.href = `https://${shop}/checkout`;
  };

  // Toast Notification Fonksiyonu
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");

    // Mevcut toast'ları kaldır
    const existingToasts = container.querySelectorAll('[id^="toast-"]');
    existingToasts.forEach((existingToast) => {
      existingToast.classList.remove("toast-enter");
      existingToast.classList.add("toast-exit");
      setTimeout(() => existingToast.remove(), 300);
    });

    const toast = document.createElement("div");
    const id = "toast-" + Date.now();
    toast.id = id;
    toast.style.pointerEvents = "auto";

    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-[#7cca00]",
    };

    const icons = {
      success:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
      error:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
      info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      warning:
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    };

    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] toast-enter`;
    toast.innerHTML = `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icons[type]}
      </svg>
      <span class="flex-1 text-base font-medium">${message}</span>
      <button onclick="document.getElementById('${id}').remove()" class="text-white hover:text-gray-200 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("toast-enter");
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.sendVerificationCode = function () {
    const phoneInput = document.getElementById("whatsapp-phone");
    const phone = phoneInput.value.replace(/\D/g, "");

    if (!phone || phone.length !== 10) {
      showToast("Lütfen geçerli bir telefon numarası girin", "error");
      phoneInput.focus();
      return;
    }

    const fullPhone = "+90" + phone;
    const sendBtn = document.getElementById("send-code-btn");
    sendBtn.disabled = true;
    sendBtn.innerHTML = `
      <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;

    fetch("/apps/cod/api/whatsapp/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: fullPhone }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Doğrulama kodu SMS ile gönderildi!", "success");

          // Kod girişi alanını göster
          const codeContainer = document.getElementById(
            "verification-code-container",
          );
          codeContainer.classList.remove("hidden");
          codeContainer.classList.add("code-input-enter");
          codeContainer.innerHTML = `
            <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4 mt-4">
              <label class="text-lg font-medium text-gray-900 mb-3 block">
                Doğrulama Kodu
                <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <input type="text" id="verification-code-input" placeholder="4 haneli kod" maxlength="4"
                  class="flex-1 px-4 py-4 border border-gray-300 rounded-lg text-xl text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#7cca00] focus:border-transparent">
                <button onclick="window.verifyCode('${fullPhone}')" id="verify-code-btn"
                  class="px-6 py-4 bg-[#7cca00] text-white rounded-lg hover:bg-[#6bb300] transition-colors font-medium text-lg">
                  Doğrula
                </button>
              </div>
              <p class="text-sm text-gray-600 mt-2">SMS ile gelen 4 haneli kodu girin</p>
            </div>
          `;

          // Kod input'una focus
          setTimeout(() => {
            document.getElementById("verification-code-input").focus();
          }, 100);

          // Gönder butonunu güncelle
          sendBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          `;
          sendBtn.disabled = false;
        } else {
          showToast(data.error || "Kod gönderilemedi", "error");
          sendBtn.disabled = false;
          sendBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          `;
        }
      })
      .catch((err) => {
        console.error("Kod gönderme hatası:", err);
        showToast("Bir hata oluştu. Lütfen tekrar deneyin.", "error");
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        `;
      });
  };

  window.verifyCode = function (phoneNumber) {
    const codeInput = document.getElementById("verification-code-input");
    const code = codeInput.value.trim();
    const verifyBtn = document.getElementById("verify-code-btn");
    const sendBtn = document.getElementById("send-code-btn");
    const phoneInput = document.getElementById("whatsapp-phone");

    if (!code || code.length !== 4) {
      showToast("Lütfen 4 haneli kodu girin", "error");
      codeInput.focus();
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;

    fetch("/apps/cod/api/whatsapp/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.verified) {
          showToast("Telefon numaranız başarıyla doğrulandı!", "success");

          // Kod alanını kaldır
          const codeContainer = document.getElementById(
            "verification-code-container",
          );
          codeContainer.classList.add("hidden");
          codeContainer.innerHTML = "";

          // Input container'ı gizle
          document
            .getElementById("phone-input-container")
            .classList.add("hidden");

          // Uyarı metnini gizle
          const warningText = document.getElementById(
            "verification-warning-text",
          );
          if (warningText) {
            warningText.classList.add("hidden");
          }

          // Success banner'ı göster
          const successBanner = document.getElementById(
            "verification-success-banner",
          );
          const phoneDisplay = document.getElementById(
            "verified-phone-display",
          );
          phoneDisplay.textContent = phoneNumber;
          successBanner.classList.remove("hidden");

          window.codVerifiedPhone = phoneNumber;
        } else {
          showToast(data.error || "Kod doğrulanamadı", "error");
          verifyBtn.disabled = false;
          verifyBtn.innerHTML = "Doğrula";
          codeInput.value = "";
          codeInput.focus();
        }
      })
      .catch((err) => {
        console.error("Kod doğrulama hatası:", err);
        showToast("Kod doğrulanırken hata oluştu", "error");
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = "Doğrula";
      });
  };

  window.completeOrder = function () {
    // Online ödeme seçiliyse validasyon yapma, direkt checkout'a git
    if (selectedPaymentMethod === "online") {
      window.proceedToOnlinePayment();
      return;
    }

    // Kapıda ödeme için validasyonlar
    const phone = document
      .getElementById("whatsapp-phone")
      .value.replace(/\D/g, "");
    const name = document.getElementById("customer-name").value.trim();
    const city = document.getElementById("customer-city").value.trim();
    const address = document.getElementById("customer-address").value.trim();

    if (!phone || phone.length !== 10) {
      showToast("Lütfen telefon numaranızı girin", "error");
      document.getElementById("whatsapp-phone").focus();
      return;
    }

    if (!window.codVerifiedPhone) {
      showToast("Lütfen önce telefon numaranızı doğrulayın", "error");
      return;
    }

    if (!name || name.length < 3) {
      showToast("Lütfen adınızı ve soyadınızı girin", "error");
      document.getElementById("customer-name").focus();
      return;
    }

    if (name.split(" ").filter((p) => p.length > 0).length < 2) {
      showToast("Lütfen hem adınızı hem de soyadınızı girin", "error");
      document.getElementById("customer-name").focus();
      return;
    }

    if (!city) {
      showToast("Lütfen şehir seçin", "error");
      document.getElementById("customer-city").focus();
      return;
    }

    if (!address || address.length < 10) {
      showToast("Lütfen detaylı adresinizi girin", "error");
      document.getElementById("customer-address").focus();
      return;
    }

    // Kapıda ödeme şekli kontrolü
    if (!selectedCodPaymentType) {
      showToast("Lütfen kapıda ödeme şeklinizi seçin", "error");

      // Kırmızı border animasyonu
      const paymentTypeOptions = document.querySelectorAll(
        ".cod-payment-type-option",
      );
      paymentTypeOptions.forEach((opt) => {
        opt.classList.add("payment-type-error");
      });

      // 4 saniye sonra animasyonu kaldır
      setTimeout(() => {
        paymentTypeOptions.forEach((opt) => {
          opt.classList.remove("payment-type-error");
        });
      }, 4000);

      // Scroll to payment type section
      document.getElementById("cod-payment-type-container").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    const orderData = {
      shop: window.Shopify?.shop || window.location.hostname,
      customerName: name,
      customerPhone: window.codVerifiedPhone,
      customerEmail: "",
      customerAddress: address,
      customerCity: city,
      customerCountry: "Türkiye",
      customerZip: "",
      cartItems: window.codCartData?.items || [],
      totalAmount: window.codCartData?.total_price || 0,
      cartToken: window.codCartData?.token || `cod_${Date.now()}`,
      codPaymentType: selectedCodPaymentType, // Kapıda ödeme şekli
      landingPage:
        sessionStorage.getItem("landingPage") || window.location.href,
      referringSite:
        sessionStorage.getItem("referringSite") || document.referrer,
      userAgent: navigator.userAgent,
    };

    const btn = document.getElementById("payment-action-btn");
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;

    fetch("/apps/cod/api/orders/create-cod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetch("/cart/clear.js", { method: "POST" });
          showToast(
            "Siparişiniz başarıyla oluşturuldu! Sipariş No: " +
              (data.orderName || data.orderNumber),
            "success",
          );

          setTimeout(() => {
            const redirectUrl =
              data.thankYouUrl || data.orderStatusUrl || `https://${data.shop}`;
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          showToast(data.error || "Sipariş oluşturulamadı", "error");
          btn.disabled = false;
          const finalTotal = document.getElementById("final-total").textContent;
          btn.innerHTML = `Siparişi Tamamla - ${finalTotal}`;
        }
      })
      .catch((err) => {
        console.error("Sipariş hatası:", err);
        showToast("Bir hata oluştu. Lütfen tekrar deneyin.", "error");
        btn.disabled = false;
        const finalTotal = document.getElementById("final-total").textContent;
        btn.innerHTML = `Siparişi Tamamla - ${finalTotal}`;
      });
  };

  window.updateCartQuantity = function (itemKey, newQuantity) {
    if (newQuantity < 1) {
      // Ürünü sepetten kaldır
      if (!confirm("Bu ürünü sepetten kaldırmak istediğinize emin misiniz?")) {
        return;
      }
      newQuantity = 0;
    }

    // Loading state göster
    const itemElement = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (itemElement) {
      itemElement.style.opacity = "0.5";
      itemElement.style.pointerEvents = "none";
    }

    // Shopify cart.js API ile güncelle
    fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: itemKey,
        quantity: newQuantity,
      }),
    })
      .then((res) => res.json())
      .then((cart) => {
        // Global cart data'yı güncelle
        window.codCartData = cart;

        // UI'ı yeniden yükle
        loadCartItems(cart);

        // Toast göster
        if (newQuantity === 0) {
          showToast("Ürün sepetten kaldırıldı", "info");
        } else {
          showToast("Sepet güncellendi", "success");
        }
      })
      .catch((err) => {
        console.error("Sepet güncelleme hatası:", err);
        showToast("Sepet güncellenirken hata oluştu", "error");

        // Loading state'i kaldır
        if (itemElement) {
          itemElement.style.opacity = "1";
          itemElement.style.pointerEvents = "auto";
        }
      });
  };

  window.closeCODPopup = function () {
    const overlay = document.getElementById("cod-popup-overlay");
    if (overlay) {
      window.location.reload();
    }
  };

  function formatMoney(cents) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(cents / 100);
  }

  function initInterceptor() {
    if (!isAppEnabled()) {
      console.log("❌ COD Interceptor devre dışı");
      return;
    }

    console.log("✅ COD Interceptor AKTIF");

    document.addEventListener(
      "click",
      function (e) {
        if (e.target.closest("#cod-popup-overlay")) return;

        const clickable = e.target.closest(
          'a, button, [role="button"], input[type="submit"]',
        );
        if (clickable) {
          const href = clickable.getAttribute("href") || "";
          const className = clickable.className || "";

          if (
            isCheckoutUrl(href) ||
            className.toLowerCase().includes("checkout") ||
            className.toLowerCase().includes("payment")
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setTimeout(() => openCODPopup(null), 10);
            return false;
          }
        }
      },
      true,
    );

    let lastUrl = window.location.href;
    setInterval(function () {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl && isCheckoutUrl(currentUrl)) {
        window.history.back();
        setTimeout(() => {
          if (!isPopupOpen) openCODPopup(null);
        }, 50);
      }
      lastUrl = currentUrl;
    }, 100);

    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
      if (url && isCheckoutUrl(url)) {
        openCODPopup(null);
        return;
      }
      return originalPushState.apply(history, arguments);
    };

    document.addEventListener(
      "submit",
      function (e) {
        const action = e.target.getAttribute("action");
        if (action && isCheckoutUrl(action)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openCODPopup(e);
          return false;
        }
      },
      true,
    );

    console.log("✅ Tüm interceptorlar aktif");
  }

  if (!sessionStorage.getItem("landingPage")) {
    sessionStorage.setItem("landingPage", window.location.href);
    sessionStorage.setItem("referringSite", document.referrer || "");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInterceptor);
  } else {
    initInterceptor();
  }
})();
