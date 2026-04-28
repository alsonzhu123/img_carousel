/**
 * img_carousel v1.01 - jQuery 3.7.1 完全兼容版
 * 原始插件: img_carousel - Fullscreen Background Slideshow
 * 升级内容: 替换所有弃用API，适配jQuery 3.7.1
 */

(function($) {
    'use strict';

    // 避免变量冲突
    if (typeof $.img_carousel === 'function') {
        return;
    }

    $(document).ready(function() {
        if ($("#img_carousel-loader").length === 0) {
            $("body").append('<div id="img_carousel-loader"></div><ul id="img_carousel"></ul>');
        }
    });

    $.img_carousel = function(options) {
        var selector = "#img_carousel",
            plugin = this;

        plugin.$el = $(selector);
        plugin.el = selector;
        
        // 初始化变量
        var vars = $.extend({}, $.img_carousel.vars);
        plugin.$el.data("img_carousel", plugin);
        var api = plugin.$el.data("img_carousel");

        // 初始化方法
        plugin.init = function() {
            $.img_carousel.vars = $.extend({}, $.img_carousel.vars, $.img_carousel.themeVars);
            $.img_carousel.vars.options = $.extend({},
                $.img_carousel.defaultOptions,
                $.img_carousel.themeOptions,
                options
            );
            plugin.options = $.img_carousel.vars.options;
            plugin._build();
        };

        // 构建DOM结构
        plugin._build = function() {
            var i = 0,
                slideList = "",
                linkList = "",
                thumbList = "",
                thumbSrc,
                slideLink;

            // 生成幻灯片和链接
            while (i <= plugin.options.slides.length - 1) {
                switch (plugin.options.slide_links) {
                    case "num":
                        slideLink = i;
                        break;
                    case "name":
                        slideLink = plugin.options.slides[i].title;
                        break;
                    case "blank":
                        slideLink = "";
                        break;
                    default:
                        slideLink = "";
                }

                slideList += '<li class="slide-' + i + '"></li>';

                if (i === plugin.options.start_slide - 1) {
                    if (plugin.options.slide_links) {
                        linkList += '<li class="slide-link-' + i + ' current-slide"><a>' + slideLink + "</a></li>";
                    }
                    if (plugin.options.thumb_links) {
                        thumbSrc = plugin.options.slides[i].thumb || plugin.options.slides[i].image;
                        thumbList += '<li class="thumb' + i + ' current-thumb"><img src="../../Components/supersized/' + thumbSrc + '"/></li>';
                    }
                } else {
                    if (plugin.options.slide_links) {
                        linkList += '<li class="slide-link-' + i + '" ><a>' + slideLink + "</a></li>";
                    }
                    if (plugin.options.thumb_links) {
                        thumbSrc = plugin.options.slides[i].thumb || plugin.options.slides[i].image;
                        thumbList += '<li class="thumb' + i + '"><img src="../../Components/supersized/' + thumbSrc + '"/></li>';
                    }
                }
                i++;
            }

            // 插入链接和缩略图
            if (plugin.options.slide_links) {
                $(vars.slide_list).html(linkList);
            }
            if (plugin.options.thumb_links && vars.thumb_tray.length) {
                $(vars.thumb_tray).append('<ul id="' + vars.thumb_list.replace("#", "") + '">' + thumbList + "</ul>");
            }

            // 插入幻灯片
            $(plugin.el).append(slideList);

            // 缩略图导航
            if (plugin.options.thumbnail_navigation) {
                var prevThumb = (vars.current_slide - 1 < 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;
                $(vars.prev_thumb).show().html($("<img/>").attr("src", plugin.options.slides[prevThumb].image));
                
                var nextThumb = (vars.current_slide === plugin.options.slides.length - 1) ? 0 : vars.current_slide + 1;
                $(vars.next_thumb).show().html($("<img/>").attr("src", plugin.options.slides[nextThumb].image));
            }

            plugin._start();
        };

        // 启动轮播
        plugin._start = function() {
            var vars = $.img_carousel.vars;
            
            // 设置当前幻灯片
            if (plugin.options.start_slide) {
                vars.current_slide = plugin.options.start_slide - 1;
            } else {
                vars.current_slide = Math.floor(Math.random() * plugin.options.slides.length);
            }

            var targetAttr = plugin.options.new_window ? ' target="_blank"' : "";

            // 性能模式
            if (plugin.options.performance === 3) {
                plugin.$el.addClass("speed");
            } else if (plugin.options.performance === 1 || plugin.options.performance === 2) {
                plugin.$el.addClass("quality");
            }

            // 随机顺序
            if (plugin.options.random) {
                var arr = plugin.options.slides;
                for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x) {}
                plugin.options.slides = arr;
            }

            // 预加载上一张（如果超过2张）
            if (plugin.options.slides.length > 2) {
                var loadPrev = (vars.current_slide - 1 < 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;
                var linkAttr = plugin.options.slides[loadPrev].url ? "href='" + plugin.options.slides[loadPrev].url + "'" : "";
                var $prevImg = $('<img src="../../Components/supersized/' + plugin.options.slides[loadPrev].image + '"/>');
                var prevSelector = plugin.el + " li:eq(" + loadPrev + ")";
                
                $prevImg.appendTo(prevSelector).wrap("<a " + linkAttr + targetAttr + "></a>")
                    .parent().parent().addClass("image-loading prevslide");
                
                $prevImg.on("load", function() {
                    $(this).data("origWidth", $(this).width()).data("origHeight", $(this).height());
                    plugin.resizeNow();
                });
            }

            // 加载当前幻灯片
            linkAttr = (api.getField("url")) ? "href='" + api.getField("url") + "'" : "";
            var $currentImg = $('<img src="../../Components/supersized/' + api.getField("image") + '"/>');
            var currentSelector = plugin.el + " li:eq(" + vars.current_slide + ")";
            
            $currentImg.appendTo(currentSelector).wrap("<a " + linkAttr + targetAttr + "></a>")
                .parent().parent().addClass("image-loading activeslide");
            
            $currentImg.on("load", function() {
                plugin._origDim($(this));
                plugin.resizeNow();
                plugin.launch();
                if (typeof theme !== "undefined" && typeof theme._init === "function") {
                    theme._init();
                }
            });

            // 预加载下一张
            if (plugin.options.slides.length > 1) {
                var loadNext = (vars.current_slide === plugin.options.slides.length - 1) ? 0 : vars.current_slide + 1;
                linkAttr = plugin.options.slides[loadNext].url ? "href='" + plugin.options.slides[loadNext].url + "'" : "";
                var $nextImg = $('<img src="../../Components/supersized/' + plugin.options.slides[loadNext].image + '"/>');
                var nextSelector = plugin.el + " li:eq(" + loadNext + ")";
                
                $nextImg.appendTo(nextSelector).wrap("<a " + linkAttr + targetAttr + "></a>")
                    .parent().parent().addClass("image-loading");
                
                $nextImg.on("load", function() {
                    $(this).data("origWidth", $(this).width()).data("origHeight", $(this).height());
                    plugin.resizeNow();
                });
            }

            plugin.$el.css("visibility", "hidden");
            $(".load-item").hide();
        };

        // 启动完成后的设置
        plugin.launch = function() {
            var vars = $.img_carousel.vars;
            
            plugin.$el.css("visibility", "visible");
            $("#img_carousel-loader").remove();

            if (typeof theme !== "undefined" && typeof theme.beforeAnimation === "function") {
                theme.beforeAnimation("next");
            }

            $(".load-item").show();

            // 键盘导航（使用on替代keyup）
            if (plugin.options.keyboard_nav) {
                $(document).on("keydown", function(e) {
                    if (vars.in_animation) {
                        return false;
                    }
                    if (e.keyCode === 37 || e.keyCode === 40) {
                        clearInterval(vars.slideshow_interval);
                        plugin.prevSlide();
                        e.preventDefault();
                    } else if (e.keyCode === 39 || e.keyCode === 38) {
                        clearInterval(vars.slideshow_interval);
                        plugin.nextSlide();
                        e.preventDefault();
                    } else if (e.keyCode === 32 && !vars.hover_pause) {
                        clearInterval(vars.slideshow_interval);
                        plugin.playToggle();
                        e.preventDefault();
                    }
                });
            }

            // 悬停暂停（使用on/off替代hover）
            if (plugin.options.slideshow && plugin.options.pause_hover) {
                plugin.$el.off("mouseenter mouseleave").on({
                    mouseenter: function() {
                        if (vars.in_animation) {
                            return false;
                        }
                        vars.hover_pause = true;
                        if (!vars.is_paused) {
                            vars.hover_pause = "resume";
                            plugin.playToggle();
                        }
                    },
                    mouseleave: function() {
                        if (vars.hover_pause === "resume") {
                            plugin.playToggle();
                            vars.hover_pause = false;
                        }
                    }
                });
            }

            // 幻灯片链接点击
            if (plugin.options.slide_links) {
                $(vars.slide_list + "> li").off("click").on("click", function() {
                    var index = $(vars.slide_list + "> li").index(this);
                    var targetSlide = index + 1;
                    plugin.goTo(targetSlide);
                    return false;
                });
            }

            // 缩略图链接点击
            if (plugin.options.thumb_links) {
                $(vars.thumb_list + "> li").off("click").on("click", function() {
                    var index = $(vars.thumb_list + "> li").index(this);
                    var targetSlide = index + 1;
                    api.goTo(targetSlide);
                    return false;
                });
            }

            // 自动播放
            if (plugin.options.slideshow && plugin.options.slides.length > 1) {
                if (plugin.options.autoplay && plugin.options.slides.length > 1) {
                    vars.slideshow_interval = setInterval(plugin.nextSlide, plugin.options.slide_interval);
                } else {
                    vars.is_paused = true;
                }
                
                // 禁用右键菜单（使用on替代bind）
                $(".load-item img").off("contextmenu mousedown").on("contextmenu mousedown", function() {
                    return false;
                });
            }

            // 窗口缩放（使用on替代resize）
            $(window).off("resize").on("resize", function() {
                plugin.resizeNow();
            });
        };

        // 响应式调整
        plugin.resizeNow = function() {
            var vars = $.img_carousel.vars;
            
            return plugin.$el.each(function() {
                $("img", plugin.el).each(function() {
                    var $this = $(this);
                    var ratio = ($this.data("origHeight") / $this.data("origWidth")).toFixed(2);
                    var containerWidth = plugin.$el.width();
                    var containerHeight = plugin.$el.height();

                    // 图片适配逻辑
                    function fitWidth(force) {
                        if (force) {
                            if ($this.width() < containerWidth || $this.width() < plugin.options.min_width) {
                                if ($this.width() * ratio >= plugin.options.min_height) {
                                    $this.width(plugin.options.min_width);
                                    $this.height($this.width() * ratio);
                                } else {
                                    fitHeight();
                                }
                            }
                        } else {
                            if (plugin.options.min_height >= containerHeight && !plugin.options.fit_landscape) {
                                if (containerWidth * ratio >= plugin.options.min_height || (containerWidth * ratio >= plugin.options.min_height && ratio <= 1)) {
                                    $this.width(containerWidth);
                                    $this.height(containerWidth * ratio);
                                } else {
                                    if (ratio > 1) {
                                        $this.height(plugin.options.min_height);
                                        $this.width($this.height() / ratio);
                                    } else {
                                        if ($this.width() < containerWidth) {
                                            $this.width(containerWidth);
                                            $this.height($this.width() * ratio);
                                        }
                                    }
                                }
                            } else {
                                $this.width(containerWidth);
                                $this.height(containerWidth * ratio);
                            }
                        }
                    }

                    function fitHeight(force) {
                        if (force) {
                            if ($this.height() < containerHeight) {
                                if ($this.height() / ratio >= plugin.options.min_width) {
                                    $this.height(plugin.options.min_height);
                                    $this.width($this.height() / ratio);
                                } else {
                                    fitWidth(true);
                                }
                            }
                        } else {
                            if (plugin.options.min_width >= containerWidth) {
                                if (containerHeight / ratio >= plugin.options.min_width || ratio > 1) {
                                    $this.height(containerHeight);
                                    $this.width(containerHeight / ratio);
                                } else {
                                    if (ratio <= 1) {
                                        $this.width(plugin.options.min_width);
                                        $this.height($this.width() * ratio);
                                    }
                                }
                            } else {
                                $this.height(containerHeight);
                                $this.width(containerHeight / ratio);
                            }
                        }
                    }

                    // 根据配置选择适配方式
                    if (plugin.options.fit_always) {
                        if ((containerHeight / containerWidth) > ratio) {
                            fitWidth();
                        } else {
                            fitHeight();
                        }
                    } else {
                        if ((containerHeight <= plugin.options.min_height) && (containerWidth <= plugin.options.min_width)) {
                            if ((containerHeight / containerWidth) > ratio) {
                                plugin.options.fit_landscape && ratio < 1 ? fitWidth(true) : fitHeight(true);
                            } else {
                                plugin.options.fit_portrait && ratio >= 1 ? fitHeight(true) : fitWidth(true);
                            }
                        } else if (containerWidth <= plugin.options.min_width) {
                            if ((containerHeight / containerWidth) > ratio) {
                                plugin.options.fit_landscape && ratio < 1 ? fitWidth(true) : fitHeight();
                            } else {
                                plugin.options.fit_portrait && ratio >= 1 ? fitHeight() : fitWidth(true);
                            }
                        } else if (containerHeight <= plugin.options.min_height) {
                            if ((containerHeight / containerWidth) > ratio) {
                                plugin.options.fit_landscape && ratio < 1 ? fitWidth() : fitHeight(true);
                            } else {
                                plugin.options.fit_portrait && ratio >= 1 ? fitHeight(true) : fitWidth();
                            }
                        } else {
                            if ((containerHeight / containerWidth) > ratio) {
                                plugin.options.fit_landscape && ratio < 1 ? fitWidth() : fitHeight();
                            } else {
                                plugin.options.fit_portrait && ratio >= 1 ? fitHeight() : fitWidth();
                            }
                        }
                    }

                    // 移除加载状态
                    if ($this.parents("li").hasClass("image-loading")) {
                        $(".image-loading").removeClass("image-loading");
                    }

                    // 居中定位
                    if (plugin.options.horizontal_center) {
                        $this.css("left", (containerWidth - $this.width()) / 2);
                    }
                    if (plugin.options.vertical_center) {
                        $this.css("top", (containerHeight - $this.height()) / 2);
                    }
                });

                // 图片保护（使用on替代bind）
                if (plugin.options.image_protect) {
                    $("img", plugin.el).off("contextmenu mousedown").on("contextmenu mousedown", function() {
                        return false;
                    });
                }
                return false;
            });
        };

        // 下一张
        plugin.nextSlide = function() {
            var vars = $.img_carousel.vars;
            
            if (vars.in_animation || !api.options.slideshow) {
                return false;
            }
            
            vars.in_animation = true;
            clearInterval(vars.slideshow_interval);

            var $activeSlide = plugin.$el.find(".activeslide");
            $(".prevslide").removeClass("prevslide");
            $activeSlide.removeClass("activeslide").addClass("prevslide");

            // 更新当前索引
            vars.current_slide = (vars.current_slide + 1 === plugin.options.slides.length) ? 0 : vars.current_slide + 1;

            var $newSlide = $(plugin.el + " li:eq(" + vars.current_slide + ")");

            // 性能模式切换
            if (plugin.options.performance === 1) {
                plugin.$el.removeClass("quality").addClass("speed");
            }

            // 预加载后续图片
            var loadSlide = (vars.current_slide === plugin.options.slides.length - 1) ? 0 : vars.current_slide + 1;
            var loadSelector = plugin.el + " li:eq(" + loadSlide + ")";

            if (!$(loadSelector).html()) {
                var targetAttr = plugin.options.new_window ? ' target="_blank"' : "";
                var imageLink = plugin.options.slides[loadSlide].url ? "href='" + plugin.options.slides[loadSlide].url + "'" : "";
                var $nextImg = $('<img src="../../Components/supersized/' + plugin.options.slides[loadSlide].image + '"/>');
                
                $nextImg.appendTo(loadSelector).wrap("<a " + imageLink + targetAttr + "></a>")
                    .parent().parent().addClass("image-loading").css("visibility", "hidden");
                
                $nextImg.on("load", function() {
                    plugin._origDim($(this));
                    plugin.resizeNow();
                });
            }

            // 缩略图导航更新
            if (plugin.options.thumbnail_navigation === 1) {
                var prevThumb = (vars.current_slide - 1 < 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;
                $(vars.prev_thumb).html($("<img/>").attr("src", plugin.options.slides[prevThumb].image));
                $(vars.next_thumb).html($("<img/>").attr("src", plugin.options.slides[loadSlide].image));
            }

            // 主题回调
            if (typeof theme !== "undefined" && typeof theme.beforeAnimation === "function") {
                theme.beforeAnimation("next");
            }

            // 更新链接样式
            if (plugin.options.slide_links) {
                $(".current-slide").removeClass("current-slide");
                $(vars.slide_list + "> li").eq(vars.current_slide).addClass("current-slide");
            }

            // 执行过渡动画
            $newSlide.css("visibility", "hidden").addClass("activeslide");

            switch (plugin.options.transition) {
                case 0:
                case "none":
                    $newSlide.css("visibility", "visible");
                    vars.in_animation = false;
                    plugin.afterAnimation();
                    break;
                    
                case 1:
                case "fade":
                    $newSlide.css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 2:
                case "slideTop":
                    $newSlide.css({top: -plugin.$el.height(), visibility: "visible"}).animate({top: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 3:
                case "slideRight":
                    $newSlide.css({left: plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 4:
                case "slideBottom":
                    $newSlide.css({top: plugin.$el.height(), visibility: "visible"}).animate({top: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 5:
                case "slideLeft":
                    $newSlide.css({left: -plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 6:
                case "carouselRight":
                    $newSlide.css({left: plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    $activeSlide.animate({left: -plugin.$el.width()}, plugin.options.transition_speed);
                    break;
                    
                case 7:
                case "carouselLeft":
                    $newSlide.css({left: -plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    $activeSlide.animate({left: plugin.$el.width()}, plugin.options.transition_speed);
                    break;
            }
            
            return false;
        };

        // 上一张
        plugin.prevSlide = function() {
            var vars = $.img_carousel.vars;
            
            if (vars.in_animation || !api.options.slideshow) {
                return false;
            }
            
            vars.in_animation = true;
            clearInterval(vars.slideshow_interval);

            var $activeSlide = plugin.$el.find(".activeslide");
            $(".prevslide").removeClass("prevslide");
            $activeSlide.removeClass("activeslide").addClass("prevslide");

            // 更新当前索引
            vars.current_slide = (vars.current_slide === 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;

            var $newSlide = $(plugin.el + " li:eq(" + vars.current_slide + ")");

            // 性能模式切换
            if (plugin.options.performance === 1) {
                plugin.$el.removeClass("quality").addClass("speed");
            }

            // 加载当前图片
            var loadSlide = vars.current_slide;
            var loadSelector = plugin.el + " li:eq(" + loadSlide + ")";

            if (!$(loadSelector).html()) {
                var targetAttr = plugin.options.new_window ? ' target="_blank"' : "";
                var imageLink = plugin.options.slides[loadSlide].url ? "href='" + plugin.options.slides[loadSlide].url + "'" : "";
                var $prevImg = $('<img src="../../Components/supersized/' + plugin.options.slides[loadSlide].image + '"/>');
                
                $prevImg.appendTo(loadSelector).wrap("<a " + imageLink + targetAttr + "></a>")
                    .parent().parent().addClass("image-loading").css("visibility", "hidden");
                
                $prevImg.on("load", function() {
                    plugin._origDim($(this));
                    plugin.resizeNow();
                });
            }

            // 缩略图导航更新
            if (plugin.options.thumbnail_navigation === 1) {
                var prevThumb = (loadSlide === 0) ? plugin.options.slides.length - 1 : loadSlide - 1;
                $(vars.prev_thumb).html($("<img/>").attr("src", plugin.options.slides[prevThumb].image));
                var nextThumb = (vars.current_slide === plugin.options.slides.length - 1) ? 0 : vars.current_slide + 1;
                $(vars.next_thumb).html($("<img/>").attr("src", plugin.options.slides[nextThumb].image));
            }

            // 主题回调
            if (typeof theme !== "undefined" && typeof theme.beforeAnimation === "function") {
                theme.beforeAnimation("prev");
            }

            // 更新链接样式
            if (plugin.options.slide_links) {
                $(".current-slide").removeClass("current-slide");
                $(vars.slide_list + "> li").eq(vars.current_slide).addClass("current-slide");
            }

            // 执行过渡动画
            $newSlide.css("visibility", "hidden").addClass("activeslide");

            switch (plugin.options.transition) {
                case 0:
                case "none":
                    $newSlide.css("visibility", "visible");
                    vars.in_animation = false;
                    plugin.afterAnimation();
                    break;
                    
                case 1:
                case "fade":
                    $newSlide.css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 2:
                case "slideTop":
                    $newSlide.css({top: plugin.$el.height(), visibility: "visible"}).animate({top: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 3:
                case "slideRight":
                    $newSlide.css({left: -plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 4:
                case "slideBottom":
                    $newSlide.css({top: -plugin.$el.height(), visibility: "visible"}).animate({top: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 5:
                case "slideLeft":
                    $newSlide.css({left: plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    break;
                    
                case 6:
                case "carouselRight":
                    $newSlide.css({left: -plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    $activeSlide.css({left: 0}).animate({left: plugin.$el.width()}, plugin.options.transition_speed);
                    break;
                    
                case 7:
                case "carouselLeft":
                    $newSlide.css({left: plugin.$el.width(), visibility: "visible"}).animate({left: 0}, plugin.options.transition_speed, function() {
                        plugin.afterAnimation();
                    });
                    $activeSlide.css({left: 0}).animate({left: -plugin.$el.width()}, plugin.options.transition_speed);
                    break;
            }
            
            return false;
        };

        // 播放/暂停切换
        plugin.playToggle = function() {
            var vars = $.img_carousel.vars;
            
            if (vars.in_animation || !api.options.slideshow) {
                return false;
            }
            
            if (vars.is_paused) {
                vars.is_paused = false;
                if (typeof theme !== "undefined" && typeof theme.playToggle === "function") {
                    theme.playToggle("play");
                }
                vars.slideshow_interval = setInterval(plugin.nextSlide, plugin.options.slide_interval);
            } else {
                vars.is_paused = true;
                if (typeof theme !== "undefined" && typeof theme.playToggle === "function") {
                    theme.playToggle("pause");
                }
                clearInterval(vars.slideshow_interval);
            }
            return false;
        };

        // 跳转到指定幻灯片
        plugin.goTo = function(target) {
            var vars = $.img_carousel.vars;
            
            if (vars.in_animation || !api.options.slideshow) {
                return false;
            }
            
            var total = plugin.options.slides.length;
            
            if (target < 0) {
                target = total;
            } else if (target > total) {
                target = 1;
            }
            
            target = total - target + 1;
            clearInterval(vars.slideshow_interval);
            
            if (typeof theme !== "undefined" && typeof theme.goTo === "function") {
                theme.goTo();
            }
            
            if (vars.current_slide === total - target) {
                if (!vars.is_paused) {
                    vars.slideshow_interval = setInterval(plugin.nextSlide, plugin.options.slide_interval);
                }
                return false;
            }
            
            if (total - target > vars.current_slide) {
                vars.current_slide = total - target - 1;
                vars.update_images = "next";
                plugin._placeSlide(vars.update_images);
            } else if (total - target < vars.current_slide) {
                vars.current_slide = total - target + 1;
                vars.update_images = "prev";
                plugin._placeSlide(vars.update_images);
            }
            
            if (plugin.options.slide_links) {
                $(vars.slide_list + "> .current-slide").removeClass("current-slide");
                $(vars.slide_list + "> li").eq((total - target)).addClass("current-slide");
            }
            
            if (plugin.options.thumb_links) {
                $(vars.thumb_list + "> .current-thumb").removeClass("current-thumb");
                $(vars.thumb_list + "> li").eq((total - target)).addClass("current-thumb");
            }
        };

        // 放置幻灯片
        plugin._placeSlide = function(direction) {
            var vars = $.img_carousel.vars;
            var targetAttr = plugin.options.new_window ? ' target="_blank"' : "";
            var loadSlide = false;
            
            if (direction === "next") {
                loadSlide = (vars.current_slide === plugin.options.slides.length - 1) ? 0 : vars.current_slide + 1;
                var loadSelector = plugin.el + " li:eq(" + loadSlide + ")";
                
                if (!$(loadSelector).html()) {
                    var imageLink = plugin.options.slides[loadSlide].url ? "href='" + plugin.options.slides[loadSlide].url + "'" : "";
                    var $img = $('<img src="../../Components/supersized/' + plugin.options.slides[loadSlide].image + '"/>');
                    $img.appendTo(loadSelector).wrap("<a " + imageLink + targetAttr + "></a>")
                        .parent().parent().addClass("image-loading").css("visibility", "hidden");
                    $img.on("load", function() {
                        plugin._origDim($(this));
                        plugin.resizeNow();
                    });
                }
                plugin.nextSlide();
            } else if (direction === "prev") {
                loadSlide = (vars.current_slide - 1 < 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;
                var loadSelector = plugin.el + " li:eq(" + loadSlide + ")";
                
                if (!$(loadSelector).html()) {
                    var imageLink = plugin.options.slides[loadSlide].url ? "href='" + plugin.options.slides[loadSlide].url + "'" : "";
                    var $img = $('<img src="../../Components/supersized/' + plugin.options.slides[loadSlide].image + '"/>');
                    $img.appendTo(loadSelector).wrap("<a " + imageLink + targetAttr + "></a>")
                        .parent().parent().addClass("image-loading").css("visibility", "hidden");
                    $img.on("load", function() {
                        plugin._origDim($(this));
                        plugin.resizeNow();
                    });
                }
                plugin.prevSlide();
            }
        };

        // 获取原始尺寸
        plugin._origDim = function($img) {
            $img.data("origWidth", $img.width()).data("origHeight", $img.height());
        };

        // 动画完成后的处理
        plugin.afterAnimation = function() {
            var vars = $.img_carousel.vars;
            
            if (plugin.options.performance === 1) {
                plugin.$el.removeClass("speed").addClass("quality");
            }
            
            if (vars.update_images) {
                var setPrev = (vars.current_slide - 1 < 0) ? plugin.options.slides.length - 1 : vars.current_slide - 1;
                vars.update_images = false;
                $(".prevslide").removeClass("prevslide");
                $(plugin.el + " li:eq(" + setPrev + ")").addClass("prevslide");
            }
            
            vars.in_animation = false;
            
            if (!vars.is_paused && plugin.options.slideshow) {
                vars.slideshow_interval = setInterval(plugin.nextSlide, plugin.options.slide_interval);
                if (plugin.options.stop_loop && vars.current_slide === plugin.options.slides.length - 1) {
                    plugin.playToggle();
                }
            }
            
            if (typeof theme !== "undefined" && typeof theme.afterAnimation === "function") {
                theme.afterAnimation();
            }
            
            return false;
        };

        // 获取字段值
        plugin.getField = function(field) {
            var vars = $.img_carousel.vars;
            return plugin.options.slides[vars.current_slide][field];
        };

        // 执行初始化
        plugin.init();
    };

    // 全局变量
    $.img_carousel.vars = {
        thumb_tray: "#thumb-tray",
        thumb_list: "#thumb-list",
        slide_list: "#slide-list",
        current_slide: 0,
        in_animation: false,
        is_paused: false,
        hover_pause: false,
        slideshow_interval: false,
        update_images: false,
        options: {}
    };

    // 默认配置
    $.img_carousel.defaultOptions = {
        slideshow: 1,
        autoplay: 1,
        start_slide: 1,
        stop_loop: 0,
        random: 0,
        slide_interval: 5000,
        transition: 1,
        transition_speed: 750,
        new_window: 1,
        pause_hover: 0,
        keyboard_nav: 1,
        performance: 1,
        image_protect: 1,
        fit_always: 0,
        fit_landscape: 0,
        fit_portrait: 1,
        min_width: 0,
        min_height: 0,
        horizontal_center: 1,
        vertical_center: 1,
        slide_links: 1,
        thumb_links: 1,
        thumbnail_navigation: 0
    };

    // 主题变量和选项（供主题扩展）
    $.img_carousel.themeVars = {};
    $.img_carousel.themeOptions = {};

    // jQuery 插件注册
    $.fn.img_carousel = function(options) {
        return this.each(function() {
            if (!$.data(this, "img_carousel")) {
                $.data(this, "img_carousel", new $.img_carousel(options));
            }
        });
    };

})(jQuery);