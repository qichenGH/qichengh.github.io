/*! afontgarde - v0.1.5 - 2014-10-29
 * https://github.com/filamentgroup/a-font-garde
 * Copyright (c) 2014 Filament Group c/o Zach Leatherman
 * MIT License */

/*! fontfaceonload - v0.1.3 - 2014-10-29
 * https://github.com/zachleat/fontfaceonload
 * Copyright (c) 2014 Zach Leatherman (@zachleat)
 * MIT License */

;(function( win, doc ) {
	"use strict";

	var DELAY = 100,
		TEST_STRING = 'AxmTYklsjo190QW',
		TOLERANCE = 2, // px

		SANS_SERIF_FONTS = 'sans-serif',
		SERIF_FONTS = 'serif',

		// See https://github.com/typekit/webfontloader/blob/master/src/core/fontruler.js#L41
		style = [
			'display:block',
			'position:absolute',
			'top:-999px',
			'left:-999px',
			'font-size:3px',
			'width:auto',
			'height:auto',
			'line-height:normal',
			'margin:0',
			'padding:0',
			'font-variant:normal',
			'white-space:nowrap',
			'font-family:%s'
		].join(';'),
		html = '<div style="' + style + '">' + TEST_STRING + '</div>';

	var FontFaceOnloadInstance = function() {
		this.appended = false;
		this.dimensions = undefined;
		this.serif = undefined;
		this.sansSerif = undefined;
		this.parent = undefined;
	};

	FontFaceOnloadInstance.prototype.initialMeasurements = function ( fontFamily ) {
		var sansSerif = this.sansSerif,
			serif = this.serif;

		this.dimensions = {
			sansSerif: {
				width: sansSerif.offsetWidth,
				height: sansSerif.offsetHeight
			},
			serif: {
				width: serif.offsetWidth,
				height: serif.offsetHeight
			}
		};

		// Make sure we set the new font-family after we take our initial dimensions:
		// handles the case where FontFaceOnload is called after the font has already
		// loaded.
		sansSerif.style.fontFamily = fontFamily + ', ' + SANS_SERIF_FONTS;
		serif.style.fontFamily = fontFamily + ', ' + SERIF_FONTS;
	};

	FontFaceOnloadInstance.prototype.load = function ( fontFamily, options ) {
		var startTime = new Date(),
			that = this,
			serif = that.serif,
			sansSerif = that.sansSerif,
			parent = that.parent,
			appended = that.appended,
			dimensions = that.dimensions,
			tolerance = options.tolerance || TOLERANCE,
			delay = options.delay || DELAY;

		if( !parent ) {
			parent = that.parent = doc.createElement( 'div' );
		}

		parent.innerHTML = html.replace(/\%s/, SANS_SERIF_FONTS ) + html.replace(/\%s/, SERIF_FONTS );
		sansSerif = that.sansSerif = parent.firstChild;
		serif = that.serif = sansSerif.nextSibling;

		if( options.glyphs ) {
			sansSerif.innerHTML += options.glyphs;
			serif.innerHTML += options.glyphs;
		}

		(function checkDimensions() {
			if( !appended && doc.body ) {
				appended = that.appended = true;
				doc.body.appendChild( parent );

				that.initialMeasurements( fontFamily );
			}

			dimensions = that.dimensions;

			if( appended && dimensions &&
				( Math.abs( dimensions.sansSerif.width - sansSerif.offsetWidth ) > tolerance ||
					Math.abs( dimensions.sansSerif.height - sansSerif.offsetHeight ) > tolerance ||
					Math.abs( dimensions.serif.width - serif.offsetWidth ) > tolerance ||
					Math.abs( dimensions.serif.height - serif.offsetHeight ) > tolerance ) ) {
				options.success();
			} else if( ( new Date() ).getTime() - startTime.getTime() > options.timeout ) {
				options.error();
			} else {
				setTimeout(function() {
					checkDimensions();
				}, delay );
			}
		})();
	}; // end load()

	FontFaceOnloadInstance.prototype.init = function( fontFamily, options ) {
		var that = this,
			defaultOptions = {
				glyphs: '',
				success: function() {},
				error: function() {},
				timeout: 10000
			},
			timeout;

		if( !options ) {
			options = {};
		}

		for( var j in defaultOptions ) {
			if( !options.hasOwnProperty( j ) ) {
				options[ j ] = defaultOptions[ j ];
			}
		}

		// For some reason this was failing on afontgarde + icon fonts.
		if( !options.glyphs && "fonts" in doc ) {
			doc.fonts.load( "1em " + fontFamily ).then(function() {
				options.success();

				win.clearTimeout( timeout );
			});

			if( options.timeout ) {
				timeout = win.setTimeout(function() {
					options.error();
				}, options.timeout );
			}
		} else {
			that.load( fontFamily, options );
		}
	};

	var FontFaceOnload = function( fontFamily, options ) {
		var instance = new FontFaceOnloadInstance();
		instance.init(fontFamily, options);

		return instance;
	};

	// intentional global
	win.FontFaceOnload = FontFaceOnload;
})( this, this.document );

/*
 * A Font Garde
 */

;(function( w ) {

	var doc = w.document,
		ref,
		css = ['.FONT_NAME.supports-generatedcontent .icon-fallback-text .icon { display: inline-block; }',
			'.FONT_NAME.supports-generatedcontent .icon-fallback-text .text { clip: rect(0 0 0 0); overflow: hidden; position: absolute; height: 1px; width: 1px; }',
			'.FONT_NAME .icon-fallback-glyph .icon:before { font-size: 1em; font-size: inherit; line-height: 1; line-height: inherit; }'];

	function addEvent( type, callback ) {
		if( 'addEventListener' in w ) {
			return w.addEventListener( type, callback, false );
		} else if( 'attachEvent' in w ) {
			return w.attachEvent( 'on' + type, callback );
		}
	}

	// options can be a string of glyphs or an options object to pass into FontFaceOnload
	AFontGarde = function( fontFamily, options ) {
		var fontFamilyClassName = fontFamily.toLowerCase().replace( /\s/g, '' ),
			executed = false;

		function init() {
			if( executed ) {
				return;
			}
			executed = true;

			if( typeof FontFaceOnload === 'undefined' ) {
				throw 'FontFaceOnload is a prerequisite.';
			}

			if( !ref ) {
				ref = doc.getElementsByTagName( 'script' )[ 0 ];
			}
			var style = doc.createElement( 'style' ),
				cssContent = css.join( '\n' ).replace( /FONT_NAME/gi, fontFamilyClassName );

			style.setAttribute( 'type', 'text/css' );
			if( style.styleSheet ) {
				style.styleSheet.cssText = cssContent;
			} else {
				style.appendChild( doc.createTextNode( cssContent ) );
			}
			ref.parentNode.insertBefore( style, ref );

			var opts = {
				timeout: 5000,
				success: function() {
					// If you’re using more than one icon font, change this classname (and in a-font-garde.css)
					doc.documentElement.className += ' ' + fontFamilyClassName;

					if( options && options.success ) {
						options.success();
					}
				}
			};

			// These characters are a few of the glyphs from the font above */
			if( typeof options === "string" ) {
				opts.glyphs = options;
			} else {
				for( var j in options ) {
					if( options.hasOwnProperty( j ) && j !== "success" ) {
						opts[ j ] = options[ j ];
					}
				}
			}

			FontFaceOnload( fontFamily, opts );
		}

		// MIT credit: filamentgroup/shoestring
		addEvent( "DOMContentLoaded", init );
		addEvent( "readystatechange", init );
		addEvent( "load", init );

		if( doc.readyState === "complete" ){
			init();
		}
	};

})( this );;
/**
 * Lightbox v2.7.1
 * by Lokesh Dhakar - http://lokeshdhakar.com/projects/lightbox2/
 *
 * @license http://creativecommons.org/licenses/by/2.5/
 * - Free for use in both personal and commercial projects
 * - Attribution requires leaving author name, author link, and the license info intact
 */
(function(){var a=jQuery,b=function(){function a(){this.fadeDuration=500,this.fitImagesInViewport=!0,this.resizeDuration=700,this.positionFromTop=50,this.showImageNumberLabel=!0,this.alwaysShowNavOnTouchDevices=!1,this.wrapAround=!1}return a.prototype.albumLabel=function(a,b){return"Image "+a+" of "+b},a}(),c=function(){function b(a){this.options=a,this.album=[],this.currentImageIndex=void 0,this.init()}return b.prototype.init=function(){this.enable(),this.build()},b.prototype.enable=function(){var b=this;a("body").on("click","a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]",function(c){return b.start(a(c.currentTarget)),!1})},b.prototype.build=function(){var b=this;a("<div id='lightboxOverlay' class='lightboxOverlay'></div><div id='lightbox' class='lightbox'><div class='lb-outerContainer'><div class='lb-container'><img class='lb-image' src='' /><div class='lb-nav'><a class='lb-prev' href='' ></a><a class='lb-next' href='' ></a></div><div class='lb-loader'><a class='lb-cancel'></a></div></div></div><div class='lb-dataContainer'><div class='lb-data'><div class='lb-details'><span class='lb-caption'></span><span class='lb-number'></span></div><div class='lb-closeContainer'><a class='lb-close'></a></div></div></div></div>").appendTo(a("body")),this.$lightbox=a("#lightbox"),this.$overlay=a("#lightboxOverlay"),this.$outerContainer=this.$lightbox.find(".lb-outerContainer"),this.$container=this.$lightbox.find(".lb-container"),this.containerTopPadding=parseInt(this.$container.css("padding-top"),10),this.containerRightPadding=parseInt(this.$container.css("padding-right"),10),this.containerBottomPadding=parseInt(this.$container.css("padding-bottom"),10),this.containerLeftPadding=parseInt(this.$container.css("padding-left"),10),this.$overlay.hide().on("click",function(){return b.end(),!1}),this.$lightbox.hide().on("click",function(c){return"lightbox"===a(c.target).attr("id")&&b.end(),!1}),this.$outerContainer.on("click",function(c){return"lightbox"===a(c.target).attr("id")&&b.end(),!1}),this.$lightbox.find(".lb-prev").on("click",function(){return b.changeImage(0===b.currentImageIndex?b.album.length-1:b.currentImageIndex-1),!1}),this.$lightbox.find(".lb-next").on("click",function(){return b.changeImage(b.currentImageIndex===b.album.length-1?0:b.currentImageIndex+1),!1}),this.$lightbox.find(".lb-loader, .lb-close").on("click",function(){return b.end(),!1})},b.prototype.start=function(b){function c(a){d.album.push({link:a.attr("href"),title:a.attr("data-title")||a.attr("title")})}var d=this,e=a(window);e.on("resize",a.proxy(this.sizeOverlay,this)),a("select, object, embed").css({visibility:"hidden"}),this.sizeOverlay(),this.album=[];var f,g=0,h=b.attr("data-lightbox");if(h){f=a(b.prop("tagName")+'[data-lightbox="'+h+'"]');for(var i=0;i<f.length;i=++i)c(a(f[i])),f[i]===b[0]&&(g=i)}else if("lightbox"===b.attr("rel"))c(b);else{f=a(b.prop("tagName")+'[rel="'+b.attr("rel")+'"]');for(var j=0;j<f.length;j=++j)c(a(f[j])),f[j]===b[0]&&(g=j)}var k=e.scrollTop()+this.options.positionFromTop,l=e.scrollLeft();this.$lightbox.css({top:k+"px",left:l+"px"}).fadeIn(this.options.fadeDuration),this.changeImage(g)},b.prototype.changeImage=function(b){var c=this;this.disableKeyboardNav();var d=this.$lightbox.find(".lb-image");this.$overlay.fadeIn(this.options.fadeDuration),a(".lb-loader").fadeIn("slow"),this.$lightbox.find(".lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption").hide(),this.$outerContainer.addClass("animating");var e=new Image;e.onload=function(){var f,g,h,i,j,k,l;d.attr("src",c.album[b].link),f=a(e),d.width(e.width),d.height(e.height),c.options.fitImagesInViewport&&(l=a(window).width(),k=a(window).height(),j=l-c.containerLeftPadding-c.containerRightPadding-20,i=k-c.containerTopPadding-c.containerBottomPadding-120,(e.width>j||e.height>i)&&(e.width/j>e.height/i?(h=j,g=parseInt(e.height/(e.width/h),10),d.width(h),d.height(g)):(g=i,h=parseInt(e.width/(e.height/g),10),d.width(h),d.height(g)))),c.sizeContainer(d.width(),d.height())},e.src=this.album[b].link,this.currentImageIndex=b},b.prototype.sizeOverlay=function(){this.$overlay.width(a(window).width()).height(a(document).height())},b.prototype.sizeContainer=function(a,b){function c(){d.$lightbox.find(".lb-dataContainer").width(g),d.$lightbox.find(".lb-prevLink").height(h),d.$lightbox.find(".lb-nextLink").height(h),d.showImage()}var d=this,e=this.$outerContainer.outerWidth(),f=this.$outerContainer.outerHeight(),g=a+this.containerLeftPadding+this.containerRightPadding,h=b+this.containerTopPadding+this.containerBottomPadding;e!==g||f!==h?this.$outerContainer.animate({width:g,height:h},this.options.resizeDuration,"swing",function(){c()}):c()},b.prototype.showImage=function(){this.$lightbox.find(".lb-loader").hide(),this.$lightbox.find(".lb-image").fadeIn("slow"),this.updateNav(),this.updateDetails(),this.preloadNeighboringImages(),this.enableKeyboardNav()},b.prototype.updateNav=function(){var a=!1;try{document.createEvent("TouchEvent"),a=this.options.alwaysShowNavOnTouchDevices?!0:!1}catch(b){}this.$lightbox.find(".lb-nav").show(),this.album.length>1&&(this.options.wrapAround?(a&&this.$lightbox.find(".lb-prev, .lb-next").css("opacity","1"),this.$lightbox.find(".lb-prev, .lb-next").show()):(this.currentImageIndex>0&&(this.$lightbox.find(".lb-prev").show(),a&&this.$lightbox.find(".lb-prev").css("opacity","1")),this.currentImageIndex<this.album.length-1&&(this.$lightbox.find(".lb-next").show(),a&&this.$lightbox.find(".lb-next").css("opacity","1"))))},b.prototype.updateDetails=function(){var b=this;"undefined"!=typeof this.album[this.currentImageIndex].title&&""!==this.album[this.currentImageIndex].title&&this.$lightbox.find(".lb-caption").html(this.album[this.currentImageIndex].title).fadeIn("fast").find("a").on("click",function(){location.href=a(this).attr("href")}),this.album.length>1&&this.options.showImageNumberLabel?this.$lightbox.find(".lb-number").text(this.options.albumLabel(this.currentImageIndex+1,this.album.length)).fadeIn("fast"):this.$lightbox.find(".lb-number").hide(),this.$outerContainer.removeClass("animating"),this.$lightbox.find(".lb-dataContainer").fadeIn(this.options.resizeDuration,function(){return b.sizeOverlay()})},b.prototype.preloadNeighboringImages=function(){if(this.album.length>this.currentImageIndex+1){var a=new Image;a.src=this.album[this.currentImageIndex+1].link}if(this.currentImageIndex>0){var b=new Image;b.src=this.album[this.currentImageIndex-1].link}},b.prototype.enableKeyboardNav=function(){a(document).on("keyup.keyboard",a.proxy(this.keyboardAction,this))},b.prototype.disableKeyboardNav=function(){a(document).off(".keyboard")},b.prototype.keyboardAction=function(a){var b=27,c=37,d=39,e=a.keyCode,f=String.fromCharCode(e).toLowerCase();e===b||f.match(/x|o|c/)?this.end():"p"===f||e===c?0!==this.currentImageIndex?this.changeImage(this.currentImageIndex-1):this.options.wrapAround&&this.album.length>1&&this.changeImage(this.album.length-1):("n"===f||e===d)&&(this.currentImageIndex!==this.album.length-1?this.changeImage(this.currentImageIndex+1):this.options.wrapAround&&this.album.length>1&&this.changeImage(0))},b.prototype.end=function(){this.disableKeyboardNav(),a(window).off("resize",this.sizeOverlay),this.$lightbox.fadeOut(this.options.fadeDuration),this.$overlay.fadeOut(this.options.fadeDuration),a("select, object, embed").css({visibility:"visible"})},b}();a(function(){{var a=new b;new c(a)}})}).call(this);
