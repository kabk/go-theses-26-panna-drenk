'use strict';
const OPENING_KEY = "opening"
const INITIAL_ABSTRACT_COUNT = 21
const CHILD_COUNT = 20
const MOBILE_ABSTRACT_COUNT = 9
const MOBILE_CHILD_COUNT = 3
const MAX_CHAPTER = 6
const MAX_VISIBLE_BUTTONS = 21

const CHAPTER_DISPLAY_NAME = {
    abstract: "Abstract",
    transition: "Transition",
    chapter1: "Introducing the World of Instinct",
    chapter2: "The Smooth",
    chapter3: "As a labyrinth",
    chapter4: "The Unfamiliar",
    chapter5: "End.",
    chapter6: "Bibliography",
}

function getPathStepLabel(step){
    return CHAPTER_DISPLAY_NAME[step] || step
}

const path = [OPENING_KEY]

const buttonsContainer = document.getElementById("buttons")
const pathContainer = document.getElementById("path")
const mapEl = document.querySelector(".map")
const containerEl = document.querySelector(".container")
const chapterContainerEl = document.getElementById("chapter")
const chapterScrollRailEl = document.querySelector(".chapter-scroll-rail")
const chapterScrollThumbEl = document.querySelector(".chapter-scroll-thumb")
const mobileNavHintEl = document.getElementById("mobile-nav-hint")
const siteTopBarEl = document.querySelector(".site-top-bar")
const topbarTitleEl = document.querySelector(".site-top-bar__title")
const topbarTitleTriggerEl = document.querySelector(".site-top-bar__title-trigger")
const topbarColophonEl = document.getElementById("topbar-colophon")

const CHAPTER_SCROLL_THUMB_PX = 11
const CHAPTER_SCROLL_HIDE_MS = 900
let chapterScrollHideTimer = 0

function setColophonOpen(isOpen){
    if(!topbarTitleEl || !topbarTitleTriggerEl || !topbarColophonEl) return
    topbarTitleEl.classList.toggle("is-open", isOpen)
    topbarTitleTriggerEl.setAttribute("aria-expanded", String(isOpen))
    topbarColophonEl.setAttribute("aria-hidden", String(!isOpen))
}

if(topbarTitleEl && topbarTitleTriggerEl && topbarColophonEl){
    topbarTitleTriggerEl.addEventListener("click", (e) => {
        e.stopPropagation()
        const next = !topbarTitleEl.classList.contains("is-open")
        setColophonOpen(next)
    })

    document.addEventListener("click", (e) => {
        if(topbarTitleEl.contains(e.target)) return
        setColophonOpen(false)
    })
}

function chapterScrollRailActive(){
    return Boolean(
        chapterContainerEl &&
        mapEl &&
        !mapEl.classList.contains("map--opening") &&
        !document.body.classList.contains("touch-ui"),
    )
}

function updateChapterScrollThumb(){
    if(!chapterScrollRailEl || !chapterScrollThumbEl || !chapterContainerEl) return
    if(!chapterScrollRailActive()){
        chapterScrollRailEl.classList.remove("is-active")
        return
    }
    const { scrollTop, scrollHeight, clientHeight } = chapterContainerEl
    const maxScroll = Math.max(0, scrollHeight - clientHeight)
    const railH = chapterScrollRailEl.getBoundingClientRect().height
    if(maxScroll <= 1 || railH <= CHAPTER_SCROLL_THUMB_PX){
        chapterScrollThumbEl.style.display = "none"
        return
    }
    chapterScrollThumbEl.style.display = "block"
    const travel = railH - CHAPTER_SCROLL_THUMB_PX
    const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0
    chapterScrollThumbEl.style.top = `${Math.min(travel, Math.max(0, ratio * travel))}px`
}

function flashChapterScrollRail(){
    if(!chapterScrollRailEl || !chapterScrollRailActive()) return
    const { scrollHeight, clientHeight } = chapterContainerEl
    if(scrollHeight <= clientHeight + 1) return
    chapterScrollRailEl.classList.add("is-active")
    clearTimeout(chapterScrollHideTimer)
    chapterScrollHideTimer = window.setTimeout(() => {
        chapterScrollRailEl.classList.remove("is-active")
    }, CHAPTER_SCROLL_HIDE_MS)
}

if(chapterContainerEl){
    chapterContainerEl.addEventListener("scroll", () => {
        scheduleTopBarHeadroomUpdate()
        updateChapterScrollThumb()
        flashChapterScrollRail()
    }, { passive: true })
}
window.addEventListener("scroll", scheduleTopBarHeadroomUpdate, { passive: true })

if(chapterContainerEl && typeof ResizeObserver !== "undefined"){
    const chapterScrollRo = new ResizeObserver(() => {
        window.requestAnimationFrame(updateChapterScrollThumb)
    })
    chapterScrollRo.observe(chapterContainerEl)
}

let mobilePanel = "text"
let suppressSpyUntil = 0
let scrollSpyRaf = null
let mobileHintDismissed = false
let currentViewKey = OPENING_KEY
let suppressHeadroomUntil = 0
const HEADROOM_DELTA_PX = 6
const HEADROOM_TOP_PX = 12
let lastHeadroomScrollTop = 0
let headroomRaf = null

function setTopBarHidden(isHidden){
    if(!siteTopBarEl) return
    siteTopBarEl.classList.toggle("site-top-bar--hidden", isHidden)
    document.body.classList.toggle("top-bar-hidden", isHidden)
}

function hideTopBarForNavigation(){
    setTopBarHidden(true)
    suppressHeadroomUntil = performance.now() + 500
}

function updateTopBarHeadroom(scrollTop){
    if(!siteTopBarEl) return
    if(document.body.classList.contains("site--opening")){
        setTopBarHidden(false)
        lastHeadroomScrollTop = 0
        return
    }
    const current = Math.max(0, scrollTop)
    if(performance.now() < suppressHeadroomUntil){
        lastHeadroomScrollTop = current
        return
    }
    const delta = current - lastHeadroomScrollTop
    if(current <= HEADROOM_TOP_PX){
        setTopBarHidden(false)
        lastHeadroomScrollTop = current
        return
    }
    if(delta > HEADROOM_DELTA_PX){
        setTopBarHidden(true)
    }else if(delta < -HEADROOM_DELTA_PX){
        setTopBarHidden(false)
    }
    lastHeadroomScrollTop = current
}

function scheduleTopBarHeadroomUpdate(){
    if(headroomRaf) return
    headroomRaf = requestAnimationFrame(() => {
        headroomRaf = null
        const scrollTop = chapterContainerEl
            ? chapterContainerEl.scrollTop
            : (window.scrollY || window.pageYOffset || 0)
        updateTopBarHeadroom(scrollTop)
    })
}

function hideMobileHintOnce(){
    if(mobileHintDismissed) return
    mobileHintDismissed = true
    if(mobileNavHintEl){
        mobileNavHintEl.classList.add("is-hidden")
    }
}

function getChapterLabels(){
    return Array.from({ length: MAX_CHAPTER }, (_, i) => `chapter${i + 1}`)
}

function getVisibleLabelsForState(currentKey){
    if(currentKey === OPENING_KEY){
        return ["abstract"]
    }

    if(currentKey === "abstract"){
        return ["transition", ...getChapterLabels()]
    }

    if(currentKey === "transition"){
        return getChapterLabels()
    }

    if(currentKey.startsWith("chapter")){
        const currentN = parseInt(currentKey.replace("chapter",""), 10)
        return getChapterLabels().filter((label) => {
            const n = parseInt(label.replace("chapter",""), 10)
            return n !== currentN
        })
    }

    return []
}

function getResponsiveCount(desktopCount, mobileCount){
    const minWidth = 480
    const maxWidth = 1280
    const width = window.innerWidth

    if(width <= minWidth) return mobileCount
    if(width >= maxWidth) return desktopCount

    const t = (width - minWidth) / (maxWidth - minWidth)
    return Math.round(mobileCount + (desktopCount - mobileCount) * t)
}

function getButtonCounts(){
    return {
        abstract: getResponsiveCount(INITIAL_ABSTRACT_COUNT, MOBILE_ABSTRACT_COUNT),
        child: getResponsiveCount(CHILD_COUNT, MOBILE_CHILD_COUNT),
    }
}

function estimateCollisionRadiusPx(labelKey, areaRect){
    const text = getPathStepLabel(labelKey) || labelKey || ""
    const approxCharPx = areaRect.width <= 420 ? 7 : 8.5
    const padding = 26
    const lineH = 26
    const maxLineW = Math.min(areaRect.width * 0.78, 300)
    const rawW = text.length * approxCharPx + padding
    const lines = Math.max(1, Math.ceil(rawW / maxLineW))
    const w = Math.min(maxLineW, rawW)
    const h = lines * lineH + 18
    return 0.55 * Math.hypot(w, h) + 10
}

function estimateButtonHalfExtentsPx(labelKey, areaRect){
    const text = String(getPathStepLabel(labelKey) || labelKey || "")
    const charPx = areaRect.width <= 420 ? 11 : 13
    const horzPadBorder = 26
    const vertPadBorder = 18
    const lineH = 26
    const rawW = text.length * charPx + horzPadBorder
    const rawH = lineH + vertPadBorder
    return {
        halfW: Math.max(54, rawW / 2),
        halfH: Math.max(22, rawH / 2),
    }
}

function viewportRectToAreaLocal(rect, areaRect){
    if(!rect) return null
    return {
        left: rect.left - areaRect.left,
        top: rect.top - areaRect.top,
        right: rect.right - areaRect.left,
        bottom: rect.bottom - areaRect.top,
    }
}

function unionClientRectsViewport(el){
    if(!el) return null
    const s = getComputedStyle(el)
    if(s.display === "none" || s.visibility === "hidden") return null
    const rects = el.getClientRects()
    let left = Infinity
    let top = Infinity
    let right = -Infinity
    let bottom = -Infinity
    let anyRects = false
    for(let i = 0; i < rects.length; i++){
        const r = rects[i]
        if(r.width <= 0 && r.height <= 0) continue
        anyRects = true
        left = Math.min(left, r.left)
        top = Math.min(top, r.top)
        right = Math.max(right, r.right)
        bottom = Math.max(bottom, r.bottom)
    }
    const fallback = el.getBoundingClientRect()
    if(!anyRects){
        if(fallback.width < 0.5 && fallback.height < 0.5) return null
        return {
            left: fallback.left,
            top: fallback.top,
            right: fallback.right,
            bottom: fallback.bottom,
        }
    }
    return { left, top, right, bottom }
}

function mergeViewportBoxes(a, b){
    if(!a) return b
    if(!b) return a
    return {
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        right: Math.max(a.right, b.right),
        bottom: Math.max(a.bottom, b.bottom),
    }
}

function getOpeningTypographyViewportRect(){
    const block = document.querySelector(".chapter-block--opening")
    if(!block || block.classList.contains("is-hidden")){
        return null
    }
    const bs = getComputedStyle(block)
    if(bs.display === "none"){
        return null
    }

    const titleEl = block.querySelector(".opening-title")
    const subEl = block.querySelector(".opening-subtitle")
    let box = null
    box = mergeViewportBoxes(box, unionClientRectsViewport(titleEl))
    box = mergeViewportBoxes(box, unionClientRectsViewport(subEl))

    if(!box){
        const br = block.getBoundingClientRect()
        if(br.width < 2 || br.height < 2) return null
        box = { left: br.left, top: br.top, right: br.right, bottom: br.bottom }
    }

    const pad = 8
    return {
        left: box.left - pad,
        top: box.top - pad,
        right: box.right + pad,
        bottom: box.bottom + pad,
    }
}

function axisAlignedButtonOverlapsRect(cx, cy, halfW, halfH, rect){
    if(rect.right <= rect.left || rect.bottom <= rect.top) return false
    return (
        cx + halfW > rect.left &&
        cx - halfW < rect.right &&
        cy + halfH > rect.top &&
        cy - halfH < rect.bottom
    )
}

function intersectIntervals(a0, a1, b0, b1){
    const lo = Math.max(a0, b0)
    const hi = Math.min(a1, b1)
    if(lo >= hi - 1e-6) return null
    return [lo, hi]
}

function sampleOpeningAroundTypography(areaRect, typo, halfW, halfH, gapPx, xmin, xmax, ymin, ymax, overlapsExistingPxPct){
    const L = typo.left
    const R = typo.right
    const T = typo.top
    const B = typo.bottom
    const regions = []

    const push = (cx0, cx1, cy0, cy1) => {
        const xInt = intersectIntervals(cx0, cx1, xmin, xmax)
        const yInt = intersectIntervals(cy0, cy1, ymin, ymax)
        if(!xInt || !yInt) return
        const [cxLo, cxHi] = xInt
        const [cyLo, cyHi] = yInt
        const w = cxHi - cxLo
        const h = cyHi - cyLo
        if(w <= 1e-6 || h <= 1e-6) return
        regions.push({ cxLo, cxHi, cyLo, cyHi, area: w * h })
    }

    /* Centers must keep the whole chip outside typo: inset by half sizes + gap. */
    const leftOf = L - gapPx - halfW
    const rightOf = R + gapPx + halfW
    const aboveT = T - gapPx - halfH
    const belowB = B + gapPx + halfH

    push(xmin, leftOf, ymin, ymax)
    push(rightOf, xmax, ymin, ymax)
    push(xmin, xmax, ymin, aboveT)
    push(xmin, xmax, belowB, ymax)

    if(regions.length === 0){
        return null
    }

    const totalArea = regions.reduce((s, r) => s + r.area, 0)
    if(totalArea <= 0) return null

    for(let attempt = 0; attempt < 700; attempt += 1){
        const pick = Math.random() * totalArea
        let acc = 0
        let chosen = regions[regions.length - 1]
        for(let i = 0; i < regions.length; i += 1){
            acc += regions[i].area
            if(pick < acc){
                chosen = regions[i]
                break
            }
        }
        const cx = chosen.cxLo + Math.random() * (chosen.cxHi - chosen.cxLo)
        const cy = chosen.cyLo + Math.random() * (chosen.cyHi - chosen.cyLo)
        const leftPct = (cx / areaRect.width) * 100
        const topPct = (cy / areaRect.height) * 100
        if(axisAlignedButtonOverlapsRect(cx, cy, halfW, halfH, typo)) continue
        if(overlapsExistingPxPct(leftPct, topPct)) continue
        return { leftPct, topPct }
    }
    return null
}

function randomPosition(occupied = [], labelKey = ""){
    const wrapper = document.getElementById("chapter-wrapper");
    const area = document.getElementById("buttons");
    if(!wrapper || !area){
        return { left: "50%", top: "50%" }
    }

    const mapOpening = Boolean(mapEl && mapEl.classList.contains("map--opening"))
    const areaRect = area.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    if(areaRect.width <= 0 || areaRect.height <= 0){
        return { left: "50%", top: "50%" }
    }

    const buffer = 10;

    const centerLeftMin = ((wrapperRect.left - areaRect.left - buffer) / areaRect.width) * 100;
    const centerLeftMax = ((wrapperRect.right - areaRect.left + buffer) / areaRect.width) * 100;
    const centerTopMin = ((wrapperRect.top - areaRect.top - buffer) / areaRect.height) * 100;
    const centerTopMax = ((wrapperRect.bottom - areaRect.top + buffer) / areaRect.height) * 100;

    const wrapperStyle = getComputedStyle(wrapper)
    const textColumnAbsent =
        document.body.classList.contains("mobile-controls-view") ||
        wrapperStyle.display === "none" ||
        wrapperStyle.visibility === "hidden" ||
        wrapper.offsetParent === null ||
        wrapper.clientWidth === 0 ||
        wrapper.clientHeight === 0

    const wrapperMeasurable =
        !textColumnAbsent &&
        Number.isFinite(centerLeftMin) &&
        Number.isFinite(centerLeftMax) &&
        wrapperRect.width >= 4 &&
        wrapperRect.height >= 4

    const hasHorizontalOverlap = centerLeftMin < 95 && centerLeftMax > 0
    const hasVerticalOverlap = centerTopMin < 95 && centerTopMax > 0
    const openingTypoArea = mapOpening ? viewportRectToAreaLocal(getOpeningTypographyViewportRect(), areaRect) : null
    const useWrapperBand =
        wrapperMeasurable && hasHorizontalOverlap && hasVerticalOverlap &&
        !(mapOpening && openingTypoArea)
    const shouldExcludeCenter = useWrapperBand

    const narrow = window.innerWidth <= 900
    const controlsSpread = narrow && document.body.classList.contains("mobile-controls-view")
    const openingColW = mapOpening
        ? (narrow
            ? Math.min(760, window.innerWidth * 0.92)
            : Math.min(900, window.innerWidth * 0.9))
        : 0
    const sideGutterPx = mapOpening
        ? Math.max(narrow ? 20 : 40, (window.innerWidth - openingColW) / 2)
        : 0
    const baseEdgePadPx = controlsSpread ? 16 : Math.max(narrow ? 44 : 40, 40)
    const edgePaddingPxX = controlsSpread ? 16 : (mapOpening ? Math.max(baseEdgePadPx, sideGutterPx) : baseEdgePadPx)
    const edgePaddingPxY = controlsSpread ? 16 : baseEdgePadPx
    const edgeCapPct = controlsSpread ? 12 : (mapOpening ? 50 : 30)
    let edgeX = Math.min(edgeCapPct, (edgePaddingPxX / areaRect.width) * 100)
    let edgeY = Math.min(edgeCapPct, (edgePaddingPxY / areaRect.height) * 100)
    if(controlsSpread){
        const myR = estimateCollisionRadiusPx(labelKey, areaRect)
        const insetXPct = Math.min(12, ((myR + 2) / areaRect.width) * 100)
        const insetYPct = Math.min(8, ((myR + 2) / areaRect.height) * 100)
        edgeX = Math.max(edgeX, insetXPct)
        edgeY = Math.max(edgeY, insetYPct)
    }else{
        const { halfW, halfH } = estimateButtonHalfExtentsPx(labelKey, areaRect)
        const myR = estimateCollisionRadiusPx(labelKey, areaRect)
        const insetXPct = Math.min(49, (Math.max(halfW + 14, myR + 18) / areaRect.width) * 100)
        const insetYPct = Math.min(48, (Math.max(halfH + 14, myR + 18) / areaRect.height) * 100)
        edgeX = Math.max(edgeX, insetXPct)
        edgeY = Math.max(edgeY, insetYPct)
    }
    const minX = edgeX
    const maxX = 100 - edgeX
    const minY = edgeY
    const maxY = 100 - edgeY

    const minSepPx = controlsSpread ? 0 : (narrow ? 72 : 48)
    const myRadius = controlsSpread ? estimateCollisionRadiusPx(labelKey, areaRect) : 0

    let left = 50
    let top = 50
    let attempts = 0
    const maxAttempts = mapOpening ? 2000 : 800

    const overlapsExistingPx = (l, t) => {
        const x1 = (l / 100) * areaRect.width
        const y1 = (t / 100) * areaRect.height
        return occupied.some((p) => {
            const x2 = (p.left / 100) * areaRect.width
            const y2 = (p.top / 100) * areaRect.height
            const d = Math.hypot(x1 - x2, y1 - y2)
            if(controlsSpread && typeof p.radius === "number" && p.radius > 0){
                return d < myRadius + p.radius + 12
            }
            return d < minSepPx
        })
    }

    if(mapOpening && openingTypoArea && !controlsSpread){
        const { halfW, halfH } = estimateButtonHalfExtentsPx(labelKey, areaRect)
        const gapPx = 22
        const xmin = (minX / 100) * areaRect.width
        const xmax = (maxX / 100) * areaRect.width
        const ymin = (minY / 100) * areaRect.height
        const ymax = (maxY / 100) * areaRect.height
        let around = sampleOpeningAroundTypography(
            areaRect,
            openingTypoArea,
            halfW,
            halfH,
            gapPx,
            xmin,
            xmax,
            ymin,
            ymax,
            overlapsExistingPx,
        )
        if(!around){
            around = sampleOpeningAroundTypography(
                areaRect,
                openingTypoArea,
                halfW,
                halfH,
                12,
                xmin,
                xmax,
                ymin,
                ymax,
                overlapsExistingPx,
            )
        }
        if(around){
            return {
                left: around.leftPct + "%",
                top: around.topPct + "%",
                leftNum: around.leftPct,
                topNum: around.topPct,
                radiusNum: 0,
            }
        }
    }

    const positionAcceptable = (l, t) => {
        const inExcludedCenter = shouldExcludeCenter &&
            l > centerLeftMin && l < centerLeftMax &&
            t > centerTopMin && t < centerTopMax
        if(inExcludedCenter) return false
        const cx = (l / 100) * areaRect.width
        const cy = (t / 100) * areaRect.height
        const { halfW, halfH } = estimateButtonHalfExtentsPx(labelKey, areaRect)
        if(openingTypoArea && axisAlignedButtonOverlapsRect(cx, cy, halfW, halfH, openingTypoArea)){
            return false
        }
        if(overlapsExistingPx(l, t)) return false
        return true
    }

    do {
        left = minX + Math.random() * Math.max(0.5, (maxX - minX))
        top = minY + Math.random() * Math.max(0.5, (maxY - minY))
        attempts += 1
        if(positionAcceptable(left, top)){
            break
        }
    } while(attempts < maxAttempts)

    if(openingTypoArea && !positionAcceptable(left, top)){
        const stepX = Math.max(1.2, (maxX - minX) / 24)
        const stepY = Math.max(1.2, (maxY - minY) / 24)
        let placed = false
        for(let ty = minY; ty <= maxY + 0.001 && !placed; ty += stepY){
            for(let tx = minX; tx <= maxX + 0.001 && !placed; tx += stepX){
                if(positionAcceptable(tx, ty)){
                    left = tx
                    top = ty
                    placed = true
                }
            }
        }
    }

    return {
        left: left + "%",
        top: top + "%",
        leftNum: left,
        topNum: top,
        radiusNum: controlsSpread ? myRadius : 0,
    };
}

function showChapter(chapterKey, preserveScroll = false){
    // Hide all top-level blocks first.
    document.querySelectorAll(".chapter-block").forEach((el) => {
        el.classList.add("is-hidden")
    })

    const showOpening = () => {
        const opening = document.querySelector(".chapter-block--opening")
        if(opening){
            opening.classList.remove("is-hidden")
        }
    }

    const showContent = (sectionKey = null) => {
        const content = document.querySelector(".chapter-block--content")
        if(!content) return
        content.classList.remove("is-hidden")

        if(!chapterContainerEl || preserveScroll) return

        if(!sectionKey || sectionKey === "abstract"){
            chapterContainerEl.scrollTop = 0
            return
        }

        if(sectionKey.startsWith("chapter")){
            const chapterNumber = parseInt(sectionKey.replace("chapter", ""), 10)
            // Keep END. as an exception: land on the text block instead of forcing title visibility.
            if(chapterNumber === 5){
                const endSection = content.querySelector('[data-section="fiction5"]')
                if(endSection){
                    endSection.scrollIntoView({ block: "start" })
                }
                return
            }
            const chapterTitle = content.querySelector(`.chapter-pair--${chapterNumber} .chapter-title`)
            if(chapterTitle){
                chapterTitle.scrollIntoView({ block: "start" })
                return
            }
        }

        const section = content.querySelector(`[data-section="${sectionKey}"]`)
        if(section){
            section.scrollIntoView({ block: "start" })
        }
    }

    if(chapterKey === OPENING_KEY){
        showOpening()
        return
    }

    if(chapterKey === "abstract"){
        showContent("abstract")
        return
    }

    if(chapterKey === "transition"){
        showContent("transition")
        return
    }

    if(chapterKey.startsWith("chapter")){
        showContent(chapterKey)
        return
    }

    showContent("abstract")
}

function updateMobilePathRibbonHeight(){
    const root = document.documentElement
    if(!root || !pathContainer) return

    const inControlsView =
        document.body.classList.contains("mobile-dual-mode") &&
        document.body.classList.contains("mobile-controls-view")

    if(!inControlsView){
        root.style.removeProperty("--mobile-path-ribbon-height")
        root.style.removeProperty("--mobile-controls-buttons-top")
        return
    }

    const measured = Math.ceil(pathContainer.getBoundingClientRect().height || 0)
    const minHeight = 76
    root.style.setProperty("--mobile-path-ribbon-height", `${Math.max(minHeight, measured)}px`)

    const pathRect = pathContainer.getBoundingClientRect()
    const rootStyles = getComputedStyle(root)
    const gap = parseFloat(rootStyles.getPropertyValue("--mobile-path-buttons-gap")) || 0
    const buttonsTop = Math.ceil(pathRect.bottom + gap)
    root.style.setProperty("--mobile-controls-buttons-top", `${buttonsTop}px`)
}

function isDesktopPathOverflowingViewport(){
    if(!pathContainer || isMobileViewport()) return false
    const rect = pathContainer.getBoundingClientRect()
    return rect.bottom >= window.innerHeight
}

function buildCollapsedDesktopPath(currentStep){
    if(currentStep === OPENING_KEY) return null
    if(currentStep === "abstract"){
        return [OPENING_KEY, "abstract"]
    }
    return [OPENING_KEY, "abstract", currentStep]
}

function applyDesktopPathOverflowReset(){
    if(!isDesktopPathOverflowingViewport()) return false
    const current = path[path.length - 1]
    const nextPath = buildCollapsedDesktopPath(current)
    if(!nextPath) return false
    if(isSamePath(nextPath)) return false
    path.splice(0, path.length, ...nextPath)
    return true
}

function renderPath({ skipOverflowCheck = false } = {}){
    if(!pathContainer) return
    pathContainer.textContent = ""
    const frag = document.createDocumentFragment()

    path.forEach((step,index)=>{
        const div = document.createElement("div")
        const btn = document.createElement("button")

        btn.type = "button"
        btn.textContent = getPathStepLabel(step)
        btn.addEventListener("click", () => {
            if(step !== "abstract"){
                hideTopBarForNavigation()
            }
            path.length = index + 1
            mobilePanel = "text"
            render()
        })

        div.appendChild(btn)
        frag.appendChild(div)
    })

    pathContainer.appendChild(frag)
    if(!skipOverflowCheck && applyDesktopPathOverflowReset()){
        renderPath({ skipOverflowCheck: true })
        return
    }
    window.requestAnimationFrame(updateMobilePathRibbonHeight)
}

function renderButtons(){
    if(!buttonsContainer) return
    if(path[path.length-1] === OPENING_KEY){
        const ob = document.querySelector(".chapter-block--opening")
        void ob?.offsetHeight
        void mapEl?.offsetHeight
    }
    buttonsContainer.innerHTML = ""
    const frag = document.createDocumentFragment()
    const counts = getButtonCounts()
    const occupied = []

    const addBalancedButtons = (labels, totalCount, clickHandler) => {
        if(labels.length === 0) return
        const cappedTotal = Math.min(MAX_VISIBLE_BUTTONS, Math.max(labels.length, totalCount))
        const base = Math.floor(cappedTotal / labels.length)
        let remainder = cappedTotal % labels.length

        labels.forEach((label) => {
            const countForLabel = base + (remainder > 0 ? 1 : 0)
            if(remainder > 0) remainder -= 1
            for(let i=0;i<countForLabel;i++){
                frag.appendChild(createButton(label, clickHandler, occupied))
            }
        })
    }

    const handleButtonClick = (e) => {
        const key = e.currentTarget?.dataset?.chapter
        if(!key) return
        const fromKey = path[path.length-1]
        const goingFromOpeningToAbstract = fromKey === OPENING_KEY && key === "abstract"
        if(!goingFromOpeningToAbstract){
            hideTopBarForNavigation()
        }
        path.push(key)
        mobilePanel = "text"
        render()
    }

    const current = path[path.length-1]
    const labels = getVisibleLabelsForState(current)

    if(current === OPENING_KEY){
        addBalancedButtons(labels, counts.abstract, handleButtonClick)
    }else if(isPhoneControlsView()){
        addBalancedButtons(labels, labels.length, handleButtonClick)
    }else{
        addBalancedButtons(labels, counts.child * labels.length, handleButtonClick)
    }

    buttonsContainer.appendChild(frag)
    window.requestAnimationFrame(clampRandomButtonsToViewport)
}

function clampRandomButtonsToViewport(){
    if(!buttonsContainer) return
    const areaRect = buttonsContainer.getBoundingClientRect()
    if(areaRect.width <= 0 || areaRect.height <= 0) return

    const viewportW = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0
    if(viewportW <= 0 || viewportH <= 0) return

    const edgeInsetPx = isMobileViewport() ? 6 : 8
    const minLeft = edgeInsetPx
    const maxRight = viewportW - edgeInsetPx
    const minTop = edgeInsetPx
    const maxBottom = viewportH - edgeInsetPx

    const toPctX = (xPx) => (xPx / areaRect.width) * 100
    const toPctY = (yPx) => (yPx / areaRect.height) * 100

    buttonsContainer.querySelectorAll(".chapter-btn").forEach((btn) => {
        const rect = btn.getBoundingClientRect()
        if(rect.width <= 0 || rect.height <= 0) return

        const centerX = rect.left + (rect.width / 2)
        const centerY = rect.top + (rect.height / 2)
        let nextCenterX = centerX
        let nextCenterY = centerY

        if(rect.left < minLeft){
            nextCenterX += (minLeft - rect.left)
        }else if(rect.right > maxRight){
            nextCenterX -= (rect.right - maxRight)
        }

        if(rect.top < minTop){
            nextCenterY += (minTop - rect.top)
        }else if(rect.bottom > maxBottom){
            nextCenterY -= (rect.bottom - maxBottom)
        }

        if(nextCenterX !== centerX){
            const localX = Math.min(Math.max(0, nextCenterX - areaRect.left), areaRect.width)
            btn.style.left = `${toPctX(localX)}%`
        }
        if(nextCenterY !== centerY){
            const localY = Math.min(Math.max(0, nextCenterY - areaRect.top), areaRect.height)
            btn.style.top = `${toPctY(localY)}%`
        }
    })
}

function createButton(label,click,occupied){
    const btn = document.createElement("button")
    btn.type = "button"
    btn.textContent = getPathStepLabel(label)
    btn.classList.add("chapter-btn")
    btn.classList.add(`activate-${label}`)
    btn.dataset.chapter = label

    const pos = randomPosition(occupied, label)
    occupied.push({
        left: pos.leftNum,
        top: pos.topNum,
        radius: document.body.classList.contains("mobile-controls-view") ? pos.radiusNum : undefined,
    })
    btn.style.position = "absolute"
    btn.style.left = pos.left
    btn.style.top = pos.top
    btn.style.transform = "translate(-50%, -50%)"
    if(document.body.classList.contains("mobile-controls-view")){
        btn.style.maxWidth = "min(85vw, 300px)"
        btn.style.whiteSpace = "normal"
        btn.style.textAlign = "center"
    }

    btn.addEventListener("click", click)
    return btn
}

function render({ preserveScroll = false } = {}){
    const key = path[path.length-1]
    const previousKey = currentViewKey
    if(mapEl){
        mapEl.classList.toggle("map--opening", key === OPENING_KEY)
    }
    document.body.classList.toggle("site--opening", key === OPENING_KEY)
    if(key === OPENING_KEY){
        setTopBarHidden(false)
        lastHeadroomScrollTop = 0
    }else if(key === "abstract" && previousKey === OPENING_KEY){
        // Keep top bar visible on first arrival to Abstract.
        setTopBarHidden(false)
        lastHeadroomScrollTop = 0
    }else{
        scheduleTopBarHeadroomUpdate()
    }
    updateMobilePanels()
    showChapter(key, preserveScroll)

    if(!preserveScroll){
        suppressSpyUntil = performance.now() + 60
    }

    renderPath()

    if(key === OPENING_KEY){
        void mapEl?.offsetHeight
        requestAnimationFrame(() => {
            if(path[path.length-1] !== OPENING_KEY) return
            renderButtons()
        })
        if(document.fonts?.ready){
            document.fonts.ready.then(() => {
                if(path[path.length-1] !== OPENING_KEY) return
                renderButtons()
            })
        }
    } else {
        renderButtons()
    }

    window.requestAnimationFrame(updateChapterScrollThumb)
    currentViewKey = key
}

render()

let resizeRaf = null
window.addEventListener("resize", () => {
    if(resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => {
        updateInputModeClass()
        updateMobilePanels()
        renderButtons()
        updateChapterScrollThumb()
        updateMobilePathRibbonHeight()
    })
})

function isMobileViewport(){
    return window.innerWidth <= 900
}

function isPhoneControlsView(){
    return document.body.classList.contains("mobile-controls-view") && isMobileViewport()
}

function isTouchLikeDevice(){
    return (
        window.matchMedia("(pointer: coarse)").matches ||
        ("ontouchstart" in window) ||
        (navigator.maxTouchPoints > 0)
    )
}

function updateInputModeClass(){
    document.body.classList.toggle("touch-ui", isTouchLikeDevice())
}
updateInputModeClass()

function updateMobilePanels(){
    const currentKey = path[path.length-1]
    const dualMode = isMobileViewport() && isTouchLikeDevice() && currentKey !== OPENING_KEY
    document.body.classList.toggle("mobile-dual-mode", dualMode)
    document.body.classList.toggle("mobile-controls-view", dualMode && mobilePanel === "controls")
    window.requestAnimationFrame(updateMobilePathRibbonHeight)
}

let touchStartX = 0
let touchStartY = 0
let touchStartInChapter = false

if(containerEl){
    containerEl.addEventListener("touchstart", (e) => {
        const t = e.changedTouches[0]
        touchStartX = t.clientX
        touchStartY = t.clientY
        touchStartInChapter = Boolean(e.target && e.target.closest && e.target.closest("#chapter"))
    }, { passive: true })

    containerEl.addEventListener("touchend", (e) => {
        if(!document.body.classList.contains("mobile-dual-mode")) return

        const t = e.changedTouches[0]
        const dx = t.clientX - touchStartX
        const dy = t.clientY - touchStartY
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        const edgeZone = 28
        const vw = window.innerWidth || 0
        const startedAtEdge = touchStartX <= edgeZone || touchStartX >= (vw - edgeZone)
        const isIntentionalHorizontalSwipe = startedAtEdge && absDx >= 70 && absDx >= (absDy * 1.8)

        if(touchStartInChapter) return
        if(!isIntentionalHorizontalSwipe) return

        if(dx < 0){
            hideMobileHintOnce()
            mobilePanel = "controls"
        }else{
            mobilePanel = "text"
        }

        updateMobilePanels()
        if(mobilePanel === "controls"){
            renderButtons()
        }
    }, { passive: true })
}

function getOrderedPathSteps(){
    return ["abstract", "transition", ...getChapterLabels()]
}

function mapSectionToPathKey(sectionKey){
    if(sectionKey === "abstract" || sectionKey === "transition"){
        return sectionKey
    }
    const match = sectionKey.match(/^(fiction|research)(\d+)$/)
    if(!match) return null
    return `chapter${match[2]}`
}

function buildPathForStep(step){
    const steps = getOrderedPathSteps()
    const idx = steps.indexOf(step)
    if(idx === -1) return null
    return [OPENING_KEY, ...steps.slice(0, idx + 1)]
}

function isSamePath(nextPath){
    if(!nextPath || nextPath.length !== path.length) return false
    return nextPath.every((step, idx) => step === path[idx])
}

function getActivePathStepFromScroll(){
    const content = document.querySelector(".chapter-block--content")
    if(!content || content.classList.contains("is-hidden") || !chapterContainerEl){
        return null
    }

    const sections = Array.from(content.querySelectorAll("[data-section]"))
    if(sections.length === 0) return null

    const chapterRect = chapterContainerEl.getBoundingClientRect()
    const probeY = chapterRect.top + Math.max(24, chapterRect.height * 0.18)

    let activeStep = mapSectionToPathKey(sections[0].dataset.section || "")
    sections.forEach((section) => {
        const sectionKey = mapSectionToPathKey(section.dataset.section || "")
        if(!sectionKey) return
        const rect = section.getBoundingClientRect()
        if(rect.top <= probeY){
            activeStep = sectionKey
        }
    })

    return activeStep
}

function syncPathFromScroll(){
    if(performance.now() < suppressSpyUntil) return
    if(path[path.length - 1] === OPENING_KEY) return

    const activeStep = getActivePathStepFromScroll()
    if(!activeStep) return

    const nextPath = buildPathForStep(activeStep)
    if(!nextPath || isSamePath(nextPath)) return

    path.splice(0, path.length, ...nextPath)
    render({ preserveScroll: true })
}

function shouldIgnoreScroll(e){
    if(e && e.target && e.target.closest && e.target.closest('#chapter-wrapper')){
        return true
    }
    return false
}

if(mapEl){
    mapEl.addEventListener("wheel", (e) => {
        if(shouldIgnoreScroll(e)) return
        if(!chapterContainerEl) return
        if(mapEl.classList.contains("map--opening")) return
        e.preventDefault()
        chapterContainerEl.scrollTop += e.deltaY
    }, { passive: false })
}

if(chapterContainerEl){
    chapterContainerEl.addEventListener("scroll", () => {
        if(scrollSpyRaf) return
        scrollSpyRaf = requestAnimationFrame(() => {
            scrollSpyRaf = null
            syncPathFromScroll()
        })
    }, { passive: true })
}