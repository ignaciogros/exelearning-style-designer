# eXeLearning Style Designer

**License:** AGPL

## Description

eXeLearning Style Designer is a tool designed to facilitate the creation of custom styles for **eXeLearning 3**.

With this tool, you can easily edit and customize the look and feel of your eXeLearning projects by modifying style files and packaging them for distribution.

---

## Important Notice

⚠️ **This application must never be used in production.**  
It does not include the necessary security measures. This tool is intended solely for designers to simplify the creation of styles for eXeLearning 3.

---

## How to Use

1. Export your eXeLearning project as:
   - A **Website**  
   - A **SCORM 1.2**  
   - A **Single page**  
   using the style you want to customize.

2. Make sure to enable all project properties (search box, page counter, etc.) to ensure your style remains compatible with those features.

3. Open **eXeLearning Style Designer**.

4. Upload the three exported `.zip` files.

5. Edit the `style.css` and `style.js` files located in the `theme` folder as needed.

6. When you finish editing, click **"Done"** to generate your customized style package.

---

## Serving the Tool

Any static server works; the examples below cover the most common options:

- **Node.js (http-server)**
  ```bash
  npm install --global http-server        # once
  http-server -p 8080                     # from the project root
  ```
  Navigate to `http://127.0.0.1:8080/`.

- **PHP built-in web server**
  ```bash
  php -S 127.0.0.1:8080
  ```

- **Python 3 (http.server)**
  ```bash
  python3 -m http.server 8080
  ```

- **Any other static server**
  Point Apache, Nginx, Caddy, etc. at the repository root; no rewrite rules are required.

> **Tip:** When you change code, do a hard refresh (`Ctrl`/`Cmd` + `Shift` + `R`) so the updated service worker and assets reload.

---

## Notes

- The tool is intended for **designers only**.  
- It is **not secure** for production use.  
- Always test generated styles in a safe environment before deploying to any live site.
- When you have finished, it is important to **test your Style within eXeLearning** to ensure that its CSS code does not affect the application interface.

---

## License

This project is licensed under the **AGPL**. You may freely use, modify, and distribute it under the terms of the Affero General Public License.

---

## Credits / Attributions

The following third-party resources are included in this project:

- **Example content:** `leer-para-aprender.elpx`  
  Used to create screenshots of Styles in eXeLearning 3.  
  Original content created for [CEDEC](https://cedec.intef.es/).  
  License: [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/3.0/)

- **Icon:** `files/img/new-window.svg`  
  Source: [Google Fonts Icons](https://fonts.google.com/icons)  
  License: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

- **Bootstrap JavaScript:** `files/js/bootstrap.bundle.min.js` and `bootstrap.bundle.min.js.map`  
  Source: [Bootstrap](https://getbootstrap.com/)  
  License: [MIT License](https://github.com/twbs/bootstrap/blob/main/LICENSE)

- **jQuery:** `files/js/jquery.min.js`  
  Source: [jQuery](https://jquery.com/)  
  License: [MIT License](https://jquery.org/license/)

- **Bootstrap CSS:** `files/css/bootstrap.min.css` and `bootstrap.min.css.map`  
  Source: [Bootstrap](https://getbootstrap.com/)  
  License: [MIT License](https://github.com/twbs/bootstrap/blob/main/LICENSE)

- **eXeLearning Logo:**  
  Source: [eXeLearning GitHub](https://github.com/exelearning/exelearning/)  
  License: AGPL (same as this project)

> All other files in this project were created by [@ignaciogros](https://github.com/ignaciogros) and are licensed under AGPL.
