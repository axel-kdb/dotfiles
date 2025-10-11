let _lazyShouldDebug;
let _isSafeAreaInitialized = false;
let _doesSupportSafeArea = false;
let _safeAreaRect = null;
const LEGACY_SAFE_AREA_INSET = {
  desktop: {
    wide: {
      TOP: 128,
      RIGHT: 24,
      BOTTOM: 200,
      LEFT: 24
    },
    narrow: {
      TOP: 224,
      RIGHT: 24,
      BOTTOM: 200,
      LEFT: 24
    }
  },
  mobile: {
    TOP: 156,
    RIGHT: 12,
    BOTTOM: 58,
    LEFT: 12
  }
};
const _isSoftwareRenderer = (name) => /swiftshader|llvmpipe|softpipe|mesa|software/i.test(name);
async function _hasWebGPUAcceleration() {
  if (!("gpu" in navigator)) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;
    return !_isSoftwareRenderer(adapter.name);
  } catch {
    return false;
  }
}
function _hasWebGlAcceleration() {
  for (const type of ["webgl2", "webgl"]) {
    const canvas = document.createElement("canvas");
    const webgl = canvas.getContext(type);
    if (!webgl) continue;
    const debugRendererInfo = webgl.getExtension(
      "WEBGL_debug_renderer_info"
    );
    if (debugRendererInfo) {
      const renderer = webgl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL) ?? "";
      if (!_isSoftwareRenderer(renderer)) return true;
    }
    canvas.width = 0;
    canvas.height = 0;
  }
  return false;
}
function _drawSafeAreaDebugOverlay(rect) {
  const id = "debug-safe-area";
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("div");
    element.id = id;
    element.style.position = "fixed";
    element.style.boxSizing = "border-box";
    element.style.background = "transparent";
    element.style.border = "4px solid rgba(0, 255, 0, 0.7)";
    element.style.pointerEvents = "none";
    element.style.zIndex = "2147483647";
    document.body.appendChild(element);
  }
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}
function _maybeDrawSafeAreaDebugOverlay(rect) {
  if (!document.body) {
    window.addEventListener(
      "DOMContentLoaded",
      () => _maybeDrawSafeAreaDebugOverlay(rect),
      { once: true }
    );
    return;
  }
  if (shouldDebug()) _drawSafeAreaDebugOverlay(rect);
}
function _setSafeAreaCSSVariables(rect) {
  const style = document.documentElement.style;
  const top = rect.y;
  const right = window.innerWidth - rect.right;
  const bottom = window.innerHeight - rect.bottom;
  const left = rect.x;
  style.setProperty("--safe-area-x", `${rect.x}px`);
  style.setProperty("--safe-area-y", `${rect.y}px`);
  style.setProperty("--safe-area-width", `${rect.width}px`);
  style.setProperty("--safe-area-height", `${rect.height}px`);
  style.setProperty("--safe-area-top", `${top}px`);
  style.setProperty("--safe-area-bottom", `${bottom}px`);
  style.setProperty("--safe-area-left", `${left}px`);
  style.setProperty("--safe-area-right", `${right}px`);
  style.setProperty("--safe-area", `${top}px ${right}px ${bottom}px ${left}px`);
  _maybeDrawSafeAreaDebugOverlay(rect);
}
function _getSafeAreaRect() {
  return _safeAreaRect ?? _legacySafeAreaRect();
}
function _legacySafeAreaRect() {
  let inset;
  if (isMobile()) {
    inset = LEGACY_SAFE_AREA_INSET.mobile;
  } else if (window.innerWidth <= 643) {
    inset = LEGACY_SAFE_AREA_INSET.desktop.narrow;
  } else {
    inset = LEGACY_SAFE_AREA_INSET.desktop.wide;
  }
  return new DOMRectReadOnly(
    inset.LEFT,
    inset.TOP,
    window.innerWidth - (inset.LEFT + inset.RIGHT),
    window.innerHeight - (inset.TOP + inset.BOTTOM)
  );
}
function _notifySafeAreaLayoutChange() {
  window.postMessage(
    {
      type: "layoutSafeArea"
      /* LayoutSafeArea */
    },
    "chrome-untrusted://new-tab-takeover"
    /* ChromeUntrustedNewTabTakeover */
  );
}
function _updateSafeAreaLayout() {
  const updateSafeAreaLayout = () => {
    const safeAreaRect = _getSafeAreaRect();
    utils.debugLog("Safe area: ", safeAreaRect);
    _setSafeAreaCSSVariables(safeAreaRect);
    _notifySafeAreaLayoutChange();
  };
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        requestAnimationFrame(updateSafeAreaLayout);
      },
      { once: true }
    );
  } else {
    requestAnimationFrame(updateSafeAreaLayout);
  }
}
function _subscribeToSafeAreaLayoutChanges() {
  window.addEventListener("message", (messageEvent) => {
    if (targetOrigin() !== messageEvent.origin) return;
    const { type, value } = messageEvent.data || {};
    if (type === "richMediaSafeRect" && value && typeof value.x === "number" && typeof value.y === "number" && typeof value.width === "number" && typeof value.height === "number") {
      _doesSupportSafeArea = true;
      _safeAreaRect = new DOMRectReadOnly(
        value.x,
        value.y,
        value.width,
        value.height
      );
      _updateSafeAreaLayout();
    }
  });
  window.addEventListener("resize", () => {
    _updateSafeAreaLayout();
  });
}
function _initSafeArea() {
  if (_isSafeAreaInitialized) throw new Error("Safe area already initialized");
  _isSafeAreaInitialized = true;
  _updateSafeAreaLayout();
  _subscribeToSafeAreaLayoutChanges();
}
function _parseHexColor(hex) {
  const match = hex.replace("#", "").match(/^([a-f\d]{3}|[a-f\d]{6})$/i);
  if (!match) throw new Error("Invalid hex color format");
  let hexValue = match[1];
  if (hexValue.length === 3) {
    hexValue = hexValue.split("").map((c) => c + c).join("");
  }
  const value = parseInt(hexValue, 16);
  const r = value >> 16 & 255;
  const g = value >> 8 & 255;
  const b = value & 255;
  return [r, g, b];
}
function _rgbToCss(r, g, b, alpha) {
  return typeof alpha === "number" ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}
function _parseFocalPointCoordinate(focalPoint) {
  const normalizedFocalPoint = focalPoint.trim().toLowerCase();
  if (normalizedFocalPoint.endsWith("%"))
    return parseFloat(normalizedFocalPoint) / 100;
  if (normalizedFocalPoint === "left" || normalizedFocalPoint === "top")
    return 0;
  if (normalizedFocalPoint === "center") return 0.5;
  if (normalizedFocalPoint === "right" || normalizedFocalPoint === "bottom")
    return 1;
  console.warn("Invalid focal point coordinate, defaulting to center.");
  return 0.5;
}
function _platform() {
  const userAgentData = navigator.userAgentData;
  if (userAgentData && userAgentData.platform) {
    switch (userAgentData.platform) {
      case "Android":
        return "Android";
      case "iOS":
        return "iOS";
      case "Windows":
        return "Windows";
      case "macOS":
        return "Mac";
      case "Linux":
        return "Linux";
      default:
        return "Unknown";
    }
  }
  const userAgent = navigator.userAgent || "";
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone/.test(userAgent)) return "iOS";
  if (/Win/.test(userAgent)) return "Windows";
  if (/Mac/.test(userAgent)) return "Mac";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown";
}
const MILLISECONDS_IN_SECONDS = 1e3;
const DEG_TO_RAD = Math.PI / 180;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const prefersReducedTransparency = window.matchMedia(
  "(prefers-reduced-transparency: reduce)"
).matches;
function shouldDebug() {
  if (_lazyShouldDebug === void 0) {
    _lazyShouldDebug = utils.parseBoolDataAttr(
      document.body?.dataset?.debug,
      false
    );
  }
  return _lazyShouldDebug;
}
function debugLog(...args) {
  if (shouldDebug()) {
    console.debug(...args);
  }
}
function parseBoolDataAttr(value, fallback = false) {
  if (value === void 0) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "" || normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}
function parseNumberDataAttr(value, fallback = null) {
  if (value === void 0 || value.trim() === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
function targetOrigin() {
  return isAndroid() ? "chrome://new-tab-takeover" : "chrome://newtab";
}
function isAndroid() {
  return _platform() === "Android";
}
function isIOS() {
  return _platform() === "iOS";
}
function isMobile() {
  return isAndroid() || isIOS();
}
async function supportsEfficientVideoDecoding(video) {
  const mediaCapabilities = navigator.mediaCapabilities;
  if (typeof mediaCapabilities?.decodingInfo !== "function") return null;
  let contentType = video.querySelector("source")?.type?.trim();
  if (!contentType || !/codecs=/.test(contentType)) {
    contentType = 'video/mp4; codecs="avc1.42E01E"';
  }
  const configuration = {
    // bitrate and framerate are not exposed by HTMLVideoElement.
    type: "file",
    video: {
      contentType,
      width: video.videoWidth || 1920,
      height: video.videoHeight || 1080,
      bitrate: 1e7,
      // number of bits to encode 1 second of video.
      framerate: 30
      // number of frames making up that 1s.
    }
  };
  try {
    const { supported, smooth, powerEfficient } = await mediaCapabilities.decodingInfo(configuration);
    return supported && smooth && powerEfficient === true;
  } catch {
    return null;
  }
}
async function supportsGpuAcceleration() {
  return await _hasWebGPUAcceleration() || _hasWebGlAcceleration();
}
function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}
function registerLayoutSafeAreaHandler(callback) {
  window.addEventListener("message", (messageEvent) => {
    if (messageEvent.origin !== "chrome-untrusted://new-tab-takeover")
      return;
    if (messageEvent.data?.type === "layoutSafeArea") {
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            requestAnimationFrame(() => callback(_getSafeAreaRect()));
          },
          { once: true }
        );
      } else {
        requestAnimationFrame(() => callback(_getSafeAreaRect()));
      }
    }
  });
}
function randomIntInRange(min, max, inclusive = true) {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    throw new Error("min/max must be finite");
  if (inclusive ? min > max : min >= max) throw new Error("Invalid range");
  const range = max - min + (inclusive ? 1 : 0);
  return Math.floor(Math.random() * range) + min;
}
function randomFloatInRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    throw new Error("min/max must be finite");
  if (min >= max) throw new Error("Invalid range");
  return Math.random() * (max - min) + min;
}
function randomArrayIndex(array) {
  if (array.length === 0) throw new Error("Array is empty");
  return randomIntInRange(
    0,
    array.length,
    /*inclusive*/
    false
  );
}
function randomArrayElement(array) {
  if (array.length === 0) throw new Error("Array is empty");
  const index = randomArrayIndex(array);
  return array[index];
}
function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length; i > 1; i--) {
    const j = Math.floor(Math.random() * i);
    [shuffledArray[i - 1], shuffledArray[j]] = [
      shuffledArray[j],
      shuffledArray[i - 1]
    ];
  }
  return shuffledArray;
}
function loadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load " + imageSrc));
    image.src = imageSrc;
  });
}
function imageSizeToFit(imageWidth, imageHeight, containerWidth, containerHeight) {
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  let width, height;
  if (imageAspectRatio > containerAspectRatio) {
    width = containerWidth;
    height = width / imageAspectRatio;
  } else {
    height = containerHeight;
    width = height * imageAspectRatio;
  }
  return { imageSize: { width, height } };
}
function imageSizeToCover(imageWidth, imageHeight, containerWidth, containerHeight) {
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  let width, height;
  if (imageAspectRatio > containerAspectRatio) {
    height = containerHeight;
    width = height * imageAspectRatio;
  } else {
    width = containerWidth;
    height = width / imageAspectRatio;
  }
  return { imageSize: { width, height } };
}
function drawImageWithAlpha(context, image, rect, alpha) {
  context.save();
  try {
    context.globalAlpha = alpha;
    context.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );
  } finally {
    context.restore();
  }
}
function hexToRgba(hex, alpha) {
  const [r, g, b] = _parseHexColor(hex);
  return _rgbToCss(r, g, b, alpha);
}
function hexToRgb(hex) {
  const [r, g, b] = _parseHexColor(hex);
  return _rgbToCss(r, g, b);
}
function createCanvasWith2DContext(alpha = true) {
  const canvas = document.createElement("canvas");
  const canvasRenderingContext2D = canvas.getContext("2d", {
    alpha
  });
  canvasRenderingContext2D.setSize = (cssWidth, cssHeight) => {
    canvas.width = Math.round(cssWidth * getDevicePixelRatio());
    canvas.height = Math.round(cssHeight * getDevicePixelRatio());
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvasRenderingContext2D.setTransform(
      getDevicePixelRatio(),
      0,
      0,
      getDevicePixelRatio(),
      0,
      0
    );
  };
  return [canvas, canvasRenderingContext2D];
}
function clearCanvasRenderingContext2D(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
function parseFocalPoint(focalPoint) {
  const components = focalPoint.trim().split(/\s+/);
  if (components.length === 1) {
    const x = _parseFocalPointCoordinate(components[0]);
    return { x, y: 0.5 };
  }
  if (components.length === 2) {
    return {
      x: _parseFocalPointCoordinate(components[0]),
      y: _parseFocalPointCoordinate(components[1])
    };
  }
  console.warn("Invalid focal point, defaulting to center.");
  return { x: 0.5, y: 0.5 };
}
function parseDuration(duration) {
  const value = duration.trim().toLowerCase();
  let ms;
  if (value.endsWith("ms")) ms = parseFloat(value);
  else if (value.endsWith("s"))
    ms = parseFloat(value) * MILLISECONDS_IN_SECONDS;
  else ms = parseFloat(value);
  if (!Number.isFinite(ms) || ms < 0) throw new Error("Invalid duration");
  return ms;
}
_initSafeArea();
const utils = {
  MILLISECONDS_IN_SECONDS,
  DEG_TO_RAD,
  prefersReducedMotion,
  prefersReducedTransparency,
  shouldDebug,
  debugLog,
  parseBoolDataAttr,
  parseNumberDataAttr,
  targetOrigin,
  isAndroid,
  isIOS,
  isMobile,
  supportsEfficientVideoDecoding,
  supportsGpuAcceleration,
  getDevicePixelRatio,
  doesSupportSafeArea: () => _doesSupportSafeArea,
  registerLayoutSafeAreaHandler,
  randomIntInRange,
  randomFloatInRange,
  randomArrayIndex,
  randomArrayElement,
  shuffleArray,
  loadImage,
  imageSizeToFit,
  imageSizeToCover,
  drawImageWithAlpha,
  hexToRgba,
  hexToRgb,
  createCanvasWith2DContext,
  clearCanvasRenderingContext2D,
  parseFocalPoint,
  parseDuration
};
const dispatchedEvents = /* @__PURE__ */ new Set();
const RICH_MEDIA_EVENT = "richMediaEvent";
function _hasDispatchedEvent(eventType) {
  return dispatchedEvents.has(eventType);
}
const eventTypes = {
  CLICK: "click",
  INTERACTION: "interaction",
  MEDIA_PLAY: "mediaPlay",
  MEDIA_25: "media25",
  MEDIA_100: "media100"
};
function dispatchEvent(eventType) {
  if (_hasDispatchedEvent(eventType)) return;
  dispatchedEvents.add(eventType);
  utils.debugLog(`Dispatching event: ${eventType}`);
  window.parent.postMessage(
    { type: RICH_MEDIA_EVENT, value: eventType },
    utils.targetOrigin()
  );
}
const eventDispatcher = {
  eventTypes,
  dispatchEvent
};
function _bindClickToSelectors(object, handler) {
  const selectors = Array.isArray(object) ? object : [object];
  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return;
    }
    elements.forEach(handler);
  });
}
function bindClickHandler(object, handler) {
  _bindClickToSelectors(
    object,
    (element) => element.addEventListener("click", handler)
  );
}
function bindAndDispatchClickEvent(object) {
  _bindClickToSelectors(
    object,
    (element) => element.addEventListener(
      "click",
      () => eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.CLICK)
    )
  );
}
const eventBinder = {
  bindClickHandler,
  bindAndDispatchClickEvent
};
const PlaybackQuartileEventTypes = {
  FirstQuartileReached: "firstQuartileReached",
  SecondQuartileReached: "secondQuartileReached",
  ThirdQuartileReached: "thirdQuartileReached",
  FourthQuartileReached: "fourthQuartileReached"
};
class Projector {
  constructor() {
    this.videoFrameCallbackHandle = null;
    this.lastVideoFrameMediaTime = null;
    this.autoplayTo = null;
    this.autoplayCompleted = false;
    this.quartilesReached = /* @__PURE__ */ new Set();
    this.loopCount = null;
    this.currentLoop = 0;
    this.didPlayToEnd = false;
    this.wasPausedByUser = false;
    this.onFrame = (_now, metadata) => {
      this.videoFrameCallbackHandle = null;
      const playbackQuartile = this.playbackQuartile(metadata);
      if (playbackQuartile !== null) {
        this.maybeDispatchPlaybackQuartileEvent(playbackQuartile);
      }
      if (this.hasLooped(metadata.mediaTime)) {
        this.maybeHandleLoopCount();
        this.didPlayToEnd = true;
      }
      this.maybeHandleAutoplayCompletion(metadata);
      this.lastVideoFrameMediaTime = metadata.mediaTime;
      this.scheduleFrame();
    };
    this.handleCanPlayEventListener = () => {
      utils.debugLog("Video duration is ", this.video.duration, " seconds.");
      if (this.autoplayTo !== null && (Math.abs(this.autoplayTo - this.video.duration) < Number.EPSILON || this.autoplayTo > this.video.duration)) {
        utils.debugLog("Canceled autoplay because time exceeds video duration.");
        this.cancelAutoplay();
        return;
      }
      if (this.video.autoplay) {
        eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.MEDIA_PLAY);
      }
      this.updatePlaybackToggleButtonState();
    };
    this.handlePlayEventListener = () => {
      this.wasPausedByUser = false;
      this.scheduleInitialFrame();
      this.updatePlaybackToggleButtonState();
    };
    this.handlePauseEventListener = () => {
      this.cancelScheduledFrame();
      this.updatePlaybackToggleButtonState();
      this.maybeCancelLoop();
    };
    this.handleEndedEventListener = () => {
      this.didPlayToEnd = true;
      this.cancelScheduledFrame();
      utils.debugLog("Video playback ended.");
      this.resetPlaybackQuartiles();
    };
    this.handleFirstQuartileReachedEventListener = () => {
      utils.debugLog("First quartile reached.");
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.MEDIA_25);
    };
    this.handleSecondQuartileReachedEventListener = () => {
      utils.debugLog("Second quartile reached.");
    };
    this.handleThirdQuartileReachedEventListener = () => {
      utils.debugLog("Third quartile reached.");
    };
    this.handleFourthQuartileReachedEventListener = () => {
      utils.debugLog("Fourth quartile reached.");
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.MEDIA_100);
    };
    this.handleClickEventListener = () => {
      if (this.isPlaying()) this.wasPausedByUser = true;
      this.togglePlayback();
      this.maybeDispatchInteractionEvent();
    };
    this.handleVisibilityChangeEventListener = () => {
      if (document.hidden) this.stop();
    };
    if (utils.prefersReducedMotion) {
      console.warn("User prefers reduced motion. Skipping animations.");
    }
    void this.init().catch(
      (error) => utils.debugLog("Failed to initialize.", error)
    );
  }
  async init() {
    await this.initVideo();
    this.initPlaybackToggleButton();
    this.addEventListeners();
  }
  // Video.
  videoElement() {
    const videos = document.querySelectorAll("video");
    if (videos.length === 0) {
      console.warn("No <video> element found.");
      return null;
    }
    if (videos.length > 1) {
      console.warn("Multiple <video> elements are not supported.");
      return null;
    }
    return videos[0];
  }
  async initVideo() {
    const videoElement = this.videoElement();
    if (!videoElement) throw new Error("Failed to initialize video element.");
    this.video = videoElement;
    this.video.style.objectPosition = this.video.dataset.focalPoint || "center";
    this.video.muted = true;
    this.video.playsInline = true;
    this.autoplayTo = this.parseAutoplayDataAttr();
    this.video.autoplay = await this.shouldAutoplay() || this.autoplayTo !== null;
    this.loopCount = this.parseLoopCountDataAttr();
    this.video.loop = this.loopCount !== null;
  }
  frameTolerance() {
    return 1 / 25;
  }
  tolerance() {
    if (Number.isNaN(this.video.duration)) {
      throw new Error(
        "Invalid video duration, tolerance must be called after canplay."
      );
    }
    if (this.lazyTolerance === void 0) {
      this.lazyTolerance = Math.max(
        this.video.duration * 1e-3,
        this.frameTolerance()
      );
    }
    return this.lazyTolerance;
  }
  // Playback.
  createPlaybackToggleButtonElement() {
    const element = document.createElement("button");
    element.className = "playback-toggle";
    element.type = "button";
    element.style.zIndex = "2147483647";
    return element;
  }
  initPlaybackToggleButton() {
    this.playbackToggleButtonElement = this.createPlaybackToggleButtonElement();
    this.video.insertAdjacentElement(
      "afterend",
      this.playbackToggleButtonElement
    );
  }
  updatePlaybackToggleButtonState() {
    this.playbackToggleButtonElement.classList.toggle(
      "paused",
      !this.isPlaying()
    );
  }
  parseAutoplayDataAttr() {
    if (utils.prefersReducedMotion) {
      return null;
    }
    return utils.parseNumberDataAttr(this.video.dataset.autoplay, null);
  }
  async shouldAutoplay() {
    if (utils.prefersReducedMotion) {
      return false;
    }
    if (!await utils.supportsEfficientVideoDecoding(this.video)) {
      console.warn(
        "Efficient video decoding not supported. Skipping autoplay."
      );
      return false;
    }
    utils.debugLog("Efficient video decoding supported.");
    this.autoplayTo = utils.parseNumberDataAttr(
      this.video.dataset.autoplay,
      null
    );
    if (this.autoplayTo !== null) {
      return true;
    }
    return utils.parseBoolDataAttr(this.video.dataset.autoplay, false);
  }
  maybeHandleAutoplayCompletion(metadata) {
    if (this.autoplayTo === null) return;
    if (metadata.mediaTime >= this.autoplayTo - this.frameTolerance()) {
      this.autoplayCompleted = true;
      this.stopAtAutoplayTime();
      utils.debugLog("Autoplay complete. Video paused.");
    }
  }
  cancelAutoplay() {
    this.video.autoplay = false;
    this.autoplayTo = null;
  }
  isPlaying() {
    return !this.video.paused;
  }
  togglePlayback() {
    this.isPlaying() ? this.stop() : this.play();
    utils.debugLog(this.isPlaying() ? "Played video." : "Paused video.");
  }
  playbackProgress(metadata) {
    const currentTime = Math.min(
      Math.max(metadata.mediaTime, 0),
      this.video.duration
    );
    return Math.min(1, Math.max(0, currentTime / this.video.duration));
  }
  playbackQuartile(metadata) {
    const progress = this.playbackProgress(metadata);
    if (progress >= 1 - this.tolerance()) return 3;
    if (progress >= 0.75 - this.tolerance()) return 2;
    if (progress >= 0.5 - this.tolerance()) return 1;
    if (progress >= 0.25 - this.tolerance()) return 0;
    return null;
  }
  maybeDispatchPlaybackQuartileEvent(playbackQuartile) {
    if (this.quartilesReached.has(playbackQuartile)) return;
    this.quartilesReached.add(playbackQuartile);
    let eventType = null;
    switch (playbackQuartile) {
      case 0:
        eventType = PlaybackQuartileEventTypes.FirstQuartileReached;
        break;
      case 1:
        eventType = PlaybackQuartileEventTypes.SecondQuartileReached;
        break;
      case 2:
        eventType = PlaybackQuartileEventTypes.ThirdQuartileReached;
        break;
      case 3:
        eventType = PlaybackQuartileEventTypes.FourthQuartileReached;
        break;
    }
    if (eventType) {
      this.video.dispatchEvent(
        new CustomEvent(eventType, { detail: { playbackQuartile } })
      );
    }
  }
  resetPlaybackQuartiles() {
    utils.debugLog("Resetting quartiles.");
    this.quartilesReached.clear();
  }
  async play() {
    try {
      await this.video.play();
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.MEDIA_PLAY);
    } catch (reason) {
      console.warn("Autoplay blocked: ", reason);
      this.updatePlaybackToggleButtonState();
      this.cancelAutoplay();
    }
  }
  stop() {
    this.cancelScheduledFrame();
    this.cancelAutoplay();
    this.video.pause();
  }
  stopAtAutoplayTime() {
    const autoplayTo = this.autoplayTo;
    this.stop();
    this.seekTo(autoplayTo);
  }
  seekTo(time) {
    if (time === null) return;
    this.video.currentTime = time;
    this.scheduleFrame();
  }
  seekToEnd() {
    this.seekTo(this.video.duration);
  }
  // Loop handling.
  parseLoopCountDataAttr() {
    if (utils.prefersReducedMotion) {
      return null;
    }
    if (this.video.dataset.loop?.trim() === "") {
      return Number.POSITIVE_INFINITY;
    }
    const value = utils.parseNumberDataAttr(this.video.dataset.loop, null);
    if (value && value > 0) return value;
    return null;
  }
  hasLooped(mediaTime) {
    if (this.lastVideoFrameMediaTime === null) return false;
    return mediaTime < this.lastVideoFrameMediaTime - this.tolerance();
  }
  maybeHandleLoopCount() {
    if (!this.video.loop || this.loopCount === null) {
      return;
    }
    this.currentLoop++;
    if (this.currentLoop < this.loopCount) {
      utils.debugLog(`Completed loop ${this.currentLoop} of ${this.loopCount}`);
      this.resetPlaybackQuartiles();
      return;
    }
    utils.debugLog("Video finished looping.");
    this.cancelLoop();
    this.stop();
    this.seekToEnd();
    utils.debugLog("Video playback ended.");
    this.resetPlaybackQuartiles();
  }
  cancelLoop() {
    this.video.loop = false;
    this.loopCount = null;
    this.currentLoop = 0;
  }
  maybeCancelLoop() {
    if (this.video.loop && this.wasPausedByUser) {
      this.cancelLoop();
      utils.debugLog("Video loop canceled.");
    }
  }
  // Video frame handling.
  scheduleInitialFrame() {
    this.lastVideoFrameMediaTime = null;
    this.scheduleFrame();
  }
  scheduleFrame() {
    if (!this.video || this.video.paused || this.video.ended) {
      return;
    }
    if (this.videoFrameCallbackHandle !== null) {
      return;
    }
    if (this.video.requestVideoFrameCallback) {
      this.videoFrameCallbackHandle = this.video.requestVideoFrameCallback(
        this.onFrame
      );
    }
  }
  cancelScheduledFrame() {
    if (this.videoFrameCallbackHandle !== null) {
      this.video.cancelVideoFrameCallback?.(this.videoFrameCallbackHandle);
      this.videoFrameCallbackHandle = null;
    }
  }
  // Metrics.
  maybeDispatchInteractionEvent() {
    if (this.isPlaying() && (this.autoplayCompleted || this.didPlayToEnd)) {
      eventDispatcher.dispatchEvent(eventDispatcher.eventTypes.INTERACTION);
    }
  }
  addEventListeners() {
    eventBinder.bindAndDispatchClickEvent("video");
    this.video.addEventListener("contextmenu", (event) => {
      if (event.target === this.video) {
        event.preventDefault();
      }
    });
    this.video.addEventListener("canplay", this.handleCanPlayEventListener, {
      once: true
    });
    this.video.addEventListener("play", this.handlePlayEventListener);
    this.video.addEventListener("pause", this.handlePauseEventListener);
    this.video.addEventListener("ended", this.handleEndedEventListener);
    this.video.addEventListener(
      PlaybackQuartileEventTypes.FirstQuartileReached,
      this.handleFirstQuartileReachedEventListener
    );
    this.video.addEventListener(
      PlaybackQuartileEventTypes.SecondQuartileReached,
      this.handleSecondQuartileReachedEventListener
    );
    this.video.addEventListener(
      PlaybackQuartileEventTypes.ThirdQuartileReached,
      this.handleThirdQuartileReachedEventListener
    );
    this.video.addEventListener(
      PlaybackQuartileEventTypes.FourthQuartileReached,
      this.handleFourthQuartileReachedEventListener
    );
    this.playbackToggleButtonElement.addEventListener(
      "click",
      this.handleClickEventListener
    );
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChangeEventListener
    );
  }
}
document.addEventListener("DOMContentLoaded", () => {
  try {
    new Projector();
    eventBinder.bindAndDispatchClickEvent(".button");
  } catch (error) {
    console.error(error);
  }
});
