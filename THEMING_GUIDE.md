# 🎨 Theming Guide - Creating New Projects

**Quick Guide:** How to create a new themed project in 15 minutes

---

## 🚀 QUICK START (15 Minutes)

### **Step 1: Copy Project Folder** (2 mins)
```bash
# Copy entire project
cp -r BBB BBB-YourProjectName

# Navigate to new project
cd BBB-YourProjectName
```

### **Step 2: Edit Theme File** (10 mins)
Open `src/components/BTCChart/styles/theme.css`

Change only these values:
```css
:root {
  /* Change these colors for your project */
  --color-up: #4CAF50;        /* UP button color */
  --color-down: #FF5722;      /* DOWN button color */
  --color-warning: #FEC300;   /* Warning/pending color */
  
  /* Optionally change background theme */
  --bg-main: #000000;         /* Main background */
  --bg-panel: #222222;        /* Panel background */
  
  /* Optionally change text colors */
  --text-primary: #ffffff;    /* Primary text */
}
```

### **Step 3: Test** (2 mins)
```bash
npm run dev
```
Open browser and check all colors updated

### **Step 4: Deploy** (1 min)
```bash
npm run build
# Deploy to your hosting
```

**Done!** 🎉

---

## 🎨 THEME EXAMPLES

### **Example 1: Bitcoin (Default - Green)**
```css
:root {
  --color-up: #4CAF50;      /* Green */
  --color-down: #FF5722;    /* Red */
  --bg-main: #000000;       /* Dark */
  --text-primary: #ffffff;
}
```
**Use for:** Bitcoin, Crypto projects

---

### **Example 2: Forex (Blue)**
```css
:root {
  --color-up: #2196F3;      /* Blue */
  --color-down: #FF5722;    /* Red */
  --bg-main: #000000;       /* Dark */
  --text-primary: #ffffff;
}
```
**Use for:** Forex, Currency trading

---

### **Example 3: Stocks (Purple)**
```css
:root {
  --color-up: #9C27B0;      /* Purple */
  --color-down: #FF5722;    /* Red */
  --bg-main: #000000;       /* Dark */
  --text-primary: #ffffff;
}
```
**Use for:** Stock market, Equity trading

---

### **Example 4: Light Theme (Purple)**
```css
:root {
  --color-up: #9C27B0;         /* Purple */
  --color-down: #FF5722;       /* Red */
  --bg-main: #ffffff;          /* White background */
  --bg-panel: #f5f5f5;         /* Light gray */
  --bg-section: #e0e0e0;       /* Medium gray */
  --bg-input: #ffffff;         /* White */
  --text-primary: #000000;     /* Black text */
  --text-secondary: #666666;   /* Dark gray */
  --border-color: #cccccc;     /* Light border */
}
```
**Use for:** Light mode preference

---

### **Example 5: Gold/Premium (Gold)**
```css
:root {
  --color-up: #FFD700;         /* Gold */
  --color-down: #C0C0C0;       /* Silver */
  --color-warning: #FFA500;    /* Orange */
  --bg-main: #1a1a1a;          /* Very dark */
  --bg-panel: #2a2a2a;         /* Dark gray */
  --text-primary: #ffffff;
}
```
**Use for:** Premium/VIP versions

---

## 📋 COMPLETE TOKEN REFERENCE

### **Colors**
| Token | Description | Default | Example Values |
|-------|-------------|---------|----------------|
| `--color-up` | UP/WIN button | `#4CAF50` | Green, Blue, Purple |
| `--color-up-hover` | UP hover state | `#66BB6A` | Lighter shade |
| `--color-down` | DOWN/LOSS button | `#FF5722` | Red, Orange |
| `--color-down-hover` | DOWN hover state | `#e64a19` | Lighter shade |
| `--color-warning` | Warning/pending | `#FEC300` | Yellow, Orange |
| `--color-success` | Success messages | `#4CAF50` | Green |
| `--color-danger` | Error messages | `#FF5722` | Red |
| `--color-info` | Info/draw | `#76a8e5` | Blue |

### **Backgrounds**
| Token | Description | Default | Example Values |
|-------|-------------|---------|----------------|
| `--bg-main` | Main background | `#000000` | Black, White |
| `--bg-panel` | Chart container | `#222222` | Dark gray, Light gray |
| `--bg-section` | Sections | `#1a1a1a` | Very dark, Medium gray |
| `--bg-input` | Input fields | `#2a2a2a` | Dark, White |

### **Text Colors**
| Token | Description | Default | Example Values |
|-------|-------------|---------|----------------|
| `--text-primary` | Main text | `#ffffff` | White, Black |
| `--text-secondary` | Secondary text | `#c9c9c9` | Light gray, Dark gray |
| `--text-muted` | Muted text | `#888888` | Medium gray |

### **Spacing** (Usually don't change)
| Token | Description | Default |
|-------|-------------|---------|
| `--spacing-xs` | Extra small | `4px` |
| `--spacing-sm` | Small | `8px` |
| `--spacing-md` | Medium | `16px` |
| `--spacing-lg` | Large | `24px` |
| `--spacing-xl` | Extra large | `32px` |

### **Sizes** (Usually don't change)
| Token | Description | Default |
|-------|-------------|---------|
| `--button-height-desktop` | Desktop button | `60px` |
| `--button-height-mobile` | Mobile button | `40px` |
| `--input-height` | Input fields | `28px` |
| `--chart-height` | Chart height | `475px` |

---

## ⚠️ IMPORTANT RULES

### **DO:**
✅ Edit `styles/theme.css` only  
✅ Test after every change  
✅ Use browser DevTools to preview colors  
✅ Keep color contrast for accessibility  
✅ Document your custom themes

### **DON'T:**
❌ Edit `core.css` (desktop styles)  
❌ Edit `mobile.css` (mobile styles)  
❌ Edit `index.css` (import file)  
❌ Remove `var()` syntax  
❌ Use hardcoded colors

---

## 🎨 CHOOSING COLORS

### **Color Psychology:**
- **Green:** Growth, success, money (Bitcoin, stocks up)
- **Red:** Warning, loss, danger (stocks down)
- **Blue:** Trust, stability, calm (Forex, finance)
- **Purple:** Luxury, premium, royal (VIP features)
- **Gold:** Premium, wealth, exclusive
- **Orange:** Energy, enthusiasm, creativity

### **Accessibility:**
- Ensure good contrast ratio (4.5:1 minimum)
- Test with colorblind simulators
- Don't rely on color alone (use text/icons too)

### **Tools:**
- [Coolors.co](https://coolors.co) - Color palette generator
- [Adobe Color](https://color.adobe.com) - Color wheel
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 🧪 TESTING YOUR THEME

### **Checklist:**
- [ ] UP button shows correct color
- [ ] DOWN button shows correct color
- [ ] Hover states work
- [ ] Trends display correct colors
- [ ] Timer shows correct colors
- [ ] Background theme matches
- [ ] Text is readable
- [ ] Mobile view looks good
- [ ] All colors are consistent

### **Test Scenarios:**
1. Place UP bet → Check green theme
2. Place DOWN bet → Check red theme
3. View on mobile → Check responsive design
4. Check in dark room → Ensure not too bright
5. Check in daylight → Ensure readable

---

## 🐛 TROUBLESHOOTING

### **Colors not changing?**
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Check you edited the correct `theme.css` file
3. Make sure you saved the file
4. Check browser console for errors

### **Some elements wrong color?**
1. You may have hardcoded a color somewhere
2. Check `core.css` and `mobile.css` for hex codes
3. Replace with appropriate token

### **Text not readable?**
1. Check contrast ratio
2. Adjust `--text-primary` color
3. For light backgrounds, use dark text

---

## 💡 ADVANCED CUSTOMIZATION

### **Multiple Themes in One Project**
```css
/* Default theme */
:root {
  --color-up: #4CAF50;
}

/* Alternative theme */
[data-theme="blue"] {
  --color-up: #2196F3;
}

[data-theme="purple"] {
  --color-up: #9C27B0;
}
```

**Switch theme in JavaScript:**
```javascript
document.documentElement.setAttribute('data-theme', 'blue');
```

---

### **Dark/Light Mode Toggle**
```css
/* Dark mode (default) */
:root {
  --bg-main: #000000;
  --text-primary: #ffffff;
}

/* Light mode */
[data-mode="light"] {
  --bg-main: #ffffff;
  --text-primary: #000000;
}
```

---

## 📞 NEED HELP?

- Check `CSS_REFACTOR_PLAN.md` for detailed documentation
- Review `styles/theme.css` comments
- Test in browser DevTools (Inspect → Computed styles)

---

**Remember:** Only edit `theme.css` to create new projects! 🎨
