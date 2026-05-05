import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// Recursively find all image files in directory and subdirectories
function findImageFiles(dir: string): string[] {
  const imageFiles: string[] = [];

  function scanDirectory(currentDir: string) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        // Skip node_modules and other common directories to avoid
        if (
          !item.name.startsWith(".") &&
          item.name !== "node_modules" &&
          item.name !== "dist" &&
          item.name !== "build"
        ) {
          scanDirectory(fullPath);
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
          imageFiles.push(fullPath);
        }
      }
    }
  }

  scanDirectory(dir);
  return imageFiles;
}

async function convertImagesToWebP() {
  const currentDir = process.cwd();
  console.log(`Scanning directory recursively: ${currentDir}`);

  try {
    // Find all image files recursively
    const imageFiles = findImageFiles(currentDir);

    if (imageFiles.length === 0) {
      console.log("No PNG or JPG files found in the directory tree.");
      return;
    }

    console.log(`Found ${imageFiles.length} image file(s):`);
    imageFiles.forEach((file) => {
      const relativePath = path.relative(currentDir, file);
      console.log(`  - ${relativePath}`);
    });

    // Convert each image file
    for (const imageFile of imageFiles) {
      const inputPath = imageFile; // imageFile is already a full path
      const fileExtension = path.extname(imageFile).toLowerCase();
      const baseName = path.basename(imageFile, fileExtension);
      const outputPath = path.join(path.dirname(imageFile), `${baseName}.webp`);

      const relativePath = path.relative(currentDir, imageFile);
      console.log(`Converting ${relativePath} to WebP...`);

      try {
        await sharp(inputPath)
          .webp({
            quality: 80,
            effort: 6, // Higher effort for better compression
          })
          .toFile(outputPath);

        // Get file sizes for comparison
        const originalSize = fs.statSync(inputPath).size;
        const newSize = fs.statSync(outputPath).size;
        const savings = (
          ((originalSize - newSize) / originalSize) *
          100
        ).toFixed(1);

        console.log(
          `✓ Converted ${relativePath} -> ${path.basename(outputPath)}`
        );
        console.log(
          `  Size: ${(originalSize / 1024).toFixed(1)}KB -> ${(
            newSize / 1024
          ).toFixed(1)}KB (${savings}% reduction)`
        );

        // Delete the original image file
        fs.unlinkSync(inputPath);
        console.log(`✓ Deleted original file: ${relativePath}`);
      } catch (error) {
        console.error(`✗ Error converting ${relativePath}:`, error);
      }
    }

    console.log("\nConversion complete!");
  } catch (error) {
    console.error("Error scanning directory:", error);
  }
}

// Run the conversion
convertImagesToWebP().catch(console.error);
