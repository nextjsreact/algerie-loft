import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// High-quality placeholder images from Unsplash
const imageUrls = [
  {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'loft-1.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'kitchen.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'living-room.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'bedroom.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'bathroom.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    filename: 'terrace.jpg'
  }
];

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'public', 'loft-images', filename);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const setupLoftImages = async () => {
  console.log('🖼️  Setting up loft images...');
  
  // Ensure directory exists
  const imagesDir = path.join(__dirname, '..', 'public', 'loft-images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('📁 Created loft-images directory');
  }
  
  try {
    // Download all images
    for (const image of imageUrls) {
      const filePath = path.join(imagesDir, image.filename);
      
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipped: ${image.filename} (already exists)`);
        continue;
      }
      
      await downloadImage(image.url, image.filename);
    }
    
    console.log('🎉 All loft images have been set up successfully!');
    console.log('📝 You can now replace these placeholder images with your own loft photos.');
    console.log('📖 See public/loft-images/README.md for more information.');
    
  } catch (error) {
    console.error('❌ Error setting up loft images:', error.message);
    console.log('💡 The carousel will use online placeholder images as fallback.');
  }
};

// Run the setup
setupLoftImages();