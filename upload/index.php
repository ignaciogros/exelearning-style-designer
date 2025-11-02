<?php
// Enable error reporting (optional for development)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define paths
$rootDir = dirname(__DIR__);
$uploadDir = __DIR__;
$contentsDir = $rootDir . '/contents';
$themeTargetDir = $rootDir . '/theme';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $allowedSuffixes = ['_page', '_scorm', '_web'];
    $folderNames = ['page', 'scorm', 'web'];
    $messages = [];

    if (!isset($_FILES['zipFiles'])) {
        $messages[] = ['type' => 'danger', 'text' => 'No files uploaded.'];
    } else {
        // Delete existing root-level contents and theme folders if they exist
        if (is_dir($contentsDir)) {
            exec("rm -rf " . escapeshellarg($contentsDir));
        }
        if (is_dir($themeTargetDir)) {
            exec("rm -rf " . escapeshellarg($themeTargetDir));
        }

        // Create fresh contents directory
        if (!is_dir($contentsDir)) {
            mkdir($contentsDir, 0777, true);
        }

        // Process uploaded ZIP files
        foreach ($_FILES['zipFiles']['name'] as $index => $fileName) {
            $tmpPath = $_FILES['zipFiles']['tmp_name'][$index];

            foreach ($allowedSuffixes as $key => $suffix) {
                if (str_ends_with($fileName, $suffix . '.zip')) {
                    $targetFolder = $contentsDir . '/' . $folderNames[$key];

                    // Remove previous folder if exists (extra safety)
                    if (is_dir($targetFolder)) {
                        exec("rm -rf " . escapeshellarg($targetFolder));
                    }

                    // Create target folder only if it doesn't exist
                    if (!is_dir($targetFolder)) {
                        mkdir($targetFolder, 0777, true);
                    }

                    // Extract ZIP
                    $zip = new ZipArchive;
                    if ($zip->open($tmpPath) === TRUE) {
                        $zip->extractTo($targetFolder);
                        $zip->close();
                        unlink($tmpPath); // Delete uploaded zip
                    } else {
                        $messages[] = ['type' => 'danger', 'text' => 'Failed to unzip: ' . $fileName];
                    }
                }
            }
        }

        // Copy theme folder from contents/web to root
        /**
         * Recursively copy a directory
         */
        function copyDir($src, $dst) {
            $dir = opendir($src);
            if (!is_dir($dst)) mkdir($dst, 0777, true);
            while(false !== ($file = readdir($dir))) {
                if ($file != '.' && $file != '..') {
                    $srcPath = $src . '/' . $file;
                    $dstPath = $dst . '/' . $file;
                    if (is_dir($srcPath)) {
                        copyDir($srcPath, $dstPath);
                    } else {
                        copy($srcPath, $dstPath);
                    }
                }
            }
            closedir($dir);
        }
        $webThemeDir = $contentsDir . '/web/theme';
        if (is_dir($webThemeDir)) {
            copyDir($webThemeDir, $themeTargetDir);
        }

        // --- Replace strings in HTML files ---
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($contentsDir));
        foreach ($iterator as $file) {
            if ($file->isFile() && pathinfo($file, PATHINFO_EXTENSION) === 'html') {
                $content = file_get_contents($file);

                $replacements = [
                    '<script src="../theme/style.js"> </script>' => '<script>document.write(\'<script src="../../../theme/style.js?v=\'+Date.now()+\'"><\/script>\');</script>',
                    '<link rel="stylesheet" href="../theme/style.css">' => '<script>document.write(\'<link rel="stylesheet" href="../../../theme/style.css?v=\'+Date.now()+\'">\');</script>',
                    '<script src="theme/style.js"> </script>' => '<script>document.write(\'<script src="../../theme/style.js?v=\'+Date.now()+\'"><\/script>\');</script>',
                    '<link rel="stylesheet" href="theme/style.css">' => '<script>document.write(\'<link rel="stylesheet" href="../../theme/style.css?v=\'+Date.now()+\'">\');</script>',
                ];

                $content = str_replace(array_keys($replacements), array_values($replacements), $content);

                if (basename($file) === 'index.html') {
                    $content = str_replace('</body>', '<script src="../../files/js/style-designer.js"></script></body>', $content);
                } else {
                    $content = str_replace('</body>', '<script src="../../../files/js/style-designer.js"></script></body>', $content);
                }

                file_put_contents($file, $content);
            }
        }

        $messages[] = ['type' => 'success', 'text' => 'Processing completed successfully.'];
    }
}
?><!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="robots" content="noindex">
        <meta charset="utf-8">
        <title>Uploader | Style Designer</title>
        <link rel="icon" href="../files/favicon.ico">
        <link rel="stylesheet" href="../files/css/bootstrap.min.css">
        <script src="../files/js/jquery.min.js"></script>
        <script src="../files/js/bootstrap.bundle.min.js" defer></script>
        <link rel="stylesheet" href="../files/css/style-designer.css">
    </head>
    <body class="upload">
        <div id="sdHeader">
            <a href="../" class="btn btn-outline-light btn-sm mw" id="_blank">Style Designer</a>
        </div>
        <div class="container p-4">
            <h1 class="h5 mb-4 visually-hidden">Upload .zip files</h1>
            <?php if (!empty($messages)): ?>
                <?php foreach ($messages as $msg): ?>
                    <div class="alert alert-<?php echo $msg['type']; ?>">
                        <?php echo htmlspecialchars($msg['text']); ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
            <form method="post" enctype="multipart/form-data">
                <div class="mb-3">
                    <label for="zipFiles" class="form-label">Select 3 exported .zip files</label>
                    <input type="file" class="form-control" name="zipFiles[]" id="zipFiles" multiple required>
                    <div class="form-text">Files must end with _page.zip, _scorm.zip or _web.zip</div>
                </div>
                <button type="submit" class="btn btn-primary">Upload and process</button>
            </form>
            <ol class="mt-4 text-muted">
                <li>Open a content file with eXeLearning 3 and export it in these formats: Website, Single page, SCORM 1.2.<br />Do not change the default names that eXeLearning assigns (they end with _page.zip, _scorm.zip, and _web.zip).</li>
                <li>Then select the <strong>3 .zip files</strong> and click on "Upload and process."</li>
                <li>When the process is finished, click on "Style Viewer." There you can see the different views and switch between them easily.</li>
                <li>You can see the changes by editing the</li>
            </ol>
        </div>
</body>
</html>
