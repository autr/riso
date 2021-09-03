import rectd from './_rectd.js'

export default {
	rgbToHsl: function(r, g, b) {
		r /= 255, g /= 255, b /= 255;

		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if (max == min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return [ h, s, l ];
	},
	createThumbnail: ( url, scale) => {

        return new Promise( (resolve, reject) => {


            let img = new Image()
            img.onload = e => {

                let canvas = document.createElement('canvas')
                let ctx = canvas.getContext('2d')
                let bounds = rectd.autoSetObject( img )
                let fit = rectd.fitInto( bounds, scale, 0.5 )
                canvas.width = scale.width
                canvas.height = scale.height
                ctx.drawImage(img, fit.x,fit.y,fit.width,fit.height)
                resolve(canvas.toDataURL('image/png'))
            }
            img.src = url

        })
    }
}