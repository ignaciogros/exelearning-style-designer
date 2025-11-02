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

## Installation

### 1. Docker (Recommended)

This is the easiest way to run the application without installing PHP or Apache locally.

1. Make sure **Docker Desktop** is installed and running.  
2. Clone or download this repository.  
3. Navigate to the project root in a terminal.  
4. Build and start the container:

```bash
docker-compose up --build
```

5. Open your browser and visit:

```
http://localhost:8000/
```

> You can change the port mapping in `docker-compose.yml` if needed.

---

### 2. Direct Installation on Apache

If you prefer to run the application directly on a local Apache server:

1. Make sure you have **PHP 8+** and Apache installed.  
2. Copy the project files to your Apache document root (e.g., `htdocs` or `www`).  
3. Ensure the `path-to-project/` folder is accessible via your browser.  
4. Adjust PHP settings if needed for large file uploads:

```ini
upload_max_filesize = 50M
post_max_size = 50M
memory_limit = 128M
```

5. Open your browser and visit:

```
http://localhost/path-to-project/index.php
```

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

## Notes

- The tool is intended for **designers only**.  
- It is **not secure** for production use.  
- Always test generated styles in a safe environment before deploying to any live site.
- When you have finished, it is important to **test your Style within eXeLearning** to ensure that its CSS code does not affect the application interface.
