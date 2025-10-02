# 🎯 QUICK REFERENCE CARD

**Project:** CSS Refactor - Design Tokens Implementation

---

## 📂 FILE STRUCTURE

```
BEFORE:
src/components/
└── BTCChart.css (1,764 lines - everything mixed)

AFTER:
src/components/BTCChart/
└── styles/
    ├── index.css       (5 lines - imports)
    ├── theme.css       (100 lines - EDIT PER PROJECT)
    ├── core.css        (800 lines - don't touch)
    └── mobile.css      (500 lines - don't touch)
```

---

## ⚡ QUICK COMMANDS

### Setup:
```bash
# Create folder
mkdir -p src/components/BTCChart/styles

# Backup original
cp src/components/BTCChart.css src/components/BTCChart.css.backup

# Create empty files
touch src/components/BTCChart/styles/{index,theme,core,mobile}.css
```

### Find & Replace:
```bash
# Find all hex colors
grep -rn "#[0-9A-Fa-f]" styles/

# Find all hardcoded sizes
grep -rn "[0-9]px" styles/

# Count lines
wc -l styles/*.css
```

### Testing:
```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

### Git:
```bash
# Check changes
git status
git diff

# Commit
git add .
git commit -m "refactor: implement design tokens system"
git push origin individual-betting-system
```

---

## 🎨 TOKEN QUICK REFERENCE

### Most Common Tokens:
```css
/* Colors */
--color-up: #4CAF50;           /* UP button */
--color-down: #FF5722;         /* DOWN button */
--color-warning: #FEC300;      /* Warning */

/* Backgrounds */
--bg-main: #000000;            /* Main bg */
--bg-panel: #222222;           /* Panel bg */

/* Text */
--text-primary: #ffffff;       /* Main text */

/* Spacing */
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;

/* Sizes */
--button-height-desktop: 60px;
--button-height-mobile: 40px;
```

---

## 📋 PHASE CHECKLIST (Quick)

- [ ] **Phase 1:** Setup (30 min) - Person A
- [ ] **Phase 2:** Create tokens (1 hr) - Person A
- [ ] **Phase 3:** Split desktop CSS (1.5 hr) - Person A
- [ ] **Phase 4:** Split mobile CSS (1 hr) - Person B
- [ ] **Phase 5:** Import hub (15 min) - Person A
- [ ] **Phase 6:** Testing (45 min) - Both
- [ ] **Phase 7:** Documentation (30 min) - Person B
- [ ] **Phase 8:** Git commit (15 min) - Person A

**Total:** 3.5-4 hours

---

## 🧪 TESTING CHECKLIST (Quick)

**Visual:**
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Functional:**
- [ ] Buttons work
- [ ] Timer animates
- [ ] Modal opens
- [ ] Mobile responsive

**Browsers:**
- [ ] Chrome
- [ ] Safari
- [ ] Firefox

---

## 🚀 CREATE NEW PROJECT (15 min)

```bash
# 1. Copy project (2 min)
cp -r BBB BBB-NewProject
cd BBB-NewProject

# 2. Edit theme.css (10 min)
# Change: --color-up, --color-down, --bg-main

# 3. Test (2 min)
npm run dev

# 4. Deploy (1 min)
npm run build
```

---

## ⚠️ COMMON ISSUES

**Styles not working?**
→ Check import order in index.css (theme first!)

**Colors not changing?**
→ Clear browser cache (Cmd+Shift+R)

**Mobile broken?**
→ Check all @media in mobile.css

**Variables not working?**
→ Check :root in theme.css

---

## 📞 HELP FILES

- `CSS_REFACTOR_PLAN.md` - Full project documentation
- `THEMING_GUIDE.md` - How to create new projects
- `CSS_REFACTOR_CHECKLIST.md` - Detailed checklist

---

## 🎯 SUCCESS CRITERIA

✅ Desktop looks identical  
✅ Mobile looks identical  
✅ No console errors  
✅ All functions work  
✅ Can create new project in 15 min

---

**Quick Links:**
- Phases: See CSS_REFACTOR_PLAN.md
- Checklist: See CSS_REFACTOR_CHECKLIST.md
- Theming: See THEMING_GUIDE.md
