# Casa Aurelia

Casa Aurelia is a responsive luxury real estate property showcase template. It presents a private residence with property details, photography, floor plans, location information, and a frontend-only visit request demonstration. The site is built with HTML5, CSS3, and vanilla JavaScript; it does not require a framework or build process.

## Features

- Responsive layouts for desktop, tablet, and mobile screens.
- Hero section, property overview, price, specifications, and amenities.
- Eight-image gallery with an interactive Lightbox, image captions, keyboard navigation, and touch swipe navigation.
- Accessible tabs for ground-floor and first-floor plans and property specifications.
- Location section with approximate travel times and a static location illustration (not an interactive map).
- Five-step visit request interface with visit type, date, time, personal details, and review.
- Client-side date, time, contact-detail, and consent validation using mock availability.
- Booking draft persistence in the browser's local storage.
- ICS calendar-file export for the simulated request.
- FAQ accordion and responsive mobile navigation.
- Accessibility support including a skip link, semantic landmarks, focus management, keyboard interactions, and reduced-motion handling.

## Technologies

- HTML5, including semantic elements, native form controls, and Schema.org JSON-LD structured data.
- CSS3, including custom properties, fluid sizing, and responsive media queries.
- Vanilla JavaScript and browser APIs:
  - DOM selection, events, and focus management.
  - `localStorage` for booking drafts.
  - `Intl.DateTimeFormat` for date labels.
  - `matchMedia` for responsive navigation and reduced-motion preferences.
  - `IntersectionObserver` for reveal effects where supported.
  - `Blob` and `URL.createObjectURL()` for ICS downloads where supported.

There are no JavaScript frameworks, package dependencies, or build tools in the project.

## Project structure

```text
Casa Aurelia/
├── index.html
├── LICENSES.md
├── README.md
├── assets/
│   └── images/
│       ├── agent.jpg
│       ├── floorplan-first.jpg
│       ├── floorplan-ground.jpg
│       ├── gallery-01.jpg
│       ├── gallery-02.jpg
│       ├── gallery-03.jpg
│       ├── gallery-04.jpg
│       ├── gallery-05.jpg
│       ├── gallery-06.jpg
│       ├── gallery-07.jpg
│       ├── gallery-08.jpg
│       ├── hero.jpg     
├── css/
│   └── styles.css
└── js/
    └── main.js
```

The `hero.jpg`, `gallery-01.jpg` through `gallery-08.jpg`, `floorplan-ground.jpg`, `floorplan-first.jpg`, and `agent.jpg` files are referenced by the page. Other JPGs listed above are present in the package but are not currently referenced by the page.

## Getting started

1. Download or extract the template files.
2. Open the extracted project folder in Visual Studio Code.
3. If needed, install the **Live Server** extension in VS Code.
4. Open `index.html` and select **Go Live** in the VS Code status bar, or use the editor's **Open with Live Server** command.
5. Live Server opens the page in a browser. If it does not, open the local address shown by the extension.

Node.js, npm, and a build step are not required.

## Customization

### Property content

Edit `index.html` to change the property name, description, asking price, area, room counts, amenities, location text, FAQs, and property specifications. Some details appear in more than one place, including the hero, property card, booking summary, and FAQ; update each relevant occurrence for consistency.

The document also contains canonical, Open Graph, Twitter, and JSON-LD example property values. Replace the `.example` URLs and update the structured property data before publishing.

### Colors, typography, and layout

Edit the CSS custom properties near the top of `css/styles.css` to adjust the color palette, font stacks, type scale, content width, and spacing. Responsive layout rules and breakpoints are also defined in that stylesheet.

### Advisor and contact information

Update the advisor's name, role, description, email, and phone links in `index.html`. Also review the footer contact details, privacy and legal links, booking consent text, and other contact references so they match your business.

### Gallery and floor plans

Replace the referenced files in `assets/images/` with your own images, keeping the filenames or updating their paths in `index.html`. The gallery Lightbox reads its image and alternative text from the gallery thumbnails.

## Replacing images

The default package uses JPG images in `assets/images/`. The page references these files:

- `hero.jpg`
- `gallery-01.jpg` through `gallery-08.jpg`
- `floorplan-ground.jpg`
- `floorplan-first.jpg`
- `agent.jpg`

You can replace these JPGs with your own while preserving the original filenames. Where practical, keep the current dimensions and aspect ratios to maintain the intended crops and layout. The default package does **not** include WebP or AVIF images.

WebP images can also be used, but update the corresponding image paths and markup in `index.html`. The current JavaScript image fallback removes any `<source>` elements and reverts to the image's `src`, so retain a valid JPG `src` as the fallback when using WebP sources. The Lightbox uses each gallery thumbnail's image path and alternative text; it does not contain a separate list of image filenames.

## Booking demonstration notice

The booking interface is a frontend demonstration only:

- It does not send real booking requests and does not connect to a backend or database.
- Date and time availability is mock data, not a live schedule.
- Draft form data is stored in the browser's local storage under `aurelia-visit-draft`.
- Completing the form simulates a response on the page. No appointment is reserved and no personal data leaves the browser.
- After the simulated completion, the page can generate an ICS calendar file for the demo request.

Real booking functionality requires a secure backend integration, including server-side validation and appropriate handling of personal data.

## Browser compatibility

The template uses standard HTML, CSS, and browser JavaScript APIs and is intended for modern browsers. It has no project-specific browser support matrix, so test the finished site in the browsers and devices you intend to support. Local storage can be unavailable in some browsing contexts, and ICS download support depends on browser support for Blob URLs.

## License and support

Refer to [`LICENSES.md`](./LICENSES.md) for image credit and licensing records and the publishing checklist. Complete and verify the image licensing information before publishing.

No support channel is specified in the project files.
