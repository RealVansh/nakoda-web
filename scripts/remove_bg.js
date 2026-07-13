/* eslint-disable */
const { Jimp } = require('jimp');

async function processImage() {
  try {
    const image = await Jimp.read('../public/images/nakoda_logo.jpg');
    
    // Background color: #0C0A09 (approx 12, 10, 9)
    // We will make anything close to black/dark gray transparent
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red   = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue  = this.bitmap.data[idx + 2];
      
      // If the pixel is very dark (close to the background color)
      // The background in the image is not perfectly uniform due to jpeg compression,
      // so we use a threshold
      if (red < 25 && green < 25 && blue < 25) {
        // Set alpha to 0 (transparent)
        this.bitmap.data[idx + 3] = 0;
      } else {
        // Optional: anti-aliasing edge blending could go here, but a hard threshold is fine for now
        // Let's soften the alpha for pixels that are somewhat dark to avoid harsh jagged edges
        if (red < 50 && green < 50 && blue < 50) {
           const maxVal = Math.max(red, green, blue);
           // scale alpha based on how far it is from the threshold
           const alpha = Math.floor(((maxVal - 25) / 25) * 255);
           this.bitmap.data[idx + 3] = alpha;
        }
      }
    });

    await image.write('../public/images/nakoda_logo.png');
    console.log('Successfully created transparent PNG logo');
  } catch (err) {
    console.error(err);
  }
}

processImage();
