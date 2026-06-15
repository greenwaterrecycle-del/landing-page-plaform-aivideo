/**
 * ═══════════════════════════════════════════════════════════════
 * BETAGEN EVENT — Landing Page Script
 * Techstack: HTML + CSS + Vanilla JS
 *
 * TODO: Thay đổi API_ENDPOINT bên dưới thành URL webhook n8n thật
 *       khi đã triển khai backend.
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. CONFIG — THAY ĐỔI WEBHOOK URL N8N TẠI ĐÂY
  ───────────────────────────────────────────────────────────── */
  const API_ENDPOINT = "YOUR_N8N_WEBHOOK_URL_HERE";
  /* Khi đã có webhook n8n thật, thay đổi giá trị trên.
   * Ví dụ: const API_ENDPOINT = "https://your-n8n-instance.com/webhook/xxx";
   *
   * Nếu API_ENDPOINT vẫn là "YOUR_N8N_WEBHOOK_URL_HERE",
   * hệ thống sẽ chạy MOCK mode (giả lập 5 giây).
   */

  /* ─────────────────────────────────────────────────────────────
     2. STATE
  ───────────────────────────────────────────────────────────── */
  let selectedFile = null;
  let isLoading = false;

  /* ─────────────────────────────────────────────────────────────
     3. DOM ELEMENTS
  ───────────────────────────────────────────────────────────── */
  const navbar        = document.getElementById('navbar');
  const navHamburger  = document.getElementById('navHamburger');
  const navMenu      = document.getElementById('navMenu');
  const imageInput   = document.getElementById('imageInput');
  const uploadArea   = document.getElementById('uploadArea');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg   = document.getElementById('previewImg');
  const previewFilename = document.getElementById('previewFilename');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const btnCreateVideo = document.getElementById('btnCreateVideo');
  const errorMessage  = document.getElementById('errorMessage');
  const errorText     = document.getElementById('errorText');
  const loadingState  = document.getElementById('loadingState');
  const resultSection = document.getElementById('resultSection');
  const resultVideo   = document.getElementById('resultVideo');
  const resultPlaceholder = document.getElementById('resultPlaceholder');
  const btnDownload   = document.getElementById('btnDownload');
  const btnReset      = document.getElementById('btnReset');
  const templateVideo = document.getElementById('templateVideo');
  const templateVideoPlaceholder = document.getElementById('templateVideoPlaceholder');

  /* ─────────────────────────────────────────────────────────────
     4. NAVBAR — Hamburger & Scroll Effect
  ───────────────────────────────────────────────────────────── */
  function initNavbar() {
    // Scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Hamburger menu
    if (navHamburger && navMenu) {
      navHamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navHamburger.classList.toggle('active', isOpen);
      });

      // Close menu on link click
      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
          navHamburger.classList.remove('active');
        });
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     5. SCROLL REVEAL — Intersection Observer
  ───────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     6. VIDEO TEMPLATE — Try to play real video, fallback to KOL preview image
  ───────────────────────────────────────────────────────────── */
  function initTemplateVideo() {
    if (!templateVideo) return;

    // Check if real video exists — if yes, play it; if no, keep the KOL preview image
    templateVideo.addEventListener('canplay', () => {
      // Real video loaded successfully — switch from image to video
      const kolPreview = document.getElementById('kolVideoPreview');
      if (kolPreview) kolPreview.style.display = 'none';
      templateVideo.style.display = 'block';
      templateVideo.play().catch(() => {
        // Autoplay blocked by browser — show video element anyway (user can tap to play)
      });
    });

    templateVideo.addEventListener('error', () => {
      // Video failed to load — keep KOL preview image visible
      templateVideo.style.display = 'none';
      // kolVideoPreview stays visible by default (no need to set display)
    });

    // Attempt to load
    templateVideo.load();
  }

  /* ─────────────────────────────────────────────────────────────
     7. FILE UPLOAD — Drag & Drop + Input
  ───────────────────────────────────────────────────────────── */
  function initFileUpload() {
    if (!imageInput || !uploadArea) return;

    // Accepted types
    const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    function validateFile(file) {
      if (!file) return 'Vui lòng chọn một file ảnh.';

      if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Chỉ chấp nhận file ảnh định dạng JPG, PNG, hoặc WEBP.';
      }

      if (file.size > MAX_SIZE_BYTES) {
        return `File ảnh quá lớn. Vui lòng chọn ảnh dưới ${MAX_SIZE_MB}MB.`;
      }

      return null;
    }

    function handleFile(file) {
      // Hide error if any
      hideError();

      const validationError = validateFile(file);
      if (validationError) {
        showError(validationError);
        return;
      }

      selectedFile = file;

      // Preview image
      const objectUrl = URL.createObjectURL(file);
      previewImg.src = objectUrl;
      previewFilename.textContent = file.name;

      // Show preview, hide upload area
      uploadArea.style.display = 'none';
      imagePreview.style.display = 'block';

      // Enable create button
      btnCreateVideo.disabled = false;
    }

    // File input change
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFile(file);
    });

    // Drag & drop on upload area
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    // Click upload area to trigger input
    uploadArea.addEventListener('click', (e) => {
      if (e.target.tagName !== 'LABEL') {
        imageInput.click();
      }
    });

    // Remove image
    if (btnRemoveImage) {
      btnRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     8. CREATE VIDEO — Core API Logic
  ───────────────────────────────────────────────────────────── */
  function initCreateVideo() {
    if (!btnCreateVideo) return;

    btnCreateVideo.addEventListener('click', handleCreateVideo);
  }

  async function handleCreateVideo() {
    // ── Validation ──
    if (!selectedFile) {
      showError('Vui lòng chọn ảnh trước khi tạo video.');
      // Scroll to upload area on mobile
      uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    hideError();
    setLoading(true);

    // ── Mock Mode (when API_ENDPOINT is placeholder) ──
    if (API_ENDPOINT === 'YOUR_N8N_WEBHOOK_URL_HERE') {
      await mockCreateVideo();
      return;
    }

    // ── Real API Call ──
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('template_id', 'betagen-template-01');
    formData.append('event_name', 'Betagen KOL Event');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
        // Không đặt Content-Type — browser tự đặt multipart/form-data với boundary
      });

      if (!response.ok) {
        throw new Error(`Lỗi server: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.video_url) {
        showResult(data.video_url);
      } else {
        throw new Error(data.message || 'Không nhận được video_url từ API.');
      }
    } catch (err) {
      console.error('[Betagen] API Error:', err);
      showError('Đã xảy ra lỗi khi tạo video. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * MOCK MODE — Giả lập tạo video trong 5 giây
   * Rồi hiển thị video placeholder.
   */
  async function mockCreateVideo() {
    // Simulate 5-second processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Show result with placeholder
    showResult(null, true);
    setLoading(false);
  }

  /**
   * Hiển thị kết quả video
   * @param {string|null} videoUrl - URL video từ API, hoặc null nếu mock
   * @param {boolean} isMock - true nếu đang ở mock mode
   */
  function showResult(videoUrl, isMock = false) {
    // Hide upload area and image preview
    uploadArea.style.display = 'none';
    imagePreview.style.display = 'none';
    btnCreateVideo.style.display = 'none';

    // Show result section
    resultSection.style.display = 'flex';

    if (isMock || !videoUrl) {
      // Mock mode: hiển thị placeholder
      resultVideo.style.display = 'none';
      resultPlaceholder.style.display = 'flex';
    } else {
      // Real mode: hiển thị video thật
      resultVideo.src = videoUrl;
      resultVideo.style.display = 'block';
      resultPlaceholder.style.display = 'none';
    }

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ─────────────────────────────────────────────────────────────
     9. DOWNLOAD BUTTON
  ───────────────────────────────────────────────────────────── */
  function initDownloadButton() {
    if (!btnDownload) return;

    btnDownload.addEventListener('click', () => {
      if (resultVideo.src && resultVideo.src !== window.location.href) {
        // Real video from API — trigger download
        const a = document.createElement('a');
        a.href = resultVideo.src;
        a.download = `betagen-kol-event-${Date.now()}.mp4`;
        a.target = '_blank';
        a.click();
      } else {
        // Mock/placeholder — show info message
        showSuccessToast('Video demo — chưa có file để tải. Khi triển khai n8n thật, video sẽ tải được.');
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     10. RESET BUTTON — Tạo lại video khác
  ───────────────────────────────────────────────────────────── */
  function initResetButton() {
    if (!btnReset) return;

    btnReset.addEventListener('click', () => {
      resetUpload();

      // Scroll back to upload area
      uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     11. HELPER — Reset Upload State
  ───────────────────────────────────────────────────────────── */
  function resetUpload() {
    selectedFile = null;
    hideError();

    // Reset file input
    if (imageInput) imageInput.value = '';

    // Hide preview, show upload area
    if (imagePreview) imagePreview.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';

    // Hide result section
    if (resultSection) resultSection.style.display = 'none';
    if (resultVideo) {
      resultVideo.src = '';
      resultVideo.style.display = 'block';
    }
    if (resultPlaceholder) resultPlaceholder.style.display = 'none';

    // Reset create button
    if (btnCreateVideo) {
      btnCreateVideo.style.display = 'flex';
      btnCreateVideo.disabled = true;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     12. ERROR / SUCCESS HELPERS
  ───────────────────────────────────────────────────────────── */
  function showError(message) {
    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = 'flex';
    }
  }

  function hideError() {
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
  }

  function showSuccessToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast-success');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>${message}</span>
    `;

    // Styles
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--success);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      z-index: 9999;
      animation: toastIn 0.3s ease;
      max-width: 320px;
    `;

    // Add keyframes if not already in document
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ─────────────────────────────────────────────────────────────
     13. LOADING STATE
  ───────────────────────────────────────────────────────────── */
  function setLoading(loading) {
    isLoading = loading;

    if (loading) {
      // Show loading, hide other elements
      if (uploadArea) uploadArea.style.display = 'none';
      if (imagePreview) imagePreview.style.display = 'none';
      if (btnCreateVideo) {
        btnCreateVideo.style.display = 'none';
      }
      if (resultSection) resultSection.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'none';
      if (loadingState) loadingState.style.display = 'flex';
    } else {
      // Hide loading
      if (loadingState) loadingState.style.display = 'none';
    }
  }

  /* ─────────────────────────────────────────────────────────────
     14. SMOOTH SCROLL for anchor links
  ───────────────────────────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          // Account for fixed navbar
          const offsetTop = target.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     15. INIT — Run on DOM Ready
  ───────────────────────────────────────────────────────────── */
  function init() {
    initNavbar();
    initScrollReveal();
    initTemplateVideo();
    initFileUpload();
    initCreateVideo();
    initDownloadButton();
    initResetButton();
    initSmoothScroll();

    console.log('[Betagen Event] Landing page loaded. API Mode:',
      API_ENDPOINT === 'YOUR_N8N_WEBHOOK_URL_HERE' ? 'MOCK (5s delay)' : 'REAL API'
    );
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
