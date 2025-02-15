/**
 * @fileoverview jsTGALoader - Javascript loader for TGA file
 * @author Vincent Thibault
 * @version 1.2.0
 * @blog http://blog.robrowser.com/javascript-ase-loader.html
 */

/* Copyright (c) 2013, Vincent Thibault. All rights reserved.
Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

(function(_global)
{
	'use strict';


	/**
	 * TGA Namespace
	 * @constructor
	 */
	window.Aseprite = function()
	{
	}

  Aseprite.ChunkType = {
		OLD_PALLETTE_4:   0x0004,
		OLD_PALLETTE_11:  0x0011,
		LAYER:            0x2004,
		CEL:              0x2005,
		CEL_EXTRA:        0x2006,
		COLOR_PROFILE:    0x2007,
		EXTERNAL_FILES:   0x2008,
		TAGS:             0x2018,
		PALETTE:          0x2019,
		USER_DATA:        0x2020,
		SLICE:            0x2022,
		TILESET:          0x2023
	}


	/**
	 * Check the header of TGA file to detect errors
	 *
	 * @param {object} ase header structure
	 * @throws Error
	 */
	function checkHeader( header )
	{
		// Check file magic
		if (header.magic !== 0xA5E0) {
			throw new Error('Aseprite::checkHeader() - Invalid magic number');
		}

		// Check flags
		if (header.flags !== 1) {
			throw new Error('Aseprite::checkHeader() - Layer opacity not valid');
		}


		// Check image size
		if (header.width <= 0 || header.height <= 0) {
			throw new Error('Aseprite::checkHeader() - Invalid image size');
		}

		// Check pixel size
		if (header.colorDepth !== 8  && // Indexed
		    header.colorDepth !== 16 && // Grayscale
		    header.colorDepth !== 32) { // RGBA
			throw new Error('Aseprite::checkHeader() - Invalid pixel size "' + header.pixelDepth + '"');
		}
	}


	/**
	 * Return a ImageData object from a TGA file (8bits)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} indexes - index to colormap
	 * @param {Array} colormap
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageData8bits(imageData, indexes, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var color, i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i++) {
				color = indexes[i];
				imageData[(x + width * y) * 4 + 3] = 255;
				imageData[(x + width * y) * 4 + 2] = colormap[(color * 3) + 0];
				imageData[(x + width * y) * 4 + 1] = colormap[(color * 3) + 1];
				imageData[(x + width * y) * 4 + 0] = colormap[(color * 3) + 2];
			}
		}

		return imageData;
	}


	/**
	 * Return a ImageData object from a TGA file (16bits)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} pixels data
	 * @param {Array} colormap - not used
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageData16bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var color, i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i += 2) {
				color = pixels[i + 0] | (pixels[i + 1] << 8);
				imageData[(x + width * y) * 4 + 0] = (color & 0x7C00) >> 7;
				imageData[(x + width * y) * 4 + 1] = (color & 0x03E0) >> 2;
				imageData[(x + width * y) * 4 + 2] = (color & 0x001F) >> 3;
				imageData[(x + width * y) * 4 + 3] = (color & 0x8000) ? 0 : 255;
			}
		}

		return imageData;
	}


	/**
	 * Return a ImageData object from a TGA file (24bits)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} pixels data
	 * @param {Array} colormap - not used
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageData24bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i += 3) {
				imageData[(x + width * y) * 4 + 3] = 255;
				imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
				imageData[(x + width * y) * 4 + 1] = pixels[i + 1];
				imageData[(x + width * y) * 4 + 0] = pixels[i + 2];
			}
		}

		return imageData;
	}


	/**
	 * Return a ImageData object from a TGA file (32bits)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} pixels data
	 * @param {Array} colormap - not used
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageData32bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i += 4) {
				imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
				imageData[(x + width * y) * 4 + 1] = pixels[i + 1];
				imageData[(x + width * y) * 4 + 0] = pixels[i + 2];
				imageData[(x + width * y) * 4 + 3] = pixels[i + 3];
			}
		}

		return imageData;
	}


	/**
	 * Return a ImageData object from a TGA file (8bits grey)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} pixels data
	 * @param {Array} colormap - not used
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageDataGrey8bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var color, i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i++) {
				color = pixels[i];
				imageData[(x + width * y) * 4 + 0] = color;
				imageData[(x + width * y) * 4 + 1] = color;
				imageData[(x + width * y) * 4 + 2] = color;
				imageData[(x + width * y) * 4 + 3] = 255;
			}
		}

		return imageData;
	}


	/**
	 * Return a ImageData object from a TGA file (16bits grey)
	 *
	 * @param {Array} imageData - ImageData to bind
	 * @param {Array} pixels data
	 * @param {Array} colormap - not used
	 * @param {number} width
	 * @param {number} y_start - start at y pixel.
	 * @param {number} x_start - start at x pixel.
	 * @param {number} y_step  - increment y pixel each time.
	 * @param {number} y_end   - stop at pixel y.
	 * @param {number} x_step  - increment x pixel each time.
	 * @param {number} x_end   - stop at pixel x.
	 * @returns {Array} imageData
	 */
	function getImageDataGrey16bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end)
	{
		var i, x, y;

		for (i = 0, y = y_start; y !== y_end; y += y_step) {
			for (x = x_start; x !== x_end; x += x_step, i += 2) {
				imageData[(x + width * y) * 4 + 0] = pixels[i + 0];
				imageData[(x + width * y) * 4 + 1] = pixels[i + 0];
				imageData[(x + width * y) * 4 + 2] = pixels[i + 0];
				imageData[(x + width * y) * 4 + 3] = pixels[i + 1];
			}
		}

		return imageData;
	}


	/**
	 * Open a targa file using XHR, be aware with Cross Domain files...
	 *
	 * @param {string} path - Path of the filename to load
	 * @param {function} callback - callback to trigger when the file is loaded
	 */
	Aseprite.prototype.open = function asepriteOpen(path, callback)
	{
		var req, ase = this;
		req = new XMLHttpRequest();
		req.open('GET', path, true);
		req.responseType = 'arraybuffer';
		req.onload = function() {
			if (this.status === 200) {
				ase.load(new Uint8Array(req.response));
				if (callback) {
					callback.call(ase);
				}
			}
		};
		req.send(null);
	};


	/**
	 * Load and parse a TGA file
	 *
	 * @param {Uint8Array} data - TGA file buffer array
	 */
	Aseprite.prototype.load = function aseLoad( data )
	{
		var offset = 0;
		var chunks = 0;

		// Not enough data to contain header ?
		if (data.length < 0x80) {
			throw new Error('Aseprite::load() - Not enough data to contain header');
		}

		// Read TgaHeader
		this.header = {
			/* 0x00  DWORD */  fileSize:       data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
			/* 0x01  WORD  */  magic:          data[offset++] | data[offset++] << 8,
			/* 0x02  WORD  */  numFrames:         data[offset++] | data[offset++] << 8,
			/* 0x03  WORD  */  width:          data[offset++] | data[offset++] << 8,
			/* 0x05  WORD  */  height:         data[offset++] | data[offset++] << 8,
			/* 0x07  WORD  */  colorDepth:     data[offset++] | data[offset++] << 8,
			/* 0x08  DWORD */  flags:          data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
			/* 0x0a  WORD  */  speed:          data[offset++] | data[offset++] << 8,
			/* 0x0c  DWORD */  padding:        data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
			/* 0x0e  DWORD */  padding:        data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
			/* 0x10  BYTE  */  palletteEntry:  data[offset++],
			/* 0x11  BYTE  */  ignore:         data[offset++],
			/* 0x11  BYTE  */  ignore:         data[offset++],
			/* 0x11  BYTE  */  ignore:         data[offset++],
			/* 0x11  BYTE  */  numColor:       data[offset++] | data[offset++] << 8,
			/* 0x10  BYTE  */  pixelWidth:     data[offset++],
			/* 0x10  BYTE  */  pixelHeight:    data[offset++],
			/* 0x10  SHORT */  gridXPos:       data[offset++] | data[offset++] << 8,
			/* 0x10  SHORT */  gridYPos:       data[offset++] | data[offset++] << 8,
			/* 0x0e  WORD  */  gridWidth:      data[offset++] | data[offset++] << 8,
			/* 0x0e  WORD  */  gridHeight:     data[offset++] | data[offset++] << 8,
			/* 0x0e  WORD  */  future:         data.slice(offset, offset+=84),
		};

		// Check if a valid TGA file (or if we can load it)
		checkHeader(this.header);
	};

	this.frames = [];
	for (f = 0; f < this.header.numFrames; f++) {
		const frame = {
			/* 0x00  DWORD */ frameSize: data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
			/* 0x04  WORD  */ magic:     data[offset++] | data[offset++] << 8,
			/* 0x06  WORD  */ oldChunks: data[offset++] | data[offset++] << 8,
			/* 0x08  WORD  */ frameLen:  data[offset++] | data[offset++] << 8,
			/* 0x0A  BYTE  */ future:    data[offset++],
			/* 0x0B  BYTE  */ future:    data[offset++],
			/* 0x0C  DWORD */ newChunks: data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24,
		};
		frame.chunks = []
		if (frame.newChunks === 0) {
			chunks = frame.newChunks
		} else {
			chunks = frame.oldChunks
		}
		for (i = 0; i < chunks; i++) {
			var size = data[offset++] | data[offset++] << 8 | data[offset++] << 16 | data[offset++] << 24
			frame.chunks.push({
				/* DWORD */ size: size,
				/* WORD  */ type: data[offset++] | data[offset++] << 8,
				/* BYTES */ data: data.slice(offset, offset+=(size-6))
			})
		}
	};


	/**
	 * Return a ImageData object from a TGA file
	 *
	 * @param {object} imageData - Optional ImageData to work with
	 * @returns {object} imageData
	 */
	Aseprite.prototype.getImageData = function targaGetImageData( imageData )
	{
		var width  = this.header.width;
		var height = this.header.height;
		var getImageData;

			// Create an imageData
		if (!imageData) {
			if (document) {
				imageData = document.createElement('canvas').getContext('2d').createImageData(width, height);
			}
			// In Thread context ?
			else {
				imageData = {
					width:  width,
					height: height,
					data: new Uint8ClampedArray(width * height * 4)
				};
			}
		}

		// TODO: use this.header.offsetX and this.header.offsetY ?

		switch (this.header.pixelDepth) {
			case 8:
				getImageData = this.header.isGreyColor ? getImageDataGrey8bits : getImageData8bits;
				break;

			case 16:
				getImageData = this.header.isGreyColor ? getImageDataGrey16bits : getImageData16bits;
				break;

			case 24:
				getImageData = getImageData24bits;
				break;

			case 32:
				getImageData = getImageData32bits;
				break;
		}

		getImageData(imageData.data, this.imageData, this.palette, width, y_start, y_step, y_end, x_start, x_step, x_end);
		return imageData;
	};


	/**
	 * Return a canvas with the TGA render on it
	 *
	 * @returns {object} CanvasElement
	 */
	Aseprite.prototype.getCanvas = function targaGetCanvas()
	{
		var canvas, ctx, imageData;

		canvas    = document.createElement('canvas');
		ctx       = canvas.getContext('2d');
		imageData = ctx.createImageData(this.header.width, this.header.height);

		canvas.width  = this.header.width;
		canvas.height = this.header.height;

		ctx.putImageData(this.getImageData(imageData), 0, 0);

		return canvas;
	};


	/**
	 * Return a dataURI of the TGA file
	 *
	 * @param {string} type - Optional image content-type to output (default: image/png)
	 * @returns {string} url
	 */
	Aseprite.prototype.getDataURL = function targaGetDatURL( type )
	{
		return this.getCanvas().toDataURL(type || 'image/png');
	};


	// Find Context
	var shim = {};
	if (typeof(exports) === 'undefined') {
		if (typeof(define) === 'function' && typeof(define.amd) === 'object' && define.amd) {
			define(function(){
				return Aseprite;
			});
		} else {
			// Browser
			shim.exports = typeof(window) !== 'undefined' ? window : _global;
		}
	} 
	else {
		// Commonjs
		shim.exports = exports;
	}


	// Export
	if (shim.exports) {
		shim.exports.TGA = Aseprite;
	}

})(this);
