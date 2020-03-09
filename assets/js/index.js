// clipboard
const serverAddr = document.querySelector("url");
const copiedText = document.getElementById('copy'),

serverAddr.addEventListener("click", async (event) => {
  if (!navigator.clipboard) {
    return;
  }  
  
  try {
    const text = event.target.innerText;
    await navigator.clipboard.writeText(text);
    
    event.target.dataset.clipboard = text;
    setTimeout(() =>{
      delete event.target.dataset.clipboard;
    }, 1500);  
	  
	  
	  
	  
    if ( document.execCommand( 'copy' ) ) {
      copiedText.classList.add( 'copied' );
    
    var temp = setInterval( function(){
      copiedText.classList.remove( 'copied' );
      clearInterval(temp);
    }, 600 );
 } else {
    console.info( 'document.execCommand went wrong…' )
  }  
	  
	  
	  
  } catch (error) {
    console.error("Copy failed", error);
  }
});
// clipboard

function customBackground() {
	$("#canvas").css("background", "#00AB39")
}
var option_overlay_skin = "black",
	option_overlay_animation = "fade",
	option_overlay_content_animation = "fade",
	option_overlay_bullet_navigation = "fade",
	option_hero_parallax_hover_effect = "on",
	option_hero_gravity_effect = "on",
	option_hero_background_mode = "youtube",
	option_hero_background_image_path = [{
		src: "assets/images/1.jpg"
	}],
	option_hero_background_slider_path = [{
		src: "assets/images/1.jpg"
	}, {
		src: "assets/images/2.jpg"
	}, {
		src: "assets/images/3.jpg"
	}],
	option_hero_background_slider_delay = 6e3,
	option_hero_background_slider_transition = "slideDown",
	option_hero_background_slider_transitionDuration = 800,
	option_hero_background_kenburns_path = [{
		src: "assets/images/1.jpg"
	}, {
		src: "assets/images/2.jpg"
	}, {
		src: "assets/images/3.jpg"
	}],
	option_hero_background_kenburns_delay = 6e3,
	option_hero_background_kenburns_transition = "slideDown",
	option_hero_background_kenburns_transitionDuration = 800,
	option_hero_background_youtube_url = "https://www.youtube.com/watch?v=T3K2Fc4t93Y",
	option_hero_background_youtube_startPoint = 12,
	option_hero_background_youtube_endPoint = 208,
	option_hero_background_youtube_mute = "on",
	option_hero_background_youtube_loop = "on",
	option_hero_background_youtube_controls = "on",
	option_hero_background_color_custom_color = "#6e00ff",
	option_hero_background_gradient_colorArray = new Array([62, 35, 255], [60, 255, 60], [255, 35, 98], [45, 175, 230], [255, 0, 255], [255, 128, 0]),
	option_hero_background_gradient_stransitionSpeed = 8,
	option_hero_background_sphere_distance = 300,
	option_hero_background_sphere_rotation_speed = .2,
	option_hero_background_sphere_line_color = "#ffffff",
	option_hero_background_sphere_dot_color = "#ffffff",
	option_hero_background_sphere_background_color = "#000000",
	option_hero_background_waves_distance = 1500,
	option_hero_background_waves_dotSpacing = 120,
	option_hero_background_waves_dotAmountX = 20,
	option_hero_background_waves_dotAmountY = 60,
	option_hero_background_waves_dot_color = "#ffffff",
	option_hero_background_waves_background_color = "#000000",
	option_hero_background_mesh_color = "#ffffff",
	option_hero_background_mesh_background_color = "#111111",
	option_hero_background_mesh_spotlight_size = 600,
	option_hero_background_space_star_amount = 512,
	option_hero_background_space_star_speed = 2.5,
	option_hero_background_star_star_color = "#ffffff",
	option_hero_background_star_background_color = "#000000",
	option_hero_background_abstract_bg_color = "#d1c395",
	option_hero_background_move_speed = 10,
	option_hero_background_width = 75,
	option_hero_background_width_expansion = .8,
	option_hero_background_glitch_image = "assets/images/4.jpg",
	option_analytics_tracking = "off",
	option_analytics_tracking_id = "UA-XXXXXXXX-X";

function loadtracking() {
	window._gaq.push(["_setAccount", option_analytics_tracking_id]), window._gaq.push(["_trackPageview"]),
		function () {
			var e = document.createElement("script");
			e.type = "text/javascript", e.async = !0, e.src = ("https:" == document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
			var a = document.getElementsByTagName("script")[0];
			a.parentNode.insertBefore(e, a)
		}()
}
var blockProcess = !0;
if (jQuery(window).on("load", function () {
		"use strict";
		setTimeout(function () {
			$("#page-loader").addClass("hide-this"), $("#cycle").cycle("goto", "0"), setTimeout(function () {
				$(".hero .background-content.page-enter-animated").addClass("show"), setTimeout(function () {
					$(".hero .front-content.page-enter-animated").addClass("show"), setTimeout(function () {
						blockProcess = !1, $(".grcs_bullet_nav").addClass("init")
					}, 1e3)
				}, 600), $(".social-icons li a").tooltip({
					container: "body",
					delay: {
						show: 150,
						hide: 0
					}
				})
			}, 200)
		}, 600)
	}), $(document).ready(function () {
		"use strict";

		function e(e, a, t, s) {
			function o() {
				_.children().css("transition", "all 1000ms 500ms"), g.addClass("overlay-active"), g.removeClass("show"), g.find("div.controls").removeClass("show"), $("#cycle").cycle("pause")
			}

			function n() {
				_.children().css("transition", "all 800ms 200ms"), g.removeClass("overlay-active"), g.addClass("show"), "youtube" === option_hero_background_mode && setTimeout(function () {
					g.find("div.controls").addClass("show")
				}, 200), setTimeout(function () {
					$("#cycle").cycle("resume")
				}, 1400)
			}

			function c() {
				return y == C || blockProcess === !0 ? !1 : (blockProcess = !0, 0 === y && (o(), setTimeout(function () {
					m.addClass("open")
				}, 200)), 0 == b ? y += 1 : (y = v, b = !1), f.removeClass("active"), u = f.eq(y - 1), $(".social-icons li a").tooltip("hide"), void setTimeout(function () {
					u.addClass("active"), i(), setTimeout(function () {
						p.addClass("active"), setTimeout(function () {
							blockProcess = !1
						}, 800)
					}, 400)
				}, 1e3))
			}

			function r() {
				return 0 === y || blockProcess === !0 ? !1 : (blockProcess = !0, 0 == b ? y -= 1 : (y = v, b = !1), f.removeClass("active"), u = f.eq(y - 1), setTimeout(function () {
					u.addClass("active"), i(), setTimeout(function () {
						blockProcess = !1
					}, 800)
				}, 800), void(0 === y && (p.removeClass("active"), setTimeout(function () {
					n(), m.removeClass("open")
				}, 800))))
			}

			function i() {
				"on" !== option_overlay_bullet_navigation || $(".hero").hasClass("error-404") || ($(".grcs_bullet_nav .nav_dots").removeClass("active"), $(".grcs_bullet_nav .nav_dots").eq(y).addClass("active"))
			}

			function l() {
				$(".grcs_bullet_nav .nav_dots").click(function () {
					v = $(".grcs_bullet_nav .nav_dots").index(this), v != y && (y > v ? (b = !0, r()) : (b = !0, c()))
				})
			}

			function d() {
				$("body").append('<div class="grcs_bullet_nav"></div>');
				for (var e = 0; C + 1 > e; e++) $(".grcs_bullet_nav").append('<div class="nav_dots"></div>');
				i(), l()
			}
			var u, m = $(e),
				f = $(e + ">" + a),
				v = 0,
				b = !1,
				p = $(".go-up"),
				h = $(".go-down"),
				g = $(t),
				_ = $(s),
				C = f.length,
				y = 0;
			switch ("on" !== option_overlay_bullet_navigation || $(".hero").hasClass("error-404") || d(), h.click(function () {
				c()
			}), p.click(function () {
				r()
			}), $("html").on("DOMMouseScroll mousewheel", function (e) {
				var a = e.originalEvent.wheelDelta || -1 * e.originalEvent.detail;
				0 > a / 120 && c()
			}), $("html").on("DOMMouseScroll mousewheel", function (e) {
				var a = e.originalEvent.wheelDelta || -1 * e.originalEvent.detail;
				a / 120 > 0 && r()
			}), $(document).keydown(function (e) {
				switch (e.which) {
					case 37:
						break;
					case 38:
						r();
						break;
					case 39:
						break;
					case 40:
						c();
						break;
					default:
						return
				}
				e.preventDefault()
			}), "white" == option_overlay_skin && $("body").addClass("white"), option_overlay_animation) {
				case "fade":
					m.addClass("fade-In");
					break;
				case "slide":
					m.addClass("slide-from-bottom");
					break;
				default:
					m.addClass("fade-In")
			}
			switch (option_overlay_content_animation) {
				case "fade":
					f.addClass("fade-In");
					break;
				case "slide":
					f.addClass("slide-from-bottom");
					break;
				default:
					f.addClass("slide-from-bottom")
			}
		}
		e("#overlay", "section.overlay", "#hero .front-content", "#hero .front-content .container-mid"), $(".subscribe-form").submit(function () {
			var e = $(".subscribe-form").serialize();
			return $.ajax({
				type: "POST",
				url: "assets/php/subscribe.php",
				data: e,
				dataType: "json",
				success: function (e) {
					$(".subscribe-form").removeClass("error").removeClass("error-final"), 0 === e.valid ? ($(".subscribe-form").addClass("error"), $(".subscribe-form input").attr("placeholder", e.message), $(".subscribe-form input").val(""), setTimeout(function () {
						$(".subscribe-form").addClass("error-final")
					}, 1500)) : ($(".subscribe-form input,.subscribe-form button").val("").prop("disabled", !0), $(".subscribe-form input").attr("placeholder", e.message), $(".subscribe-form").addClass("success"))
				}
			}), !1
		}), $("#contact-form").submit(function (e) {
			e.preventDefault();
			var a = $(this).serialize();
			$.ajax({
				type: "POST",
				url: "assets/php/contact.php",
				data: a,
				dataType: "json",
				success: function (e) {
					$("#contact-form.error input, #contact-form.error textarea").removeClass("active"), setTimeout(function () {
						"" !== e.nameMessage && ($("#contact-form-name").addClass("active").attr("placeholder", e.nameMessage), $("#contact-form").addClass("error")), "" !== e.emailMessage && ($("#contact-form-email").addClass("active").val("").attr("placeholder", e.emailMessage), $("#contact-form").addClass("error")), "" !== e.messageMessage && ($("#contact-form-message").addClass("active").attr("placeholder", e.messageMessage), $("#contact-form").addClass("error"))
					}, 50), "" === e.nameMessage && "" === e.emailMessage && "" === e.messageMessage && ($("#contact-form").removeClass("error").addClass("success"), $("#contact-form textarea, #contact-form input").attr("placeholder", ""), $("#contact-form textarea").attr("placeholder", e.succesMessage), $("#contact-form input, #contact-form button, #contact-form textarea").val("").prop("disabled", !0))
				}
			})
		})
	}), "on" == option_analytics_tracking) {
	var _gaq = _gaq || [];
	loadtracking()
}

$(document).ready(function () {
	"use strict";

	function t() {
		$(".bg-image").vegas({
			slides: option_hero_background_image_path,
			delay: 6e3,
			transitionDuration: 800,
			timer: !1
		})
	}

	function e() {
		$(".bg-image").vegas({
			slides: option_hero_background_slider_path,
			transition: option_hero_background_slider_transition,
			delay: option_hero_background_slider_delay,
			transitionDuration: option_hero_background_slider_transitionDuration,
			firstTransitionDuration: 1,
			timer: !1,
			walk: function (t, e) {
				$("#cycle").cycle("next")
			}
		})
	}

	function o() {
		$(".bg-image").vegas({
			slides: option_hero_background_kenburns_path,
			transition: option_hero_background_kenburns_transition,
			delay: option_hero_background_kenburns_delay,
			transitionDuration: option_hero_background_kenburns_transitionDuration,
			firstTransitionDuration: 1,
			timer: !1,
			animation: "kenburns",
			walk: function (t, e) {
				$("#cycle").cycle("next")
			}
		})
	}

	function n() {
		"on" === option_hero_background_youtube_controls && $(".hero .front-content").append('<div class="controls"><i class="volume-button fa fa-volume-up"></i><i class="pause-button ti-control-pause"></i></div>'), "on" === option_hero_background_youtube_mute && (option_hero_background_youtube_mute = !0, $(".volume-button").removeClass("fa-volume-up").addClass("fa-volume-off")), "off" === option_hero_background_youtube_mute && (option_hero_background_youtube_mute = !1), "off" === option_hero_background_youtube_loop ? option_hero_background_youtube_loop = !1 : option_hero_background_youtube_loop = !0, $(".hero .bg-video").append('<div id="bg-youtube" class="player showOn-video-bg"></div>'), $(".hero #bg-youtube").attr("data-property", '{videoURL:option_hero_background_youtube_url,containment:".bg-video",autoPlay:true,mute:option_hero_background_youtube_mute,startAt: option_hero_background_youtube_startPoint,stopAt: option_hero_background_youtube_endPoint,loop: option_hero_background_youtube_loop,opacity:1,stopMovieOnBlur:false,showControls:false}'), $(".player").mb_YTPlayer(), $(".hero .controls").addClass("show"), $(".volume-button").click(function () {
			$("#bg-youtube").hasClass("isMuted") ? ($("#bg-youtube").YTPUnmute(), $(".volume-button").removeClass("fa-volume-off").addClass("fa-volume-up")) : ($("#bg-youtube").YTPMute(), $(".volume-button").removeClass("fa-volume-up").addClass("fa-volume-off"))
		});
		var t = !0;
		$("#bg-youtube").on("YTPPause", function () {
			t = !1
		}), $("#bg-youtube").on("YTPPlay", function () {
			t = !0
		}), $(".pause-button").click(function () {
			1 == t ? ($("#bg-youtube").YTPPause(), $(".pause-button").removeClass("ti-control-pause").addClass("ti-control-play")) : ($("#bg-youtube").YTPPlay(), $(".pause-button").removeClass("ti-control-play").addClass("ti-control-pause"))
		})
	}

	function i() {
		$(".hero .level-2").css("background", option_hero_background_color_custom_color), $(".hero .level-2").children().remove(), $(".hero .bg-color").css("opacity", "1"), $(".hero .bg-pattern").remove(), $(".hero .bg-overlay").remove()
	}

	function a() {
		function t() {
			var t = e[i[0]],
				r = e[i[1]],
				s = e[i[2]],
				h = e[i[3]],
				c = 1 - o,
				l = Math.round(c * t[0] + o * r[0]),
				u = Math.round(c * t[1] + o * r[1]),
				d = Math.round(c * t[2] + o * r[2]),
				g = "rgb(" + l + "," + u + "," + d + ")",
				p = Math.round(c * s[0] + o * h[0]),
				_ = Math.round(c * s[1] + o * h[1]),
				f = Math.round(c * s[2] + o * h[2]),
				m = "rgb(" + p + "," + _ + "," + f + ")";
			n.css({
				background: "-webkit-gradient(linear, left top, right top, from(" + g + "), to(" + m + "))"
			}).css({
				background: "-moz-linear-gradient(left, " + g + " 0%, " + m + " 100%)"
			}), o += a, o >= 1 && (o %= 1, i[0] = i[1], i[2] = i[3], i[1] = (i[1] + Math.floor(1 + Math.random() * (e.length - 1))) % e.length, i[3] = (i[3] + Math.floor(1 + Math.random() * (e.length - 1))) % e.length)
		}
		var e = option_hero_background_gradient_colorArray,
			o = 0,
			n = $(".bg-color"),
			i = [0, 1, 2, 3],
			a = option_hero_background_gradient_stransitionSpeed / 1e4;
		setInterval(t, 1), $(".hero .bg-color").css("opacity", "1"), $(".hero .bg-pattern").remove(), $(".hero .bg-overlay").remove()
	}

	function r() {
		function t() {
			var t, a;
			t = document.createElement("div"), document.getElementById("canvas").appendChild(t), s = new THREE.PerspectiveCamera(75, l / u, 1, 1e4), s.position.z = option_hero_background_sphere_distance, h = new THREE.Scene, c = new THREE.CanvasRenderer, c.setPixelRatio(window.devicePixelRatio), c.setSize(l, u), t.appendChild(c.domElement), c.setClearColor(option_hero_background_sphere_background_color);
			for (var r = 2 * Math.PI, d = new THREE.SpriteCanvasMaterial({
					color: option_hero_background_sphere_dot_color,
					program: function (t) {
						t.beginPath(), t.arc(0, 0, .5, 0, r, !0), t.fill()
					}
				}), g = 0; 1e3 > g; g++) a = new THREE.Sprite(d), a.position.x = 2 * Math.random() - 1, a.position.y = 2 * Math.random() - 1, a.position.z = 2 * Math.random() - 1, a.position.normalize(), a.position.multiplyScalar(10 * Math.random() + 450), a.scale.multiplyScalar(2), h.add(a);
			for (var g = 0; 300 > g; g++) {
				var p = new THREE.Geometry,
					_ = new THREE.Vector3(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
				_.normalize(), _.multiplyScalar(450), p.vertices.push(_);
				var f = _.clone();
				f.multiplyScalar(.3 * Math.random() + 1), p.vertices.push(f);
				var m = new THREE.Line(p, new THREE.LineBasicMaterial({
					color: option_hero_background_sphere_line_color,
					opacity: Math.random()
				}));
				h.add(m)
			}
			document.addEventListener("mousemove", o, !1), document.addEventListener("touchstart", n, !1), document.addEventListener("touchmove", i, !1), window.addEventListener("resize", e, !1)
		}

		function e() {
			var t = $(".hero .level-1").width(),
				e = $(".hero .level-1").height();
			p = t / 2, _ = e / 2, s.aspect = t / e, s.updateProjectionMatrix(), c.setSize(t, e)
		}

		function o(t) {
			d = t.clientX - p, g = t.clientY - _
		}

		function n(t) {
			t.touches.length > 1 && (t.preventDefault(), d = t.touches[0].pageX - p, g = t.touches[0].pageY - _)
		}

		function i(t) {
			1 === t.touches.length && (t.preventDefault(), d = t.touches[0].pageX - p, g = t.touches[0].pageY - _)
		}

		function a() {
			requestAnimationFrame(a), r()
		}

		function r() {
			f && (s.position.x += .05 * (d - s.position.x), s.position.y += .05 * (-g + 200 - s.position.y), s.lookAt(h.position), h.rotation.y += option_hero_background_sphere_rotation_speed / 100, c.render(h, s))
		}
		$(".hero .background-content .bg-overlay").css("z-index", "2");
		var s, h, c, l = $(".hero .level-1").width(),
			u = $(".hero .level-1").height(),
			d = 0,
			g = 0,
			p = window.innerWidth / 2,
			_ = window.innerHeight / 2;
		t(), a();
		var f = !0;
		$(document).scroll(function () {
			f = $(this).scrollTop() > $(window).height() ? !1 : !0
		})
	}

	function s() {
		function t() {
			s = document.createElement("div"), document.getElementById("canvas").appendChild(s), h = new THREE.PerspectiveCamera(75, f / m, 1, 1e4), h.position.z = option_hero_background_waves_distance, c = new THREE.Scene, u = new Array;
			for (var t = 2 * Math.PI, a = new THREE.SpriteCanvasMaterial({
					color: option_hero_background_waves_dot_color,
					program: function (e) {
						e.beginPath(), e.arc(0, 0, .5, 0, t, !0), e.fill()
					}
				}), r = 0, v = 0; p > v; v++)
				for (var b = 0; _ > b; b++) d = u[r++] = new THREE.Sprite(a), d.position.x = v * g - p * g / 2, d.position.z = b * g - _ * g / 2, c.add(d);
			l = new THREE.CanvasRenderer, l.setPixelRatio(window.devicePixelRatio), l.setSize(f, m), s.appendChild(l.domElement), l.setClearColor(option_hero_background_waves_background_color), document.addEventListener("mousemove", o, !1), document.addEventListener("touchstart", n, !1), document.addEventListener("touchmove", i, !1), window.addEventListener("resize", e, !1)
		}

		function e() {
			var t = $(".hero .level-1").width(),
				e = $(".hero .level-1").height();
			x = t / 2, w = e / 2, h.aspect = t / e, h.updateProjectionMatrix(), l.setSize(t, e)
		}

		function o(t) {
			b = t.clientX - x, y = t.clientY - w
		}

		function n(t) {
			1 === t.touches.length && (t.preventDefault(), b = t.touches[0].pageX - x, y = t.touches[0].pageY - w)
		}

		function i(t) {
			1 === t.touches.length && (t.preventDefault(), b = t.touches[0].pageX - x, y = t.touches[0].pageY - w)
		}

		function a() {
			requestAnimationFrame(a), r()
		}

		function r() {
			if (S) {
				h.position.x += .05 * (b - h.position.x), h.position.y += .05 * (-y - h.position.y), h.lookAt(c.position);
				for (var t = 0, e = 0; p > e; e++)
					for (var o = 0; _ > o; o++) d = u[t++], d.position.y = 50 * Math.sin(.3 * (e + v)) + 50 * Math.sin(.5 * (o + v)), d.scale.x = d.scale.y = 4 * (Math.sin(.3 * (e + v)) + 1) + 4 * (Math.sin(.5 * (o + v)) + 1);
				l.render(c, h), v += .1
			}
		}
		$(".hero .background-content .bg-overlay").css("z-index", "2");
		var s, h, c, l, u, d, g = option_hero_background_waves_dotSpacing,
			p = option_hero_background_waves_dotAmountX,
			_ = option_hero_background_waves_dotAmountY,
			f = $(".hero .level-1").width(),
			m = $(".hero .level-1").height(),
			v = 0,
			b = 0,
			y = 0,
			x = f / 2,
			w = m / 2;
		t(), a();
		var S = !0;
		$(document).scroll(function () {
			S = $(this).scrollTop() > $(window).height() ? !1 : !0
		})
	}

	function h() {
		function t(t) {
			this.x = t.x, this.y = t.y, this.xBase = this.x, this.yBase = this.y, this.offset = e(0, 1e3), this.duration = e(20, 60), this.range = e(5, 5), this.dir = e(0, 1) > .5 ? 1 : -1, this.rad = e(2, 4)
		}

		function e(t, e) {
			return Math.random() * (e - t) + t
		}

		function o(t, e) {
			var o = t.x - e.x,
				n = t.y - e.y;
			return Math.atan2(n, o)
		}

		function n() {
			l = document.createElement("canvas"), u = l.getContext("2d"), b = {
				x: 0,
				y: 0
			}, S = [], p = 180, _ = .25 * p, document.getElementById("canvas").appendChild(l), i(), h()
		}

		function i() {
			d = $(".hero .level-1").width(), g = $(".hero .level-1").height(), l.width = d, l.height = g, b.x = d / 2, b.y = g / 2, y = !1, x = 0, w = 0, S.length = 0, k = 0, a(), u.strokeStyle = option_hero_background_mesh_color, u.lineWidth = 2
		}

		function a() {
			for (var o = -p / 2; d + p > o; o += p) {
				x++;
				for (var n = -p / 2; g + p > n; n += p) o == -p / 2 && w++, S.push(new t({
					x: ~~(o + e(-_, _)),
					y: ~~(n + e(-_, _))
				}))
			}
		}

		function r() {
			y || (b.x = d / 2 + 90 * Math.cos(k / 40), b.y = g / 2 + 90 * Math.sin(k / 40)), S.forEach(function (t) {
				t.step()
			}), k++
		}

		function s() {
			u.clearRect(0, 0, d, g), u.beginPath();
			for (var t = 0; x > t; t++)
				for (var e = 0; w > e; e++) f = S[t * w + e], m = t === x - 1 ? null : S[(t + 1) * w + e], v = e === w - 1 ? null : S[t * w + e + 1], m && (u.moveTo(f.x, f.y), u.lineTo(m.x, m.y)), v && (u.moveTo(f.x, f.y), u.lineTo(v.x, v.y));
			u.stroke(), u.fillStyle = "#000", S.forEach(function (t) {
				u.save(), u.beginPath(), u.translate(t.x, t.y), u.rotate(Math.PI / 4), u.rect(0, 0, 0, 0), u.fill(), u.stroke(), u.restore()
			});
			var o = u.createRadialGradient(b.x, b.y, 0, b.x, b.y, option_hero_background_mesh_spotlight_size);
			o.addColorStop(0, "hsla(0, 0%, 0%, 0)"), o.addColorStop(1, "hsla(0, 0%, 0%, 0.93)"), u.fillStyle = o, u.fillRect(0, 0, d, g)
		}

		function h() {
			requestAnimationFrame(h), r(), s()
		}

		function c(t) {
			y = !0, b.x = t.pageX, b.y = t.pageY
		}
		var l, u, d, g, p, _, f, m, v, b, y, x, w, S, k;
		t.prototype.step = function () {
			this.x = this.xBase + this.dir * Math.sin((k + this.offset) / this.duration) * this.range, this.y = this.yBase + this.dir * Math.cos((k + this.offset) / this.duration) * this.range;
			var t = o(this, b);
			this.x = this.x + 100 * Math.cos(t), this.y = this.y + 100 * Math.sin(t)
		}, window.addEventListener("resize", i), window.addEventListener("mousemove", c), n(), $(".hero .background-content #canvas canvas").css("background-color", option_hero_background_mesh_background_color)
	}

	function c() {
		! function (t, e, o, n) {
			var i, a, r, s = function (e, o) {
					this.el = e, this.$el = t(e), this.options = o, r = this
				},
				h = !1,
				c = !1;
			! function () {
				for (var t = 0, o = ["ms", "moz", "webkit", "o"], n = 0; n < o.length && !e.requestAnimationFrame; ++n) e.requestAnimationFrame = e[o[n] + "RequestAnimationFrame"], e.cancelAnimationFrame = e[o[n] + "CancelAnimationFrame"] || e[o[n] + "CancelRequestAnimationFrame"];
				e.requestAnimationFrame || (e.requestAnimationFrame = function (o, n) {
					var i = (new Date).getTime(),
						a = Math.max(0, 16 - (i - t)),
						r = e.setTimeout(function () {
							o(i + a)
						}, a);
					return t = i + a, r
				}), e.cancelAnimationFrame || (e.cancelAnimationFrame = function (t) {
					clearTimeout(t)
				})
			}(), s.prototype = {
				defaults: {
					starColor: option_hero_background_star_star_color,
					bgColor: option_hero_background_star_background_color,
					mouseMove: !0,
					mouseColor: "rgba(0,0,0,0.2)",
					mouseSpeed: 15,
					speed: option_hero_background_space_star_speed,
					quantity: option_hero_background_space_star_amount,
					ratio: option_hero_background_space_star_amount / 2,
					divclass: "starfield"
				},
				resizer: function () {
					var t = this.star,
						e = this.context.canvas.width,
						o = this.context.canvas.height;
					this.w = this.$el.width(), this.h = this.$el.height(), this.x = Math.round(this.w / 2), this.y = Math.round(this.h / 2);
					var n = this.w / e,
						i = this.h / o;
					this.context.canvas.width = this.w, this.context.canvas.height = this.h;
					for (var a = 0; a < this.n; a++) this.star[a][0] = t[a][0] * n, this.star[a][1] = t[a][1] * i, this.star[a][3] = this.x + this.star[a][0] / this.star[a][2] * this.star_ratio, this.star[a][4] = this.y + this.star[a][1] / this.star[a][2] * this.star_ratio;
					r.context.fillStyle = r.settings.bgColor, this.context.strokeStyle = this.settings.starColor
				},
				init: function () {
					this.settings = t.extend({}, this.defaults, this.options);
					var i = o.location.href;
					this.n = parseInt(-1 != i.indexOf("n=") ? i.substring(i.indexOf("n=") + 2, -1 != i.substring(i.indexOf("n=") + 2, i.length).indexOf("&") ? i.indexOf("n=") + 2 + i.substring(i.indexOf("n=") + 2, i.length).indexOf("&") : i.length) : this.settings.quantity), this.flag = !0, this.test = !0, this.w = 0, this.h = 0, this.x = 0, this.y = 0, this.z = 0, this.star_color_ratio = 0, this.star_x_save = 0, this.star_y_save = 0, this.star_ratio = this.settings.ratio, this.star_speed = this.settings.speed, this.star_speed_save = 0, this.star = new Array(this.n), this.color = this.settings.starColor, this.opacity = .1, this.cursor_x = 0, this.cursor_y = 0, this.mouse_x = 0, this.mouse_y = 0, this.canvas_x = 0, this.canvas_y = 0, this.canvas_w = 0, this.canvas_h = 0, this.fps = this.settings.fps, this.desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|IEMobile)/), this.orientationSupport = e.DeviceOrientationEvent !== n, this.portrait = null;
					var a = function () {
						r.w = r.$el.width(), r.h = r.$el.height(), r.initW = r.w, r.initH = r.h, r.portrait = r.w < r.h, r.wrapper = t("<canvas />").addClass(r.settings.divclass), r.wrapper.appendTo(r.el), r.starz = t("canvas", r.el), r.starz[0].getContext && (r.context = r.starz[0].getContext("2d"), c = !0), r.context.canvas.width = r.w, r.context.canvas.height = r.h
					};
					a();
					var s = function () {
						if (c) {
							r.x = Math.round(r.w / 2), r.y = Math.round(r.h / 2), r.z = (r.w + r.h) / 2, r.star_color_ratio = 1 / r.z, r.cursor_x = r.x, r.cursor_y = r.y;
							for (var t = 0; t < r.n; t++) r.star[t] = new Array(5), r.star[t][0] = Math.random() * r.w * 2 - 2 * r.x, r.star[t][1] = Math.random() * r.h * 2 - 2 * r.y, r.star[t][2] = Math.round(Math.random() * r.z), r.star[t][3] = 0, r.star[t][4] = 0;
							r.context.fillStyle = r.settings.bgColor, r.context.strokeStyle = r.settings.starColor
						}
					};
					s(), h = !0
				},
				anim: function () {
					this.mouse_x = this.cursor_x - this.x, this.mouse_y = this.cursor_y - this.y, this.context.fillRect(0, 0, this.w, this.h);
					for (var t = 0; t < this.n; t++) this.test = !0, this.star_x_save = this.star[t][3], this.star_y_save = this.star[t][4], this.star[t][0] += this.mouse_x >> 4, this.star[t][0] > this.x << 1 && (this.star[t][0] -= this.w << 1, this.test = !1), this.star[t][0] < -this.x << 1 && (this.star[t][0] += this.w << 1, this.test = !1), this.star[t][1] += this.mouse_y >> 4, this.star[t][1] > this.y << 1 && (this.star[t][1] -= this.h << 1, this.test = !1), this.star[t][1] < -this.y << 1 && (this.star[t][1] += this.h << 1, this.test = !1), this.star[t][2] -= this.star_speed, this.star[t][2] > this.z && (this.star[t][2] -= this.z, this.test = !1), this.star[t][2] < 0 && (this.star[t][2] += this.z, this.test = !1), this.star[t][3] = this.x + this.star[t][0] / this.star[t][2] * this.star_ratio, this.star[t][4] = this.y + this.star[t][1] / this.star[t][2] * this.star_ratio, this.star_x_save > 0 && this.star_x_save < this.w && this.star_y_save > 0 && this.star_y_save < this.h && this.test && (this.context.lineWidth = 2 * (1 - this.star_color_ratio * this.star[t][2]), this.context.beginPath(), this.context.moveTo(this.star_x_save, this.star_y_save), this.context.lineTo(this.star[t][3], this.star[t][4]), this.context.stroke(), this.context.closePath())
				},
				loop: function () {
					this.anim(), a = e.requestAnimationFrame(function () {
						r.loop()
					})
				},
				move: function () {
					function t(t) {
						if (null !== t.beta && null !== t.gamma) {
							var e = t.gamma,
								o = t.beta;
							r.portrait || (e = -1 * t.beta, o = t.gamma), r.cursor_x = r.w / 2 + 5 * e, r.cursor_y = r.h / 2 + 5 * o
						}
					}

					function n(t) {
						r.cursor_x = t.pageX || t.clientX + i.scrollLeft - i.clientLeft, r.cursor_y = t.pageY || t.clientY + i.scrollTop - i.clientTop
					}
					var i = o.documentElement;
					this.orientationSupport && !this.desktop ? e.addEventListener("deviceorientation", t, !1) : e.addEventListener("mousemove", n, !1)
				},
				stop: function () {
					e.cancelAnimationFrame(a), i = !1
				},
				start: function () {
					return h || (h = !0, this.init()), i || (i = !0, this.loop()), e.addEventListener("resize", function () {
						r.resizer()
					}, !1), e.addEventListener("orientationchange", function () {
						r.resizer()
					}, !1), this.settings.mouseMove && this.move(), this
				}
			}, s.defaults = s.prototype.defaults, t.fn.starfield = function (t) {
				return this.each(function () {
					new s(this, t).start()
				})
			}, e.Starfield = s
		}(jQuery, window, document), $("#canvas").starfield()
	}

	function l() {
		function t() {
			e(), n(), i(), a(), l(), r(E.offsetWidth, E.offsetHeight), s()
		}

		function e() {
			v = new FSS.CanvasRenderer, o(w.renderer)
		}

		function o(t) {
			g && C.removeChild(g.element), g = v, g.setSize(E.offsetWidth, E.offsetHeight), C.appendChild(g.element)
		}

		function n() {
			p = new FSS.Scene
		}

		function i() {
			p.remove(_), g.clear(), f = new FSS.Plane(y.width * g.width, y.height * g.height, y.segments, y.slices), m = new FSS.Material(y.ambient, y.diffuse), _ = new FSS.Mesh(f, m), p.add(_);
			var t, e;
			for (t = f.vertices.length - 1; t >= 0; t--) e = f.vertices[t], e.anchor = FSS.Vector3.clone(e.position), e.step = FSS.Vector3.create(Math.randomInRange(.2, 1), Math.randomInRange(.2, 1), Math.randomInRange(.2, 1)), e.time = Math.randomInRange(0, Math.PIM2)
		}

		function a() {
			var t, e;
			for (t = p.lights.length - 1; t >= 0; t--) e = p.lights[t], p.remove(e);
			for (g.clear(), t = 0; t < x.count; t++) e = new FSS.Light(x.ambient, x.diffuse), e.ambientHex = e.ambient.format(), e.diffuseHex = e.diffuse.format(), p.add(e), e.mass = Math.randomInRange(.5, 1), e.velocity = FSS.Vector3.create(), e.acceleration = FSS.Vector3.create(), e.force = FSS.Vector3.create(), e.ring = document.createElementNS(FSS.SVGNS, "circle"), e.ring.setAttributeNS(null, "stroke", e.ambientHex), e.ring.setAttributeNS(null, "stroke-width", "0.5"), e.ring.setAttributeNS(null, "fill", "none"), e.ring.setAttributeNS(null, "r", "10"), e.core = document.createElementNS(FSS.SVGNS, "circle"), e.core.setAttributeNS(null, "fill", e.diffuseHex), e.core.setAttributeNS(null, "r", "4")
		}

		function r(t, e) {
			g.setSize(t, e), FSS.Vector3.set(k, g.halfWidth, g.halfHeight), i()
		}

		function s() {
			d = Date.now() - S, h(), c(), requestAnimationFrame(s)
		}

		function h() {
			var t, e, o, n, i, a, r, s = y.depth / 2;
			for (FSS.Vector3.copy(x.bounds, k), FSS.Vector3.multiplyScalar(x.bounds, x.xyScalar), FSS.Vector3.setZ(M, x.zOffset), x.autopilot && (t = Math.sin(x.step[0] * d * x.speed), e = Math.cos(x.step[1] * d * x.speed), FSS.Vector3.set(M, x.bounds[0] * t, x.bounds[1] * e, x.zOffset)), n = p.lights.length - 1; n >= 0; n--) {
				i = p.lights[n], FSS.Vector3.setZ(i.position, x.zOffset);
				var h = Math.clamp(FSS.Vector3.distanceSquared(i.position, M), x.minDistance, x.maxDistance),
					c = x.gravity * i.mass / h;
				FSS.Vector3.subtractVectors(i.force, M, i.position), FSS.Vector3.normalise(i.force), FSS.Vector3.multiplyScalar(i.force, c), FSS.Vector3.set(i.acceleration), FSS.Vector3.add(i.acceleration, i.force), FSS.Vector3.add(i.velocity, i.acceleration), FSS.Vector3.multiplyScalar(i.velocity, x.dampening), FSS.Vector3.limit(i.velocity, x.minLimit, x.maxLimit), FSS.Vector3.add(i.position, i.velocity)
			}
			for (a = f.vertices.length - 1; a >= 0; a--) r = f.vertices[a], t = Math.sin(r.time + r.step[0] * d * y.speed), e = Math.cos(r.time + r.step[1] * d * y.speed), o = Math.sin(r.time + r.step[2] * d * y.speed), FSS.Vector3.set(r.position, y.xRange * f.segmentWidth * t, y.yRange * f.sliceHeight * e, y.zRange * s * o - s), FSS.Vector3.add(r.position, r.anchor);
			f.dirty = !0
		}

		function c() {
			if (g.render(p), x.draw) {
				var t, e, o, n;
				for (t = p.lights.length - 1; t >= 0; t--) n = p.lights[t], e = n.position[0], o = n.position[1], g.context.lineWidth = .5, g.context.beginPath(), g.context.arc(e, o, 10, 0, Math.PIM2), g.context.strokeStyle = n.ambientHex, g.context.stroke(), g.context.beginPath(), g.context.arc(e, o, 4, 0, Math.PIM2), g.context.fillStyle = n.diffuseHex, g.context.fill()
			}
		}

		function l() {
			window.addEventListener("resize", u)
		}

		function u(t) {
			r(E.offsetWidth, E.offsetHeight), c()
		}
		$(".hero .bg-pattern").remove(), $(".hero .bg-overlay").remove();
		var d, g, p, _, f, m, v, b = setInterval(function () {
				$(".hero .level-1 #canvas").offset().top <= 0 && ($(".hero .level-1 #canvas").css({
					WebkitTransition: "all .4s",
					transition: "all .4s"
				}), $(".hero .level-1 #canvas").css("background", option_hero_background_abstract_bg_color), clearInterval(b))
			}, 50),
			y = {
				width: option_hero_background_width / 100,
				height: 1.8,
				depth: 60,
				segments: 9,
				slices: 8,
				xRange: option_hero_background_width_expansion,
				yRange: .1,
				zRange: 1,
				ambient: "#666666",
				diffuse: "#fff",
				speed: option_hero_background_move_speed / 1e4
			},
			x = {
				count: 2,
				xyScalar: 1,
				zOffset: 100,
				ambient: "#fff",
				diffuse: "#b3b3b3",
				speed: 2e-4,
				gravity: 500,
				dampening: .95,
				minLimit: 10,
				maxLimit: null,
				minDistance: 20,
				maxDistance: 400,
				autopilot: !0,
				draw: !1,
				bounds: FSS.Vector3.create(),
				step: FSS.Vector3.create(Math.randomInRange(.2, 1), Math.randomInRange(.2, 1), Math.randomInRange(.2, 1))
			},
			w = {
				renderer: "canvas"
			},
			S = Date.now(),
			k = FSS.Vector3.create(),
			M = FSS.Vector3.create(),
			E = document.getElementById("canvas"),
			C = document.getElementById("canvas");
		if (t(), canvas.getContext) {
			var F = canvas.getContext("2d"),
				T = !0;
			canvas.height = screen.height - 60, canvas.width = screen.width + 20, initialize(), initialize();
			setInterval(function () {
				for (var t = 1; 1e3 >= t; t++) F.beginPath(), T ? (F.moveTo(0, randomize(canvas.height + 10)), T = !1) : (F.moveTo(randomize(canvas.width + 10), 0), T = !0), F.lineTo(randomize(canvas.width + 50), randomize(canvas.height + 50)), F.lineTo(randomize(canvas.width + 50), randomize(canvas.height + 50)), F.fillStyle = getRndColor(), F.fill()
			}, 5e3)
		}
	}

	function u() {
		var t = "background-image: url('" + option_hero_background_glitch_image + "')";
		$(".hero .level-2 .bg-image").append('<div class="glitch-img" style="' + t + '"></div>'), $(".glitch-img").mgGlitch({
			destroy: !1,
			glitch: !0,
			scale: !0,
			blend: !0,
			blendModeType: "hue",
			glitch1TimeMin: 600,
			glitch1TimeMax: 900,
			glitch2TimeMin: 10,
			glitch2TimeMax: 115,
			zIndexStart: 8
		})
	}

	function d() {
		"on" === option_hero_gravity_effect && p()
	}

	function g(t, e) {
		var o = document.getElementsByTagName("head")[0],
			n = document.createElement("script");
		n.type = "text/javascript", n.src = t, n.onreadystatechange = e, n.onload = e, o.appendChild(n)
	}

	function p() {
		function t(t, e) {
			function o() {
				this.x = Math.random() * t.width, this.y = Math.random() * t.height, this.vx = u.velocity - .5 * Math.random(), this.vy = u.velocity - .5 * Math.random(), this.radius = Math.random() * u.star.width
			}
			var n = 14e3,
				i = .2,
				a = $(".hero .level-1").width(),
				r = $(".hero .level-1").height(),
				s = Math.round(r * a / n),
				h = $(t),
				c = t.getContext("2d"),
				l = {
					star: {
						color: "rgba(255, 255, 255, .65)",
						width: 1
					},
					line: {
						color: "rgba(255, 255, 255, .65)",
						width: .2
					},
					position: {
						x: 0,
						y: 0
					},
					width: a,
					height: r,
					velocity: i,
					length: s,
					distance: 120,
					radius: 200,
					stars: []
				},
				u = $.extend(!0, {}, l, e);
			o.prototype = {
				create: function () {
					c.beginPath(), c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, !1), c.fill()
				},
				animate: function () {
					var e;
					for (e = 0; e < u.length; e++) {
						var o = u.stars[e];
						o.y < 0 || o.y > t.height ? (o.vx = o.vx, o.vy = -o.vy) : (o.x < 0 || o.x > t.width) && (o.vx = -o.vx, o.vy = o.vy), o.x += o.vx, o.y += o.vy
					}
				},
				line: function () {
					var t, e, o, n, i = u.length;
					for (o = 0; i > o; o++)
						for (n = 0; i > n; n++) t = u.stars[o], e = u.stars[n], t.x - e.x < u.distance && t.y - e.y < u.distance && t.x - e.x > -u.distance && t.y - e.y > -u.distance && t.x - u.position.x < u.radius && t.y - u.position.y < u.radius && t.x - u.position.x > -u.radius && t.y - u.position.y > -u.radius && (c.beginPath(), c.moveTo(t.x, t.y), c.lineTo(e.x, e.y), c.stroke(), c.closePath())
				}
			}, this.createStars = function () {
				var e, n, i = u.length;
				for (c.clearRect(0, 0, t.width, t.height), n = 0; i > n; n++) u.stars.push(new o), e = u.stars[n], e.create();
				e.line(), e.animate(), u.stars.splice(i, i)
			}, this.setCanvas = function () {
				t.width = u.width, t.height = u.height, c.fillStyle = u.star.color, c.strokeStyle = u.line.color, c.lineWidth = u.line.width, e && e.hasOwnProperty("position") || (u.position = {
					x: .5 * t.width,
					y: .5 * t.height
				})
			}, this.loop = function (t) {
				t(), window.requestAnimationFrame(function () {
					this.loop(t)
				}.bind(this))
			}, this.bind = function () {
				$(window).on("mousemove", function (t) {
					u.position.x = t.pageX - h.offset().left, u.position.y = t.pageY - h.offset().top
				})
			}, this.init = function () {
				this.setCanvas(), this.loop(this.createStars), this.bind()
			}
		}
		$.fn.constellation = function (e) {
			return this.each(function () {
				var o = new t(this, e);
				o.init()
			})
		}, $("#canvas canvas").constellation({});
		var e = function () {
			var t = {};
			return function (e, o, n) {
				n || (n = "Don't call this twice without a uniqueId"), t[n] && clearTimeout(t[n]), t[n] = setTimeout(e, o)
			}
		}();
		$(window).resize(function () {
			e(function () {
				$("#canvas canvas").constellation({})
			}, 500, "some unique string")
		})
	}
	switch (option_hero_background_mode) {
		case "image":
			t(), d();
			break;
		case "slider":
			e(), d();
			break;
		case "kenburns":
			o(), d();
			break;
		case "youtube":
			jQuery.browser.mobile ? t() : n(), d();
			break;
		case "color":
			i(), d();
			break;
		case "gradient":
			a(), d();
			break;
		case "sphere":
			g("assets/js/plugins/three.min.js", function () {
				r()
			});
			break;
		case "waves":
			g("assets/js/plugins/three.min.js", function () {
				s()
			});
			break;
		case "mesh":
			h();
			break;
		case "space":
			c();
			break;
		case "abstract":
			g("assets/js/plugins/fss.min.js", function () {
				l()
			});
			break;
		case "glitch":
			u(), d();
			break;
		case "custom":
			customBackground(), d();
			break;
		default:
			alert("Error! No background is set or something went wrong"), console.log("Error! No background is set or something went wrong")
	}
	if ("on" == option_hero_parallax_hover_effect) {
		var _ = $(".hero").parallax({
			scalarX: 24,
			scalarY: 15,
			frictionX: .1,
			frictionY: .1
		});
		$(".hero").hover(function () {
			_.parallax("enable")
		}, function () {
			_.parallax("disable")
		})
	}
	var f = 800,
		m = 6e3;
	"slider" === option_hero_background_mode && (f = option_hero_background_slider_transitionDuration, m = option_hero_background_slider_delay), "kenburns" === option_hero_background_mode && (f = option_hero_background_kenburns_transitionDuration, m = option_hero_background_kenburns_delay), $("#cycle").cycle({
		fx: "scrollVert",
		timeout: m,
		delay: 0,
		autoHeight: "container",
		speed: f,
		slides: ".slide",
		log: !1
	})
});

function getUrlParameter(e) {
	var o, a, t = decodeURIComponent(window.location.search.substring(1)),
		s = t.split("&");
	for (a = 0; a < s.length; a++)
		if (o = s[a].split("="), o[0] === e) return void 0 === o[1] ? !0 : o[1]
}
if (jQuery(window).load(function () {
		"use strict";
		setTimeout(function () {
			$(".options-panel .panel-button").css("margin-right", "-43px")
		}, 3600)
	}), $(document).ready(function () {
		"use strict";
		$(".options-panel .panel-button").click(function () {
			$(".options-panel").toggleClass("active")
		}), $("#hero, #overlay").click(function () {
			$(".options-panel").removeClass("active")
		}), $("#overlay-skin p").click(function () {
			$("#overlay-skin p").removeClass("active"), $(this).addClass("active"), $(this).hasClass("overlay-skin-white") ? $("body").addClass("white") : $("body").removeClass("white")
		}), $("#bullet-navigation p").click(function () {
			$("#bullet-navigation p").removeClass("active"), $(this).addClass("active"), $(this).hasClass("bullet-navigation-on") ? $(".grcs_bullet_nav").show() : $(".grcs_bullet_nav").hide()
		}), $("#overlay-animation p").click(function () {
			$("#overlay-animation p").removeClass("active"), $(this).addClass("active"), $(this).hasClass("overlay-animation-fade") ? ($("#overlay").addClass("edit"), $("#overlay").addClass("fade-In"), $("#overlay").removeClass("slide-from-bottom"), setTimeout(function () {
				$("#overlay").removeClass("edit")
			}, 10)) : ($("#overlay").addClass("edit"), $("#overlay").removeClass("fade-In"), $("#overlay").addClass("slide-from-bottom"), setTimeout(function () {
				$("#overlay").removeClass("edit")
			}, 10))
		}), $("#overlay-content-animation p").click(function () {
			$("#overlay-content-animation p").removeClass("active"), $(this).addClass("active"), $(this).hasClass("overlay-content-animation-fade") ? ($("#overlay > .overlay").addClass("edit"), $("#overlay > .overlay").addClass("fade-In"), $("#overlay > .overlay").removeClass("slide-from-bottom"), setTimeout(function () {
				$("#overlay > .overlay").removeClass("edit")
			}, 10)) : ($("#overlay > .overlay").addClass("edit"), $("#overlay > .overlay").removeClass("fade-In"), $("#overlay > .overlay").addClass("slide-from-bottom"), setTimeout(function () {
				$("#overlay > .overlay").removeClass("edit")
			}, 10))
		}), $(".options-panel .gravity-remove-button").click(function () {
			$("#canvas canvas").length && ($("html, body").animate({
				scrollTop: "0"
			}), $("#canvas canvas").remove(), $(".options-panel .gravity-remove-button,.options-panel .pei").remove())
		}), ("waves" === option_hero_background_mode || "sphere" === option_hero_background_mode || "mesh" === option_hero_background_mode || "space" === option_hero_background_mode || "abstract" === option_hero_background_mode || $("#hero").hasClass("half-height")) && $(".options-panel .gravity-remove-button,.options-panel .pei").remove()
	}), void 0 !== getUrlParameter("bg")) var option_hero_background_mode = getUrlParameter("bg");
