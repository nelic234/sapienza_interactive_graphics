// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.

// function for finding the new blended c value
function blend( alpha, fgAlpha, bgAlpha, fgC, bgC){
    return (fgAlpha * fgC + (1 - fgAlpha) * bgAlpha * bgC)/alpha;
}

function composite( bgImg, fgImg, fgOpac, fgPos )
{
    // loop over the different pixels in the image
    for (let i = 0; i < fgImg.width; i++) {
        for (let j = 0; j < fgImg.height; j++) {
            let x = i + fgPos['x'];
            let y = j + fgPos['y'];

            // check if out of bounds
            if (x < 0 || x >= bgImg.width || y < 0 || y >= bgImg.height) {
                continue;
            }

            // find the alpha values for both images and calculate the new alpha
            let bgAlpha = bgImg.data[(y*bgImg.width + x)*4 + 3]/255;
            let fgAlpha = fgImg.data[(j*fgImg.width + i)*4 + 3] * fgOpac/255;
            let alpha = fgAlpha + (1 - fgAlpha) * bgAlpha;
            
            // calculate the new c values for the background image
            bgImg.data[(y*bgImg.width + x)*4] = blend( alpha, fgAlpha, bgAlpha, fgImg.data[(j*fgImg.width + i)*4], bgImg.data[(y*bgImg.width + x)*4]);
            bgImg.data[(y*bgImg.width + x)*4 + 1] = blend( alpha, fgAlpha, bgAlpha, fgImg.data[(j*fgImg.width + i)*4 + 1], bgImg.data[(y*bgImg.width + x)*4 + 1]);
            bgImg.data[(y*bgImg.width + x)*4 + 2] = blend( alpha, fgAlpha, bgAlpha, fgImg.data[(j*fgImg.width + i)*4 + 2], bgImg.data[(y*bgImg.width + x)*4 + 2]);
            bgImg.data[(y*bgImg.width + x)*4 + 3] = alpha * 255;
        }
    }
}
