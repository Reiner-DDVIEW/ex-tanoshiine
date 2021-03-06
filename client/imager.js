/* Thumbnail and image renderring */

var Hidamari = {
	events: {
		'click >figure>figcaption>.imageSrc': 'revealThumbnail',
		'click >figure>a': 'imageClicked',
	},

	renderSpoiler: function(spoiler){
		this.model.get('image').spoiler = spoiler;
		var $fig = this.$el.find('figure');
		$fig.attr('data-spoiler', this.model.get('image').spoiler);
		var $caption = $fig.find('i');
		if (oneeSama.spoilToggle)
			$caption.html($caption.html().replace(/^\(/, '(Spoiler, '));
		this.renderThumbnail();
	},

	changeThumbnailStyle: function(model, type){
		if (!this.model.has('image'))
			return;
		// Shitty hack
		// TODO: remove all, when options model is rewritten
		oneeSama.thumbStyle = type;
		this.renderThumbnail(type == 'hide');
	},
	// Rerenders the entire thumbnail, which can pretty expensive in batch,
	// but good enough for now
	renderThumbnail: function(hide, contract){
		var $fig = this.$el.children('figure');
		var $a = $fig.children('a');
		var $img = $a.children('img, video');
		if (hide === undefined)
			hide = options.get('thumbs') == 'hide';
		if (hide){
			$fig.find('.imageSrc').text('[Show]');
			this.model.set({imageExpanded: false, thumbnailRevealed: false});
			return $img.remove();
		}
		// Don't replace expanded images, unless contracting
		if (this.model.get('imageExpanded') && !contract)
			return;
		var img = this.model.get('image');
		$fig.find('.imageSrc').text(img.src);
		$img = $(flatten(oneeSama.gazou_img(img, this.$el.is('section')).html).join(''));
		$a.remove();
		$fig.children('audio').remove();
		$img.appendTo($fig);
		this.model.set({imageExpanded: false, thumbnailRevealed: !hide});
	},

	toggleSpoiler: function(model, toggle){
		if (!this.model.has('image') || options.get('thumbs') == 'hide')
			return;
		var $fig = this.$el.children('figure');
		var $caption = $fig.find('i');
		if ($fig.data("spoiler")) {
			if (/^\(Spoiler/.test($caption.html()))
				$caption.html($caption.html().replace(/^\(Spoiler\,\ /, '('));
			else
				$caption.html($caption.html().replace(/^\(/, '(Spoiler, '));
		}
		oneeSama.spoilToggle = toggle;
		this.renderThumbnail();
	},
	// Toggle animated GIF thumbnails
	toggleAutogif: function(model, toggle){
		var img = this.model.get('image');
		if (!img || !/\.gif$/i.test(img.src) || options.get('thumbs') == 'hide')
			return;
		oneeSama.autoGif = toggle;
		this.renderThumbnail();
	},
	// Reveal hidden thumbnail by clicking [Show]
	revealThumbnail: function(e){
		if (options.get('thumbs') != 'hide')
			return;
		e.preventDefault();
		var revealed = this.model.get('thumbnailRevealed');
		if (revealed === undefined)
			revealed = false;
		this.renderThumbnail(revealed);
		this.$el.children('figure').find('.imageSrc').text(revealed ? '[Show]' : '[Hide]');
	},


	imageClicked: function(e){
		if (options.get('inlinefit') == 'none' || e.which != 1)
			return;
		e.preventDefault();
		this.toggleImageExpansion();
	},

	autoExpandImage: function(){
		var expand = massExpander.get('expand');
		if (expand)
			this.toggleImageExpansion(null, expand);
	},

	toggleImageExpansion: function(model, expand){
		var img = this.model.get('image');
		var fit = options.get('inlinefit');
		if (!img || fit == 'none')
			return;
		// Don't autoexpand webm or PDF with Expand All enabled
		if (expand !== undefined && (/\.(mp4|webm|pdf|mp3|wav|ogg)/.test(img.ext)))
			return;
		if  (expand != false)
			expand = expand || this.model.get('imageExpanded') != true;
		if (expand)
			this.fitImage(img, fit);
		else
			this.renderThumbnail(options.get('thumbs') == 'hide', true);
	},

	fitImage: function(img, fit){
		// Open PDF in a new tab on click
		if (img.ext == '.pdf')
			return window.open(mediaURL + 'src/' + img.src, '_blank');
		if (/\.(mp3|ogg|wav)/.test(img.ext))
			return this.renderAudio();
		var width = newWidth = img.dims[0];
		var height = newHeight = img.dims[1];
		var video = !!img.length;
		if (fit == 'full')
			return this.expandImage(width, height, img.ext);
		var both = fit == 'both';
		var widthFlag = both || fit == 'width';
		var heightFlag = both || fit == 'height';
		var aspect = width / height;
		var isArticle = this.$el.is('article');
		var fullWidth, fullHeight;
		if (widthFlag){
			var maxWidth = $(window).width() -
					// We have to go wider
					this.$el.closest('section')[0].getBoundingClientRect().left
						* (isArticle ? 1 : 2);
			if (isArticle)
				maxWidth -= this.$el.outerWidth() - this.$el.width() + 5;
			if (newWidth > maxWidth){
				newWidth = maxWidth;
				newHeight = newWidth / aspect;
				fullWidth = true;
			}
		}
		if (heightFlag){
			var maxHeight = $(window).height() - $('#banner').outerHeight();
			if (newHeight > maxHeight){
				newHeight = maxHeight;
				newWidth = newHeight * aspect;
				fullHeight = true;
			}
		}
		if (newWidth > 50 && newHeight > 50){
			width = newWidth;
			height = newHeight;
		}
		this.expandImage(width, height, img.ext, fullWidth && !fullHeight);
	},

	expandImage: function(width, height, ext, fullWidth){
		var $fig = this.$el.children('figure'), tag;
		if (ext == '.webm' || ext == '.mp4')
			tag = 'video';
		else
			tag = 'img';
		$fig.find('img, video').replaceWith($('<'+ tag +'/>', {
			src: $fig.find('.imageSrc').attr('href'),
			width: width,
			height: height,
			autoplay: true,
			loop: true,
			// Even wider
			'class': 'expanded'+ (fullWidth ? ' fullWidth' : ''),
		}));
		if (vol && (ext == '.webm' || ext == '.mp4'))
			$fig.find('video')['0'].volume = vol;
		this.model.set('imageExpanded', true);
	},

	renderAudio: function() {
		$fig = this.$el.children('figure');
		$('<audio/>', {
			src: $fig.children('a').attr('href'),
			width: 300,
			height: '3em',
			autoplay: true,
			loop: false,
			controls: true
		}).insertAfter($fig.children('a'));
		if (vol)
			$fig.find('audio')['0'].volume = vol;
		this.model.set('imageExpanded', true);
	},
};

var massExpander = new Backbone.Model({
	expand: false
});

$('#expandImages').click(function(e){
	e.preventDefault();
	var expand = massExpander.get('expand');
	$(e.target).text((expand ? 'Expand' : 'Contract')+' Images');
	massExpander.set('expand', !expand);
});
